import { describe, it, expect } from "vitest";
import {
  HONE_TABLES,
  TJW_MAT_PRICE_KEY,
  TJW_DEFAULT_PRICES,
  ARTISAN_THRESHOLD,
  type HoneMatKey,
} from "../src/lib/packs/data/specialHoneTables";
import { tapValue, type TapPriceInputs } from "../src/lib/packs/specialHone";
import fixture from "./fixtures/tjw-nae-prices.json";

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

// ---------------------------------------------------------------------------
// tapValue parity with TJW's compiled engine (port-provenance record).
//
// Anchors re-verified 2026-08-02 by serving docs/hell-rewards-picker-main over
// http and reading the hydrated DOM (Playwright): the default view (NA-E region,
// 1750 Hell Key tier, target +19) displays 992.7521097045062 in the disabled
// "Special Hones" input; switching Target level to "Most Efficient (auto)" shows
// the same number (weapon +19 is the auto argmax), and switching the tier to
// 1700 Hell Key (Circulated) at auto shows 280.71470985268604. A node harness
// running his verbatim sliced Um/Cf/Km reproduced all three to full float
// precision, which pins the exact engine inputs below.
//
// His default price resolution (extracted from the compiled resolver oe/ie/D/Pe):
// user overrides (none by default) -> live prices.json for the region -> per-tier
// unit_gold_value blob -> catalog defaults. The snapshot prices.json in the repo
// (generated_at 2026-08-02T06:00:03Z, nae) therefore feeds every key his hone
// engine asks for. Transferred (1730 table, T4.5 track) prices red/blue stones
// and leapstones at min(direct, T4 price x 5) (his bm=5 trade-up) and Fusions at
// the T4.5 key; Circulated (1700 table) uses the T4 keys directly. Silver is
// weighted at his hardcoded Om=1 and shards at his hardcoded Am=0.25 per unit,
// so the parity inputs pass silver 1 and shards 0.25; juice per-unit prices come
// from the same snapshot (Red 371 / Blue 334).
describe("tapValue parity with TJW at his real default inputs", () => {
  // prices.json nae snapshot resolved through his oe():
  //   Fusions 150 | Stones min(29.9, 5.4x5)=27 | Leapstones min(43, 11x5)=43 |
  //   Base blue stones min(1.69, 0.2x5)=1 | Red juice 371 | Blue juice 334
  const liveTransferred: TapPriceInputs = {
    fusions: 150,
    redStones: 27,
    blueStones: 1,
    leapstones: 43,
    shards: 0.25, // his Am shard weight
    redJuice: 371,
    blueJuice: 334,
    silver: 1, // his Om silver weight
  };
  //   T4 Fusions 101 | Red stones (T4) 5.4 | Leapstones (T4) 11 | Blue stones (T4) 0.2
  const liveCirculated: TapPriceInputs = {
    fusions: 101,
    redStones: 5.4,
    blueStones: 0.2,
    leapstones: 11,
    shards: 0.25,
    redJuice: 371,
    blueJuice: 334,
    silver: 1,
  };

  it("reproduces his displayed transferred auto value (992.75, weapon +19)", () => {
    const v = tapValue(liveTransferred, "transferred", "auto");
    expect(v.goldPerTap).toBeCloseTo(992.7521097045062, 2);
    expect(v.slot).toBe("weapon");
    expect(v.level).toBe(19);
  });

  it("reproduces his default fixed-target values (+19 both kinds)", () => {
    expect(tapValue(liveTransferred, "transferred", 19).goldPerTap).toBeCloseTo(992.7521097045062, 2);
    expect(tapValue(liveCirculated, "circulated", 19).goldPerTap).toBeCloseTo(221.08055578408104, 2);
  });

  it("reproduces his displayed circulated auto value (280.71, weapon +23)", () => {
    const v = tapValue(liveCirculated, "circulated", "auto");
    expect(v.goldPerTap).toBeCloseTo(280.71470985268604, 2);
    expect(v.slot).toBe("weapon");
    expect(v.level).toBe(23);
  });

  // Second pin at his Ho catalog defaults (TJW_DEFAULT_PRICES) fed through the
  // same resolution, values computed by running his verbatim compiled functions
  // in a node harness (never displayed by his app, so browser-unverifiable).
  const BM = 5; // his bm: 5 T4 stones/leapstones trade up to 1 T4.5
  const defaultTransferred: TapPriceInputs = {
    fusions: TJW_DEFAULT_PRICES["Fusions"], // 241
    redStones: Math.min(TJW_DEFAULT_PRICES["Red stones"], TJW_DEFAULT_PRICES["Red stones (T4)"] * BM), // 25
    blueStones: Math.min(TJW_DEFAULT_PRICES["Blue stones"], TJW_DEFAULT_PRICES["Blue stones (T4)"] * BM), // 0.5
    leapstones: Math.min(TJW_DEFAULT_PRICES["Leapstones"], TJW_DEFAULT_PRICES["Leapstones (T4)"] * BM), // 65
    shards: 0.25,
    redJuice: TJW_DEFAULT_PRICES["Red juice (T4.5)"], // 400
    blueJuice: TJW_DEFAULT_PRICES["Blue juice (T4.5)"], // 200
    silver: 1,
  };
  const defaultCirculated: TapPriceInputs = {
    fusions: TJW_DEFAULT_PRICES["T4 Fusions"], // 160
    redStones: TJW_DEFAULT_PRICES["Red stones (T4)"], // 5
    blueStones: TJW_DEFAULT_PRICES["Blue stones (T4)"], // 0.1
    leapstones: TJW_DEFAULT_PRICES["Leapstones (T4)"], // 13
    shards: 0.25,
    redJuice: TJW_DEFAULT_PRICES["Red juice (T4.5)"],
    blueJuice: TJW_DEFAULT_PRICES["Blue juice (T4.5)"],
    silver: 1,
  };

  it("matches his engine at the catalog default prices", () => {
    expect(tapValue(defaultTransferred, "transferred", "auto").goldPerTap).toBeCloseTo(977.8962599139213, 2);
    expect(tapValue(defaultCirculated, "circulated", "auto").goldPerTap).toBeCloseTo(288.8660815945518, 2);
  });

  it("auto beats or equals every fixed target for both kinds", () => {
    for (const [inputs, kind] of [
      [liveTransferred, "transferred"],
      [liveCirculated, "circulated"],
    ] as const) {
      const auto = tapValue(inputs, kind, "auto").goldPerTap;
      for (let lvl = 12; lvl <= 25; lvl++) {
        expect(auto).toBeGreaterThanOrEqual(tapValue(inputs, kind, lvl).goldPerTap - 1e-9);
      }
    }
  });

  it("circulated is far cheaper than transferred at his defaults", () => {
    // Mirrors his app: each kind priced from its own track (T4 vs T4.5 mats).
    const transferred = tapValue(liveTransferred, "transferred", "auto").goldPerTap;
    const circulated = tapValue(liveCirculated, "circulated", "auto").goldPerTap;
    expect(circulated).toBeLessThan(transferred / 2);
  });
});

// ---------------------------------------------------------------------------
// Self-goldens: OUR standing regression pins at the pinned fixture ev.test.ts
// uses, on OUR model choices (computed 2026-08-02, port proven above first):
// mats at the fixture's direct per-unit slug prices (no T4 trade-up), shards at
// the destiny-shard price, silver at 0, and juice unpriced (the Task 5 slug set
// carries no juice price; an unpriced juice disables the juice enumeration,
// which is his own 0-price behavior). Transferred prices the T4.5 track slugs,
// Circulated the T4 track slugs. These pins are price-driven regressions only;
// the TJW parity block above stays the port-provenance record.
describe("tapValue self-goldens at the pinned fixture (our baseline)", () => {
  const p = fixture.prices as Record<string, number>;
  const transferred: TapPriceInputs = {
    fusions: p["superior-abidos-fusion-material"], // 171
    redStones: p["destiny-crystallized-destruction-stone"], // 29
    blueStones: p["destiny-crystallized-guardian-stone"], // 0.92
    leapstones: p["great-destiny-leapstone"], // 47
    shards: p["destiny-shard"], // 0.224
  };
  const circulated: TapPriceInputs = {
    fusions: p["abidos-fusion-material"], // 137
    redStones: p["destiny-destruction-stone"], // 5.75
    blueStones: p["destiny-guardian-stone"], // 0.09
    leapstones: p["destiny-leapstone"], // 14
    shards: p["destiny-shard"], // 0.224
  };

  it("transferred auto = 1363.09 (weapon +19)", () => {
    const v = tapValue(transferred, "transferred", "auto");
    expect(v.goldPerTap).toBeCloseTo(1363.09, 2);
    expect(v.slot).toBe("weapon");
    expect(v.level).toBe(19);
  });

  it("circulated auto = 351.14 (weapon +25)", () => {
    const v = tapValue(circulated, "circulated", "auto");
    expect(v.goldPerTap).toBeCloseTo(351.14, 2);
    expect(v.slot).toBe("weapon");
    expect(v.level).toBe(25);
  });

  it("circulated stays well below transferred at fixture prices", () => {
    expect(tapValue(circulated, "circulated", "auto").goldPerTap).toBeLessThan(
      tapValue(transferred, "transferred", "auto").goldPerTap / 2,
    );
  });
});
