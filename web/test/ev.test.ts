import { describe, it, expect } from "vitest";
import {
  binomial,
  G,
  columnPrice,
  chestVal,
  baseGold,
  hellKeyEv,
  hellKeyBreakdown,
  hellKeyColumnPrices,
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
  WEALTH_BASE_MULT,
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
    expect(chestVal("Random Astrogems", "0|15|0", {})).toBe(1500);
  });
  it("values selectable astrogems (c=epic @15000)", () => {
    // "0|0|3" -> 3 * astrogem.epic(15000) = 45000
    expect(chestVal("Selectable Astrogems", "0|0|3", {})).toBe(45000);
  });
  it("prices Juice as 1 lava + 3 glacier per unit on every tier (deliberate TJW divergence)", () => {
    // 96 x (400 + 3 x 319) = 96 x 1357 = 130,272 — the 1730 destiny floor 70-79 cell.
    expect(chestVal("Juice", 96, { "lavas-breath": 400, "glaciers-breath": 319 })).toBe(130272);
    // Falls back to lava 400 / glacier 200 when unpriced: 320 x 1000.
    expect(chestVal("Juice", 320, {})).toBe(320000);
  });
  it("picks the max of the two Stones valuations", () => {
    // Stones slug cheap, blue-stone slug rich -> blue-stone path (qty*3*blue) wins.
    const prices = {
      "destiny-crystallized-destruction-stone": 1, // Stones per-unit
      "destiny-crystallized-guardian-stone": 10, // Base blue stones per-unit
    };
    // max(100*1, 100*3*10) = max(100, 3000) = 3000
    expect(chestVal("Stones", 100, prices)).toBe(3000);
    // Now make the Stones slug rich -> direct path wins.
    const prices2 = {
      "destiny-crystallized-destruction-stone": 50,
      "destiny-crystallized-guardian-stone": 1,
    };
    // max(100*50, 100*3*1) = max(5000, 300) = 5000
    expect(chestVal("Stones", 100, prices2)).toBe(5000);
  });
});

describe("columnPrice", () => {
  it("returns flat value for flat columns", () => {
    expect(columnPrice("Karma", {})).toBe(600);
    expect(columnPrice("Gold", {})).toBe(1);
  });
  it("returns 0 for untradable columns", () => {
    expect(columnPrice("Accessories", {})).toBe(0);
  });
  it("uses the 1730 slug when present, else its fallback", () => {
    expect(columnPrice("Fusions", { "superior-abidos-fusion-material": 171 })).toBe(171);
    expect(columnPrice("Fusions", {})).toBe(241); // fallback1730
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
    expect(baseGold(f, prices)).toBeCloseTo(expected, 4);
    // matches TJW's displayed "Base" of 8,553 g for the 100 floor (legendary key)
    expect(Math.round(baseGold(f, prices))).toBe(8553);
  });
});

// 1730 golden EVs — self-goldens on the Season-4 datamine tables at the pinned fixture.
// History: the original TJW-verbatim tables reproduced his live /math page exactly
// (2026-06-15 capture: Legendary V = 189,684 | Epic V = 129,295 | Flame = 48,636 |
// Frost = 50,440, re-verified to the gold against his current build on 2026-07-30 — the
// engine ALGORITHM is his, byte-parity). On 2026-07-30 the user moved all tiers to the
// datamine (merged Karma/Quality, selection-chest astrogems, FlameFrost Juice column,
// base 26/170) and priced Juice everywhere, so these values deliberately sit above his.
describe("hellKeyEv 1730 goldens (datamine tables, our model)", () => {
  const map = buildPriceMap(NAE);
  const golden: Record<string, number> = {
    "splendid-hell-key-of-destiny-v": 204429,
    "splendid-hell-key-of-destiny-v-epic": 138919,
    "splendid-netherworld-flame-key": 103363,
    "splendid-netherworld-frost-key": 107176,
  };
  for (const [slug, expected] of Object.entries(golden)) {
    it(`reproduces ${slug} = ${expected} (±1)`, () => {
      expect(Math.abs(Math.round(hellKeyEv(slug, map)) - expected)).toBeLessThanOrEqual(1);
    });
  }
});

// Per-floor cross-check: reconstruct one floor's contribution from the formula and the
// fixture, and assert it matches the engine's own row exactly. This proves the best-pick
// blend + base + normalization are correct, not just the summed total.
describe("hellKeyEv per-floor reconstruction (engine internals)", () => {
  const map = buildPriceMap(NAE);

  // Helper mirroring the inner loop, returning per-floor diagnostics.
  function perFloor(slug: string) {
    const m = HELL_KEY_MAP[slug];
    const tier = HELL_TIERS[m.tierLabel];
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
        const v = chestVal(col, rewards[col], map);
        if (v > 0) cands.push(v);
      }
      cands.sort((a, b) => b - a);
      const bestPick = 0.95 * G(cands, 3) + 0.05 * G(cands, 4);
      const base = baseGold(rewards, map);
      return { range: pr.range, p, bestPick, base };
    });
    return { rows, sump };
  }

  it("legendary destiny floor 70-79: best-pick 160,027 / base 6,433 / contribution 40,148", () => {
    // Reference history: TJW's June-vintage row was 148,053 / 6,433 / 37,260; the shift is
    // the priced Juice chest plus the datamine table swap (2026-07-30).
    const { rows, sump } = perFloor("splendid-hell-key-of-destiny-v");
    const r = rows.find((x) => x.range === "70 - 79")!;
    expect(Math.round(r.bestPick)).toBe(160027);
    expect(Math.round(r.base)).toBe(6433);
    const contribution = (r.bestPick + r.base) * (r.p / sump);
    expect(Math.round(contribution)).toBe(40148);
  });

  it("flame floor 10-19: best-pick 72,920 / base 0 / contribution 25,707", () => {
    // Was 36,000 / 0 / 12,691 on TJW's juice-less table; the datamine 1730 FlameFrost table
    // gained a Juice column (75 units on this floor) that now leads the best-of-3 pool.
    const { rows, sump } = perFloor("splendid-netherworld-flame-key");
    const r = rows.find((x) => x.range === "10 - 19")!;
    expect(Math.round(r.bestPick)).toBe(72920);
    expect(Math.round(r.base)).toBe(0);
    const contribution = (r.bestPick + r.base) * (r.p / sump);
    expect(Math.round(contribution)).toBe(25707);
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
  it("flame & frost each in (60000, 160000)", () => {
    // Bounds widened 2026-07-30: the datamine 1730 FlameFrost table's Juice column roughly
    // doubles these keys vs the old juice-less values (~48-50k).
    const flame = hellKeyEv("splendid-netherworld-flame-key", map);
    const frost = hellKeyEv("splendid-netherworld-frost-key", map);
    expect(flame).toBeGreaterThan(60000);
    expect(flame).toBeLessThan(160000);
    expect(frost).toBeGreaterThan(60000);
    expect(frost).toBeLessThan(160000);
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

// ---------------- 1750 tier (the ilvl-1750 "VI" hell keys) ----------------
// Tables transcribed from the sekwahar datamine; the datamine wins every conflict with the
// Arkemys sheet (locked in DECISIONS.md, see docs/Hell-1750-Gap-Analysis-2026-07-30.md).
// EVs for these keys are OUR baseline, deliberately not TJW-anchored (he has no 1750 math yet).

describe("Karma/Quality merged column (1750)", () => {
  it("values a karma|quality pick-one cell at max(karma x 600, quality x 0)", () => {
    // Floor 0-9 destiny cell "9|7": karma side 9 x 600 = 5400 always wins (quality unit 0).
    expect(chestVal("Karma/Quality", "9|7", {})).toBe(5400);
    // Floor 100 cell "300|250" -> 180000.
    expect(chestVal("Karma/Quality", "300|250", {})).toBe(180000);
  });
  it("lists Karma/Quality as a flat 600 per-unit in the prices-used table", () => {
    const cols = hellKeyColumnPrices("hell-key-of-destiny-vi", {});
    const kq = cols.find((c) => c.column === "Karma/Quality")!;
    expect(kq.perUnit).toBe(600);
    expect(kq.source).toBe("flat");
  });
});

describe("Juice column (live-priced on all tiers per user decision 2026-07-30)", () => {
  it("values a juice unit as 1 lavas-breath + 3 glaciers-breath", () => {
    const prices = { "lavas-breath": 400, "glaciers-breath": 300 };
    // per unit = 400 + 3 x 300 = 1300; 1750 destiny floor 0-9 has 12 juice -> 15600
    expect(chestVal("Juice", 12, prices)).toBe(15600);
  });
  it("lists Juice with a live source in the prices-used table", () => {
    const cols = hellKeyColumnPrices("netherworld-flame-key-vi", {
      "lavas-breath": 400,
      "glaciers-breath": 300,
    });
    const j = cols.find((c) => c.column === "Juice")!;
    expect(j.perUnit).toBe(1300);
    expect(j.source).toBe("live");
  });
});

describe("lower tiers (1640/1680/1700, datamine-generated)", () => {
  it("has all six lower-tier tables with 11 floors each", () => {
    for (const label of [
      "1700 Destiny Rewards", "1700 FlameFrost Rewards",
      "1680 Destiny Rewards", "1680 FlameFrost Rewards",
      "1640 Destiny Rewards", "1640 FlameFrost Rewards",
    ]) {
      expect(Object.keys(HELL_TIERS[label].floors).length).toBe(11);
    }
  });
  it("locks datamine spot cells", () => {
    const d1700 = HELL_TIERS["1700 Destiny Rewards"].floors;
    expect(d1700["0 - 9"].Stones).toBe(2000);
    expect(d1700["0 - 9"].Shards).toBe(12500);
    expect(d1700["100"].Fusions).toBe(2800);
    expect(d1700["100"]["Astrogem chests"]).toBe(11);
    expect(d1700["0 - 9"]["Base shards"]).toBe(4500);
    expect(HELL_TIERS["1640 FlameFrost Rewards"].floors["100"]["Lv. 8 Gems"]).toBe(3);
    expect(HELL_TIERS["1680 Destiny Rewards"].floors["0 - 9"]["Karma/Quality"]).toBe("4|1");
  });
  it("values lower-tier Stones with the raw destiny-stone override", () => {
    const tier = HELL_TIERS["1700 Destiny Rewards"];
    const prices = { "destiny-destruction-stone": 0.06, "destiny-guardian-stone": 0.03 };
    // max(2000 x 0.06, 2000 x 3 x 0.03) = max(120, 180) = 180
    expect(chestVal("Stones", 2000, prices, tier)).toBe(180);
    // 1730 keeps the crystallized slug (no override): unpriced here -> fallback 31.3.
    expect(chestVal("Stones", 100, {}, HELL_TIERS["1730 Destiny Rewards"])).toBeCloseTo(
      Math.max(100 * 31.3, 100 * 3 * 1.45), 6,
    );
  });
  it("prices Astrogem chests via the baked rare-epic-astrogem", () => {
    expect(chestVal("Astrogem chests", 5, { "rare-epic-astrogem": 4300 })).toBe(21500);
    expect(chestVal("Astrogem chests", 5, {})).toBe(21500); // fallback 4300
  });
  it("values lower-tier Free taps at Arkemys' T4 unit of 100, not 1000", () => {
    expect(chestVal("Free taps", 90, {}, HELL_TIERS["1700 Destiny Rewards"])).toBe(9000);
    // 1730 keeps the 1000/tap Transferred convention (D6).
    expect(chestVal("Free taps", 24, {}, HELL_TIERS["1730 Destiny Rewards"])).toBe(24000);
  });
  it("maps the twelve lower-tier keys", () => {
    expect(HELL_KEY_MAP["hell-key-of-destiny-iv"]).toEqual({
      tierLabel: "1700 Destiny Rewards", rarityTier: "Legendary", probKey: "Destiny",
    });
    expect(HELL_KEY_MAP["hell-key-of-destiny-ii-epic"]).toEqual({
      tierLabel: "1640 Destiny Rewards", rarityTier: "Epic", probKey: "Destiny",
    });
    expect(HELL_KEY_MAP["netherworld-flame-key-iii"]).toEqual({
      tierLabel: "1680 FlameFrost Rewards", rarityTier: "Legendary", probKey: "Flame",
    });
    expect(Object.keys(HELL_KEY_MAP).length).toBe(20);
  });
});

describe("1750 reward tables (datamine-locked cells)", () => {
  it("both 1750 tiers exist with the same 11 floor brackets as 1730", () => {
    expect(Object.keys(HELL_TIERS["1750 Destiny Rewards"].floors)).toEqual(
      Object.keys(HELL_TIERS["1730 Destiny Rewards"].floors),
    );
    expect(Object.keys(HELL_TIERS["1750 FlameFrost Rewards"].floors)).toEqual(
      Object.keys(HELL_TIERS["1730 FlameFrost Rewards"].floors),
    );
  });
  it("uses the datamine Fusions column, not the sheet's stale 1730 copy", () => {
    const f = HELL_TIERS["1750 Destiny Rewards"].floors;
    expect(f["0 - 9"].Fusions).toBe(75);
    expect(f["40 - 49"].Fusions).toBe(270);
    expect(f["100"].Fusions).toBe(2400);
  });
  it("uses the datamine base mats at floor 0-9 (shards 5200 / red 26 / blue 170)", () => {
    const f = HELL_TIERS["1750 Destiny Rewards"].floors["0 - 9"];
    expect(f["Base shards"]).toBe(5200);
    expect(f["Base red stones"]).toBe(26);
    expect(f["Base blue stones"]).toBe(170);
  });
  it("floor 100 Ability stones is the datamine 220, not the sheet's 230", () => {
    // Caught by the 2026-07-30 adversarial verify pass: the Arkemys sheet (and the gap doc's
    // reconciled table) carried 230; both datamine views say 220. EV-neutral (untradable).
    expect(HELL_TIERS["1750 Destiny Rewards"].floors["100"]["Ability stones"]).toBe(220);
  });
  it("FlameFrost VI Lv. 8 Gems are 5/6/7 at 80-89/90-99/Max (was 4/5/6 at 1730)", () => {
    const f = HELL_TIERS["1750 FlameFrost Rewards"].floors;
    expect(f["80 - 89"]["Lv. 8 Gems"]).toBe(5);
    expect(f["90 - 99"]["Lv. 8 Gems"]).toBe(6);
    expect(f["100"]["Lv. 8 Gems"]).toBe(7);
  });
  it("1750 Destiny drops the Accessories and Random Astrogems columns", () => {
    const cols = HELL_TIERS["1750 Destiny Rewards"].columns;
    expect(cols).not.toContain("Accessories");
    expect(cols).not.toContain("Random Astrogems");
    expect(cols).toContain("Karma/Quality");
  });
});

describe("1750 hell key map", () => {
  it("maps the four VI keys onto the 1750 tiers with the reused probability tables", () => {
    expect(HELL_KEY_MAP["hell-key-of-destiny-vi"]).toEqual({
      tierLabel: "1750 Destiny Rewards", rarityTier: "Legendary", probKey: "Destiny",
    });
    expect(HELL_KEY_MAP["hell-key-of-destiny-vi-epic"]).toEqual({
      tierLabel: "1750 Destiny Rewards", rarityTier: "Epic", probKey: "Destiny",
    });
    expect(HELL_KEY_MAP["netherworld-flame-key-vi"]).toEqual({
      tierLabel: "1750 FlameFrost Rewards", rarityTier: "Legendary", probKey: "Flame",
    });
    expect(HELL_KEY_MAP["netherworld-frost-key-vi"]).toEqual({
      tierLabel: "1750 FlameFrost Rewards", rarityTier: "Legendary", probKey: "Frost",
    });
  });
});

// Self-goldens: OUR baseline, deliberately not TJW-anchored (he has no 1750 math yet).
// Computed 2026-07-30 on the pinned fixture at the model decisions locked in
// docs/Hell-1750-Gap-Analysis-2026-07-30.md: datamine tables, live-priced Juice
// (lava 330 + 3 x glacier 319 = 1287/unit at this fixture), Karma/Quality max(600, 0),
// taps flat 1000. When TJW ships 1750, diff as a cross-check only (DECISIONS.md);
// adopt a specific fix only if the diff exposes a real error, never blanket re-anchor.
describe("1750 hellKeyEv self-goldens (our baseline)", () => {
  const map = buildPriceMap(NAE);
  const golden: Record<string, number> = {
    "hell-key-of-destiny-vi": 247132,
    "hell-key-of-destiny-vi-epic": 168202,
    "netherworld-flame-key-vi": 125807,
    "netherworld-frost-key-vi": 130508,
  };
  for (const [slug, expected] of Object.entries(golden)) {
    it(`${slug} = ${expected} exactly`, () => {
      expect(Math.round(hellKeyEv(slug, map))).toBe(expected);
    });
  }
  it("each VI key values above its V counterpart at the same prices", () => {
    expect(hellKeyEv("hell-key-of-destiny-vi", map)).toBeGreaterThan(hellKeyEv("splendid-hell-key-of-destiny-v", map));
    expect(hellKeyEv("hell-key-of-destiny-vi-epic", map)).toBeGreaterThan(hellKeyEv("splendid-hell-key-of-destiny-v-epic", map));
    expect(hellKeyEv("netherworld-flame-key-vi", map)).toBeGreaterThan(hellKeyEv("splendid-netherworld-flame-key", map));
    expect(hellKeyEv("netherworld-frost-key-vi", map)).toBeGreaterThan(hellKeyEv("splendid-netherworld-frost-key", map));
  });
});

// Self-goldens for the 1640/1680/1700 keys at the pinned fixture (computed 2026-07-30):
// datamine tables, juice priced, Circulated taps at 100 (Arkemys T4 unit), astrogem chests
// at the baked 4300. OUR baseline — no TJW anchor exists for these tiers on Season-4 data.
describe("lower-tier hellKeyEv self-goldens (our baseline)", () => {
  const map = buildPriceMap(NAE);
  const golden: Record<string, number> = {
    "hell-key-of-destiny-iv": 134778,
    "hell-key-of-destiny-iv-epic": 93394,
    "netherworld-flame-key-iv": 96595,
    "netherworld-frost-key-iv": 100368,
    "hell-key-of-destiny-iii": 128530,
    "hell-key-of-destiny-iii-epic": 88213,
    "netherworld-flame-key-iii": 93292,
    "netherworld-frost-key-iii": 96510,
    "hell-key-of-destiny-ii": 92091,
    "hell-key-of-destiny-ii-epic": 62947,
    "netherworld-flame-key-ii": 71792,
    "netherworld-frost-key-ii": 74425,
  };
  for (const [slug, expected] of Object.entries(golden)) {
    it(`${slug} = ${expected} exactly`, () => {
      expect(Math.round(hellKeyEv(slug, map))).toBe(expected);
    });
  }
  it("destiny keys rise with ilvl (II < III < IV < V < VI)", () => {
    const ladder = ["hell-key-of-destiny-ii", "hell-key-of-destiny-iii", "hell-key-of-destiny-iv", "splendid-hell-key-of-destiny-v", "hell-key-of-destiny-vi"]
      .map((s) => hellKeyEv(s, map));
    for (let i = 1; i < ladder.length; i++) expect(ladder[i]).toBeGreaterThan(ladder[i - 1]);
  });
  it("netherworld keys rise with ilvl too (fixed by the 1730 datamine swap)", () => {
    for (const family of [
      ["netherworld-flame-key-ii", "netherworld-flame-key-iii", "netherworld-flame-key-iv", "splendid-netherworld-flame-key", "netherworld-flame-key-vi"],
      ["netherworld-frost-key-ii", "netherworld-frost-key-iii", "netherworld-frost-key-iv", "splendid-netherworld-frost-key", "netherworld-frost-key-vi"],
    ]) {
      const ladder = family.map((s) => hellKeyEv(s, map));
      for (let i = 1; i < ladder.length; i++) expect(ladder[i]).toBeGreaterThan(ladder[i - 1]);
    }
  });
});

describe("hellKeyBreakdown candidates / wealth / rarity opts", () => {
  const map = buildPriceMap(NAE);
  it("exposes DESC-sorted positive candidates whose top value drives bestPick", () => {
    const b = hellKeyBreakdown("hell-key-of-destiny-vi", map)!;
    for (const f of b.floors) {
      const golds = f.candidates.map((c) => c.gold);
      expect(golds).toEqual([...golds].sort((x, y) => y - x));
      expect(golds.every((g) => g > 0)).toBe(true);
      if (golds.length > 0) expect(f.bestPick).toBeLessThanOrEqual(golds[0]);
    }
  });
  it("labels the Stones pick side and the Juice composition", () => {
    const b = hellKeyBreakdown("hell-key-of-destiny-vi", map)!;
    const f = b.floors.find((x) => x.range === "50 - 59")!;
    expect(f.candidates.find((c) => c.column === "Stones")!.note).toMatch(/^Pick (Destruction \(Red\)|Guardian \(Blue\))$/);
    const juice = f.candidates.find((c) => c.column === "Juice")!;
    expect(juice.note).toBe(`${juice.qty} Lava's + ${juice.qty * 3} Glacier's`);
  });
  it("flips the Stones note to the blue side when 3x guardian stones win", () => {
    // The regex above accepts either side; pin the other branch with a guardian-rich map.
    const blueRich = {
      ...map,
      "destiny-crystallized-destruction-stone": 0.01,
      "destiny-crystallized-guardian-stone": 50,
    };
    const f = hellKeyBreakdown("hell-key-of-destiny-vi", blueRich)!.floors.find((x) => x.range === "50 - 59")!;
    expect(f.candidates.find((c) => c.column === "Stones")!.note).toBe("Pick Guardian (Blue)");
  });
  it("baseWealth is exactly base x WEALTH_BASE_MULT and never leaks into ev", () => {
    const plain = hellKeyBreakdown("hell-key-of-destiny-vi", map)!;
    for (const f of plain.floors) expect(f.baseWealth).toBeCloseTo(f.base * WEALTH_BASE_MULT, 9);
    expect(plain.ev).toBeCloseTo(hellKeyEv("hell-key-of-destiny-vi", map), 9);
  });
  it("rarity override changes the weighting; unsupported columns clamp", () => {
    const leg = hellKeyBreakdown("hell-key-of-destiny-vi", map)!;
    const anc = hellKeyBreakdown("hell-key-of-destiny-vi", map, { rarity: "Ancient" })!;
    expect(anc.ev).toBeGreaterThan(leg.ev);
    expect(anc.effectiveRarity).toBe("Ancient");
    expect(anc.rarityClamped).toBe(false);
    const flame = hellKeyBreakdown("netherworld-flame-key-vi", map, { rarity: "Ancient" })!;
    expect(flame.effectiveRarity).toBe("Legendary");
    expect(flame.rarityClamped).toBe(true);
    expect(flame.ev).toBeCloseTo(hellKeyBreakdown("netherworld-flame-key-vi", map)!.ev, 9);
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
