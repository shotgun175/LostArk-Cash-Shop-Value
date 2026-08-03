import { describe, it, expect } from "vitest";
import {
  HONE_TABLES,
  TJW_MAT_PRICE_KEY,
  TJW_DEFAULT_PRICES,
  ARTISAN_THRESHOLD,
  type HoneMatKey,
} from "../src/lib/packs/data/specialHoneTables";

describe("specialHoneTables shape", () => {
  it("has both leapstone kinds with weapon+armor tables covering +12..+25 contiguously", () => {
    for (const kind of ["transferred", "circulated"] as const) {
      for (const slot of ["weapon", "armor"] as const) {
        const { levels } = HONE_TABLES[kind][slot];
        expect(levels.map((r) => r.level)).toEqual(Array.from({ length: 14 }, (_, i) => 12 + i));
        for (const r of levels) {
          // Rates are TJW's 0.01% fixed point, so 1e4 is 100%.
          expect(r.success).toBeGreaterThan(0);
          expect(r.success).toBeLessThanOrEqual(1e4);
          expect(r.mats.Fusions).toBeGreaterThan(0);
          expect(r.mats.Leapstones).toBeGreaterThan(0);
          expect(r.tapsPerAttempt).toBeGreaterThan(0);
        }
      }
    }
  });

  it("prices every material and juice column it references", () => {
    for (const kind of ["transferred", "circulated"] as const) {
      for (const slot of ["weapon", "armor"] as const) {
        const table = HONE_TABLES[kind][slot];
        expect(TJW_DEFAULT_PRICES[table.additiveKey]).toBeGreaterThan(0);
        for (const row of table.levels) {
          for (const col of Object.keys(row.mats) as HoneMatKey[]) {
            expect(TJW_DEFAULT_PRICES[TJW_MAT_PRICE_KEY[col]]).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("carries TJW default prices for the parity harness", () => {
    expect(TJW_DEFAULT_PRICES["Leapstones"]).toBeGreaterThan(0);
    expect(ARTISAN_THRESHOLD).toBe(21500);
  });
});
