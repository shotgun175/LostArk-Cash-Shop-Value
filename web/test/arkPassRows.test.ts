import { describe, it, expect } from "vitest";
import { arkPassRows } from "../src/lib/packs/arkPassRows";
import { ARK_PASS_LEVELS } from "../src/lib/packs/data/arkPass";
import { RESOLVER } from "../src/lib/packs/data/resolver";

// Uniform unit price of 1 for every option slug we assert on, so the option with the
// largest qtyPerChest is unambiguously the highest-value (default) pick.
const prices: Record<string, number> = {
  // Tenebrous Special Honing Material Selection Chest (levels 2 & 8, chest qty 3)
  "destiny-destruction-stone": 1,              // qtyPerChest 6000
  "destiny-crystallized-destruction-stone": 1, // qtyPerChest 2000
  "destiny-guardian-stone": 1,                 // qtyPerChest 18000 -> highest
  "destiny-crystallized-guardian-stone": 1,    // qtyPerChest 6000
  // Tenebrous Shard Chest (level 1, chest qty 3): fixed 20x Destiny Shard Pouch (L)
  "destiny-shard-pouch-l": 1,
  // Epic Astrogem Chest (levels 18 & 19, chest qty 3)
  "epic-astrogem": 1,
};

describe("arkPassRows", () => {
  it("defaults a selection chest to its highest-value option", () => {
    const lvl2 = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    expect(lvl2.chosenSlug).toBe("destiny-guardian-stone");
    expect(lvl2.gold).toBe(18000 * 3); // round(1 * 18000) * chest qty 3
  });

  it("values the fixed Tenebrous Shard Chest with no picker", () => {
    const lvl1 = arkPassRows(prices, {}).find((r) => r.level === 1)!;
    expect(lvl1.chosenSlug).toBe("destiny-shard-pouch-l");
    expect(lvl1.qty).toBe(20 * 3);
    expect(lvl1.optionCount).toBe(1);
  });

  it("applies a per-level pick to only that level", () => {
    const rows = arkPassRows(prices, { 2: "destiny-crystallized-destruction-stone" });
    const lvl2 = rows.find((r) => r.level === 2)!;
    const lvl8 = rows.find((r) => r.level === 8)!; // same chest, no pick
    expect(lvl2.chosenSlug).toBe("destiny-crystallized-destruction-stone");
    expect(lvl8.chosenSlug).toBe("destiny-guardian-stone"); // unchanged default
  });

  it("changes the row's gold when a pick is made", () => {
    const def = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    const picked = arkPassRows(prices, { 2: "destiny-crystallized-destruction-stone" }).find((r) => r.level === 2)!;
    expect(def.gold).toBe(18000 * 3);
    expect(picked.gold).toBe(2000 * 3);
    expect(picked.gold).toBeLessThan(def.gold);
  });

  it("values the astrogem rows through the resolver", () => {
    const lvl18 = arkPassRows(prices, {}).find((r) => r.level === 18)!; // Epic Astrogem Chest x3
    expect(lvl18.unresolved).toBe(false);
    expect(lvl18.chosenSlug).toBe("epic-astrogem");
    expect(lvl18.gold).toBe(3);
  });

  it("marks the card-pack row unresolved with no options and passes its icon through", () => {
    const lvl30 = arkPassRows(prices, {}).find((r) => r.level === 30)!; // Leap Legendary Card Selection Pack III
    expect(lvl30.unresolved).toBe(true);
    expect(lvl30.options).toEqual([]);
    expect(lvl30.gold).toBe(0);
    expect(lvl30.icon).toBe("legendary-card-pack");
    expect(lvl30.chosenSlug).toBeNull();
  });

  it("returns exactly one chosen option matching chosenSlug for a selection row", () => {
    const lvl2 = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    expect(lvl2.options.length).toBe(lvl2.optionCount);
    const chosen = lvl2.options.filter((o) => o.chosen);
    expect(chosen.length).toBe(1);
    expect(chosen[0].slug).toBe(lvl2.chosenSlug);
  });
});

describe("Tenebrous Judge track (in-game 2026-09-19, cross-checked vs Lost Ark Codex pass 1316)", () => {
  it("has 30 levels with Super Premium milestones every 5 levels", () => {
    expect(ARK_PASS_LEVELS.map((l) => l.level)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(ARK_PASS_LEVELS.filter((l) => l.milestone).map((l) => l.level)).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it("resolves every level except the card pack", () => {
    const unresolved = ARK_PASS_LEVELS.filter((l) => l.unresolved || !RESOLVER[l.chest]).map((l) => l.level);
    expect(unresolved).toEqual([30]);
  });

  it("grants the per-chest-family totals from the datamined track", () => {
    const totals: Record<string, number> = {};
    for (const l of ARK_PASS_LEVELS) totals[l.chest] = (totals[l.chest] ?? 0) + l.qty;
    expect(totals).toEqual({
      "Tenebrous Shard Chest": 28,
      "Tenebrous Special Honing Material Selection Chest": 21,
      "Tenebrous Special Support Materials Selection Chest": 16,
      "Tenebrous Special Leapstone Selection Chest": 24,
      "Tenebrous Special Fusion Material Selection Chest": 21,
      "(NEW) Ebony Cube Entrance Ticket Selection Chest II": 4,
      "Epic Astrogem Chest": 6,
      "Fixed Epic Astrogem Selection Chest": 1,
      "Leap Legendary Card Selection Pack III": 1,
    });
  });

  it("pins every option of the Tenebrous chests to the datamined box tables", () => {
    const outputs = (name: string) => RESOLVER[name].outputs.map((o) => [o.slug, o.qtyPerChest]);
    expect(RESOLVER["Tenebrous Shard Chest"].type).toBe("fixed");
    expect(outputs("Tenebrous Shard Chest")).toEqual([["destiny-shard-pouch-l", 20]]);
    expect(outputs("Tenebrous Special Honing Material Selection Chest")).toEqual([
      ["destiny-destruction-stone", 6000],
      ["destiny-crystallized-destruction-stone", 2000],
      ["destiny-guardian-stone", 18000],
      ["destiny-crystallized-guardian-stone", 6000],
    ]);
    expect(outputs("Tenebrous Special Support Materials Selection Chest")).toEqual([
      ["glaciers-breath", 100],
      ["lavas-breath", 100],
    ]);
    expect(outputs("Tenebrous Special Leapstone Selection Chest")).toEqual([
      ["destiny-leapstone", 200],
      ["great-destiny-leapstone", 100],
    ]);
    expect(outputs("Tenebrous Special Fusion Material Selection Chest")).toEqual([
      ["abidos-fusion-material", 270],
      ["superior-abidos-fusion-material", 225],
    ]);
  });

  it("matches the hand-computed material total at the 2026-09-19 NA snapshot", () => {
    // Best picks: pouch 20x574; crystallized destruction 2000x29.4; glacier's 100x498;
    // great leapstone 100x53; abidos 270x116. 28x11480 + 21x58800 + 16x49800 + 24x5300 +
    // 21x31320 = 3,137,960. Cube and astrogem slugs are absent here, so those rows add 0.
    const na: Record<string, number> = {
      "destiny-shard-pouch-l": 574,
      "destiny-destruction-stone": 6.43,
      "destiny-crystallized-destruction-stone": 29.4,
      "destiny-guardian-stone": 0.44,
      "destiny-crystallized-guardian-stone": 2.81,
      "glaciers-breath": 498,
      "lavas-breath": 460,
      "destiny-leapstone": 16,
      "great-destiny-leapstone": 53,
      "abidos-fusion-material": 116,
      "superior-abidos-fusion-material": 138,
    };
    const total = arkPassRows(na, {}).reduce((s, r) => s + r.gold, 0);
    expect(total).toBe(3137960);
  });
});
