import { describe, it, expect } from "vitest";
import { arkPassRows } from "../src/lib/packs/arkPassRows";

// Uniform unit price of 1 for every option slug we assert on, so the option with the
// largest qtyPerChest is unambiguously the highest-value (default) pick.
const prices: Record<string, number> = {
  // Wanderer's Special Honing Material Selection Chest (levels 2 & 8, chest qty 7)
  "refined-obliteration-stone": 1,          // qtyPerChest 9000
  "destiny-destruction-stone": 1,           // qtyPerChest 3000
  "destiny-crystallized-destruction-stone": 1, // qtyPerChest 1000
  "refined-protection-stone": 1,            // qtyPerChest 45000 -> highest
  "destiny-guardian-stone": 1,              // qtyPerChest 15000
  "destiny-crystallized-guardian-stone": 1, // qtyPerChest 5000
  // Wanderer's Shard Box (level 1, chest qty 6) — defaultPickSlug: destiny-shard-pouch-l
  "honor-shard-pouch-l": 1,                 // qtyPerChest 20 (higher qty)
  "destiny-shard-pouch-l": 1,               // qtyPerChest 10 (the configured default)
};

describe("arkPassRows", () => {
  it("defaults a selection chest to its highest-value option", () => {
    const lvl2 = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    expect(lvl2.chosenSlug).toBe("refined-protection-stone");
    expect(lvl2.gold).toBe(45000 * 7); // round(1 * 45000) * chest qty 7
  });

  it("respects a chest's defaultPickSlug over the highest-value option", () => {
    const lvl1 = arkPassRows(prices, {}).find((r) => r.level === 1)!; // Wanderer's Shard Box
    expect(lvl1.chosenSlug).toBe("destiny-shard-pouch-l"); // default beats honor pouch (qty 20 > 10)
  });

  it("applies a per-level pick to only that level", () => {
    const rows = arkPassRows(prices, { 2: "destiny-crystallized-destruction-stone" });
    const lvl2 = rows.find((r) => r.level === 2)!;
    const lvl8 = rows.find((r) => r.level === 8)!; // same chest, no pick
    expect(lvl2.chosenSlug).toBe("destiny-crystallized-destruction-stone");
    expect(lvl8.chosenSlug).toBe("refined-protection-stone"); // unchanged default
  });

  it("changes the row's gold when a pick is made", () => {
    const def = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    const picked = arkPassRows(prices, { 2: "destiny-crystallized-destruction-stone" }).find((r) => r.level === 2)!;
    expect(def.gold).toBe(45000 * 7);
    expect(picked.gold).toBe(1000 * 7);
    expect(picked.gold).toBeLessThan(def.gold);
  });

  it("marks an unresolved row with no options and passes its icon through", () => {
    const lvl18 = arkPassRows(prices, {}).find((r) => r.level === 18)!; // Rare - Epic Astrogem Chest
    expect(lvl18.unresolved).toBe(true);
    expect(lvl18.options).toEqual([]);
    expect(lvl18.gold).toBe(0);
    expect(lvl18.icon).toBe("epic-astrogem");
    expect(lvl18.chosenSlug).toBeNull();
  });

  it("returns exactly one chosen option matching chosenSlug for a selection row", () => {
    const lvl2 = arkPassRows(prices, {}).find((r) => r.level === 2)!;
    expect(lvl2.options.length).toBe(lvl2.optionCount);
    const chosen = lvl2.options.filter((o) => o.chosen);
    expect(chosen.length).toBe(1);
    expect(chosen[0].slug).toBe(lvl2.chosenSlug);
  });
});
