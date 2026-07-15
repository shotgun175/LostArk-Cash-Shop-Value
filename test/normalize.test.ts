import { describe, it, expect } from "vitest";
import { isValidRow, sanitizeRows, maxTimestamp, buildRegionSnapshot, buildPayload, applyDerivedPrices } from "../src/normalize";
import type { FeedRow } from "../src/feed";
import { BUNDLES } from "../src/bundles";

const TS = 1781506594; // valid epoch-seconds
const good: FeedRow = { item_slug: "grudge", price: 100, timestamp: TS };

describe("isValidRow", () => {
  it("accepts a well-formed, known-slug row", () => {
    expect(isValidRow(good)).toBe(true);
  });

  it("rejects unknown or dangerous slugs (allowlist)", () => {
    expect(isValidRow({ ...good, item_slug: "not-a-real-slug" })).toBe(false);
    expect(isValidRow({ ...good, item_slug: "__proto__" })).toBe(false);
    expect(isValidRow({ ...good, item_slug: "constructor" })).toBe(false);
  });

  it("rejects non-positive, non-finite, or absurd prices", () => {
    expect(isValidRow({ ...good, price: 0 })).toBe(false);
    expect(isValidRow({ ...good, price: -5 })).toBe(false);
    expect(isValidRow({ ...good, price: Infinity })).toBe(false);
    expect(isValidRow({ ...good, price: NaN })).toBe(false);
    expect(isValidRow({ ...good, price: 1e308 })).toBe(false);
  });

  it("rejects out-of-range or non-integer timestamps (incl. millisecond-scale)", () => {
    expect(isValidRow({ ...good, timestamp: 0 })).toBe(false);
    expect(isValidRow({ ...good, timestamp: 2000 })).toBe(false); // far too small
    expect(isValidRow({ ...good, timestamp: 1781506594000 })).toBe(false); // ms-scale
    expect(isValidRow({ ...good, timestamp: Infinity })).toBe(false);
    expect(isValidRow({ ...good, timestamp: TS + 0.5 })).toBe(false); // non-integer
  });

  it("rejects a plausible-but-future timestamp beyond the skew window, accepts a small skew", () => {
    const nowMs = Date.parse("2026-06-15T06:00:00.000Z");
    const nowS = Math.floor(nowMs / 1000);
    expect(isValidRow({ ...good, timestamp: nowS + 7200 }, nowMs)).toBe(false); // +2h -> rejected
    expect(isValidRow({ ...good, timestamp: nowS + 300 }, nowMs)).toBe(true); // +5min -> accepted
    expect(isValidRow({ ...good, timestamp: nowS + 3600 }, nowMs)).toBe(true); // exactly at the skew edge
    expect(isValidRow({ ...good, timestamp: nowS + 3601 }, nowMs)).toBe(false); // one second past it
  });
});

describe("sanitizeRows", () => {
  it("drops invalid rows but keeps the valid ones", () => {
    const rows: FeedRow[] = [
      good,
      { item_slug: "destiny-leapstone", price: 14, timestamp: TS },
      { item_slug: "grudge", price: -1, timestamp: TS }, // bad price
      { item_slug: "junk-slug", price: 5, timestamp: TS }, // unknown slug
      { item_slug: "grudge", price: 5, timestamp: 1781506594000 }, // ms timestamp
    ];
    const out = sanitizeRows(rows);
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.item_slug)).toEqual(["grudge", "destiny-leapstone"]);
  });

  it("returns [] for empty or non-array input", () => {
    expect(sanitizeRows([])).toEqual([]);
    expect(sanitizeRows(undefined as unknown as FeedRow[])).toEqual([]);
  });

  it("caps the number of rows (DoS guard)", () => {
    const many = Array.from({ length: 6000 }, () => good);
    expect(sanitizeRows(many)).toHaveLength(5000);
  });

  it("drops implausibly-future rows using the injected clock", () => {
    const nowMs = Date.parse("2026-06-15T06:00:00.000Z");
    const nowS = Math.floor(nowMs / 1000);
    const rows: FeedRow[] = [
      { item_slug: "grudge", price: 100, timestamp: nowS - 60 }, // just-past -> kept
      { item_slug: "grudge", price: 200, timestamp: nowS + 7200 }, // +2h -> dropped
    ];
    const out = sanitizeRows(rows, nowMs);
    expect(out).toHaveLength(1);
    expect(out[0].price).toBe(100);
  });
});

describe("buildRegionSnapshot", () => {
  it("maps slug->price and stamps source_valid_at from the max timestamp", () => {
    const rows: FeedRow[] = [good, { item_slug: "destiny-leapstone", price: 14, timestamp: 1781506000 }];
    const snap = buildRegionSnapshot(rows);
    expect(snap.prices).toEqual({ grudge: 100, "destiny-leapstone": 14 });
    expect(maxTimestamp(rows)).toBe(TS);
    expect(snap.source_valid_at).toBe(new Date(TS * 1000).toISOString());
  });

  it("keeps the last price on a duplicate slug", () => {
    const snap = buildRegionSnapshot([
      { item_slug: "grudge", price: 100, timestamp: TS },
      { item_slug: "grudge", price: 200, timestamp: TS },
    ]);
    expect(snap.prices.grudge).toBe(200);
  });

  it("converts the raw per-stack feed price to per-unit via the stack size", () => {
    // destruction-stone stack size = 1000
    const snap = buildRegionSnapshot([{ item_slug: "destruction-stone", price: 1997, timestamp: TS }]);
    expect(snap.prices["destruction-stone"]).toBeCloseTo(1997 / BUNDLES["destruction-stone"], 6);
    // stack-1 item unchanged
    expect(buildRegionSnapshot([{ item_slug: "grudge", price: 100000, timestamp: TS }]).prices.grudge).toBe(100000);
  });
});

describe("applyDerivedPrices", () => {
  it("re-keys each unbound battle item onto its bound slug and strips the source", () => {
    const prices: Record<string, number> = { "splendid-sacred-charm": 799, grudge: 100 };
    applyDerivedPrices(prices);
    expect(prices["splendid-sacred-charm-bound"]).toBe(799);
    expect(prices["splendid-sacred-charm"]).toBeUndefined();
    expect(prices.grudge).toBe(100); // unrelated prices untouched
  });

  it("derives destiny-shard from the L pouch (÷3000) when not listed directly", () => {
    const prices: Record<string, number> = { "destiny-shard-pouch-l": 578 };
    applyDerivedPrices(prices);
    expect(prices["destiny-shard"]).toBeCloseTo(578 / 3000, 6);
  });

  it("does not override an explicit destiny-shard price", () => {
    const prices: Record<string, number> = { "destiny-shard": 0.224, "destiny-shard-pouch-l": 578 };
    applyDerivedPrices(prices);
    expect(prices["destiny-shard"]).toBe(0.224);
  });
});

describe("buildRegionSnapshot derived sourcing", () => {
  it("prices the bound battle item from its unbound feed row, not the unbound key", () => {
    const snap = buildRegionSnapshot([{ item_slug: "stimulant", price: 111, timestamp: 1781506594 }]);
    expect(snap.prices["stimulant-bound"]).toBe(111);
    expect(snap.prices["stimulant"]).toBeUndefined();
  });
});

describe("buildPayload", () => {
  it("assembles the contract shape", () => {
    const snap = buildRegionSnapshot([good]);
    const payload = buildPayload({ nae: snap }, { grudge: 1 }, "2026-06-15T00:00:00.000Z");
    expect(payload).toEqual({
      schema_version: 1,
      generated_at: "2026-06-15T00:00:00.000Z",
      regions: { nae: snap },
      bundles: { grudge: 1 },
    });
  });
});
