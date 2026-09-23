import { describe, it, expect, vi } from "vitest";
import { buildPackRows } from "../src/lib/packs/packRows";
import { F4_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import { BC_PER_BUNDLE } from "../src/lib/packs/data/marisShop";
import fixture from "./fixtures/tjw-nae-prices.json";

// Choose-N-of-M behavior needs a LIVE custom pack: retired rows display their frozen total, so
// checkbox picks cannot move them. Both Summer Custom packs retired 2026-09-16 and no live
// choose-N pack has replaced them yet, so this file un-retires Summer Custom Pack I for its own
// module graph only (vi.mock is per test file) and keeps the rank-pinning rule under test.
vi.mock("../src/lib/packs/data/packs", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/lib/packs/data/packs")>();
  return {
    ...mod,
    PACKS: mod.PACKS.map((p) =>
      p.slug === "summer-custom-pack-1" ? { ...p, retired: false, retiredOn: undefined, frozenTotal: undefined } : p,
    ),
  };
});

// buildPackRows takes the fully layered map, built the way the Packs tab builds it.
const prices = buildPriceMap(fixture.prices as Record<string, number>, { blueCrystalGold: F4_DEFAULT_INPUT / BC_PER_BUNDLE });
const opts = { f4Input: F4_DEFAULT_INPUT, g2gInput: 0.03268824 };

describe("buildPackRows with a live choose-N pack", () => {
  it("keeps a choose-N pack's rank pinned to its default picks while custom picks change its value", () => {
    const rows = buildPackRows(prices, opts);
    const custom = buildPackRows(prices, {
      ...opts,
      customPicks: { "summer-custom-pack-1": ["Destiny Shard Pouch (L)"] },
    });
    // The displayed value drops to the single picked line...
    const base = rows.find((r) => r.slug === "summer-custom-pack-1")!;
    const picked = custom.find((r) => r.slug === "summer-custom-pack-1")!;
    expect(base.retired).toBe(false);
    expect(picked.total).toBeLessThan(base.total);
    // ...but the grid order is identical to the no-picks order: toggling never reshuffles.
    expect(custom.map((r) => r.slug)).toEqual(rows.map((r) => r.slug));
  });
});
