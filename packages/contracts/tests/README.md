# Contract tests

Lineup is tested at four levels, from the cheapest to the one that costs real
transactions. Each level has one command.

| Level | Command | Needs | What it proves |
|---|---|---|---|
| 1. Offline suite | `pnpm test:contract` | Python + pytest | the contract file itself behaves as specified, including against a lying leader, a moving clock and real payouts |
| 2. Mutation pass | `pnpm mutate:contract` | same | every defence is covered by a test that fails without it |
| 3. Live demo | `pnpm deploy:contract && pnpm seed:contract` | Node 20+ | the same behaviour happens on StudioNet, with real validators, real models, real GEN and the chain's own clock |
| 4. Chain checks | `pnpm e2e:contract`, `pnpm verify:contract`, `pnpm evidence:contract` | Node 20+ | what the record claims is what the chain holds, and what is deployed is this file |

## 1. The offline suite

```bash
pip install -r requirements-dev.txt
pnpm test:contract   # from the repo root, or here: python -m pytest tests -q
```

| File | What it covers |
|---|---|
| [`test_logic.py`](test_logic.py) | the pure rules: text cleaning, reading a model's answer back through its order, the fold, the agreement, which rulings refund, the fence and the prompt, and that `lib/lineup_consensus.py` is exactly the contract's code |
| [`test_e2e.py`](test_e2e.py) | the contract executed: `create` and its bounds; `buy` (not the organiser, the price exactly, one per fan, capacity, the sales clock, no sales after a change); `announce` (the organiser, once, before the show); `rule` (material refunds every holder, minor moves nothing, the organiser or a holder may ask, the clock on its last second, the model never sees money or fans, an order-dependent answer is material, a lying or malformed leader refused, a malformed one for free, an `[LLM_ERROR]` never agreed with); `settle` on every route; money; and static checks over the parsed source |
| [`test_runbook.py`](test_runbook.py) | the live demo replayed offline from [`demo/demo.json`](../demo/demo.json), before any transaction is spent; and once `deployments/studionet.json` exists, the validators' real rulings are replayed through this file, which must pay and refund exactly as the deployed contract did |
| [`test_vectors.py`](test_vectors.py) | `packages/shared/lineup-vectors.json` is exactly what this contract computes, so the TypeScript port is tested against the contract's own answers (`UPDATE_VECTORS=1` regenerates it) |
| [`test_shape.py`](test_shape.py) | `packages/shared/contract-shape.json` describes every public write and view, its parameters and types, and the fields the live deployment returned, exactly |

## 2. The mutation pass

```bash
pnpm mutate:contract
```

[`scripts/mutate.py`](../scripts/mutate.py) makes small edits to a copy of the
contract, each one removing a defence ("a ruling after rulings close is
accepted", "an unruled change pays the organiser", "a refund skips every
holder but the first", "a disagreement between the orders is minor", ...),
runs the suite against each, and names the test that failed.

## 3. The live demo

```bash
pnpm install
pnpm deploy:contract
pnpm seed:contract
```

Eight wallets, one role each, all made in memory for the run; the organiser
and the fans are funded from the StudioNet faucet. Every transaction, in
order; the steps are [`demo/demo.json`](../demo/demo.json).

| # | Sent by | Call | Expected | What it proves |
|---|---|---|---|---|
| 1-3 | organiser | `create` Hollow Pines (0.05), Mira Kaye (0.08), Quiet Harbour (0.03) | executed | each description, price and clock is frozen |
| 4 | organiser | `buy(0)` | refused | the organiser cannot buy |
| 5-6 | ann, ben | `buy(0)` | executed | the ticket money is held by the contract |
| 7 | ann | `buy(0)` again | refused | one ticket per fan |
| 8 | cal | `buy(1)` with the wrong price | refused | the price is paid exactly |
| 9-11 | cal, dev, eve | `buy` | executed | |
| 12 | stranger | `announce(0)` | refused | only the organiser announces |
| 13 | organiser | `announce(0)`: a stand-in drummer, doors at 7.30 | executed | |
| 14 | organiser | `announce(1)`: Mira Kaye cancelled, a DJ set instead | executed | |
| 15 | organiser | `announce(2)`: a different venue | executed | |
| 16 | stranger | `rule(0)` | refused | only the organiser or a holder may ask |
| 17 | ann | `rule(0)` | **minor** | the band and the night are as promised: nothing moves |
| 18 | cal | `rule(1)` | **material** | the named act is gone: Cal and Dev refunded at once |
| 19 | stranger | `settle(0)` | refused | the organiser is paid only once the show starts |
| 20 | stranger | `settle(2)` | refused | the venue change may still be ruled |
| 21 | eve | `rule(2)` after rulings close | **refused** | a late ruling is never asked of a model |
| 22 | stranger | `settle(2)` | **refunded** | nobody ruled the organiser's change in time: Eve refunded |
| 23 | stranger | `settle(0)` after the show starts | **paid** | the organiser is paid for Hollow Pines |

## 4. Checking the chain, not the record

```bash
pnpm e2e:contract
pnpm verify:contract
pnpm evidence:contract
```

`e2e` fetches every recorded transaction again, re-reads every show and every
ticket, checks nothing is still held and every balance moved by exactly what
the contract paid. `verify` compares the deployed source byte for byte with
`lineup.py` and lints it. `evidence` builds [EVIDENCE.md](../../../EVIDENCE.md)
from the chain's answers alone.

## Measuring

```bash
pnpm measure:contract
```

Runs the suite and the mutation pass now and renders their numbers, and the
live record, into the README. It writes nothing if the suite is red, a mutant
escapes, or the record is of a different contract file.
