import { describe, expect, it } from "vitest";
import vectors from "../lineup-vectors.json";
import {
  FORWARD,
  REVERSED,
  cleanText,
  fold,
  isSettleable,
  normaliseChoice,
  optionOf,
  parseShow,
  parseTicket,
  refunds,
  rulingSound,
} from "./index";

// lineup-vectors.json is generated from the contract's own functions
// (see packages/contracts/tests/test_vectors.py), so every case below is the
// contract's answer, not a hand-written expectation.

describe("the port agrees with the contract on every vector", () => {
  it.each(vectors.clean_text)("clean_text %#", ({ raw, clean }) => expect(cleanText(raw)).toBe(clean));
  it.each(vectors.normalise_choice)("normalise_choice %#", ({ raw, n, choice }) => expect(normaliseChoice(raw, n)).toBe(choice));
  it.each(vectors.option_of)("option_of %#", ({ choice, order, option }) => expect(optionOf(choice, order)).toBe(option));
  it.each(vectors.fold)("fold %#", ({ forward, reverse, folded }) => expect(fold(forward, reverse)).toBe(folded));
  it.each(vectors.ruling_sound)("ruling_sound %#", ({ ruling, sound }) => expect(rulingSound(ruling)).toBe(sound));
  it.each(vectors.refunds)("refunds %#", ({ ruling, refunds: want }) => expect(refunds(ruling)).toBe(want));
});

describe("the two orders", () => {
  it("are each other's reverse", () => {
    expect([...REVERSED]).toEqual([...FORWARD].reverse());
  });
});

describe("parsers refuse what the contract never returns", () => {
  const base = {
    id: 1, title: "Mira Kaye", description: "A full live headline set.", organiser: "0x" + "11".repeat(20),
    price: "80000000000000000", capacity: 5, sold: 2, status: "refunded", created_at: "t", sales_close: "t",
    starts_at: "2026-10-18T23:00:00Z", rule_window: 600, change: "Cancelled; a DJ set instead.", announced_at: "t",
    rules_close: "2026-10-18T22:40:00Z", ruling: "material", ruled_by: "0x" + "22".repeat(20), why: "",
    reason_is_leader_supplied: true, settled_at: "t",
  };
  it("parses a show and a ticket from an object or a Map, with amounts as bigint", () => {
    expect(parseShow(base).price).toBe(8n * 10n ** 16n);
    expect(parseShow(new Map(Object.entries(base))).ruling).toBe("material");
    expect(parseTicket({ id: 0, show: 1, holder: "0x" + "22".repeat(20), bought_at: "t", refunded: "80" }).refunded).toBe(80n);
  });
  it("refuses a ruling, a status or an amount the contract never returns", () => {
    expect(() => parseShow({ ...base, ruling: "major" })).toThrow("unexpected ruling");
    expect(() => parseShow({ ...base, status: "cancelled" })).toThrow("unexpected status");
    expect(() => parseShow({ ...base, price: "8e16" })).toThrow("amount of wei");
  });
  it("refuses a settlement that contradicts the ruling", () => {
    expect(() => parseShow({ ...base, ruling: "minor" })).toThrow();
    expect(() => parseShow({ ...base, status: "paid" })).toThrow();
    expect(() => parseShow({ ...base, change: "" })).toThrow();
    expect(() => parseShow({ ...base, sold: 6 })).toThrow();
    expect(parseShow({ ...base, status: "paid", ruling: "minor" }).status).toBe("paid");
    expect(parseShow({ ...base, ruling: "unruled", ruled_by: "" }).ruling).toBe("unruled");
  });
  it("tells when anyone may settle, with the clock the view does not have", () => {
    const pending = parseShow({ ...base, status: "on_sale", ruling: "", ruled_by: "" });
    expect(isSettleable(pending, new Date("2026-10-18T22:40:00Z"))).toBe(false);
    expect(isSettleable(pending, new Date("2026-10-18T22:40:01Z"))).toBe(true);
    const minor = parseShow({ ...base, status: "on_sale", ruling: "minor" });
    expect(isSettleable(minor, new Date("2026-10-18T23:00:00Z"))).toBe(false);
    expect(isSettleable(minor, new Date("2026-10-18T23:00:01Z"))).toBe(true);
    expect(isSettleable(parseShow(base), new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });
});
