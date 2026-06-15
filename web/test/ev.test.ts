import { describe, it, expect } from "vitest";
import {
  binomial,
  G,
  columnPrice,
  chestVal,
  baseGold,
  hellKeyEv,
  cubeEv,
  relicRecipe,
} from "../src/lib/packs/ev";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import { BAKED } from "../src/lib/packs/data/constants";
import {
  HELL_TIERS,
  PROBABILITIES,
  HELL_KEY_MAP,
  SKIP_COLUMNS,
} from "../src/lib/packs/data/hellRewards";
import fixture from "./fixtures/tjw-nae-prices.json";

const NAE = fixture.prices as Record<string, number>;

describe("binomial", () => {
  it("computes small coefficients", () => {
    expect(binomial(5, 2)).toBe(10);
    expect(binomial(11, 3)).toBe(165);
    expect(binomial(4, 2)).toBe(6);
  });
  it("handles edges", () => {
    expect(binomial(5, 0)).toBe(1);
    expect(binomial(5, 5)).toBe(1);
    expect(binomial(3, 4)).toBe(0);
  });
});

describe("G (expected best of k)", () => {
  it("returns arr[0] when k >= length", () => {
    expect(G([100, 50, 10], 3)).toBe(100);
  });
  it("returns 0 for empty arr or k<=0", () => {
    expect(G([], 3)).toBe(0);
    expect(G([100, 50], 0)).toBe(0);
  });
  it("matches the hand-computed best-of-2 of [100,80,60,40]", () => {
    // r = C(4,2) = 6; sum_{o=0..2} arr[o]*C(3-o,1)/6
    // = (100*3 + 80*2 + 60*1)/6 = 520/6 = 86.6667
    expect(G([100, 80, 60, 40], 2)).toBeCloseTo(86.6667, 4);
  });
});

describe("chestVal", () => {
  it("values random astrogems (b=rare @100)", () => {
    // "0|15|0" -> 15 * astrogem.rare(100) = 1500
    expect(chestVal("Random Astrogems", "0|15|0", {}, true)).toBe(1500);
  });
  it("values selectable astrogems (c=epic @15000)", () => {
    // "0|0|3" -> 3 * astrogem.epic(15000) = 45000
    expect(chestVal("Selectable Astrogems", "0|0|3", {}, true)).toBe(45000);
  });
  it("zeroes the Destiny Juice column (intentionally unvalued to match TJW)", () => {
    // Juice has no COLUMN_VALUATION entry -> columnPrice 0 -> chestVal 0, for any qty/prices.
    expect(chestVal("Juice", 96, { "glaciers-breath": 319 }, true)).toBe(0);
    expect(chestVal("Juice", 320, {}, true)).toBe(0);
  });
  it("picks the max of the two Stones valuations", () => {
    // Stones slug cheap, blue-stone slug rich -> blue-stone path (qty*3*blue) wins.
    const prices = {
      "destiny-crystallized-destruction-stone": 1, // Stones per-unit
      "destiny-crystallized-guardian-stone": 10, // Base blue stones per-unit
    };
    // max(100*1, 100*3*10) = max(100, 3000) = 3000
    expect(chestVal("Stones", 100, prices, true)).toBe(3000);
    // Now make the Stones slug rich -> direct path wins.
    const prices2 = {
      "destiny-crystallized-destruction-stone": 50,
      "destiny-crystallized-guardian-stone": 1,
    };
    // max(100*50, 100*3*1) = max(5000, 300) = 5000
    expect(chestVal("Stones", 100, prices2, true)).toBe(5000);
  });
});

describe("columnPrice", () => {
  it("returns flat value for flat columns", () => {
    expect(columnPrice("Karma", {}, true)).toBe(600);
    expect(columnPrice("Gold", {}, true)).toBe(1);
  });
  it("returns 0 for untradable columns", () => {
    expect(columnPrice("Accessories", {}, true)).toBe(0);
  });
  it("uses the 1730 slug when present, else its fallback", () => {
    expect(columnPrice("Fusions", { "superior-abidos-fusion-material": 171 }, true)).toBe(171);
    expect(columnPrice("Fusions", {}, true)).toBe(241); // fallback1730
  });
});

describe("baseGold", () => {
  it("sums the four base columns at the floor-100 destiny rewards", () => {
    const f = HELL_TIERS["1730 Destiny Rewards"].floors["100"];
    // base red 110 @29 + base blue 680 @0.92 + base leap 15 @47 + base shards 18000 @0.224
    const prices = {
      "destiny-crystallized-destruction-stone": 29,
      "destiny-crystallized-guardian-stone": 0.92,
      "great-destiny-leapstone": 47,
      "destiny-shard": 0.224,
    };
    const expected = 110 * 29 + 680 * 0.92 + 15 * 47 + 18000 * 0.224;
    expect(baseGold(f, prices, true)).toBeCloseTo(expected, 4);
    // matches TJW's displayed "Base" of 8,553 g for the 100 floor (legendary key)
    expect(Math.round(baseGold(f, prices, true))).toBe(8553);
  });
});

// Golden EV validation against TheJungleWalrus's live /math page.
// Captured 2026-06-15 (prices.json generated_at 2026-06-15T06:15:02Z, region NA East),
// the same snapshot saved in the fixture. His displayed totals were read directly off
// https://thejunglewalrus.github.io/lostark-cash-shop-value/math :
//   Legendary V = 189,684 | Epic V = 129,295 | Flame = 48,636 | Frost = 50,440
// These also equal the documented earlier-verified values (his prices had not drifted).
describe("hellKeyEv golden parity with TJW /math", () => {
  const map = buildPriceMap(NAE);
  const golden: Record<string, number> = {
    "splendid-hell-key-of-destiny-v": 189684,
    "splendid-hell-key-of-destiny-v-epic": 129295,
    "splendid-netherworld-flame-key": 48636,
    "splendid-netherworld-frost-key": 50440,
  };
  for (const [slug, expected] of Object.entries(golden)) {
    it(`reproduces ${slug} = ${expected} (±1)`, () => {
      // Exact-or-off-by-one vs TJW's displayed total (rounding only).
      expect(Math.abs(Math.round(hellKeyEv(slug, map)) - expected)).toBeLessThanOrEqual(1);
    });
  }
});

// Per-floor cross-check: reconstruct one floor's contribution from the formula and the
// fixture, and assert it matches TJW's displayed per-floor row exactly. This proves the
// best-pick blend + base + normalization are correct, not just the summed total.
describe("hellKeyEv per-floor reconstruction matches TJW /math", () => {
  const map = buildPriceMap(NAE);

  // Helper mirroring the inner loop, returning per-floor diagnostics.
  function perFloor(slug: string) {
    const m = HELL_KEY_MAP[slug];
    const tier = HELL_TIERS[m.tierLabel];
    const is1730 = m.tierLabel.startsWith("1730 ") && !m.tierLabel.includes("Old");
    const probs = PROBABILITIES[m.probKey as keyof typeof PROBABILITIES];
    let sump = 0;
    const rows = probs.map((pr) => {
      const rewards = tier.floors[pr.range];
      const p = Number(pr[m.rarityTier]) || 0;
      sump += p;
      const cands: number[] = [];
      for (const col of tier.columns) {
        if (SKIP_COLUMNS.has(col)) continue;
        if (!rewards[col]) continue;
        const v = chestVal(col, rewards[col], map, is1730);
        if (v > 0) cands.push(v);
      }
      cands.sort((a, b) => b - a);
      const bestPick = 0.95 * G(cands, 3) + 0.05 * G(cands, 4);
      const base = baseGold(rewards, map, is1730);
      return { range: pr.range, p, bestPick, base };
    });
    return { rows, sump };
  }

  it("legendary destiny floor 70-79: best-pick 148,053 / base 6,433 / contribution 37,260", () => {
    const { rows, sump } = perFloor("splendid-hell-key-of-destiny-v");
    const r = rows.find((x) => x.range === "70 - 79")!;
    expect(Math.round(r.bestPick)).toBe(148053);
    expect(Math.round(r.base)).toBe(6433);
    const contribution = (r.bestPick + r.base) * (r.p / sump);
    expect(Math.round(contribution)).toBe(37260);
  });

  it("flame floor 10-19: best-pick 36,000 / base 0 / contribution 12,691", () => {
    const { rows, sump } = perFloor("splendid-netherworld-flame-key");
    const r = rows.find((x) => x.range === "10 - 19")!;
    expect(Math.round(r.bestPick)).toBe(36000);
    expect(Math.round(r.base)).toBe(0);
    const contribution = (r.bestPick + r.base) * (r.p / sump);
    expect(Math.round(contribution)).toBe(12691);
  });
});

describe("hellKeyEv sanity bounds", () => {
  const map = buildPriceMap(NAE);
  it("legendary hell-key-v in (150000, 230000)", () => {
    const v = hellKeyEv("splendid-hell-key-of-destiny-v", map);
    expect(v).toBeGreaterThan(150000);
    expect(v).toBeLessThan(230000);
  });
  it("epic hell-key-v in (100000, 160000)", () => {
    const v = hellKeyEv("splendid-hell-key-of-destiny-v-epic", map);
    expect(v).toBeGreaterThan(100000);
    expect(v).toBeLessThan(160000);
  });
  it("flame & frost each in (35000, 65000)", () => {
    const flame = hellKeyEv("splendid-netherworld-flame-key", map);
    const frost = hellKeyEv("splendid-netherworld-frost-key", map);
    expect(flame).toBeGreaterThan(35000);
    expect(flame).toBeLessThan(65000);
    expect(frost).toBeGreaterThan(35000);
    expect(frost).toBeLessThan(65000);
  });
  it("returns 0 for an unknown slug", () => {
    expect(hellKeyEv("not-a-key", map)).toBe(0);
  });
});

describe("cubeEv", () => {
  it("uses fallbacks with empty prices", () => {
    // round(22*500 + 41*107 + 8*200 + 8*400) = round(11000+4387+1600+3200) = 20187
    expect(cubeEv("ebony-cube-4th-unlock", {})).toBe(20187);
  });
  it("returns 0 for an unknown slug", () => {
    expect(cubeEv("not-a-cube", {})).toBe(0);
  });
});

describe("relicRecipe", () => {
  it("returns the max of the present engravings", () => {
    expect(relicRecipe({ grudge: 100, "raid-captain": 200 })).toBe(200);
  });
  it("returns 0 when none present", () => {
    expect(relicRecipe({})).toBe(0);
  });
});

describe("buildPriceMap", () => {
  const map = buildPriceMap(NAE);
  it("includes the 4 hell-key EVs as numbers", () => {
    for (const slug of Object.keys(HELL_KEY_MAP)) {
      expect(typeof map[slug]).toBe("number");
      expect(map[slug]).toBeGreaterThan(0);
    }
  });
  it("includes the 4 cube-unlock EVs as numbers", () => {
    for (const slug of ["ebony-cube-1st-unlock", "ebony-cube-2nd-unlock", "ebony-cube-3rd-unlock", "ebony-cube-4th-unlock"]) {
      expect(typeof map[slug]).toBe("number");
      expect(map[slug]).toBeGreaterThan(0);
    }
  });
  it("sets relic-combat-engraving-recipe to the max engraving", () => {
    expect(map["relic-combat-engraving-recipe"]).toBe(relicRecipe({ ...BAKED, ...NAE }));
  });
  it("keeps baked gem values when the region does not override them", () => {
    // NAE prices carry no lv-3-gem, so the baked 1543 survives.
    expect(NAE["lv-3-gem"]).toBeUndefined();
    expect(map["lv-3-gem"]).toBe(1543);
  });
  it("lets region prices override baked values", () => {
    const overridden = buildPriceMap({ "lv-3-gem": 9999 });
    expect(overridden["lv-3-gem"]).toBe(9999);
  });
});
