"""The demo's data, loaded from demo/demo.json.

scripts/seed.mjs sends exactly these strings and these steps to StudioNet, and
tests/test_runbook.py replays them offline, so the demo on the explorer and the
demo the tests check cannot drift apart.

Three shows from one organiser, each changed before it starts:

  PINES    a stand-in drummer and a later door time: minor, nothing moves,
           and after the show the organiser is paid
  KAYE     the headliner cancels and the night becomes a DJ set: material,
           every holder is refunded in the same call
  HARBOUR  a different venue, but nobody asks for a ruling before rulings
           close: a late ruling is refused, and settle() refunds the holder
"""

import json
import pathlib

_DATA = json.loads((pathlib.Path(__file__).absolute().parent.parent / "demo" / "demo.json").read_text(encoding="utf-8"))

SHOWS = {k: {**v, "price": int(v["price"])} for k, v in _DATA["shows"].items()}
ORDER = ["pines", "kaye", "harbour"]         # show ids 0, 1, 2
WRONG_PRICE = int(_DATA["wrong_price"])
CHANGES = _DATA["changes"]
STEPS = _DATA["steps"]

# the ruling each ok rule step is expected to come back with, in order
EXPECTED_RULINGS = _DATA["expected_rulings"]
