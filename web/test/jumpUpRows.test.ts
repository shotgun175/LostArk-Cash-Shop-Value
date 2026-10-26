import { describe, it, expect } from "vitest";
import { jumpUpRows } from "../src/lib/packs/jumpUpRows";
import { JUMP_UP_LEVELS, JUMP_UP_RC } from "../src/lib/packs/data/jumpUp";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import { RESOLVER } from "../src/lib/packs/data/resolver";
import { BC_PER_BUNDLE } from "../src/lib/packs/data/marisShop";
import fixture from "./fixtures/tjw-nae-prices.json";

const NAE = fixture.prices as Record<string, number>;

// Nothing in this track is AH-priced (bound gold, the Lv. 8 gem baseline, the astrogem seed, a
// BC-costed aura, three no-market items), so the fixture only matters for the "override flows
// through" case. buildPriceMap defaults to NA, so the Lv. 8 gems read the NA default 348,000
// (2026-10-25; TJW's 375,000 seed gave 2,150,000 / 2,225,158, cross-checked 2026-09-16).
describe("JUMP_UP_LEVELS data", () => {
  it("has the five Powerpass Premium milestones at 1,700 to 1,720 with resolvable rewards", () => {
    expect(JUMP_UP_RC).toBe(3000);
    expect(JUMP_UP_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
    expect(JUMP_UP_LEVELS.map((l) => l.ilvl)).toEqual([1700, 1705, 1710, 1715, 1720]);
    for (const l of JUMP_UP_LEVELS) {
      for (const r of l.rewards) expect(RESOLVER[r.chest], `Lv ${l.level}: "${r.chest}"`).toBeDefined();
    }
  });
});

describe("jumpUpRows", () => {
  it("values the track at 2,042,000 with no exchange input (aura unpriced) and 680.7 g/RC", () => {
    const r = jumpUpRows(buildPriceMap(NAE));
    // 4x50,000 gold | 2x348,000 | 3x75,000 | 3x75,000 | 2x348,000
    expect(r.rows.map((x) => x.gold)).toEqual([200000, 696000, 225000, 225000, 696000]);
    expect(r.total).toBe(2042000);
    expect(r.goldPerRc).toBeCloseTo(2042000 / 3000, 4);
  });

  it("totals 2,117,158 at the 30,000 seed once the aura is priced at 238 BC", () => {
    const r = jumpUpRows(buildPriceMap(NAE, { blueCrystalGold: 30000 / BC_PER_BUNDLE }));
    // aura: 238 x 30,000/95 = 75,157.9 -> 75,158 (per-chest rounding)
    expect(r.rows.map((x) => x.gold)).toEqual([275158, 696000, 225000, 225000, 696000]);
    expect(r.rows.map((x) => x.cumulativeGold)).toEqual([275158, 971158, 1196158, 1421158, 2117158]);
    expect(r.rows[0].cumulativeGoldPerRc).toBeCloseTo(91.7, 1);
    expect(r.rows[4].cumulativeGoldPerRc).toBeCloseTo(705.7, 1);
    expect(r.total).toBe(2117158);
  });

  it("lists every reward line with its scaled quantity; no-market items are unpriced, not unresolved", () => {
    const r = jumpUpRows(buildPriceMap(NAE));
    const lv1 = r.rows[0];
    expect(lv1).toMatchObject({ level: 1, ilvl: 1700, chest: "Premium 1,700 Achievement Chest" });
    expect(lv1.lines.map((l) => [l.slug, l.qty, l.gold])).toEqual([
      ["gold", 200000, 200000],
      ["crystalline-aura-plus-14d", 1, 0],
      ["azenas-blessing-28d", 1, 0],
      ["ancient-bracelet-chest", 1, 0],
      ["ancient-accessory-set-chest", 1, 0],
    ]);
    expect(lv1.lines.every((l) => !l.unresolved)).toBe(true);
    expect(lv1.lines[0]).toMatchObject({ chest: "50,000 Gold Bars", chestQty: 4, perUnit: 1 });
    expect(r.rows[1].lines).toEqual([
      expect.objectContaining({ slug: "lv-8-gem", chestQty: 2, qty: 2, perUnit: 348000, gold: 696000, isBound: true }),
    ]);
    expect(r.rows[2].lines[0]).toMatchObject({
      slug: "fixed-epic-astrogem-selection",
      qty: 3,
      perUnit: 75000,
      gold: 225000,
    });
  });

  it("a click-to-edit override on the Lv. 8 gem baseline flows through", () => {
    const r = jumpUpRows(buildPriceMap({ ...NAE, "lv-8-gem": 300000 }));
    expect(r.rows[1].gold).toBe(600000);
    expect(r.rows[4].gold).toBe(600000);
  });
});
