import { describe, it, expect } from "vitest";
import { PACKS } from "../src/lib/packs/data/packs";
import { RESOLVER } from "../src/lib/packs/data/resolver";
import { HELL_TIERS, PROBABILITIES, HELL_KEY_MAP } from "../src/lib/packs/data/hellRewards";
import { CUBE_REWARDS } from "../src/lib/packs/data/cube";
import { BAKED, TRADE_UP, RELIC_ENGRAVING_SLUGS } from "../src/lib/packs/data/constants";

describe("PACKS", () => {
  it("has all 19 packs", () => {
    expect(PACKS.length).toBe(19);
  });
  it("lists exactly the 9 non-retired packs", () => {
    const active = PACKS.filter((p) => !p.retired).map((p) => p.slug).sort();
    expect(active).toEqual(
      [
        "adventurers-path-package",
        "monthly-paradise-special-pack-2",
        "monthly-t4-growth-support",
        "summer-growth-support-pack-i",
        "summer-growth-support-pack-ii",
        "weekly-summer-astrogem-package",
        "weekly-t4-crystallized-stone-3",
        "weekly-t4-fusion-leap-pack-3",
        "weekly-t4-shards-support-3",
      ].sort(),
    );
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
  it("has all 43 chests", () => {
    expect(Object.keys(RESOLVER).length).toBe(43);
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
  it("has the two 1730 tiers", () => {
    expect(Object.keys(HELL_TIERS).length).toBe(2);
  });
  it("has 11 floor buckets per tier", () => {
    expect(Object.keys(HELL_TIERS["1730 Destiny Rewards"].floors).length).toBe(11);
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
  it("has the 4 keys", () => {
    expect(Object.keys(HELL_KEY_MAP).length).toBe(4);
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
