import { describe, it, expect } from "vitest";
import { ALL_SLUGS, REGIONS } from "../src/items";
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
});
