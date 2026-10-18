import { describe, expect, it } from "vitest";
import demo from "../../contracts/demo/demo.json";
import record from "../../contracts/deployments/studionet.json";
import shape from "../contract-shape.json";
import { parseShow, parseTicket, refunds } from "./index";

// The live deployment's own answers, as packages/contracts/scripts/seed.mjs
// read them back from studionet. If the contract ever returned a shape these
// parsers refuse, a client built on this package would break on real data;
// this is where that shows up first.

describe("the parsers accept everything the live deployment returned", () => {
  it("every show and ticket, with exactly the fields the contract describes", () => {
    for (const x of record.shows) expect(Object.keys(parseShow(x)).sort()).toEqual(shape.views.show.fields);
    for (const t of record.tickets) expect(Object.keys(parseTicket(t)).sort()).toEqual(shape.views.tickets_of.row_fields);
  });

  it("every show's description and price are the ones the demo listed", () => {
    const keys = ["pines", "kaye", "harbour"] as const;
    record.shows.forEach((x, k) => {
      const s = parseShow(x);
      expect(s.description).toBe(demo.shows[keys[k]].description);
      expect(s.price).toBe(BigInt(demo.shows[keys[k]].price));
    });
  });

  it("every ticket was refunded exactly when the port says its show's ruling refunds", () => {
    const shows = record.shows.map(parseShow);
    for (const t of record.tickets.map(parseTicket)) {
      const s = shows[t.show];
      expect(t.refunded).toBe(refunds(s.ruling) ? s.price : 0n);
    }
  });

  it("the wallets moved by exactly what the contract paid them", () => {
    const b = record.balances as Record<string, string>;
    for (const [who, owed] of Object.entries(record.owed)) {
      expect(BigInt(b[`${who}_after`]) - BigInt(b[`${who}_before`])).toBe(BigInt(owed));
    }
  });
});
