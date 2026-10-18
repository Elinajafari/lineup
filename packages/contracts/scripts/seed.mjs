// Put the demo on the explorer: every route the contract has, refusals included.
//
//   pnpm seed:contract
//
// Reads the address from deployments/studionet.json (written by deploy.mjs)
// and sends the steps in demo/demo.json, in order: the organiser lists three
// shows, five fans buy tickets, the organiser announces a change to each
// show, two changes are ruled (one minor, one material), one is never ruled,
// and the run waits on the chain's clock until that one's rulings close and
// until the first show starts before settling them. It sends every write the
// contract exists to refuse. Everything is appended to the same record: each
// transaction hash and its sender, its status, the refusal sentence where
// there was one, every show and its tickets as the chain holds them, and
// every wallet's balance read from the chain after the tickets were bought
// and once every payout had landed. Nothing in that file is typed by hand.
//
// The balances are read after the purchases, not before, because StudioNet
// keeps the value sent with a refused payable call at the contract's address:
// the demo's wrong price and the organiser's attempt to buy are refused, and
// their value is not returned. The contract's own `held` counts only accepted
// payments, so that value is never paid out.
//
// Seven wallets act, each in one role: the organiser, five fans (Ann, Ben,
// Cal, Dev and Eve) and a stranger. They come from <ROLE>_PRIVATE_KEY, or on
// studionet are made in memory for this run and never written to disk; every
// fan and the organiser are funded from the StudioNet faucet. The run stops
// at the first step that does not do what the demo expects, because the
// record claims whatever it holds.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PKG, RECORD_FILE, accountFrom, balanceOf, clientFor, fundAccount, loadEnv, network, readRetry, recorder, sleep, sourceSha256 } from "./lib.mjs";

loadEnv();
const net = network();
const record = JSON.parse(readFileSync(RECORD_FILE, "utf8"));
if (record.source_sha256 !== sourceSha256()) {
  throw new Error("lineup.py has changed since it was deployed; run pnpm deploy:contract first");
}
const address = record.contract;
const demo = JSON.parse(readFileSync(path.join(PKG, "demo", "demo.json"), "utf8"));
const GEN = 10n ** 18n;

const ROLES = ["organiser", "ann", "ben", "cal", "dev", "eve", "stranger"];
const who = Object.fromEntries(ROLES.map((k) => [k, accountFrom(`${k.toUpperCase()}_PRIVATE_KEY`, net)]));
const as = Object.fromEntries(ROLES.map((k) => [k, clientFor(net, who[k])]));
const ro = clientFor(net, null);
console.log(`\ncontract ${address}`);
for (const k of ROLES) console.log(`  ${k.padEnd(10)} ${who[k].address}`);

const rec = recorder();
const read = (fn, args = []) => readRetry(() => ro.readContract({ address, functionName: fn, args }));
const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));

const existing = Number(await read("count"));
if (existing !== 0) throw new Error(`the demo expects a fresh contract; this one already has ${existing} shows`);

if (net.name === "studionet") {
  console.log("\nfunding the organiser and the fans from the StudioNet faucet");
  for (const k of ["organiser", "ann", "ben", "cal", "dev", "eve"]) await fundAccount(net, ro, who[k].address, GEN);
}

const PAID = ["organiser", "ann", "ben", "cal", "dev", "eve"];
const balances = async () => Object.fromEntries(await Promise.all(PAID.map(async (k) => [k, await balanceOf(ro, who[k].address)])));
const expected = [...demo.expected_rulings];
const lastBuy = demo.steps.map((x) => x.method).lastIndexOf("buy");
const order = Object.keys(demo.shows);
let before = null;

console.log("\nthe demo");
for (const [i, step] of demo.steps.entries()) {
  if (step.after) {
    const [field, k] = step.after;
    const when = Date.parse(plain(await read("show", [k]))[field]);
    for (let left = when + 20_000 - Date.now(); left > 0; left = when + 20_000 - Date.now()) {
      console.log(`  waiting ${Math.ceil(left / 1000)} s for show ${k}'s ${field.replace("_", " ")}`);
      await sleep(Math.min(left, 30_000));
    }
  }
  let args = [step.id];
  let value = 0n;
  if (step.method === "create") {
    const x = demo.shows[step.show];
    args = [x.title, x.description, BigInt(x.price), x.capacity, x.sales_window, x.starts_in, x.rule_window];
  } else if (step.method === "buy") {
    value = BigInt(step.wrong ? demo.wrong_price : demo.shows[order[step.id]].price);
  } else if (step.method === "announce") {
    args = [step.id, demo.changes[step.change]];
  }
  await rec.write(as[step.who], who[step.who], address, step.method, args, { step: step.step, expect: step.expect, value });
  // A ruling must come back as the demo expects, or every step after it would
  // be recorded against the wrong story: stop here instead.
  if (step.method === "rule" && step.expect === "ok") {
    const got = plain(await read("show", [step.id]));
    const want = expected.shift();
    console.log(`      ruled ${got.ruling}: ${got.why}`);
    if (got.ruling !== want) throw new Error(`show ${step.id} was ruled ${got.ruling}, the demo expects ${want}`);
  }
  if (i === lastBuy) before = await balances();
}

const n = Number(await read("count"));
const shows = [];
const tickets = [];
for (let k = 0; k < n; k++) {
  shows.push(plain(await read("show", [k])));
  tickets.push(...plain(await read("tickets_of", [k])).tickets);
}
const owed = Object.fromEntries(PAID.map((p) => [p, 0n]));
const name = Object.fromEntries(PAID.map((p) => [who[p].address.toLowerCase(), p]));
for (const t of tickets) owed[name[t.holder.toLowerCase()]] += BigInt(t.refunded);
for (const s of shows) if (s.status === "paid") owed.organiser += BigInt(s.price) * BigInt(s.sold);
// a payout is a message the chain delivers after the transaction; wait until every one has landed
let after = await balances();
for (let k = 0; k < 12 && PAID.some((p) => after[p] - before[p] !== owed[p]); k++) {
  await sleep(10_000);
  after = await balances();
}
const out = {
  ...record,
  accounts: { deployer: record.deployer, ...Object.fromEntries(ROLES.map((k) => [k, who[k].address])) },
  steps: [...record.steps.filter((st) => st.step === "deploy"), ...rec.steps],
  shows,
  tickets,
  balances: Object.fromEntries(PAID.flatMap((p) => [[`${p}_before`, String(before[p])], [`${p}_after`, String(after[p])]])),
  owed: Object.fromEntries(PAID.map((p) => [p, String(owed[p])])),
  held_after: String(await read("held_total")),
};
writeFileSync(RECORD_FILE, JSON.stringify(out, null, 2) + "\n");

const gen = (wei) => `${Number(BigInt(wei)) / 1e18} GEN`;
console.log("");
for (const s of shows) console.log(`  show ${s.id}  ${s.status.padEnd(9)} ruling ${s.ruling || "-"}`);
for (const p of PAID) console.log(`  ${p.padEnd(10)} ${gen(before[p])} -> ${gen(after[p])}  (owed ${gen(owed[p])})`);
console.log(`  written  ${path.relative(PKG, RECORD_FILE)}\n`);
