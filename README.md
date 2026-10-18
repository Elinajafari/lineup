# Lineup

**Concert tickets refunded in full when the show changes materially, on
GenLayer.** The description is the promise; a change either keeps it or it
does not.

The organiser lists a show with a description, a price and its clocks, and the
description is frozen. Fans buy tickets by paying the price into the contract.
If the organiser has to change something, it announces the change before the
show. GenLayer's validators decide one thing: is the change material to what
the description promised, or minor. Material, every fan is refunded at once;
minor, the organiser is paid after the show.

**Live on studionet at `0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772`.**
Intelligent contract + shared type layer + scripts that deploy, seed, verify
and prove it, not a standalone contract.

> Every transaction of the live demo, and the wallet that sent it, read back
> from the chain: **[EVIDENCE.md](EVIDENCE.md)**.
> A second round from two new wallets: **[EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md)**.

---

## Why this exists

"The headliner has pulled out, but the night goes ahead" is the commonest
ticketing dispute, and the party that decides whether fans get their money
back is the one holding it. A stand-in drummer is not a reason for a refund; a
different act is. Asking a model "should the fans be refunded?" does not fix
it: it hands the model the money and the organiser's reputation at once.

### In plain terms

The organiser writes what the show is, and it can never be edited. Ticket
money goes into the contract, not to the organiser. If something changes, the
organiser has to say so before the show, once, and sales stop. Any fan with a
ticket, or the organiser, asks for a ruling: the validators each read the
description and the change, twice, with the two options in different orders,
and have to agree exactly. If the change takes away something the description
promised, every fan is refunded in that same call. If it does not, the
organiser is paid once the show starts. If nobody asks before rulings close,
the fans are refunded: the change was the organiser's to justify.

### Why this needs GenLayer specifically

Whether "Mira Kaye has cancelled; the night goes ahead as a DJ set by her
producer" takes away what "Mira Kaye plays a full live headline set with her
band" promised is a judgment in natural language, and the organiser holding
the ticket money is the one party who cannot be trusted to make it. Here the
reading is done by a validator quorum, and everything that is not a judgment
is kept away from the model: the description was fixed before the first sale,
the price and the fans are never shown to it, the answer is one of two options
the contract wrote, and a change that is only minor when "minor" is listed
first refunds the fans.

### How you actually use it

1. **List** (the organiser): `create(title, description, price, capacity, sales_window, starts_in, rule_window)`.
2. **Buy** (any fan): `buy(show)`, paying the price.
3. **Announce** (the organiser, before the show): `announce(show, change)`.
4. **Rule** (the organiser or a ticket holder): `rule(show)`. Material refunds everyone.
5. **Settle** (anyone): `settle(show)` pays the organiser after the show, or refunds a change nobody ruled.
6. **Rely on it from another contract**: `status(show)` returns one word.

## Stack

| Layer | Tech |
|---|---|
| Contract | GenLayer Intelligent Contract, Python (GenVM): [`packages/contracts/lineup.py`](packages/contracts/lineup.py) |
| Consensus | custom leader/validator with `gl.vm.run_nondet_unsafe`: a free structural check, then exact agreement on material or minor |
| Money | `buy()` is payable; every payout goes through one path, through the external message form with `value` |
| Tests | pytest on a GenVM stand-in that runs the real file, moves the chain's clock and records every transfer, plus a mutation pass that breaks every defence on purpose |
| Chain client | `genlayer-js` 1.1.8: deploy, seed, e2e, verify and evidence scripts; the StudioNet faucet funds the fans |
| Types | [`packages/shared`](packages/shared): view types, parsers and a port of the contract's deterministic rules, tested against vectors generated from the contract |

---

## Quick start

```bash
pnpm install
pip install -r packages/contracts/requirements-dev.txt

pnpm test               # contract (pytest) + shared (vitest), no chain needed
```

Deploy your own copy and put the whole demo on the explorer:

```bash
pnpm deploy:contract
pnpm seed:contract      # 3 shows, 5 tickets, 3 changes, 2 rulings, 3 refunds, 1 payout, 8 refusals
pnpm e2e:contract
pnpm evidence:contract
```

| Command | What it does |
|---|---|
| `pnpm test` | contract and shared suites |
| `pnpm mutate:contract` | removes every defence one at a time; every mutant must be caught by a named test |
| `pnpm measure:contract` | runs the suite and the mutation pass and renders the numbers into the contract README |
| `pnpm seed:contract` | the demo: every route and every refusal, recorded; waits on the chain's clock for the settlements |
| `pnpm seed:activity` | a second round on the deployed contract from two new wallets, recorded apart from the demo |
| `pnpm e2e:contract` | the record checked against the live chain |
| `pnpm verify:contract` | the deployed source, byte for byte against the file, and linted |
| `pnpm evidence:contract` | EVIDENCE.md: every transaction and its sender, from the chain |

On studionet nothing needs configuring: every role gets a wallet made in
memory for the run, no key is ever written to disk, and the fans are funded
from the StudioNet faucet.

## The live demo

One organiser, three shows, three changes:

| Show | The change | Ruling | Settled |
|---|---|---|---|
| Hollow Pines at the Brudenell, Leeds, 0.05 GEN | a stand-in drummer, doors at 7.30 instead of 7 | **minor** | the organiser paid for Ann's and Ben's tickets after the show |
| Mira Kaye at the Albert Hall, Manchester, 0.08 GEN | Mira Kaye cancelled; a DJ set by her producer instead | **material** | Cal and Dev refunded in the same call |
| Quiet Harbour at the Leadmill, Sheffield, 0.03 GEN | moved to the Foundry; nobody asked for a ruling in time, and a late one was refused | **unruled** | Eve refunded by settle() |

Every wallet's balance was read from the chain after the tickets were bought
and again once every payout had landed: each moved by exactly what the
contract paid it. Full detail, with every hash: [EVIDENCE.md](EVIDENCE.md) and
[`packages/contracts/README.md`](packages/contracts/README.md#verified-against-the-live-deployment).

### Second round, two new wallets

`pnpm seed:activity` ran on the same contract from two wallets that had never
been used: a new organiser listed The Lanterns in Bristol, a new fan bought a
ticket, the fan tried to announce a change and was refused, the organiser
announced a later door time, and the fan asked for the ruling: minor, the
band still plays its full set, so the ticket stands. Every hash:
[EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md).

## Repo layout

```
.
├─ packages/
│  ├─ contracts/                 the Intelligent Contract and everything that proves it
│  │  ├─ lineup.py               the contract
│  │  ├─ tests/                  pytest on a GenVM stand-in (see tests/README.md)
│  │  ├─ scripts/                deploy · seed · e2e · verify · evidence · lint · mutate · measure
│  │  ├─ demo/demo.json          the demo, read by the seed script AND the tests
│  │  ├─ deployments/            studionet.json, written by the scripts, never by hand
│  │  ├─ lib/                    the change rules, generated from the contract
│  │  └─ DECISIONS.md            why every rule is the way it is
│  └─ shared/                    types, parsers, contract-shape.json, the rules port and its vectors
├─ EVIDENCE.md                   every live transaction and its sender
├─ EVIDENCE-ACTIVITY.md          the second round, two new wallets
└─ package.json · pnpm-workspace.yaml
```

## License

MIT © 2026 Elina ([@Elinajafari](https://github.com/Elinajafari))
