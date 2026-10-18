// A second round on the deployed contract, from two NEW wallets.
//
//   pnpm seed:activity
//
// The contract in deployments/studionet.json is not redeployed. Two wallets
// made in memory for this run, used by nothing else, run one show from listing
// to a ruling, and each tries once what only the other may do:
//
//   organiser  lists a show in Bristol, 0.02 GEN a ticket
//   fan        buys a ticket
//   fan        tries to announce a change            refused: only the organiser
//   organiser  announces a later door time
//   fan        asks for the ruling                     expected minor: no refund
//
// Everything goes to deployments/studionet-activity.json, apart from the demo's
// own record, so the demo and the tests that replay it are untouched. Then
// `pnpm evidence:activity` writes EVIDENCE-ACTIVITY.md from the chain.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { PKG, RECORD_FILE, clientFor, fundAccount, loadEnv, network, readRetry, recorder } from "./lib.mjs";

loadEnv();
const net = network();
if (net.name !== "studionet") throw new Error("the activity round makes throwaway wallets; run it on studionet");
const address = JSON.parse(readFileSync(RECORD_FILE, "utf8")).contract;
const data = JSON.parse(readFileSync(path.join(PKG, "demo", "activity.json"), "utf8"));
const OUT = path.join(PKG, "deployments", "studionet-activity.json");

const organiser = createAccount(generatePrivateKey());
const fan = createAccount(generatePrivateKey());
const asOrganiser = clientFor(net, organiser);
const asFan = clientFor(net, fan);
const ro = clientFor(net, null);
const read = (fn, args = []) => readRetry(() => ro.readContract({ address, functionName: fn, args }));
const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));

const id = Number(await read("count"));
console.log(`\ncontract ${address} (already deployed, ${id} shows on it)\n  organiser ${organiser.address}\n  fan       ${fan.address}`);
await fundAccount(net, ro, fan.address, 10n ** 18n);

const S = data.show;
const rec = recorder();
await rec.write(asOrganiser, organiser, address, "create",
  [S.title, S.description, BigInt(S.price), S.capacity, S.sales_window, S.starts_in, S.rule_window],
  { step: `show ${id}: a new organiser lists The Lanterns, 0.02 GEN` });
await rec.write(asFan, fan, address, "buy", [id], { step: "a new fan buys a ticket", value: BigInt(S.price) });
await rec.write(asFan, fan, address, "announce", [id, data.change], { step: "the fan tries to announce a change", expect: "refused" });
await rec.write(asOrganiser, organiser, address, "announce", [id, data.change], { step: "the organiser announces a later door time" });
await rec.write(asFan, fan, address, "rule", [id], { step: `ruled: both orders (expected ${data.expected_ruling})` });

const show = plain(await read("show", [id]));
writeFileSync(OUT, JSON.stringify({
  network: net.name,
  contract: address,
  accounts: { organiser: organiser.address, fan: fan.address },
  steps: rec.steps,
  shows: { [id]: show },
}, null, 2) + "\n");

console.log(`  show ${id}  ${show.status}  ruling ${show.ruling}`);
console.log(`  written  ${path.relative(PKG, OUT)}\n`);
