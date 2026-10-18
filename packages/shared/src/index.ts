/**
 * Types and pure rules shared by the Lineup contract (packages/contracts/lineup.py)
 * and any client that reads it: a box office page, a bot, another app.
 *
 * Two kinds of thing live here:
 *
 *   1. The SHAPE of what the contract's views return, with a parser that
 *      refuses anything else. The price comes back as a decimal string and is
 *      parsed to bigint, because it can exceed what a number holds.
 *      genlayer-js 1.1.8 returns plain objects; older builds returned Map, so
 *      the parser accepts both.
 *
 *   2. A PORT of the contract's deterministic rules: how caller text is
 *      cleaned, how a model's answer is read back through the order it was
 *      asked in, how the two orders fold into one ruling, and which rulings
 *      refund the fans. A port that disagrees with the contract is worse than
 *      none, so it is tested against lineup-vectors.json, which is generated
 *      FROM the contract's own functions and read by its Python tests too.
 */

// ---------------------------------------------------------------- tokens

export const MATERIAL = "material" as const;
export const MINOR = "minor" as const;
export const UNRULED = "unruled" as const;
export const RULINGS = ["", MATERIAL, MINOR, UNRULED] as const;
export type Ruling = (typeof RULINGS)[number];
export const STATUSES = ["on_sale", "paid", "refunded"] as const;
export type Status = (typeof STATUSES)[number];

/** The order the options are asked in first, and then reversed. */
export const FORWARD = [MATERIAL, MINOR] as const;
export const REVERSED = [MINOR, MATERIAL] as const;

// ---------------------------------------------------------------- shapes

export interface Show {
  id: number;
  title: string;
  description: string;
  organiser: string;
  price: bigint;
  capacity: number;
  sold: number;
  status: Status;
  created_at: string;
  sales_close: string;
  starts_at: string;
  rule_window: number;
  /** "" until announced */
  change: string;
  announced_at: string;
  rules_close: string;
  ruling: Ruling;
  /** "" unless rule() decided it */
  ruled_by: string;
  /** leader-supplied and NOT part of consensus */
  why: string;
  reason_is_leader_supplied: boolean;
  settled_at: string;
}

export interface Ticket {
  id: number;
  show: number;
  holder: string;
  bought_at: string;
  refunded: bigint;
}

type Raw = Record<string, unknown>;

function record(v: unknown): Raw | null {
  if (v instanceof Map) return Object.fromEntries(v.entries()) as Raw;
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Raw;
  return null;
}

function num(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`expected a number, got ${String(v)}`);
  return n;
}

function str(v: unknown): string {
  if (typeof v !== "string") throw new Error(`expected a string, got ${typeof v}`);
  return v;
}

function wei(v: unknown): bigint {
  const s = str(v);
  if (!/^[0-9]+$/.test(s)) throw new Error(`expected an amount of wei, got ${s}`);
  return BigInt(s);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], what: string): T {
  const s = str(v);
  if (!(allowed as readonly string[]).includes(s)) throw new Error(`unexpected ${what}: ${s}`);
  return s as T;
}

export function parseShow(v: unknown): Show {
  const r = record(v);
  if (!r) throw new Error("show is not an object");
  const s: Show = {
    id: num(r.id), title: str(r.title), description: str(r.description), organiser: str(r.organiser),
    price: wei(r.price), capacity: num(r.capacity), sold: num(r.sold), status: oneOf(r.status, STATUSES, "status"),
    created_at: str(r.created_at), sales_close: str(r.sales_close), starts_at: str(r.starts_at),
    rule_window: num(r.rule_window), change: str(r.change), announced_at: str(r.announced_at),
    rules_close: str(r.rules_close), ruling: oneOf(r.ruling, RULINGS, "ruling"), ruled_by: str(r.ruled_by),
    why: str(r.why), reason_is_leader_supplied: Boolean(r.reason_is_leader_supplied), settled_at: str(r.settled_at),
  };
  // a ruling needs a change; a refund needs a refunding ruling; payment needs none
  if (s.ruling !== "" && s.change === "") throw new Error(`ruled ${s.ruling} with no change`);
  if (s.status === "refunded" && !refunds(s.ruling)) throw new Error(`refunded on a ${s.ruling || "missing"} ruling`);
  if (s.status === "paid" && refunds(s.ruling)) throw new Error(`paid on a ${s.ruling} ruling`);
  if (s.sold > s.capacity) throw new Error(`sold ${s.sold} of ${s.capacity}`);
  return s;
}

export function parseTicket(v: unknown): Ticket {
  const r = record(v);
  if (!r) throw new Error("ticket is not an object");
  return { id: num(r.id), show: num(r.show), holder: str(r.holder), bought_at: str(r.bought_at), refunded: wei(r.refunded) };
}

/** Whether anyone may settle this show at `now`. A view has no clock, so the
 * caller brings one; the contract applies the same rule to the chain's clock
 * when settle() is sent. */
export function isSettleable(s: Show, now: Date): boolean {
  if (s.status !== "on_sale") return false;
  if (s.change !== "" && s.ruling === "") return now.getTime() > Date.parse(s.rules_close);
  return now.getTime() > Date.parse(s.starts_at);
}

// ---------------------------------------------------------------- the port

/** Python's str.split() whitespace, as far as cleaned text can contain it:
 * JavaScript's \s plus NEL (U+0085), which Python splits on and \s does not. */
const PY_WS = /[\s\u0085]+/;

/** The contract's clean_text: control characters become spaces, whitespace
 * collapses, nothing is truncated. */
export function cleanText(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const o = ch.codePointAt(0) ?? 0;
    out += o < 32 || o === 127 ? " " : ch;
  }
  return out.split(PY_WS).filter(Boolean).join(" ");
}

/** Python's str.strip(chars): remove any of `chars` from both ends. */
function stripChars(s: string, chars: string): string {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

/** A model's answer as an option number 0..n-1, or "" if it is not one. */
export function normaliseChoice(raw: string, n: number): string {
  const s = stripChars(raw.trim().toLowerCase(), "[]()#").trim();
  if (s === "" || s.length > 2 || !/^[0-9]+$/.test(s)) return "";
  const k = Number(s);
  if (k < 0 || k >= n) return "";
  return String(k);
}

/** An option number, read back into its token through the order it was asked in. */
export function optionOf(choice: string, order: readonly string[]): string {
  if (choice === "") return "";
  return order[Number(choice)];
}

/** Both orders into one ruling. The same option stands; anything else is material. */
export function fold(forward: string, reverse: string): string {
  if (forward === "" || reverse === "") return "";
  return forward === reverse ? forward : MATERIAL;
}

/** The validator's free check: one of the two options. */
export function rulingSound(ruling: string): boolean {
  return ruling === MATERIAL || ruling === MINOR;
}

/** Whether a ruling refunds every holder. */
export function refunds(ruling: string): boolean {
  return ruling === MATERIAL || ruling === UNRULED;
}
