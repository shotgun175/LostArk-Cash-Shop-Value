import { describe, it, expect } from "vitest";
import { PACKS } from "../src/lib/packs/data/packs";
import { RESOLVER } from "../src/lib/packs/data/resolver";
import { HELL_TIERS, PROBABILITIES, HELL_KEY_MAP } from "../src/lib/packs/data/hellRewards";
import { CUBE_REWARDS } from "../src/lib/packs/data/cube";
import { BAKED, TRADE_UP, RELIC_ENGRAVING_SLUGS } from "../src/lib/packs/data/constants";

describe("PACKS", () => {
  // 26 = 27 tracked through the 2026-08-12 rotation minus the phantom weekly astrogem pack
  // (user-confirmed 2026-08-15 that no such shop product exists; entry deleted outright).
  it("has all 26 packs", () => {
    expect(PACKS.length).toBe(26);
  });
  it("lists exactly the 10 non-retired packs (post-2026-08-12 rotation)", () => {
    const active = PACKS.filter((p) => !p.retired).map((p) => p.slug).sort();
    expect(active).toEqual(
      [
        "adventurers-path-package", // still in the live shop despite TJW's retired flag (2026-08-15)
        "limited-astrogem-package",
        "monthly-1200-crystal-pack",
        "monthly-t4-growth-support",
        "paradise-special-pack",
        "summer-custom-pack-1",
        "summer-custom-pack-2",
        "weekly-summer-t4-crystallized-stone",
        "weekly-summer-t4-fusion-leap",
        "weekly-summer-t4-shards-support",
      ].sort(),
    );
  });
  it("every custom-selection pack has empty contents and a sane pick count", () => {
    const customs = PACKS.filter((p) => p.customSelection);
    expect(customs.map((p) => p.slug).sort()).toEqual(["summer-custom-pack-1", "summer-custom-pack-2"]);
    for (const p of customs) {
      expect(p.contents).toEqual([]);
      const cs = p.customSelection!;
      expect(cs.pick).toBeGreaterThan(0);
      expect(cs.pick).toBeLessThan(cs.options.length);
      // Option chest names are unique (the chosen-set store keys on them).
      expect(new Set(cs.options.map((o) => o.chest)).size).toBe(cs.options.length);
    }
  });
  it("carries the right royal-crystal cost", () => {
    expect(PACKS.find((p) => p.slug === "horizon-growth-support-pack-i")?.royalCrystalCost).toBe(5800);
  });
});

describe("RESOLVER", () => {
  // Source B's resolverFull array serializes 35 chests; the "38" in the task/grounding doc
  // is the source's own summary over-count. We add the documented "10k Character-Bound Gold
  // Bars" chest (referenced by a pack, valued in grounding doc §5) -> 36. The remaining 2 from
  // the summary were never serialized and can't be reconstructed without fabrication.
  // 2026-07-15 summer rotation adds 7 more (3 Season 4 tickets, 4 astrogem chests) -> 43.
  // 2026-07 1200 Crystal Pack adds 3 (Crystal + the two run-reward brews) -> 46.
  // 2026-08-12 rotation adds 3 (Abidos 15-pack, Elysian S4 ticket, Joyful card pack) -> 49.
  it("has all 49 chests", () => {
    expect(Object.keys(RESOLVER).length).toBe(49);
  });
  it("resolves a fixed chest's first output", () => {
    expect(RESOLVER["Glacier's Breath Chest"].outputs[0]).toEqual({
      slug: "glaciers-breath",
      qtyPerChest: 10,
    });
  });
  it("models a selection chest", () => {
    expect(RESOLVER["T4 Stone Selection Chest"].type).toBe("selection");
    expect(RESOLVER["T4 Stone Selection Chest"].outputs.length).toBe(2);
  });
});

describe("HELL_TIERS", () => {
  // 2026-07-30: five ilvl tiers (1640/1680/1700/1730/1750), a Destiny + FlameFrost pair each.
  it("has all five tier pairs", () => {
    expect(Object.keys(HELL_TIERS).length).toBe(10);
  });
  it("has 11 floor buckets per tier", () => {
    for (const tier of Object.values(HELL_TIERS)) {
      expect(Object.keys(tier.floors).length).toBe(11);
    }
  });
  it("preserves floor gold values", () => {
    expect(HELL_TIERS["1730 Destiny Rewards"].floors["100"].Gold).toBe(130000);
  });
});

describe("PROBABILITIES", () => {
  it("has 11 floors for each table", () => {
    expect(PROBABILITIES.Destiny.length).toBe(11);
    expect(PROBABILITIES.Flame.length).toBe(11);
    expect(PROBABILITIES.Frost.length).toBe(11);
  });
  it("ends with the 100 bucket", () => {
    expect(PROBABILITIES.Destiny[10].range).toBe("100");
  });
  it("sums a Destiny rarity column to a probability in (0, 1.2)", () => {
    const sum = PROBABILITIES.Destiny.reduce(
      (acc, f) => acc + (f.Legendary as number),
      0,
    );
    expect(sum).toBeGreaterThan(0);
    expect(sum).toBeLessThan(1.2);
  });
});

describe("HELL_KEY_MAP", () => {
  // 2026-07-30: 4 keys per tier x 5 tiers (II/III/IV/V/VI).
  it("has the 20 keys", () => {
    expect(Object.keys(HELL_KEY_MAP).length).toBe(20);
  });
  it("maps the Legendary destiny key", () => {
    expect(HELL_KEY_MAP["splendid-hell-key-of-destiny-v"].rarityTier).toBe("Legendary");
  });
});

describe("CUBE_REWARDS", () => {
  it("has the 4 ebony cubes", () => {
    expect(Object.keys(CUBE_REWARDS).length).toBe(4);
  });
  it("preserves leapstone counts", () => {
    expect(CUBE_REWARDS["Cube 1720"].leapstones).toBe(41);
  });
});

describe("constants", () => {
  it("bakes the lv-3 gem value", () => {
    expect(BAKED["lv-3-gem"]).toBe(1543);
  });
  it("tracks 23 relic engraving slugs", () => {
    expect(RELIC_ENGRAVING_SLUGS.length).toBe(23);
  });
  it("has the 7 trade-up pairs", () => {
    expect(TRADE_UP.length).toBe(7);
  });
});
