import { describe, it, expect } from "vitest";
import { loggingGoldPerLe, potionDefault, TIMBER_SLUGS, LE_PER_BASIC_POTION } from "../src/lib/packs/lifeEnergy";

// Pinned to an independent Python port of the Tool Efficiency tab of Lulu's Logging Tool
// Efficiency Calculator (the user's copy, "Valluru's Logging Guide") that reproduces the xlsx's
// cached cells to 10 decimals. Prices are per unit (the sheet's per-100 inputs / 100).
function timber(t: number, tender: number, sturdy: number, abidos: number): Record<string, number> {
  return { timber: t, "tender-timber": tender, "sturdy-timber": sturdy, "abidos-timber": abidos };
}
const SHEET = timber(0.5, 1.09, 4.99, 6.53);
const NA = timber(0.85, 1.78, 8.2, 9.26);
const EU = timber(0.99, 2.09, 10.77, 10.98);

describe("loggingGoldPerLe / potionDefault", () => {
  it("reproduces the sheet's own J10 at its example prices and F4 6,200", () => {
    const m = { ...SHEET, "blue-crystal": 6200 / 95 };
    expect(loggingGoldPerLe(m)).toBeCloseTo(0.477276822607754, 12);
    expect(loggingGoldPerLe(m)).toBeCloseTo(0.4772768226, 10); // the sheet's cached J10
    expect(potionDefault(m)).toBeCloseTo(1431.8304678233, 9);
  });

  it("gives the same result with no blue-crystal price when crafting is cheaper", () => {
    expect(loggingGoldPerLe(SHEET)).toBeCloseTo(0.477276822607754, 12);
    expect(potionDefault(SHEET)).toBeCloseTo(1431.8304678233, 9);
    expect(loggingGoldPerLe(NA)).toBeCloseTo(0.754924402118119, 12);
    expect(potionDefault(NA)).toBeCloseTo(2264.7732063544, 9);
  });

  it("values NA and EU live prices at an F4 input of 35,000", () => {
    const na = { ...NA, "blue-crystal": 35000 / 95 };
    expect(loggingGoldPerLe(na)).toBeCloseTo(0.754924402118119, 12);
    expect(potionDefault(na)).toBeCloseTo(2264.7732063544, 9);
    const eu = { ...EU, "blue-crystal": 35000 / 95 };
    expect(loggingGoldPerLe(eu)).toBeCloseTo(0.912987966891191, 12);
    expect(potionDefault(eu)).toBeCloseTo(2738.9639006736, 9);
  });

  it("takes the BC restoration route when it beats crafting (F4 1,000)", () => {
    const m = { ...NA, "blue-crystal": 1000 / 95 };
    expect(loggingGoldPerLe(m)).toBeCloseTo(0.776488372691758, 12);
    expect(potionDefault(m)).toBeCloseTo(2329.4651180753, 9);
  });

  it("is 3,000 LE per potion", () => {
    expect(LE_PER_BASIC_POTION).toBe(3000);
    expect(potionDefault(NA)).toBe(3000 * loggingGoldPerLe(NA)!);
  });

  it("is null when any timber price is missing, zero, negative or NaN", () => {
    expect(loggingGoldPerLe({})).toBeNull();
    expect(potionDefault({})).toBeNull();
    for (const slug of TIMBER_SLUGS) {
      const missing = { ...NA };
      delete missing[slug];
      for (const m of [missing, { ...NA, [slug]: 0 }, { ...NA, [slug]: -1 }, { ...NA, [slug]: NaN }]) {
        expect(loggingGoldPerLe(m), slug).toBeNull();
        expect(potionDefault(m), slug).toBeNull();
      }
    }
  });

  it("never reads the potion's own price", () => {
    expect(loggingGoldPerLe({ ...NA, "basic-life-energy-potion": 99999 })).toBe(loggingGoldPerLe(NA));
  });
});
