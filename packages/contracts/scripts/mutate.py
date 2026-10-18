"""Mutation pass: break every defence on purpose, confirm a test notices.

Passing tests prove nothing on their own. Each entry below is a small edit to
the contract that removes a defence. The suite must fail for every one of them,
and this script records WHICH test caught it, so the table in the README is
measured rather than claimed.

    python scripts/mutate.py            # run them all, print what caught what
    python scripts/mutate.py --md       # emit the markdown table for the README

An escaping mutation is a finding, not a nuisance: either a missing test, or a
later defence strict enough that an earlier test can no longer fail. The script
exits non-zero if anything escapes, and refuses to run on a red baseline.

Three rules keep the harness honest:

  * the unmutated suite must be green before anything is mutated;
  * a find string that is missing, or matches more than once, is a failure of
    the harness, never a skip, so refactoring cannot quietly turn a row off;
  * scripts/lift.py runs inside every mutated copy before the suite, so the lib
    parity test can never stand in for the behavioural test a mutation deserves.
"""

import argparse
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).absolute().parent.parent
TARGET = "lineup.py"

FENCE = '    return str(raw).replace("<", "(").replace(">", ")").replace("[", "(").replace("]", ")")'

MUTATIONS = [
    # -- the clocks: a late ruling must never decide a change nobody ruled on
    ("a ruling after rulings close is accepted", "        if now > int(s.rules_close):", "        if False:"),
    ("a ruling on the last second is refused", "        if now > int(s.rules_close):", "        if now >= int(s.rules_close):"),
    ("an unruled change settles while it may be ruled", "            if now <= int(s.rules_close):", "            if False:"),
    ("the organiser is paid before the show", "        if now <= int(s.starts_at):\n            raise gl.vm.UserError(f\"{ERR_EXPECTED} the organiser is paid",
     "        if False:\n            raise gl.vm.UserError(f\"{ERR_EXPECTED} the organiser is paid"),
    ("a change is announced after the show starts", "        if now > int(s.starts_at):", "        if False:"),
    ("sales never close", "        if now > int(s.sales_close):", "        if False:"),
    ("sales close a second early", "        if now > int(s.sales_close):", "        if now >= int(s.sales_close):"),
    ("rulings close at the announcement", "        s.rules_close = u256(now + int(s.rule_window))", "        s.rules_close = u256(now)"),
    ("sales may close after the show", "        if sw > si:", "        if False:"),

    # -- who may write
    ("the organiser may buy", "        if sender == s.organiser:\n            raise", "        if False:\n            raise"),
    ("anyone may announce", "        if gl.message.sender_address != s.organiser:", "        if False:"),
    ("a stranger may ask for a ruling",
     '        if sender != s.organiser and int(self.holds.get(f"{sid}:{sender.as_hex}", u256(0))) == 0:', "        if False:"),
    ("only the organiser may ask for a ruling",
     '        if sender != s.organiser and int(self.holds.get(f"{sid}:{sender.as_hex}", u256(0))) == 0:',
     "        if sender != s.organiser:"),
    ("a fan buys twice", "        if int(self.holds.get(key, u256(0))) > 0:", "        if False:"),
    ("a fan is not remembered", "        self.holds[key] = u256(k + 1)", "        pass"),
    ("a show oversells", "        if int(s.sold) >= int(s.capacity):", "        if False:"),
    ("tickets sell after a change", '        if str(s.status) != ON_SALE or str(s.change) != "":', "        if str(s.status) != ON_SALE:"),
    ("a show announces twice", '        if str(s.change) != "":\n            raise', "        if False:\n            raise"),
    ("a settled show takes a change",
     '        if str(s.status) != ON_SALE:\n            raise gl.vm.UserError(f"{ERR_EXPECTED} this show is {s.status}")',
     '        if False:\n            raise gl.vm.UserError(f"{ERR_EXPECTED} this show is {s.status}")'),
    ("a show with no change is ruled", '        if str(s.change) == "":\n            raise', "        if False:\n            raise"),
    ("a change is ruled twice", '        if str(s.ruling) != "":\n            raise', "        if False:\n            raise"),
    ("a show is settled twice",
     '        if str(s.status) != ON_SALE:\n            raise gl.vm.UserError(f"{ERR_EXPECTED} this show was already settled',
     '        if False:\n            raise gl.vm.UserError(f"{ERR_EXPECTED} this show was already settled'),

    # -- what create(), buy() and announce() accept
    ("a title of any length is accepted", "        if not bounded(t, MIN_TITLE, MAX_TITLE):", "        if False:"),
    ("a description of any length is accepted", "        if not bounded(body, MIN_DESCRIPTION, MAX_DESCRIPTION):", "        if False:"),
    ("a price of zero is accepted", "        if p < 1 or p > MAX_PRICE:", "        if p > MAX_PRICE:"),
    ("a show of any capacity is accepted", "        if c < 1 or c > MAX_CAPACITY:", "        if False:"),
    ("the windows are unbounded", "            if w < MIN_WINDOW or w > MAX_WINDOW:", "            if False:"),
    ("any payment is accepted", "        if paid != int(s.price):", "        if False:"),
    ("a change of any length is accepted", "        if not bounded(body, MIN_CHANGE, MAX_CHANGE):", "        if False:"),
    ("control characters are stored", '            out.append(" ")\n        else:', "            out.append(ch)\n        else:"),

    # -- what the contract decides
    ("a material change refunds nobody", "    return ruling == MATERIAL or ruling == UNRULED", "    return ruling == UNRULED"),
    ("an unruled change refunds nobody", "    return ruling == MATERIAL or ruling == UNRULED", "    return ruling == MATERIAL"),
    ("a minor change refunds everyone", "    return ruling == MATERIAL or ruling == UNRULED", "    return ruling != \"\""),
    ("an unruled change pays the organiser",
     "            s.ruling = UNRULED\n            self._refund_all(s, now)\n            return",
     "            s.ruling = UNRULED"),
    ("a refund skips every holder but the first", "        for i in ids:\n            self._send(", "        for i in ids[:1]:\n            self._send("),
    ("a refund goes to the organiser", "            self._send(self.tickets[i].holder, int(s.price))",
     "            self._send(s.organiser, int(s.price))"),
    ("a refund is not recorded per ticket", "            self.tickets[i].refunded = u256(int(s.price))", "            pass"),
    ("the organiser is paid one ticket", "        total = int(s.price) * int(s.sold)", "        total = int(s.price)"),
    ("tickets are not linked", "            self.tickets[int(s.last_ticket)].next = u256(k)", "            pass"),
    ("who asked is not recorded", "        s.ruled_by = sender", "        s.ruled_by = s.organiser"),

    # -- money
    ("the held counter is not raised", "        self.held = u256(int(self.held) + paid)", "        pass"),
    ("a payout beyond what is held is sent", "        if amount > int(self.held):", "        if False:"),
    ("the held counter is not lowered", "        self.held = u256(int(self.held) - amount)", "        pass"),

    # -- the two orders
    ("the second pass is asked in the forward order",
     "            rev, _ = ask(title, description, change, REVERSED)", "            rev, _ = ask(title, description, change, FORWARD)"),
    ("the reversed order is not reversed", "REVERSED = [MINOR, MATERIAL]", "REVERSED = [MATERIAL, MINOR]"),
    ("a disagreement between the orders keeps the forward ruling",
     "    return forward if forward == reverse else MATERIAL", "    return forward"),
    ("a disagreement between the orders is minor",
     "    return forward if forward == reverse else MATERIAL", "    return forward if forward == reverse else MINOR"),
    ("an answer is not read back through its order", "    return order[int(choice)]", "    return FORWARD[int(choice)]"),

    # -- reading the model
    ("an option past the list is accepted", "    if k < 0 or k >= n:", "    if False:"),
    ("an answer in words is read as a number",
     '    if s == "" or any(ch not in "0123456789" for ch in s) or len(s) > 2:', '    if s == "":'),
    ("an unusable answer is not retried", "    for _ in range(2):", "    for _ in range(1):"),
    ("a bare value is read as if it were an object", "        if isinstance(raw, dict):", "        if True:"),
    ("an unusable answer becomes material",
     '    raise gl.vm.UserError(f"{ERR_LLM} the model named neither option")', '    return MATERIAL, ""'),

    # -- the validator
    ("the validator agrees with a leader error",
     "                # An [LLM_ERROR] is never agreed with.\n                return False",
     "                # An [LLM_ERROR] is never agreed with.\n                return True"),
    ("the validator skips the free structural check", "            if not ruling_sound(proposed):", "            if False:"),
    ("the validator agrees with anything", '            return lineup_agrees(mine["ruling"], proposed)', "            return True"),
    ("the validator agrees when its own model fails",
     "            except gl.vm.UserError:\n                return False", "            except gl.vm.UserError:\n                return True"),
    ("agreement ignores the structural check",
     "    return ruling_sound(mine) and ruling_sound(theirs) and str(mine) == str(theirs)", "    return str(mine) == str(theirs)"),
    ("any word is a sound ruling", "    return ruling == MATERIAL or ruling == MINOR", '    return ruling != ""'),
    ("the agreed ruling is not checked again", "        if not ruling_sound(ruling):", "        if False:"),

    # -- the prompt boundary
    ("the fence does nothing", FENCE, "    return str(raw)"),
    ("the fence leaves square brackets", FENCE, '    return str(raw).replace("<", "(").replace(">", ")")'),
    ("the change reaches the prompt unfenced", "{fence(change)}", "{change}"),
    ("the description reaches the prompt unfenced", "{fence(description)}", "{description}"),
    ("the title reaches the prompt unfenced", "{fence(title)}", "{title}"),
    ("the prompt lets a change take away what was never promised",
     "Something it never mentioned cannot\nbe taken away by a change. ", ""),
    ("the prompt asks what is fair",
     "Do not decide what is fair to the organiser or to\nthe fans, only which option describes the change.",
     "Decide what is fair to the fans."),
    ("the leader's reason is stored raw", '        s.why = sanitise_reason(res.get("because", ""))', '        s.why = str(res.get("because", ""))'),
    ("the leader's reason is not capped", '    return " ".join("".join(out).split())[:limit]', '    return " ".join("".join(out).split())'),
]


PYTEST = [sys.executable, "-m", "pytest", "tests/", "-x", "-q", "--no-header", "-p", "no:cacheprovider"]


def copy_repo(tmp):
    dst = pathlib.Path(tmp) / "repo"
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns(
        "__pycache__", ".pytest_cache", ".git", "artifacts", "*.pyc", "node_modules", "deployments"))
    # tests/test_vectors.py and tests/test_shape.py read ../shared; a mutant
    # must face the same vectors and the same described surface.
    shared = pathlib.Path(tmp) / "shared"
    shared.mkdir()
    for name in ("lineup-vectors.json", "contract-shape.json"):
        shutil.copy(ROOT.parent / "shared" / name, shared / name)
    return dst


def run_one(label, find, replace):
    with tempfile.TemporaryDirectory() as tmp:
        dst = copy_repo(tmp)
        target = dst / TARGET
        src = target.read_text(encoding="utf-8")
        hits = src.count(find)
        if hits == 0:
            return "PATTERN NOT FOUND", None
        if hits > 1:
            return "PATTERN NOT UNIQUE", None
        target.write_text(src.replace(find, replace, 1), encoding="utf-8", newline="\n")
        subprocess.run([sys.executable, "scripts/lift.py"], cwd=dst, capture_output=True)
        proc = subprocess.run(PYTEST, cwd=dst, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
        if proc.returncode == 0:
            return "ESCAPED", None
        text = proc.stdout + proc.stderr
        m = re.search(r"^(?:FAILED|ERROR) (\S+?)::(\S+?)(?:\[|\s|$)", text, re.M)
        if m:
            return "caught", m.group(2).split("::")[-1]
        m = re.search(r"^E\s+(\w*(?:Error|Exception))", text, re.M)
        if m:
            return "caught", m.group(1) + " at import"
        return "caught", "unnamed failure"


def baseline_is_green():
    with tempfile.TemporaryDirectory() as tmp:
        dst = copy_repo(tmp)
        proc = subprocess.run(PYTEST, cwd=dst, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
        return proc.returncode == 0, (proc.stdout + proc.stderr)[-2000:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", action="store_true", help="emit the README table")
    args = ap.parse_args()

    green, tail = baseline_is_green()
    if not green:
        print("the unmutated suite is not green; every mutation would look caught:\n" + tail, file=sys.stderr)
        return 2

    rows, escaped = [], []
    for label, find, replace in MUTATIONS:
        status, test = run_one(label, find, replace)
        if status == "caught":
            rows.append((label, test))
            if not args.md:
                print("  caught   %-70s %s" % (label, test), flush=True)
        else:
            escaped.append((label, status))
            print("  %-8s %s" % (status, label), file=sys.stderr, flush=True)

    if args.md:
        print("| Mutation | Caught by |")
        print("|---|---|")
        for label, test in rows:
            print("| %s | `%s` |" % (label, test))
    else:
        print()
        print("  %d mutations, %d caught, %d escaped" % (len(MUTATIONS), len(rows), len(escaped)))
    return 1 if escaped else 0


if __name__ == "__main__":
    sys.exit(main())
