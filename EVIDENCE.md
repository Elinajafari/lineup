# Evidence: Lineup on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772`](https://explorer-studio.genlayer.com/address/0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772)
- **Deploy transaction:** [`0x4961b4d2…6bee`](https://explorer-studio.genlayer.com/tx/0x4961b4d26e838bc50424bca913ff8cb9ea68e83df23b0e5a96ad8f9965656bee)
- **Source sha256:** `ef4ee78e413f09e9a4b839aa2f36943b149db111bec2c167d97e49aebdca16e6`
- **Transactions:** 24, from 8 different wallets
- **Generated:** 2026-10-18 23:03 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| deployer | [`0xBDF7a077F012d4A6e9a42aEf5b66cD626EE23Fda`](https://explorer-studio.genlayer.com/address/0xBDF7a077F012d4A6e9a42aEf5b66cD626EE23Fda) | 1 |
| organiser | [`0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | 7 |
| ann | [`0x36aF507309e99D9f9E0920A59270d7AF04bd35Cb`](https://explorer-studio.genlayer.com/address/0x36aF507309e99D9f9E0920A59270d7AF04bd35Cb) | 3 |
| ben | [`0xb94d81549E22a21Adbc6E9422dB863caaFE1bFd3`](https://explorer-studio.genlayer.com/address/0xb94d81549E22a21Adbc6E9422dB863caaFE1bFd3) | 1 |
| cal | [`0xE901774cCF65a921a10beD0C7564f24CCf93cCaf`](https://explorer-studio.genlayer.com/address/0xE901774cCF65a921a10beD0C7564f24CCf93cCaf) | 3 |
| dev | [`0x91Ea46ECd2f5959C18a33B5aa1ba2d4C87997e8E`](https://explorer-studio.genlayer.com/address/0x91Ea46ECd2f5959C18a33B5aa1ba2d4C87997e8E) | 1 |
| eve | [`0x6257A5588C3f11a6Cf3d5fA1845A6341Bf1d9039`](https://explorer-studio.genlayer.com/address/0x6257A5588C3f11a6Cf3d5fA1845A6341Bf1d9039) | 2 |
| stranger | [`0xBf191926F20D87880FCdD63ed84f76A2a1c55047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | 6 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | deploy | deployer [`0xBDF7…3Fda`](https://explorer-studio.genlayer.com/address/0xBDF7a077F012d4A6e9a42aEf5b66cD626EE23Fda) | `deploy` | FINALIZED · MAJORITY_AGREE | executed | [`0x4961b4d2…6bee`](https://explorer-studio.genlayer.com/tx/0x4961b4d26e838bc50424bca913ff8cb9ea68e83df23b0e5a96ad8f9965656bee) |
| 1 | show 0: Hollow Pines, 0.05 GEN a ticket | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `create` | FINALIZED · MAJORITY_AGREE | executed | [`0x24ba77b7…7dec`](https://explorer-studio.genlayer.com/tx/0x24ba77b727aaf699e0de1119419c4dd42b2cb7b15791d5f3776dd12e862c7dec) |
| 2 | show 1: Mira Kaye, 0.08 GEN a ticket | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `create` | FINALIZED · MAJORITY_AGREE | executed | [`0x99602206…6296`](https://explorer-studio.genlayer.com/tx/0x99602206e4a5ce12d3729b5bfcf211ccf95ac943bf1d2d2f751bbe7d51736296) |
| 3 | show 2: Quiet Harbour, 0.03 GEN a ticket | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `create` | FINALIZED · MAJORITY_AGREE | executed | [`0x909afbc5…8be4`](https://explorer-studio.genlayer.com/tx/0x909afbc53a961c16ed128289bc66600810c6db7f5f8caee06378f29342db8be4) |
| 4 | the organiser buys a ticket to its own show | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `buy` | FINALIZED · MAJORITY_AGREE | refused: the organiser cannot buy a ticket to its own show | [`0xba579958…0418`](https://explorer-studio.genlayer.com/tx/0xba579958efd2eeb21c955c633826f7fd9acd00f4f49a10ffefd1f08b77990418) |
| 5 | Ann buys a ticket to Hollow Pines | ann [`0x36aF…35Cb`](https://explorer-studio.genlayer.com/address/0x36aF507309e99D9f9E0920A59270d7AF04bd35Cb) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0x09502c3a…9cf5`](https://explorer-studio.genlayer.com/tx/0x09502c3a548820d13ceb84234ee03034acbbf0947a5c39e66661a4ad6cab9cf5) |
| 6 | Ben buys a ticket to Hollow Pines | ben [`0xb94d…bFd3`](https://explorer-studio.genlayer.com/address/0xb94d81549E22a21Adbc6E9422dB863caaFE1bFd3) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0xb2609ef6…fdf2`](https://explorer-studio.genlayer.com/tx/0xb2609ef6ab767f37988d4e81430260f01c362114e0b8265d145536d77ce5fdf2) |
| 7 | Ann buys a second ticket | ann [`0x36aF…35Cb`](https://explorer-studio.genlayer.com/address/0x36aF507309e99D9f9E0920A59270d7AF04bd35Cb) | `buy` | FINALIZED · MAJORITY_AGREE | refused: one ticket per fan | [`0xed704bf0…e4ec`](https://explorer-studio.genlayer.com/tx/0xed704bf028b0b2ca89b41a94289a87e2a02b782f575adbfdb2d3e0b4c805e4ec) |
| 8 | Cal pays the wrong price for Mira Kaye | cal [`0xE901…cCaf`](https://explorer-studio.genlayer.com/address/0xE901774cCF65a921a10beD0C7564f24CCf93cCaf) | `buy` | FINALIZED · MAJORITY_AGREE | refused: pay the price exactly: 80000000000000000 wei, not 50000000000000000 | [`0x65cef1c7…f0d0`](https://explorer-studio.genlayer.com/tx/0x65cef1c7f10208655aa2a469dc95bfab0f74071fdcfa4c0872d07285ce05f0d0) |
| 9 | Cal buys a ticket to Mira Kaye | cal [`0xE901…cCaf`](https://explorer-studio.genlayer.com/address/0xE901774cCF65a921a10beD0C7564f24CCf93cCaf) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0x8466d36c…133a`](https://explorer-studio.genlayer.com/tx/0x8466d36cab5e3013890a856488c62d4bb6c3a4b0e1cb3c37995a691641f9133a) |
| 10 | Dev buys a ticket to Mira Kaye | dev [`0x91Ea…7e8E`](https://explorer-studio.genlayer.com/address/0x91Ea46ECd2f5959C18a33B5aa1ba2d4C87997e8E) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0x00169d29…0377`](https://explorer-studio.genlayer.com/tx/0x00169d29604bc1f1cb3b08d7e6ff965b5e5f473a5156ae47f2e25002eab40377) |
| 11 | Eve buys a ticket to Quiet Harbour | eve [`0x6257…9039`](https://explorer-studio.genlayer.com/address/0x6257A5588C3f11a6Cf3d5fA1845A6341Bf1d9039) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0xc4cc379c…6b44`](https://explorer-studio.genlayer.com/tx/0xc4cc379ce1e57412ec44545f47dac68a2854dff9b6ebb0026cffcab87efb6b44) |
| 12 | a stranger announces a change | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `announce` | FINALIZED · MAJORITY_AGREE | refused: only the organiser may announce a change | [`0x152c6938…5850`](https://explorer-studio.genlayer.com/tx/0x152c693810563764d83e4d87c37d5cca426e30cca5fee5d264650923fea55850) |
| 13 | Hollow Pines: a stand-in drummer, doors at 7.30 | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `announce` | FINALIZED · MAJORITY_AGREE | executed | [`0x5a9b7f41…7530`](https://explorer-studio.genlayer.com/tx/0x5a9b7f411c5785c084c5f4a03ccd0907df46256032b31ea8fe13a7dd0dcb7530) |
| 14 | Mira Kaye: cancelled, a DJ set instead | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `announce` | FINALIZED · MAJORITY_AGREE | executed | [`0x4525a19f…f085`](https://explorer-studio.genlayer.com/tx/0x4525a19f463ffee90ed060ea944464ea5a618717eaaeaae935622ef05792f085) |
| 15 | Quiet Harbour: a different venue | organiser [`0x1187…B068`](https://explorer-studio.genlayer.com/address/0x1187a61D11bA0088Cfb9F1a6B6Deea1fb505B068) | `announce` | FINALIZED · MAJORITY_AGREE | executed | [`0xbbbcc22d…4f78`](https://explorer-studio.genlayer.com/tx/0xbbbcc22dd02ec42a4cae2db12c8aa7ebcbdcddb79bc0ed7f01611f4084784f78) |
| 16 | a stranger asks for a ruling | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `rule` | FINALIZED · MAJORITY_AGREE | refused: only the organiser or a ticket holder may ask for a ruling | [`0x7bca9961…c409`](https://explorer-studio.genlayer.com/tx/0x7bca996183904eb143560ad5135c119948fe7515117d5951b41efae3e4a9c409) |
| 17 | Hollow Pines ruled: both orders | ann [`0x36aF…35Cb`](https://explorer-studio.genlayer.com/address/0x36aF507309e99D9f9E0920A59270d7AF04bd35Cb) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x2975775c…0128`](https://explorer-studio.genlayer.com/tx/0x2975775cbaea3dfcc4af137644c19f1098b7a9af5bc0ced38104555e4ff40128) |
| 18 | Mira Kaye ruled: both orders | cal [`0xE901…cCaf`](https://explorer-studio.genlayer.com/address/0xE901774cCF65a921a10beD0C7564f24CCf93cCaf) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x2583ccfc…598e`](https://explorer-studio.genlayer.com/tx/0x2583ccfcd56718ab0f12d25f445f584789a9d65685b6ec1264f3e6f08af9598e) |
| 19 | Hollow Pines settled before the show | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `settle` | FINALIZED · MAJORITY_AGREE | refused: the organiser is paid once the show starts at 2026-10-18T22:56:41Z | [`0x2c6408c2…07c4`](https://explorer-studio.genlayer.com/tx/0x2c6408c215f0fef59468da9c67152f27624a2605aacec8328b3e37cc911b07c4) |
| 20 | Quiet Harbour settled while it may be ruled | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `settle` | FINALIZED · MAJORITY_AGREE | refused: the change may be ruled until 2026-10-18T22:49:31Z | [`0xe08d760e…65eb`](https://explorer-studio.genlayer.com/tx/0xe08d760ecae84d27911aa440a9829e5ef9096556b4decf05b8b234705cb165eb) |
| 21 | Quiet Harbour ruled after rulings closed | eve [`0x6257…9039`](https://explorer-studio.genlayer.com/address/0x6257A5588C3f11a6Cf3d5fA1845A6341Bf1d9039) | `rule` | FINALIZED · MAJORITY_AGREE | refused: rulings closed at 2026-10-18T22:49:31Z; an unruled change refunds every holder at settlement | [`0x852f7157…855b`](https://explorer-studio.genlayer.com/tx/0x852f7157660848b9414de4c447cead11909e21ebed7951d8a6e16cf5fa30855b) |
| 22 | Quiet Harbour settled: unruled, refunded | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `settle` | FINALIZED · MAJORITY_AGREE | executed | [`0xd71d8a52…c551`](https://explorer-studio.genlayer.com/tx/0xd71d8a52e2142e129dcef5ae8c1dbc77701da9a59bca2e6848dab24acaedc551) |
| 23 | Hollow Pines settled: the organiser paid | stranger [`0xBf19…5047`](https://explorer-studio.genlayer.com/address/0xBf191926F20D87880FCdD63ed84f76A2a1c55047) | `settle` | FINALIZED · MAJORITY_AGREE | executed | [`0x7793e069…9a8e`](https://explorer-studio.genlayer.com/tx/0x7793e069ddc974f8f098134acf3f6d5e23955bb8664234b247be7d43fc8b9a8e) |
