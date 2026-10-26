import { describe, it, expect, vi } from "vitest";
import { GEM_LV8_DEFAULT, T4_GEM_LEVELS, gemPriceAt, gemBaseline } from "../src/lib/packs/gems";
import { buildPriceMap, COMPUTED_PRICE_NOTES, F4_DERIVED_SLUGS } from "../src/lib/packs/priceMap";
import { BAKED } from "../src/lib/packs/data/constants";
import { HELL_KEY_MAP } from "../src/lib/packs/data/hellRewards";
import { CUBE_MAP } from "../src/lib/packs/data/cube";
import { BC_PER_BUNDLE } from "../src/lib/packs/data/marisShop";
import fixture from "./fixtures/tjw-nae-prices.json";

// T4 gems: one Lv. 8 baseline per region, 3:1 per level (DECISIONS.md, 2026-10-25).
const NAE = fixture.prices as Record<string, number>;
const GEMS = ["lv-1-gem", "lv-2-gem", "lv-3-gem", "lv-8-gem"];
// The BAKED gem prices this model replaced: the hell keys must not move off them.
const OLD_GEMS = { "lv-1-gem": 171, "lv-2-gem": 514, "lv-3-gem": 1850, "lv-8-gem": 375000 };

describe("gemPriceAt and the regional defaults", () => {
  it("defaults the Lv. 8 baseline to NA 348,000 and EU 398,000", () => {
    expect(GEM_LV8_DEFAULT).toEqual({ nae: 348000, euc: 398000 });
  });

  it("lists the four T4 gem slugs with their levels", () => {
    expect(T4_GEM_LEVELS).toEqual({ "lv-1-gem": 1, "lv-2-gem": 2, "lv-3-gem": 3, "lv-8-gem": 8 });
  });

  it("divides by 3 per level below Lv. 8", () => {
    expect(gemPriceAt(8, 348000)).toBe(348000);
    expect(gemPriceAt(7, 348000)).toBe(116000);
    expect(gemPriceAt(3, 348000)).toBeCloseTo(1432.0987654, 6);
    expect(gemPriceAt(3, 398000)).toBeCloseTo(1637.8600823, 6);
    expect(gemPriceAt(2, 348000)).toBe(348000 / 729);
    expect(gemPriceAt(1, 348000)).toBe(348000 / 2187);
    expect(gemPriceAt(3, 0)).toBe(0);
  });
});

describe("gemBaseline", () => {
  it("uses the user's lv-8-gem value, 0 included", () => {
    expect(gemBaseline({ "lv-8-gem": 300000 }, "nae")).toEqual({ lv8: 300000, isDefault: false });
    expect(gemBaseline({ "lv-8-gem": 0 }, "euc")).toEqual({ lv8: 0, isDefault: false });
  });

  it("falls back to the region's default with no value, or a NaN, infinite or negative one", () => {
    expect(gemBaseline({}, "nae")).toEqual({ lv8: 348000, isDefault: true });
    expect(gemBaseline({}, "euc")).toEqual({ lv8: 398000, isDefault: true });
    for (const bad of [NaN, Infinity, -1]) {
      expect(gemBaseline({ "lv-8-gem": bad }, "euc")).toEqual({ lv8: 398000, isDefault: true });
    }
  });

  it("ignores other gem levels", () => {
    expect(gemBaseline({ "lv-3-gem": 2000 }, "nae")).toEqual({ lv8: 348000, isDefault: true });
  });
});

describe("buildPriceMap gem layer", () => {
  it("prices every level off the region's default baseline, NA when no region is given", () => {
    const na = buildPriceMap(NAE);
    expect(na["lv-8-gem"]).toBe(348000);
    expect(na["lv-3-gem"]).toBe(348000 / 243);
    expect(na["lv-2-gem"]).toBe(348000 / 729);
    expect(na["lv-1-gem"]).toBe(348000 / 2187);
    expect(buildPriceMap(NAE, { region: "nae" })["lv-3-gem"]).toBe(348000 / 243);
    const eu = buildPriceMap(NAE, { region: "euc" });
    expect(eu["lv-8-gem"]).toBe(398000);
    expect(eu["lv-3-gem"]).toBe(398000 / 243);
    expect(eu["lv-2-gem"]).toBe(398000 / 729);
    expect(eu["lv-1-gem"]).toBe(398000 / 2187);
  });

  it("moves every level with a user Lv. 8 value", () => {
    const m = buildPriceMap({ ...NAE, "lv-8-gem": 243000 }, { region: "euc" });
    expect(m["lv-8-gem"]).toBe(243000);
    expect(m["lv-3-gem"]).toBe(1000);
    expect(m["lv-2-gem"]).toBe(243000 / 729);
    expect(m["lv-1-gem"]).toBe(243000 / 2187);
  });

  it("replaces only that level with a user value on another level", () => {
    const m = buildPriceMap({ ...NAE, "lv-3-gem": 2000 });
    expect(m["lv-3-gem"]).toBe(2000);
    expect(m["lv-8-gem"]).toBe(348000);
    expect(m["lv-2-gem"]).toBe(348000 / 729);
    expect(m["lv-1-gem"]).toBe(348000 / 2187);
  });

  it("gives 0 for the derived levels with an explicit 0 baseline", () => {
    const m = buildPriceMap({ ...NAE, "lv-8-gem": 0 });
    for (const slug of GEMS) expect(m[slug], slug).toBe(0);
  });

  it("keeps the gem slugs out of BAKED and editable (not computed, not F4-derived)", () => {
    for (const slug of GEMS) {
      expect(slug in BAKED, slug).toBe(false);
      expect(COMPUTED_PRICE_NOTES.has(slug), slug).toBe(false);
      expect(F4_DERIVED_SLUGS.has(slug), slug).toBe(false);
    }
  });

  it("leaves every hell and netherworld key EV exactly where the old baked gem prices had it", () => {
    // The keys' "Lv. 8 Gems" column is untradable (0 gold), so no key may move. A user value per
    // level wins unchanged, so injecting the old baked prices reproduces the pre-change map.
    for (const region of ["nae", "euc"] as const) {
      for (const opts of [{}, { blueCrystalGold: 30000 / BC_PER_BUNDLE, includePheons: true }]) {
        const now = buildPriceMap(NAE, { ...opts, region });
        const old = buildPriceMap({ ...NAE, ...OLD_GEMS }, { ...opts, region });
        for (const slug of Object.keys(HELL_KEY_MAP)) expect(now[slug], `${region} ${slug}`).toBe(old[slug]);
      }
    }
  });

  it("moves the ebony cube EVs only through the Lv. 2 gem", () => {
    const now = buildPriceMap(NAE);
    // Old Lv. 1/3/8 with the model's NA Lv. 2 pinned: the cubes match the plain build.
    const mixed = buildPriceMap({ ...NAE, ...OLD_GEMS, "lv-2-gem": 348000 / 729 });
    // The old Lv. 2 alone restores the pre-change cube goldens.
    const oldLv2 = buildPriceMap({ ...NAE, "lv-2-gem": 514 });
    const before = [6338, 10588, 13622, 18427];
    const after = [6118, 10148, 13036, 17621];
    Object.keys(CUBE_MAP).forEach((slug, i) => {
      expect(mixed[slug], slug).toBe(now[slug]);
      expect(oldLv2[slug], slug).toBe(before[i]);
      expect(now[slug], slug).toBe(after[i]);
    });
  });
});

describe("layeredPrices reads the current region's baseline", () => {
  it("uses the EU default on EU and the region's own Lv. 8 override", async () => {
    vi.resetModules();
    const { app } = await import("../src/lib/app.svelte");
    const { overrides } = await import("../src/lib/packs/overrides.svelte");
    const { layeredPrices } = await import("../src/lib/packs/prices.svelte");
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: {
        nae: { prices: NAE, source_valid_at: new Date().toISOString() },
        euc: { prices: NAE, source_valid_at: new Date().toISOString() },
      },
      bundles: {},
    } as unknown as typeof app.payload;
    app.region = "nae";
    expect(layeredPrices()["lv-3-gem"]).toBe(348000 / 243);
    app.region = "euc";
    expect(layeredPrices()["lv-3-gem"]).toBe(398000 / 243);
    overrides.set("euc", "lv-8-gem", 486000);
    expect(layeredPrices()["lv-3-gem"]).toBe(2000);
    app.region = "nae";
    expect(layeredPrices()["lv-3-gem"]).toBe(348000 / 243);
  });
});
