# Lineup - GenLayer Intelligent Contract

[`lineup.py`](./lineup.py) is the whole protocol: the organiser lists a show
with a description, a price, a capacity and its clocks, and the description is
frozen; fans buy tickets by paying the price into the contract; if something
changes, the organiser announces it once, before the show; validators rule by
consensus, in two orders, whether the change is material to what the
description promised or minor; material refunds every holder in the same call,
minor leaves the show as sold, and after the show the organiser is paid.

## Core rule

```
the description, the price and every clock are frozen at create(), before the first ticket is sold
a ruling is one of two options the contract wrote: material or minor; the model never sees the price or the fans
material refunds every holder at once; minor pays the organiser after the show; the two orders must agree, else material
the organiser who changed the show carries the burden: a change nobody ruled in time refunds every holder
a ruling after rulings close is refused before any model
```

## Lifecycle

```
organiser: create(title, description, price, capacity, sales_window, starts_in, rule_window)
fan:       buy(show)                one ticket each, the price exactly, until sales close
organiser: announce(show, change)   once, before the show starts; sales stop; rulings open
either:    rule(show)               the organiser or a ticket holder, until rulings close:
                                      [validators, both orders] -> material: every holder refunded
                                                                   minor: nothing moves
                                    after it: refused before any model
anyone:    settle(show)             no change, or a minor one, once the show starts -> the organiser is paid
                                    a change nobody ruled, once rulings close -> every holder refunded
anyone:    count, held_total, status, show, tickets_of
```

Judgment fails **closed**: an unusable model answer is retried once inside the
block and then raised as `[LLM_ERROR]`, which no validator agrees with. It
never moves money. Every waiting state has a clock, and every clock ends in
someone being paid.

## Deploy

```bash
pnpm install
pnpm deploy:contract
pnpm seed:contract                    # the demo, recorded in deployments/studionet.json
pnpm e2e:contract                     # the record checked against the chain
pnpm verify:contract                  # deployed source == lineup.py, and genvm-lint on it
pnpm evidence:contract                # EVIDENCE.md at the repo root, from the chain
```

Every script reads a transaction's outcome from the leader's result, never
from `ACCEPTED` alone. Sends are nonce-guarded, and a send whose answer was
lost is found again in StudioNet's own index rather than sent twice. Why each
rule is the way it is: [DECISIONS.md](DECISIONS.md).

## Surface

| Write | Caller | Why |
|---|---|---|
| `create(title, description, price, capacity, sales_window, starts_in, rule_window)` | anyone | the caller becomes the organiser |
| `buy(show)` *payable* | anyone but the organiser, once, the price exactly, until sales close or a change | the ticket money is held by the contract, not the organiser |
| `announce(show, change)` | the organiser, once, before the show starts | only the organiser can change the show |
| `rule(show)` | the organiser or a ticket holder, until rulings close | either wants it decided; a stranger cannot spend everyone's inference |
| `settle(show)` | anyone, deliberately | it reads no model and pays only what the clock already says is due |

| View | Returns |
|---|---|
| `count()` | number of shows |
| `held_total()` | wei held for unsettled shows |
| `status(show)` | `on_sale`, `paid` or `refunded`: one word for another contract |
| `show(id)` | the frozen description and price, every clock, the change, the ruling, who asked |
| `tickets_of(id)` | every ticket: holder, when bought, what was refunded |

## Threat model

| Attack | What stops it |
|---|---|
| A description edited to promise less after a change | it is frozen at `create()`, before the first ticket is sold |
| A headliner swapped out and called a "minor change" | the options say replacing the named act, the date or the venue is material; the demo's DJ set in place of Mira Kaye is ruled `material` on chain |
| A refund demanded for a change the description never promised | the prompt says something the description never mentioned cannot be taken away by a change; the demo's stand-in drummer is ruled `minor` |
| The model deciding who deserves the money | it never sees the price, the takings or the fans, and only picks one of two options the contract wrote |
| A change that is only minor when "minor" is listed first | both orders inside one block; a difference is `material` |
| An organiser who announces and then nobody rules | a change unruled when rulings close refunds every holder at settlement |
| A late ruling that takes back refunds already due | `rule()` refuses once rulings close, before any model |
| An organiser paid before the show happens | `settle()` pays the organiser only after the show starts |
| Tickets sold after a change was announced | sales stop at the announcement |
| A leader that invents or hides a material change | every validator asks both orders itself and must match exactly |
| A broken model moves money by failing | an unusable answer is retried once, then raised as `[LLM_ERROR]` |
| Prompt injection inside a description or a change | `fence()` replaces `< > [ ]` at the prompt boundary and the contract numbers the options itself |

## Tests

The suite runs on [`tests/glsim.py`](tests/glsim.py), a small GenVM stand-in
that executes the real contract file, gives the leader and the validator their
own mock answers, can make a leader lie, sets the chain's clock, carries the
value a call sends and the transfers it makes, and refuses what GenVM refuses.
What each file covers, and what every demo transaction proves, is in
[tests/README.md](tests/README.md).

<!-- measured:tests:start -->
Measured: **125 passed**, 0 skipped, including the checks of the live record in `deployments/studionet.json`, which run once `pnpm seed:contract` has written it. The same record is checked against the chain itself by `pnpm e2e:contract`.
<!-- measured:tests:end -->

**The tests have teeth.** [`scripts/mutate.py`](scripts/mutate.py) removes every
defence one at a time and names the test that caught each mutant. It refuses to
run on a red baseline and exits non-zero if anything escapes.

<!-- measured:mutations:start -->
Measured: **69 mutations, 69 caught, 0 escaped.**

| Mutation | Caught by |
|---|---|
| a ruling after rulings close is accepted | `test_a_ruling_on_the_last_second_lands_and_one_after_is_refused_for_free` |
| a ruling on the last second is refused | `test_a_ruling_on_the_last_second_lands_and_one_after_is_refused_for_free` |
| an unruled change settles while it may be ruled | `test_an_unruled_change_refunds_every_holder_once_rulings_close` |
| the organiser is paid before the show | `test_a_show_with_no_change_pays_the_organiser_once_it_starts` |
| a change is announced after the show starts | `test_a_change_after_the_show_starts_is_refused` |
| sales never close | `test_sales_close_on_the_clock` |
| sales close a second early | `test_sales_close_on_the_clock` |
| rulings close at the announcement | `test_the_organiser_announces_one_change_before_the_show` |
| sales may close after the show | `test_every_bound_is_refused` |
| the organiser may buy | `test_the_organiser_cannot_buy` |
| anyone may announce | `test_only_the_organiser_announces` |
| a stranger may ask for a ruling | `test_a_stranger_may_not_ask` |
| only the organiser may ask for a ruling | `test_a_material_change_refunds_every_holder_at_once` |
| a fan buys twice | `test_one_ticket_per_fan_matched_by_value_not_spelling` |
| a fan is not remembered | `test_one_ticket_per_fan_matched_by_value_not_spelling` |
| a show oversells | `test_a_show_sells_out` |
| tickets sell after a change | `test_sales_stop_once_a_change_is_announced` |
| a show announces twice | `test_the_organiser_announces_one_change_before_the_show` |
| a settled show takes a change | `test_a_settled_show_takes_no_change_even_if_a_clock_changes` |
| a show with no change is ruled | `test_nothing_is_ruled_before_a_change` |
| a change is ruled twice | `test_a_change_is_ruled_once` |
| a show is settled twice | `test_a_settled_show_is_not_settled_again` |
| a title of any length is accepted | `test_every_bound_is_refused` |
| a description of any length is accepted | `test_every_bound_is_refused` |
| a price of zero is accepted | `test_every_bound_is_refused` |
| a show of any capacity is accepted | `test_every_bound_is_refused` |
| the windows are unbounded | `test_every_bound_is_refused` |
| any payment is accepted | `test_the_price_is_paid_exactly` |
| a change of any length is accepted | `test_a_change_is_bounded` |
| control characters are stored | `test_clean_text_collapses_whitespace_and_control_characters` |
| a material change refunds nobody | `test_a_material_change_refunds_every_holder_at_once` |
| an unruled change refunds nobody | `test_material_and_unruled_refund` |
| a minor change refunds everyone | `test_a_minor_change_moves_nothing` |
| an unruled change pays the organiser | `test_an_unruled_change_refunds_every_holder_once_rulings_close` |
| a refund skips every holder but the first | `test_a_material_change_refunds_every_holder_at_once` |
| a refund goes to the organiser | `test_a_material_change_refunds_every_holder_at_once` |
| a refund is not recorded per ticket | `test_a_material_change_refunds_every_holder_at_once` |
| the organiser is paid one ticket | `test_a_show_with_no_change_pays_the_organiser_once_it_starts` |
| tickets are not linked | `test_a_ticket_holds_the_price` |
| who asked is not recorded | `test_a_material_change_refunds_every_holder_at_once` |
| the held counter is not raised | `test_a_ticket_holds_the_price` |
| a payout beyond what is held is sent | `test_a_payout_beyond_what_is_held_is_refused` |
| the held counter is not lowered | `test_a_material_change_refunds_every_holder_at_once` |
| the second pass is asked in the forward order | `test_the_options_are_asked_in_both_orders` |
| the reversed order is not reversed | `test_the_options_are_asked_in_both_orders` |
| a disagreement between the orders keeps the forward ruling | `test_a_change_minor_in_only_one_order_is_material` |
| a disagreement between the orders is minor | `test_a_model_that_always_answers_0_refunds_the_fans` |
| an answer is not read back through its order | `test_a_minor_change_moves_nothing` |
| an option past the list is accepted | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| an answer in words is read as a number | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| an unusable answer is not retried | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| a bare value is read as if it were an object | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| an unusable answer becomes material | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| the validator agrees with a leader error | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| the validator skips the free structural check | `test_a_ruling_that_is_neither_option_is_refused_for_free` |
| the validator agrees with anything | `test_nodes_that_rule_differently_do_not_agree` |
| the validator agrees when its own model fails | `test_a_validator_whose_model_fails_does_not_agree` |
| agreement ignores the structural check | `test_agreement_is_exact_symmetric_and_over_sound_rulings` |
| any word is a sound ruling | `test_a_ruling_that_is_neither_option_is_refused_for_free` |
| the agreed ruling is not checked again | `test_the_agreed_ruling_is_checked_again_before_it_pays` |
| the fence does nothing | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the fence leaves square brackets | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the change reaches the prompt unfenced | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the description reaches the prompt unfenced | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the title reaches the prompt unfenced | `test_every_value_interpolated_into_the_prompt_is_fenced_or_ours` |
| the prompt lets a change take away what was never promised | `test_the_prompt_judges_the_promise_and_never_shows_money` |
| the prompt asks what is fair | `test_the_prompt_judges_the_promise_and_never_shows_money` |
| the leader's reason is stored raw | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
| the leader's reason is not capped | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
<!-- measured:mutations:end -->

## Verified against the live deployment

<!-- measured:deployment:start -->
Deployed on studionet at [`0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772`](https://explorer-studio.genlayer.com/address/0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772) (deploy [`0x4961b4d2...`](https://explorer-studio.genlayer.com/tx/0x4961b4d26e838bc50424bca913ff8cb9ea68e83df23b0e5a96ad8f9965656bee)). Every value below was read back from the chain by `scripts/seed.mjs` and written to [`deployments/studionet.json`](deployments/studionet.json); none of it is typed by hand.

| Show | Price | Sold | The announced change | Ruling | Settled | Reason the leader gave (not consensus) |
|---|---|---|---|---|---|---|
| 0: Hollow Pines live in Leeds | 0.05 GEN | 2 | Hollow Pines' drummer is ill, so a stand-in drummer will play the set with the band, and doors now open at 7.30 pm instead of 7 pm. | **minor** | paid | Hollow Pines still headline at Brudenell; stand-in drummer and 30-min later doors are minor changes not promised in the description. |
| 1: Mira Kaye in Manchester | 0.08 GEN | 2 | Mira Kaye has cancelled her tour. The night at the Albert Hall goes ahead as a DJ set by her producer. | **material** | refunded | Mira Kaye's live headline set with her band is replaced by a DJ set from her producer — the named act is gone. |
| 2: Quiet Harbour in Sheffield | 0.03 GEN | 1 | The show moves from the Leadmill to the Foundry, Sheffield, on the same night. | **unruled** | refunded | - |

Every wallet's balance was read from the chain after the tickets were bought and once every payout had landed, against what the contract says it paid:

| Wallet | Before | After | The contract paid |
|---|---|---|---|
| organiser | 0.95 GEN | 1.05 GEN | 0.1 GEN |
| ann | 0.9 GEN | 0.9 GEN | 0 GEN |
| ben | 0.95 GEN | 0.95 GEN | 0 GEN |
| cal | 0.87 GEN | 0.95 GEN | 0.08 GEN |
| dev | 0.92 GEN | 1 GEN | 0.08 GEN |
| eve | 0.97 GEN | 1 GEN | 0.03 GEN |

Every transaction, in order, refusals included, with the wallet that sent it:

| Step | From | Outcome | Transaction |
|---|---|---|---|
| show 0: Hollow Pines, 0.05 GEN a ticket | organiser | ok | [`0x24ba77b7...`](https://explorer-studio.genlayer.com/tx/0x24ba77b727aaf699e0de1119419c4dd42b2cb7b15791d5f3776dd12e862c7dec) |
| show 1: Mira Kaye, 0.08 GEN a ticket | organiser | ok | [`0x99602206...`](https://explorer-studio.genlayer.com/tx/0x99602206e4a5ce12d3729b5bfcf211ccf95ac943bf1d2d2f751bbe7d51736296) |
| show 2: Quiet Harbour, 0.03 GEN a ticket | organiser | ok | [`0x909afbc5...`](https://explorer-studio.genlayer.com/tx/0x909afbc53a961c16ed128289bc66600810c6db7f5f8caee06378f29342db8be4) |
| the organiser buys a ticket to its own show | organiser | refused: the organiser cannot buy a ticket to its own show | [`0xba579958...`](https://explorer-studio.genlayer.com/tx/0xba579958efd2eeb21c955c633826f7fd9acd00f4f49a10ffefd1f08b77990418) |
| Ann buys a ticket to Hollow Pines | ann | ok | [`0x09502c3a...`](https://explorer-studio.genlayer.com/tx/0x09502c3a548820d13ceb84234ee03034acbbf0947a5c39e66661a4ad6cab9cf5) |
| Ben buys a ticket to Hollow Pines | ben | ok | [`0xb2609ef6...`](https://explorer-studio.genlayer.com/tx/0xb2609ef6ab767f37988d4e81430260f01c362114e0b8265d145536d77ce5fdf2) |
| Ann buys a second ticket | ann | refused: one ticket per fan | [`0xed704bf0...`](https://explorer-studio.genlayer.com/tx/0xed704bf028b0b2ca89b41a94289a87e2a02b782f575adbfdb2d3e0b4c805e4ec) |
| Cal pays the wrong price for Mira Kaye | cal | refused: pay the price exactly: 80000000000000000 wei, not 50000000000000000 | [`0x65cef1c7...`](https://explorer-studio.genlayer.com/tx/0x65cef1c7f10208655aa2a469dc95bfab0f74071fdcfa4c0872d07285ce05f0d0) |
| Cal buys a ticket to Mira Kaye | cal | ok | [`0x8466d36c...`](https://explorer-studio.genlayer.com/tx/0x8466d36cab5e3013890a856488c62d4bb6c3a4b0e1cb3c37995a691641f9133a) |
| Dev buys a ticket to Mira Kaye | dev | ok | [`0x00169d29...`](https://explorer-studio.genlayer.com/tx/0x00169d29604bc1f1cb3b08d7e6ff965b5e5f473a5156ae47f2e25002eab40377) |
| Eve buys a ticket to Quiet Harbour | eve | ok | [`0xc4cc379c...`](https://explorer-studio.genlayer.com/tx/0xc4cc379ce1e57412ec44545f47dac68a2854dff9b6ebb0026cffcab87efb6b44) |
| a stranger announces a change | stranger | refused: only the organiser may announce a change | [`0x152c6938...`](https://explorer-studio.genlayer.com/tx/0x152c693810563764d83e4d87c37d5cca426e30cca5fee5d264650923fea55850) |
| Hollow Pines: a stand-in drummer, doors at 7.30 | organiser | ok | [`0x5a9b7f41...`](https://explorer-studio.genlayer.com/tx/0x5a9b7f411c5785c084c5f4a03ccd0907df46256032b31ea8fe13a7dd0dcb7530) |
| Mira Kaye: cancelled, a DJ set instead | organiser | ok | [`0x4525a19f...`](https://explorer-studio.genlayer.com/tx/0x4525a19f463ffee90ed060ea944464ea5a618717eaaeaae935622ef05792f085) |
| Quiet Harbour: a different venue | organiser | ok | [`0xbbbcc22d...`](https://explorer-studio.genlayer.com/tx/0xbbbcc22dd02ec42a4cae2db12c8aa7ebcbdcddb79bc0ed7f01611f4084784f78) |
| a stranger asks for a ruling | stranger | refused: only the organiser or a ticket holder may ask for a ruling | [`0x7bca9961...`](https://explorer-studio.genlayer.com/tx/0x7bca996183904eb143560ad5135c119948fe7515117d5951b41efae3e4a9c409) |
| Hollow Pines ruled: both orders | ann | ok | [`0x2975775c...`](https://explorer-studio.genlayer.com/tx/0x2975775cbaea3dfcc4af137644c19f1098b7a9af5bc0ced38104555e4ff40128) |
| Mira Kaye ruled: both orders | cal | ok | [`0x2583ccfc...`](https://explorer-studio.genlayer.com/tx/0x2583ccfcd56718ab0f12d25f445f584789a9d65685b6ec1264f3e6f08af9598e) |
| Hollow Pines settled before the show | stranger | refused: the organiser is paid once the show starts at 2026-10-18T22:56:41Z | [`0x2c6408c2...`](https://explorer-studio.genlayer.com/tx/0x2c6408c215f0fef59468da9c67152f27624a2605aacec8328b3e37cc911b07c4) |
| Quiet Harbour settled while it may be ruled | stranger | refused: the change may be ruled until 2026-10-18T22:49:31Z | [`0xe08d760e...`](https://explorer-studio.genlayer.com/tx/0xe08d760ecae84d27911aa440a9829e5ef9096556b4decf05b8b234705cb165eb) |
| Quiet Harbour ruled after rulings closed | eve | refused: rulings closed at 2026-10-18T22:49:31Z; an unruled change refunds every holder at settlement | [`0x852f7157...`](https://explorer-studio.genlayer.com/tx/0x852f7157660848b9414de4c447cead11909e21ebed7951d8a6e16cf5fa30855b) |
| Quiet Harbour settled: unruled, refunded | stranger | ok | [`0xd71d8a52...`](https://explorer-studio.genlayer.com/tx/0xd71d8a52e2142e129dcef5ae8c1dbc77701da9a59bca2e6848dab24acaedc551) |
| Hollow Pines settled: the organiser paid | stranger | ok | [`0x7793e069...`](https://explorer-studio.genlayer.com/tx/0x7793e069ddc974f8f098134acf3f6d5e23955bb8664234b247be7d43fc8b9a8e) |

`tests/test_runbook.py::TestTheRecord` replays these rulings through this repository's contract and fails unless it pays exactly as the deployed one did.
<!-- measured:deployment:end -->

On top of the record: `pnpm e2e:contract` asks the chain again for every
transaction, every show and every ticket and checks each against the record,
along with every wallet's balance, and `pnpm verify:contract` reads the
deployed source back, compares it byte for byte with
`packages/contracts/lineup.py`, and runs genvm-lint on the deployed bytes.

## Known limits

- Validators compare the change as announced with the description as listed; a change that is never announced is outside the contract.
- One change per show; a second change needs a new show.
- At most twenty tickets per show, so a refund to every holder is one bounded call; one ticket per wallet.
- On StudioNet the value sent with a refused payable call stays at the contract's address. `held` counts only accepted payments, so that value is never paid out.
- StudioNet is a test network; its state can be reset.

## Path forward

- Larger shows, refunded in pages of twenty holders at a time.
- A partial refund for a minor change, set by the organiser before the first ticket is sold.
- A box office page that shows each show's clocks, its change and its ruling.
