# DECISIONS

Why Lineup is built the way it is. Each section names the alternative that was
rejected and what it would have cost.

## The description is the promise, frozen before the first sale

The description, the price, the capacity and every clock are written at
`create()`, before anyone can buy. A description that could be edited after a
change could be edited to promise less. The view returns it as it was frozen,
next to the change and the ruling.

## Two options the contract wrote, never a refund amount

An earlier sketch asked the model what share of the ticket price a change was
worth. Two honest nodes rarely agree on a percentage, and a band of tolerance
only moves the argument. Whether a change takes away something the
description promised is a yes or a no, so the answer is one of two options the
contract wrote, `material` or `minor`, labelled `[0]` and `[1]` inside an
`<options>` block after every caller string has been fenced.

## Order-dependence is material

The options are asked in the order material, minor and then reversed and
renumbered; each answer is read back through the order it was asked in. The
same option both ways stands; anything else is `material`. The organiser who
changed the show carries the burden of showing the change is minor. A model
that always answers "0" refunds the fans, and the tests check it.

## Only what was promised can be taken away

The options name what is material (the act named as headlining, the date, the
city or venue, a full show replaced by something different) and what is minor
(a different support act, a later start the same evening, a stand-in player in
the named act). The prompt adds that something the description never mentioned
cannot be taken away by a change, and tells the model not to decide what is
fair to either side. The demo's three changes each change one thing: a stand-in
drummer and a later door time (minor), a headliner replaced by a DJ set
(material), and a different venue that nobody asks about in time.

## A material ruling refunds everyone in the same call

There is no per-fan refund claim. The fan who asks for the ruling, or the
organiser, triggers a refund to every holder at once. A show sells at most
twenty tickets, so the loop is bounded and the call cannot run out of room,
and no fan has to notice and claim before a deadline.

## Every judgment has a clock, and the organiser carries the unruled

Rulings close a fixed window after the announcement. After that `rule()`
refuses before any model is asked, and `settle()` refunds every holder: the
change was the organiser's, and an organiser who announces a change and lets
it sit cannot keep the money by silence. A show with no change, or a minor
one, is paid to the organiser only once it starts.

## Sales stop at the announcement

Nobody can buy a ticket to a show that has already announced a change; they
would be buying something other than what the description promised.

## settle() is anyone's

It reads no model and pays only what the clock already says is due. A party
who vanishes must not be able to hold the money.

## Money in, money out, counted

`buy()` is the only payable method, and it takes the price exactly. `held`
counts every ticket paid in and every payout out, and a payout larger than
`held` is refused. A refund writes the show's status and every ticket's refund
before any `_send()`; a payment to the organiser writes the status first too.

## A parse failure is an error, never a ruling

An unusable answer is retried once inside the block, then raised as
`[LLM_ERROR]`. The validator never agrees with an error, so the call fails and
nothing is stored. A broken model cannot refund or pay anyone.

## Second lines, kept and pinned

Two checks are unreachable through any public call today and kept on purpose,
each pinned by a structural test: the agreed ruling is checked again before it
refunds anyone, and a settled show refuses a change (a show is only settled
after it starts or after a change, and both already refuse an announcement).

## Tagging untrusted text is not a fence

The title, the description and the change are all written by the organiser,
who has a stake in the answer. `fence()` replaces `< > [ ]` at the prompt
boundary, length preserved. Stored text is kept verbatim; only the prompt is
fenced.

## Why the tests are built the way they are

- **Each node gets its own answers**, and a leader can lie, so every validator check is reachable, and the free layer is measured at zero prompts.
- **The clock and the money are part of the stand-in.** Every clock is tested on its last second and the one after; every refund and payout is checked by the transfers the stand-in recorded.
- **The runbook is a test.** The demo is replayed offline from `demo/demo.json` before a transaction is spent; once `deployments/studionet.json` exists, the recorded rulings are replayed through this contract, which must pay and refund exactly as the deployed one did.
- **The port is tested against the contract.** `packages/shared/lineup-vectors.json` is generated from the contract's own functions.
- **Mutation testing.** `scripts/mutate.py` removes each defence and names the test that caught it.

## GenVM constraints this contract obeys

- the runner is pinned (`py-genlayer:1jb45aa8...`), never `test` or `latest`
- the class is named after the product, because `genvm-lint validate` does not see a class named `Contract`; the storage rows are `Show` and `Ticket`, so no dataclass shares its name
- no `int`, `list`, `dict` or `tuple` as a storage type, and no collection inside a storage dataclass; TreeMap keys are strings
- every persistent field is declared in the class body, and every stored field is read somewhere
- the block returns a flat dict of strings, and never pays
- the clock is `gl.message_raw["datetime"]`, converted with integer arithmetic
- amounts are returned by the views as decimal strings, so no client number type rounds them
- the file is pure ASCII
- `genvm-lint` validates against GenVM `v0.3.0-rc7`, the release that ships the pinned runner; `scripts/verify.mjs` sets `GENVM_VERSION` accordingly

## Not upgradable

There is no owner and no admin method. The description a fan bought a ticket
for is the description the change is judged against.

## Success is read from the leader's result, not from ACCEPTED

A refusal is agreed on too. `scripts/lib.mjs` (`outcome()`) and
`scripts/evidence.mjs` read `consensus_data.leader_receipt[0].result.status`:
`return` is success, and a `rollback` carries the contract's own sentence.

## A lost answer is found, not resent

StudioNet has been measured dropping the reply to a send the node had already
accepted, and unreachable for minutes mid-run. Reads retry for up to fifteen
minutes; a send whose reply was lost is never sent again, and its hash is
found in StudioNet's own index (`sim_getTransactionsForAddress`).

## Every role is its own wallet, made in memory

The scripts make the deployer, the organiser, the five fans and the stranger
with `generatePrivateKey()` for the run and never write them anywhere, so on
the explorer each role is a different address and every refusal comes from
the account it is about.
