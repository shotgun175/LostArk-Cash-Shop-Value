import { describe, it, expect, beforeAll } from "vitest";
import { render } from "svelte/server";
import PacksPanel from "../src/lib/components/packs/PacksPanel.svelte";
import PackPage from "../src/routes/pack/[slug]/+page.svelte";
import { app } from "../src/lib/app.svelte";
import { PACKS } from "../src/lib/packs/data/packs";
import { HELL_KEY_MAP } from "../src/lib/packs/data/hellRewards";
import { CUBE_MAP } from "../src/lib/packs/data/cube";
import { buildPriceMap, COMPUTED_PRICE_NOTES, F4_DERIVED_SLUGS } from "../src/lib/packs/priceMap";
import { displayName } from "../src/lib/catalog";
import fixture from "./fixtures/tjw-nae-prices.json";

// Hell/netherworld keys, ebony cubes, the relic recipe and the Bonus Room's soaring kit are
// priced by buildPriceMap itself (EV / max engraving / 9 pheons), which overwrites any region or
// override value. Offering click-to-edit on them showed "edited" while the value never moved, so
// the pack UIs render them read-only.
const prices = fixture.prices as Record<string, number>;
const COMPUTED = [
  ...Object.keys(HELL_KEY_MAP),
  ...Object.keys(CUBE_MAP),
  "relic-combat-engraving-recipe",
  "stone-of-soaring-engraving-setting-kit",
];

beforeAll(() => {
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
});

/** Table rows in `body` whose item name cell is exactly one of the computed slugs' names. */
function computedRows(body: string): string[] {
  const rows = body.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  const names = COMPUTED.map((s) => `>${displayName(s)}<`);
  return rows.filter((r) => names.some((n) => r.includes(n)));
}

describe("computed-price slugs", () => {
  it("covers every key, cube, the relic recipe and the soaring kit", () => {
    expect([...COMPUTED_PRICE_NOTES.keys()].sort()).toEqual([...COMPUTED].sort());
  });

  it("buildPriceMap ignores a user value on each of them", () => {
    const base = buildPriceMap(prices);
    const edited = buildPriceMap({ ...prices, ...Object.fromEntries(COMPUTED.map((s) => [s, 123456789])) });
    for (const s of COMPUTED) expect(edited[s]).toBe(base[s]);
    // Also with an exchange rate and Include pheons on, where the kit is worth 9 pheons, not 0.
    const opts = { blueCrystalGold: 30000 / 95, includePheons: true };
    const baseOn = buildPriceMap(prices, opts);
    const editedOn = buildPriceMap({ ...prices, ...Object.fromEntries(COMPUTED.map((s) => [s, 123456789])) }, opts);
    expect(baseOn["stone-of-soaring-engraving-setting-kit"]).toBeGreaterThan(0);
    for (const s of COMPUTED) expect(editedOn[s]).toBe(baseOn[s]);
  });

  it("renders them read-only on pack cards", () => {
    const rows = computedRows(render(PacksPanel).body);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r).toContain("price-ro");
      expect(r).not.toContain("price-btn");
    }
  });

  it("renders them read-only in the drill-down", () => {
    // Live (un-retired) copies: retired drill-downs are read-only for every line anyway.
    for (const slug of ["monthly-paradise-special-pack-2", "limited-relic-engraving-growth"]) {
      const pack = { ...PACKS.find((p) => p.slug === slug)!, retired: false };
      const rows = computedRows(render(PackPage, { props: { data: { pack } } }).body);
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r).toContain("price-ro");
        expect(r).not.toContain("price-btn");
      }
    }
  });
});

describe("Life Energy Potion default layer", () => {
  const POTION = "basic-life-energy-potion";
  const TIMBER = { timber: 0.85, "tender-timber": 1.78, "sturdy-timber": 8.2, "abidos-timber": 9.26 }; // NA live per unit
  const OPTS = [{}, { blueCrystalGold: 30000 / 95 }, { blueCrystalGold: 30000 / 95, includePheons: true }];

  it("defaults the potion from logging when all four timber prices are present", () => {
    for (const opts of OPTS) {
      expect(buildPriceMap({ ...prices, ...TIMBER }, opts)[POTION]).toBeCloseTo(2264.7732063544, 9);
    }
  });

  it("leaves the potion unpriced without timber prices", () => {
    for (const opts of OPTS) expect(POTION in buildPriceMap(prices, opts)).toBe(false);
    const { "abidos-timber": _dropped, ...three } = TIMBER;
    expect(POTION in buildPriceMap({ ...prices, ...three })).toBe(false);
  });

  it("passes a user potion value through unchanged, 0 included", () => {
    for (const v of [50, 0]) {
      expect(buildPriceMap({ ...prices, ...TIMBER, [POTION]: v })[POTION]).toBe(v);
      expect(buildPriceMap({ ...prices, ...TIMBER, [POTION]: v }, OPTS[1])[POTION]).toBe(v);
    }
  });

  it("stays editable (not a computed read-only slug)", () => {
    expect(COMPUTED_PRICE_NOTES.has(POTION)).toBe(false);
    expect(F4_DERIVED_SLUGS.has(POTION)).toBe(false);
  });

  it("moves no other slug when the timber prices arrive", () => {
    const skip = new Set([POTION, ...Object.keys(TIMBER)]);
    const strip = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).filter(([k]) => !skip.has(k)));
    for (const opts of OPTS) {
      expect(strip(buildPriceMap({ ...prices, ...TIMBER }, opts))).toEqual(strip(buildPriceMap(prices, opts)));
    }
  });
});
