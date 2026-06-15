import { describe, it, expect } from "vitest";
import { isValidRows, maxTimestamp, buildRegionSnapshot, buildPayload } from "../src/normalize";
import type { FeedRow } from "../src/feed";

const rows: FeedRow[] = [
  { item_slug: "grudge", price: 100, timestamp: 1781506594 },
  { item_slug: "destiny-leapstone", price: 14, timestamp: 1781506000 },
];

describe("isValidRows", () => {
  it("accepts a non-empty list of positive priced rows", () => {
    expect(isValidRows(rows)).toBe(true);
  });
  it("rejects an empty list", () => {
    expect(isValidRows([])).toBe(false);
  });
  it("rejects non-positive prices", () => {
    expect(isValidRows([{ item_slug: "x", price: 0, timestamp: 1 }])).toBe(false);
  });
});

describe("buildRegionSnapshot", () => {
  it("maps slug->price and stamps source_valid_at from the max timestamp", () => {
    const snap = buildRegionSnapshot(rows);
    expect(snap.prices).toEqual({ grudge: 100, "destiny-leapstone": 14 });
    expect(maxTimestamp(rows)).toBe(1781506594);
    expect(snap.source_valid_at).toBe(new Date(1781506594 * 1000).toISOString());
  });
});

describe("buildPayload", () => {
  it("assembles the contract shape", () => {
    const snap = buildRegionSnapshot(rows);
    const payload = buildPayload({ nae: snap }, { grudge: 1 }, "2026-06-15T00:00:00.000Z");
    expect(payload).toEqual({
      schema_version: 1,
      generated_at: "2026-06-15T00:00:00.000Z",
      regions: { nae: snap },
      bundles: { grudge: 1 },
    });
  });
});
