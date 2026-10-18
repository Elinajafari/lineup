"""
The demo, replayed offline.

scripts/seed.mjs puts the demo on StudioNet from demo/demo.json, step by step.
This file replays the same steps through the real contract in the simulator,
so a demo that could not succeed is caught before a transaction is spent on it.

When deployments/studionet.json exists, the replay goes further: it feeds the
simulator the rulings the validators actually agreed on, and checks that this
repository's contract pays and refunds exactly as the deployed one did and
refuses exactly where it refused.

    pytest tests/test_runbook.py -v
"""

import collections
import hashlib
import json
import pathlib

import pytest

import glsim as S

CONTRACT_PATH = "lineup.py"
M = S.load_contract(CONTRACT_PATH)
RECORD = pathlib.Path("deployments/studionet.json")

import demo as D  # noqa: E402

WHO = {"organiser": "0x" + "a1" * 20, "ann": "0x" + "b2" * 20, "ben": "0x" + "c3" * 20, "cal": "0x" + "d4" * 20,
       "dev": "0x" + "e5" * 20, "eve": "0x" + "f6" * 20, "stranger": "0x" + "07" * 20}
T0 = 1_790_000_000
SH = D.SHOWS


def call_for(step):
    """The method, arguments and value seed.mjs sends for one step."""
    m = step["method"]
    if m == "create":
        x = SH[step["show"]]
        return [x["title"], x["description"], x["price"], x["capacity"], x["sales_window"], x["starts_in"],
                x["rule_window"]], 0
    if m == "buy":
        price = SH[D.ORDER[step["id"]]]["price"]
        return [step["id"]], D.WRONG_PRICE if step.get("wrong") else price
    if m == "announce":
        return [step["id"], D.CHANGES[step["change"]]], 0
    return [step["id"]], 0


def replay(rulings, who=WHO):
    """Run the steps. `rulings` are what the ok rule steps come back with, in order."""
    c = S.deploy(CONTRACT_PATH)
    S.reset_transfers()
    outcomes = []
    clock = T0
    queue = list(rulings)
    for step in D.STEPS:
        clock += 30
        if "after" in step:
            field, k = step["after"]
            clock = max(clock, M.seconds(c.show(k)[field]) + 20)
        S.set_time(M.iso(clock))
        S.set_mocks()
        if step["method"] == "rule" and step["expect"] == "ok":
            want = queue.pop(0)
            S.set_mocks(leader_prompts={
                "[0] material:": {"option": str(M.FORWARD.index(want)), "because": "replayed"},
                "[0] minor:": {"option": str(M.REVERSED.index(want)), "because": "replayed"}})
        args, value = call_for(step)
        S.set_sender(who[step["who"]])
        try:
            S.call(c, step["method"], *args, value=value)
            outcomes.append(("ok", ""))
        except S.UserError as e:
            outcomes.append(("refused", e.message))
    return c, outcomes


def received(who=WHO):
    by = {a.lower(): n for n, a in who.items()}
    out = collections.Counter()
    for to, v in S.transfers():
        out[by[str(to).lower()]] += v
    return out


class TestDemoData:
    def test_every_string_and_amount_the_demo_sends_passes_the_bounds(self):
        for key in D.ORDER:
            x = SH[key]
            assert M.bounded(M.clean_text(x["title"]), M.MIN_TITLE, M.MAX_TITLE)
            assert M.bounded(M.clean_text(x["description"]), M.MIN_DESCRIPTION, M.MAX_DESCRIPTION)
            assert 1 <= x["price"] <= M.MAX_PRICE and 1 <= x["capacity"] <= M.MAX_CAPACITY
            assert x["sales_window"] <= x["starts_in"]
            assert M.bounded(M.clean_text(D.CHANGES[key]), M.MIN_CHANGE, M.MAX_CHANGE)
        assert D.WRONG_PRICE != SH["kaye"]["price"]

    def test_each_change_changes_one_thing(self):
        """Hollow Pines keeps the band and the night; Mira Kaye's headline set
        becomes a DJ set; Quiet Harbour moves venue."""
        assert "Hollow Pines play" in SH["pines"]["description"] and "stand-in drummer" in D.CHANGES["pines"]
        assert "Mira Kaye plays" in SH["kaye"]["description"] and "cancelled" in D.CHANGES["kaye"]
        assert "the Leadmill" in SH["harbour"]["description"] and "the Foundry" in D.CHANGES["harbour"]

    def test_the_clocks_leave_room_for_the_steps_meant_to_land_inside_them(self):
        """Eleven steps after the first show is listed are meant to land before
        sales close, and fifteen before Hollow Pines starts."""
        assert SH["pines"]["sales_window"] >= 11 * 45 + 120 and SH["pines"]["starts_in"] >= 15 * 60
        assert SH["harbour"]["rule_window"] >= 5 * 60 + 2 * 120


class TestReplay:
    def test_the_demo_succeeds_and_refuses_exactly_where_it_says(self):
        _, outcomes = replay(D.EXPECTED_RULINGS)
        assert [o for o, _ in outcomes] == [s["expect"] for s in D.STEPS]

    def test_the_refusals_say_why(self):
        _, outcomes = replay(D.EXPECTED_RULINGS)
        msgs = [m for o, m in outcomes if o == "refused"]
        wants = ["cannot buy a ticket to its own show", "one ticket per fan", "pay the price exactly",
                 "only the organiser may announce", "only the organiser or a ticket holder",
                 "paid once the show starts", "may be ruled until", "rulings closed at"]
        assert len(msgs) == len(wants)
        for msg, want in zip(msgs, wants):
            assert want in msg, (want, msg)

    def test_the_expected_rulings_pay_the_organiser_and_refund_the_rest(self):
        c, _ = replay(D.EXPECTED_RULINGS)
        assert [(c.show(k)["ruling"], c.show(k)["status"]) for k in range(3)] == [
            ("minor", "paid"), ("material", "refunded"), ("unruled", "refunded")]
        assert received() == {"organiser": 2 * SH["pines"]["price"], "cal": SH["kaye"]["price"],
                              "dev": SH["kaye"]["price"], "eve": SH["harbour"]["price"]}
        assert c.held_total() == 0


@pytest.mark.skipif(not RECORD.exists(), reason="no deployment recorded yet: pnpm deploy:contract && pnpm seed:contract")
class TestTheRecord:
    def _record(self):
        return json.loads(RECORD.read_text(encoding="utf-8"))

    def test_the_record_is_of_this_source(self):
        here = hashlib.sha256(pathlib.Path(CONTRACT_PATH).read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        assert self._record()["source_sha256"] == here, "the deployed contract is not this file; redeploy"

    def test_every_step_on_chain_did_what_the_demo_expected(self):
        steps = [s for s in self._record()["steps"] if s["step"] != "deploy"]
        assert [("ok" if s["ok"] else "refused") for s in steps] == [s["expect"] for s in D.STEPS]

    def test_this_contract_pays_as_the_deployed_one_did(self):
        rec = self._record()
        rulings = [x["ruling"] for x in rec["shows"] if x["ruled_by"]]
        c, outcomes = replay(rulings)
        assert [o for o, _ in outcomes] == [s["expect"] for s in D.STEPS]
        for x in rec["shows"]:
            mine = c.show(x["id"])
            for f in ("status", "ruling", "sold", "price", "change"):
                assert mine[f] == x[f], (x["id"], f)

    def test_the_payouts_reached_the_wallets(self):
        rec = self._record()
        b = rec["balances"]
        for who in rec["owed"]:
            assert int(b[f"{who}_after"]) - int(b[f"{who}_before"]) == int(rec["owed"][who]), who
        assert rec["held_after"] == "0"
