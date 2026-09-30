import { describe, it, expect, beforeAll } from "vitest";
import { render } from "svelte/server";
import PacksPanel from "../src/lib/components/packs/PacksPanel.svelte";
import PackPage from "../src/routes/pack/[slug]/+page.svelte";
import { app } from "../src/lib/app.svelte";
import { PACKS } from "../src/lib/packs/data/packs";
import { HELL_KEY_MAP } from "../src/lib/packs/data/hellRewards";
import { CUBE_MAP } from "../src/lib/packs/data/cube";
import { buildPriceMap, COMPUTED_PRICE_NOTES } from "../src/lib/packs/priceMap";
import { displayName } from "../src/lib/catalog";
import fixture from "./fixtures/tjw-nae-prices.json";

// Hell/netherworld keys, ebony cubes and the relic recipe are priced by buildPriceMap itself
// (EV / max engraving), which overwrites any region or override value. Offering click-to-edit on
// them showed "edited" while the value never moved, so the pack UIs render them read-only.
const prices = fixture.prices as Record<string, number>;
const COMPUTED = [...Object.keys(HELL_KEY_MAP), ...Object.keys(CUBE_MAP), "relic-combat-engraving-recipe"];

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
  it("covers every key, cube and the relic recipe", () => {
    expect([...COMPUTED_PRICE_NOTES.keys()].sort()).toEqual([...COMPUTED].sort());
  });

  it("buildPriceMap ignores a user value on each of them", () => {
    const base = buildPriceMap(prices);
    const edited = buildPriceMap({ ...prices, ...Object.fromEntries(COMPUTED.map((s) => [s, 123456789])) });
    for (const s of COMPUTED) expect(edited[s]).toBe(base[s]);
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
