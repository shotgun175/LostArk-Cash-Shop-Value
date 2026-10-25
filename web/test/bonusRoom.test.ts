import { describe, it, expect } from "vitest";
import { BONUS_ROOM, type BonusRoom } from "../src/lib/packs/data/bonusRoom";
import { bonusRoomActive, bonusRoomRows, timeLeft, type BonusGroupRow, type BonusProductRow } from "../src/lib/packs/bonusRoom";
import { RESOLVER } from "../src/lib/packs/data/resolver";
import { PACKS } from "../src/lib/packs/data/packs";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import { pheonGold } from "../src/lib/packs/ev";
import { cashPerRc } from "../src/lib/packs/exchange";
import { BC_PER_BUNDLE } from "../src/lib/packs/data/marisShop";
import { hasIcon } from "../src/lib/catalog";
import fixture from "./fixtures/tjw-nae-prices.json";

// Pure data + row tests: no stores, so nothing here needs app.now pinned or hellSettings reset
// (Include pheons goes straight into buildPriceMap's opts).
const ROOM = BONUS_ROOM as BonusRoom;
const NAE = fixture.prices as Record<string, number>;
const F4 = 30000;
const G2G = 0.03268824; // the same arbitrary G2G input as packRows.test.ts
const CASH = cashPerRc("nae"); // $100 / 12,000 RC
const OPTS = { f4Input: F4, g2gInput: G2G, cashPerRc: CASH };
const KIT = "stone-of-soaring-engraving-setting-kit";

/** The layered map the Bonus Room reads at the 30,000 F4 seed (blue crystal 30,000 / 95). */
function layered(extra: Record<string, number> = {}, includePheons = false): Record<string, number> {
  return buildPriceMap({ ...NAE, ...extra }, { blueCrystalGold: F4 / BC_PER_BUNDLE, includePheons });
}

function group(rows: BonusGroupRow[], slug: string): BonusGroupRow {
  return rows.find((g) => g.slug === slug)!;
}
function product(rows: BonusGroupRow[], slug: string): BonusProductRow {
  return rows.flatMap((g) => g.products).find((p) => p.slug === slug)!;
}
/** TJW's delta: (value - gold cost) / gold cost, in percent. */
function tjwDelta(value: number, costGold: number): number {
  return ((value - costGold) / costGold) * 100;
}

describe("BONUS_ROOM data (Autumn, 2026-10-21)", () => {
  it("is the Autumn room ending with the 11/18/2026 maintenance", () => {
    expect(ROOM).not.toBeNull();
    expect(ROOM.name).toBe("Autumn");
    expect(Number.isFinite(Date.parse(ROOM.endsAt))).toBe(true);
    expect(ROOM.endsAt).toBe("2026-11-18T04:00:00Z");
    expect(ROOM.endsLabel).toBe("Scheduled maintenance on 11/18/2026");
  });

  it("has 3 groups of 3 products, each with a bonus", () => {
    expect(ROOM.groups.map((g) => g.slug)).toEqual(["autumn-ark-grid", "gems-and-cards", "growth-and-life-skills"]);
    for (const g of ROOM.groups) {
      expect(g.products.length, g.slug).toBe(3);
      expect(g.bonus.contents.length, g.slug).toBeGreaterThan(0);
    }
  });

  it("resolves every product and bonus chest name", () => {
    for (const g of ROOM.groups) {
      for (const row of [...g.products.flatMap((p) => p.contents), ...g.bonus.contents]) {
        expect(RESOLVER[row.chest], `${g.slug}: "${row.chest}"`).toBeDefined();
      }
    }
  });

  it("prices each product in exactly one currency, once per roster", () => {
    for (const p of ROOM.groups.flatMap((g) => g.products)) {
      expect((p.royalCrystalCost != null) !== (p.blueCrystalCost != null), p.slug).toBe(true);
      expect(p.maxPurchases, p.slug).toBe(1);
      expect(p.limited, p.slug).toBe(false);
      expect(p.retired, p.slug).toBe(false);
    }
    // The in-game BC prices (user screenshots 2026-10-25) and TJW's 4,000 RC Astrogem Packs.
    const cost = (p: { royalCrystalCost?: number; blueCrystalCost?: number }) => p.royalCrystalCost ?? p.blueCrystalCost;
    expect(ROOM.groups.map((g) => g.products.map(cost))).toEqual([
      [4000, 4000, 4000],
      [600, 300, 300],
      [250, 350, 250],
    ]);
  });

  it("uses unique slugs that never collide with a Packs slug (the drill-down route keys on them)", () => {
    const productSlugs = ROOM.groups.flatMap((g) => g.products.map((p) => p.slug));
    expect(new Set(productSlugs).size).toBe(productSlugs.length);
    const packSlugs = new Set(PACKS.map((p) => p.slug));
    for (const s of productSlugs) expect(packSlugs.has(s), s).toBe(false);
  });

  it("maps every product and bonus icon to real art", () => {
    for (const g of ROOM.groups) {
      for (const icon of [...g.products.map((p) => p.icon), g.bonus.icon]) expect(hasIcon(icon), icon).toBe(true);
    }
  });
});

describe("bonusRoomActive", () => {
  const INSIDE = Date.parse("2026-10-25T12:00:00Z");
  const AFTER = Date.parse("2026-11-19T00:00:00Z");
  const END = Date.parse("2026-11-18T04:00:00Z");

  it("is open inside the window and closed from endsAt on", () => {
    expect(bonusRoomActive(ROOM, INSIDE)).toBe(true);
    expect(bonusRoomActive(ROOM, END - 1)).toBe(true);
    expect(bonusRoomActive(ROOM, END)).toBe(false);
    expect(bonusRoomActive(ROOM, AFTER)).toBe(false);
  });

  it("waits for startsAt when the data sets one", () => {
    const later: BonusRoom = { ...ROOM, startsAt: "2026-10-28T10:00:00Z" };
    expect(bonusRoomActive(later, INSIDE)).toBe(false);
    expect(bonusRoomActive(later, Date.parse("2026-10-28T10:00:00Z"))).toBe(true);
  });

  it("is closed when there is no room", () => {
    expect(bonusRoomActive(null, INSIDE)).toBe(false);
  });
});

describe("timeLeft", () => {
  it("formats days, hours and minutes like TJW's countdown", () => {
    expect(timeLeft(Date.parse("2026-11-18T04:00:00Z") - Date.parse("2026-10-25T12:00:00Z"))).toBe("23d 16h");
    expect(timeLeft(86_400_000)).toBe("1d 0h");
    expect(timeLeft(90 * 60_000)).toBe("1h 30m");
    expect(timeLeft(3_600_000)).toBe("1h 0m");
    expect(timeLeft(42 * 60_000 + 59_999)).toBe("42m");
    expect(timeLeft(59_999)).toBe("0m");
  });

  it("reads ended at or past the end", () => {
    expect(timeLeft(0)).toBe("ended");
    expect(timeLeft(-5)).toBe("ended");
  });
});

describe("bonusRoomRows at the fixture prices, F4 30,000", () => {
  const rows = bonusRoomRows(ROOM, layered(), OPTS);

  it("values an RC product (Autumn Astrogem Pack I) and compares it", () => {
    // Pinned through the engine and hand-checked (per-chest rounding, gold/BC = 30,000 / 95):
    // Crystal 600 x round(315.79) = 189,600; Rare - Epic 25 x 3,750 = 93,750; Fixed Epic
    // 2 x 75,000 = 150,000; Reset Ticket 10 x round(100 x 315.79) = 315,790; T4 Lv. 3 gems
    // 30 x 1,850 = 55,500; Ebony Cube II 5 x 18,427 (Cube 1720 = round(22 x 514 + 41 x 47 +
    // 8 x 319 + 8 x 330)) = 92,135. Total 896,775.
    const r = product(rows, "autumn-astrogem-i");
    expect(r.total).toBe(896775);
    expect(r.valueSet).toBe(true);
    expect(r.hasUnpriced).toBe(false);
    expect(r.icon).toBe("epic-astrogem");
    expect(r.costGold!).toBeCloseTo((4000 * F4) / 238, 6); // 504,201.68
    expect(r.goldPerRc!).toBeCloseTo(224.19375, 9);
    expect(r.vsExchange!).toBeCloseTo(77.860375, 6);
    expect(r.goldPerDollar!).toBeCloseTo(26903.25, 6); // 896,775 / (4,000 x $100 / 12,000)
    expect(r.vsG2G!).toBeCloseTo(-12.058, 3);
    expect(product(rows, "autumn-astrogem-ii").total).toBe(896775);
    expect(product(rows, "autumn-astrogem-iii").total).toBe(896775);
  });

  it("values a BC product (T4 Gem Chest x125) against the BC baseline and G2G via 95 BC = 238 RC", () => {
    // 125 x 1,850 (BAKED lv-3-gem) = 231,250 for 600 BC.
    const r = product(rows, "t4-gem-chest-125");
    expect(r.total).toBe(231250);
    expect(r.goldPerRc).toBeNull();
    expect(r.goldPerBc!).toBeCloseTo(231250 / 600, 9);
    expect(r.costGold!).toBeCloseTo((600 * F4) / 95, 6); // 189,473.68
    expect(r.vsExchange!).toBeCloseTo(22.048611, 5);
    // Shop-money cost: 600 BC = 600 x 238 / 95 RC at $100 / 12,000 RC.
    expect(r.goldPerDollar!).toBeCloseTo(231250 / (((600 * 238) / 95) * CASH), 6);
    expect(r.vsG2G!).toBeCloseTo((r.goldPerDollar! / (1000 / G2G) - 1) * 100, 9);
    expect(r.vsG2G!).toBeCloseTo(-39.6538, 3);
  });

  it("values the Superior Abidos product at 20 mats per chest", () => {
    // 35 chests x round(171 x 20) = 119,700 for 250 BC.
    const r = product(rows, "superior-abidos-chest");
    expect(r.total).toBe(119700);
    expect(r.vsExchange!).toBeCloseTo(51.62, 6);
  });

  it("matches TJW's (value - cost) / cost for every priced product and group", () => {
    for (const g of rows) {
      for (const p of g.products.filter((x) => x.valueSet)) {
        expect(p.vsExchange!, p.slug).toBeCloseTo(tjwDelta(p.total, p.costGold!), 9);
      }
      expect(g.vsExchange!, g.slug).toBeCloseTo(tjwDelta(g.total!, g.costGold!), 9);
    }
  });

  it("totals the Ark Grid group: 3 packs + the 600,000 Ancient chest bonus, all RC", () => {
    const g = group(rows, "autumn-ark-grid");
    expect(g.bonus.total).toBe(600000); // BAKED seeds 500,000 + 100,000
    expect(g.bonus.valueSet).toBe(true);
    expect(g.total).toBe(3 * 896775 + 600000); // 3,290,325
    expect(g.rcCost).toBe(12000);
    expect(g.bcCost).toBe(0);
    expect(g.rcEquiv).toBe(12000);
    expect(g.costGold!).toBeCloseTo((12000 * F4) / 238, 6); // 1,512,605.04
    expect(g.vsExchange!).toBeCloseTo(117.527042, 5);
    expect(g.goldPerDollar!).toBeCloseTo(32903.25, 6); // 3,290,325 / $100
    expect(g.vsG2G!).toBeCloseTo(7.5549, 3);
    expect(g.hasUnpriced).toBe(false);
  });

  it("totals Gems & Cards from its priced contents only (the card packs have no price)", () => {
    // 231,250 (gems) + 0 (soaring kit, Include pheons off) + nothing for the cards.
    const g = group(rows, "gems-and-cards");
    expect(g.total).toBe(231250);
    expect(g.bcCost).toBe(1200);
    expect(g.rcEquiv).toBeCloseTo((1200 * 238) / 95, 9);
    expect(g.costGold!).toBeCloseTo((1200 * F4) / 95, 6); // 378,947.37
    expect(g.vsExchange!).toBeCloseTo(-38.975694, 5);
    expect(g.goldPerDollar!).toBeCloseTo(231250 / (((1200 * 238) / 95) * CASH), 6);
    expect(g.vsG2G!).toBeCloseTo((g.goldPerDollar! / (1000 / G2G) - 1) * 100, 9);
    expect(g.hasUnpriced).toBe(true);
    expect(g.bonus.valueSet).toBe(false);
    expect(g.bonus.total).toBe(0);
  });

  it("totals Growth & Life Skills without the unpriced potions", () => {
    // 6 x 18,427 (ebony cube selection chests) + 119,700 (abidos) + 9,000 bonus (3 x 3,000
    // Elysian) = 239,262. Re-pinned 2026-10-25: the user's in-game count is 6 cube chests per
    // product (TJW's data, and the first pin of 147,127, had 1).
    const g = group(rows, "growth-and-life-skills");
    expect(product(rows, "ebony-cube-selection").total).toBe(6 * 18427);
    expect(g.bonus.total).toBe(9000);
    expect(g.total).toBe(239262);
    expect(g.bcCost).toBe(850);
    expect(g.costGold!).toBeCloseTo((850 * F4) / 95, 6); // 268,421.05
    expect(g.vsExchange!).toBeCloseTo(-10.863176, 4);
    expect(g.hasUnpriced).toBe(true);
  });

  it("leaves the Joyful card product unpriced: no value and null chips", () => {
    const r = product(rows, "joyful-card-pack-10");
    expect(r.valueSet).toBe(false);
    expect(r.hasUnpriced).toBe(true);
    expect(r.total).toBe(0);
    expect(r.goldPerRc).toBeNull();
    expect(r.goldPerBc).toBeNull();
    expect(r.goldPerDollar).toBeNull();
    expect(r.vsExchange).toBeNull();
    expect(r.vsG2G).toBeNull();
    expect(r.costGold!).toBeCloseTo((300 * F4) / 95, 6); // the cost still shows
  });

  it("prices the potion product once the user sets a value, 0 included", () => {
    expect(product(rows, "basic-life-energy-potion-20").valueSet).toBe(false);
    const zero = product(bonusRoomRows(ROOM, layered({ "basic-life-energy-potion": 0 }), OPTS), "basic-life-energy-potion-20");
    expect(zero.valueSet).toBe(true);
    expect(zero.hasUnpriced).toBe(false);
    expect(zero.total).toBe(0);
    expect(zero.vsExchange).toBe(-100);
    const fifty = bonusRoomRows(ROOM, layered({ "basic-life-energy-potion": 50 }), OPTS);
    expect(product(fifty, "basic-life-energy-potion-20").total).toBe(1000); // 20 x 50
    expect(group(fifty, "growth-and-life-skills").total).toBe(239262 + 1000);
    expect(group(fifty, "growth-and-life-skills").hasUnpriced).toBe(false);
  });
});

describe("bonusRoomRows edge cases", () => {
  it("gives null costs and null vs exchange with no F4 rate, but still compares to G2G", () => {
    for (const f4Input of [0, Number.NaN]) {
      const rows = bonusRoomRows(ROOM, buildPriceMap(NAE), { ...OPTS, f4Input });
      for (const g of rows) {
        expect(g.costGold, g.slug).toBeNull();
        expect(g.vsExchange, g.slug).toBeNull();
        for (const p of g.products) {
          expect(p.costGold, p.slug).toBeNull();
          expect(p.vsExchange, p.slug).toBeNull();
        }
      }
      // Without the exchange the Crystal and Reset Ticket lines go unpriced; the rest still count.
      const astro = product(rows, "autumn-astrogem-i");
      expect(astro.valueSet).toBe(true);
      expect(astro.hasUnpriced).toBe(true);
      expect(astro.total).toBe(896775 - 189600 - 315790);
      expect(astro.vsG2G).not.toBeNull();
      expect(group(rows, "autumn-ark-grid").vsG2G).not.toBeNull();
    }
  });

  it("gives a group no value when nothing in it is priced", () => {
    const rows = bonusRoomRows(ROOM, {}, OPTS);
    for (const g of rows) {
      expect(g.total, g.slug).toBeNull();
      expect(g.vsExchange, g.slug).toBeNull();
      expect(g.goldPerDollar, g.slug).toBeNull();
      expect(g.vsG2G, g.slug).toBeNull();
      expect(g.hasUnpriced, g.slug).toBe(true);
      expect(g.costGold!, g.slug).toBeGreaterThan(0);
    }
  });

  it("values the soaring kit at 0 with Include pheons off and 9 pheons with it on", () => {
    const off = layered();
    expect(off[KIT]).toBe(0);
    const kitOff = product(bonusRoomRows(ROOM, off, OPTS), "soaring-engraving-kit");
    expect(kitOff.valueSet).toBe(true); // priced at 0, not unpriced (TJW's rule)
    expect(kitOff.total).toBe(0);
    expect(kitOff.vsExchange).toBe(-100);

    const on = layered({}, true);
    expect(on[KIT]).toBeCloseTo(9 * pheonGold(on), 9); // 9 x 8.5 x 30,000 / 95 = 24,157.89
    const rows = bonusRoomRows(ROOM, on, OPTS);
    // 10 kits per product (the user's in-game count, re-pinned 2026-10-25; TJW's data has 1).
    expect(product(rows, "soaring-engraving-kit").total).toBe(10 * 24158);
    expect(group(rows, "gems-and-cards").total).toBe(231250 + 241580);
    expect(group(rows, "gems-and-cards").vsExchange!).toBeCloseTo(24.774583, 4);
    // A user pheon price moves the kit too.
    expect(layered({ pheon: 2000 }, true)[KIT]).toBe(18000);
  });
});
