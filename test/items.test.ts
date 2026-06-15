import { describe, it, expect } from "vitest";
import { ALL_SLUGS, REGIONS } from "../src/items";

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
});
