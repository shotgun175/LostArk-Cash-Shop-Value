import { describe, it, expect } from "vitest";
import { ALL_SLUGS, REGIONS, FETCH_SLUGS, PRICE_SOURCE_SLUGS, BOUND_FROM_UNBOUND } from "../src/items";
import { BUNDLES } from "../src/bundles";

describe("items catalog", () => {
  it("tracks 95 unique slugs", () => {
    expect(ALL_SLUGS.length).toBe(95);
    expect(new Set(ALL_SLUGS).size).toBe(95);
  });

  it("includes known anchor slugs", () => {
    expect(ALL_SLUGS).toContain("destiny-leapstone");
    expect(ALL_SLUGS).toContain("grudge");
    expect(ALL_SLUGS).toContain("splendid-netherworld-frost-key");
  });

  it("targets only the two fresh regions", () => {
    expect([...REGIONS]).toEqual(["nae", "euc"]);
  });

  it("has a stack-size in BUNDLES for every tracked slug, and no dead bundle keys", () => {
    // Binds the two hand-maintained lists: a stacked slug missing from BUNDLES would
    // silently ship Nx-wrong (per-stack) prices via the `?? 1` fallback.
    expect([...ALL_SLUGS].sort()).toEqual(Object.keys(BUNDLES).sort());
    for (const s of ALL_SLUGS) expect(typeof BUNDLES[s]).toBe("number");
  });

  it("fetches the display universe plus the 6 unbound price-source slugs", () => {
    expect(PRICE_SOURCE_SLUGS).toEqual(Object.keys(BOUND_FROM_UNBOUND));
    expect(PRICE_SOURCE_SLUGS.length).toBe(6);
    expect([...FETCH_SLUGS].sort()).toEqual([...ALL_SLUGS, ...PRICE_SOURCE_SLUGS].sort());
    // Sources are pure price inputs — not part of the displayed catalog, and stripped from output.
    for (const s of PRICE_SOURCE_SLUGS) expect(ALL_SLUGS).not.toContain(s);
    // Every bound target IS a tracked display slug that the source prices.
    for (const bound of Object.values(BOUND_FROM_UNBOUND)) expect(ALL_SLUGS).toContain(bound);
  });
});
