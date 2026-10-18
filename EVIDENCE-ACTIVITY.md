# Evidence: Lineup, second round on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772`](https://explorer-studio.genlayer.com/address/0x93b37D58dFAAde61E562BADa7E03Cd9A3bF7e772)
- **Round:** new wallets on the contract already deployed; no deploy in this round
- **The deployment itself:** [EVIDENCE.md](EVIDENCE.md)
- **Transactions:** 5, from 2 different wallets
- **Generated:** 2026-10-18 23:03 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| organiser | [`0xbF9E6F440dC2bAD2b42353FBe7f3DC558770D61E`](https://explorer-studio.genlayer.com/address/0xbF9E6F440dC2bAD2b42353FBe7f3DC558770D61E) | 2 |
| fan | [`0x5Bf2F71Ab8F5f84d2e5a94a39E87C21f1D447315`](https://explorer-studio.genlayer.com/address/0x5Bf2F71Ab8F5f84d2e5a94a39E87C21f1D447315) | 3 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | show 3: a new organiser lists The Lanterns, 0.02 GEN | organiser [`0xbF9E…D61E`](https://explorer-studio.genlayer.com/address/0xbF9E6F440dC2bAD2b42353FBe7f3DC558770D61E) | `create` | FINALIZED · MAJORITY_AGREE | executed | [`0xa4b62c72…4952`](https://explorer-studio.genlayer.com/tx/0xa4b62c7221dfee6a308ee5a3b31b8ea712ab321231708c01e99f4188ab4f4952) |
| 1 | a new fan buys a ticket | fan [`0x5Bf2…7315`](https://explorer-studio.genlayer.com/address/0x5Bf2F71Ab8F5f84d2e5a94a39E87C21f1D447315) | `buy` | FINALIZED · MAJORITY_AGREE | executed | [`0x6425c42c…f4a7`](https://explorer-studio.genlayer.com/tx/0x6425c42cd678655ae1d87911e676b2f090cf4ecd0019c6ddc95dada1d61ef4a7) |
| 2 | the fan tries to announce a change | fan [`0x5Bf2…7315`](https://explorer-studio.genlayer.com/address/0x5Bf2F71Ab8F5f84d2e5a94a39E87C21f1D447315) | `announce` | FINALIZED · MAJORITY_AGREE | refused: only the organiser may announce a change | [`0xae884e02…1b0b`](https://explorer-studio.genlayer.com/tx/0xae884e02371e59d362cabf8b0c5c0f55a531a16bd418612f9185864c287a1b0b) |
| 3 | the organiser announces a later door time | organiser [`0xbF9E…D61E`](https://explorer-studio.genlayer.com/address/0xbF9E6F440dC2bAD2b42353FBe7f3DC558770D61E) | `announce` | FINALIZED · MAJORITY_AGREE | executed | [`0xcc724d1a…0e57`](https://explorer-studio.genlayer.com/tx/0xcc724d1aa0605b0df8290451af045c63d72b8986d4a679b9ffa2ff2c32c60e57) |
| 4 | ruled: both orders (expected minor) | fan [`0x5Bf2…7315`](https://explorer-studio.genlayer.com/address/0x5Bf2F71Ab8F5f84d2e5a94a39E87C21f1D447315) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0xaaa73236…d941`](https://explorer-studio.genlayer.com/tx/0xaaa732367974394309b8c4950d7e70fa8cbe0a2f1c46c365b1d8c0531934d941) |
