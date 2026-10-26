import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import PacksPanel from "../src/lib/components/packs/PacksPanel.svelte";
import { app } from "../src/lib/app.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { BAR_OVERRIDES } from "../src/lib/valuesBar";
import fixture from "./fixtures/tjw-nae-prices.json";

// Include pheons is a shared singleton that moves every key valuation, so each case starts off.
beforeEach(() => {
  hellSettings.setIncludePheons(false);
});

// The checkbox-block guard below needs LIVE choose-N packs (retired cards render compact, with
// no option rows). Both Summer Custom packs retired 2026-09-16 and nothing choose-N has replaced
// them yet, so un-retire them for this file's module graph only (vi.mock is per test file).
vi.mock("../src/lib/packs/data/packs", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/lib/packs/data/packs")>();
  return {
    ...mod,
    PACKS: mod.PACKS.map((p) =>
      p.customSelection ? { ...p, retired: false, retiredOn: undefined, frozenTotal: undefined } : p,
    ),
  };
});

// The cold-start guard: a fresh visitor whose payload has no regions yet (worker KV still cold, or
// a T8-style degraded fetch) must see the honest empty state, not a grid of 0-gold packs read off
// baked constants with status "ok".
describe("PacksPanel cold start", () => {
  it("shows the empty state when the payload has no region snapshot yet", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: {} };
    const { body } = render(PacksPanel);
    expect(body).toContain("No prices yet");
    expect(body).not.toContain("pack-grid"); // and no pack cards rendered alongside it
  });
});

// Regression guard for the checkbox-block price map (commit bcf55ee): the choose-N-of-M option
// rows must be valued on the fully layered buildPriceMap, not the raw feed. On the raw feed the
// EV/baked options (S4 key tickets, T4 gems) render "no price" dashes and the displayed default
// checkmarks disagree with the engine's chosen set (the pack total).
describe("PacksPanel custom-pack checkbox block", () => {
  it("values EV-backed options and checks the engine's default set", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
      bundles: {},
    } as unknown as typeof app.payload;
    const { body } = render(PacksPanel);

    // The Epic HK S4 ticket is one of summer-custom-pack-1's default top-5 at this fixture
    // (via the hell-key EV layer) — its option row must render checked and not dimmed.
    const rows = body.match(/<label[^>]*cs-opt[\s\S]*?<\/label>/g) ?? [];
    const epicRow = rows.find((r) => r.includes("Epic Hell Key of Destiny Exchange Ticket (Season 4)"));
    expect(epicRow).toBeDefined();
    expect(epicRow!).toContain("checked");
    expect(epicRow!).not.toContain("off");

    // Every option across both custom packs carries a real price except the one genuinely
    // priceless line (the untradable Joyful card pack in summer-custom-pack-2).
    // (scoped styles append a svelte-hash to the class list, so match a prefix)
    const golds = [...body.matchAll(/<span class="cs-gold num[^"]*">([^<]+)<\/span>/g)].map((m) => m[1]);
    expect(golds.length).toBe(18); // 10 options (pack I) + 8 options (pack II)
    expect(golds.filter((g) => g.includes("—")).length).toBe(1);
  });

  it("renders the Blue Crystal unit price read-only (F4 input is the source of truth)", () => {
    // user 2026-08-15: no click-to-edit on F4-derived prices — an override would be silently
    // out-layered by the input/95 injection, so the affordance must not be offered.
    app.region = "nae";
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
      bundles: {},
    } as unknown as typeof app.payload;
    const { body } = render(PacksPanel);
    const rows = body.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
    const bcRow = rows.find((r) => r.includes(">Blue Crystal<"));
    expect(bcRow).toBeDefined();
    expect(bcRow!).toContain("price-ro");
    expect(bcRow!).not.toContain("price-btn");
    // An ordinary editable line keeps the affordance.
    const gemRow = rows.find((r) => r.includes(">Lv 3 Gem<"));
    expect(gemRow).toBeDefined();
    expect(gemRow!).toContain("price-btn");
  });
});

// The Include pheons setting moves every key value on this page, so the note says so while it is
// on. Indicator only: the control itself lives in the shared "Your values" bar.
describe("PacksPanel Include pheons indicator", () => {
  const INDICATOR = "Key values include ability stones at 9 pheons each (set in Your values).";
  function seed(): void {
    app.region = "nae";
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
      bundles: {},
    } as unknown as typeof app.payload;
  }

  it("is absent while the setting is off", () => {
    seed();
    const { body } = render(PacksPanel);
    expect(body).not.toContain(INDICATOR);
    expect(body).not.toContain("Include pheons"); // no second control on this page
  });

  it("appears in the note while the setting is on", () => {
    seed();
    hellSettings.setIncludePheons(true);
    const { body } = render(PacksPanel);
    const note = (body.match(/<p class="note[^"]*">[\s\S]*?<\/p>/)?.[0] ?? "")
      .replace(/<!--[^>]*-->/g, "")
      .replace(/\s+/g, " ");
    expect(note).toContain(`Click any market price to enter your own AH price. ${INDICATOR}`);
    expect(body).not.toContain("Include pheons");
  });
});

// The Your values Lv. 8 gem and potion are stored as price overrides but are settings: the note's
// custom-price count leaves them out and "reset all" keeps them (user 2026-10-25). Clearing the
// bar's box is how they go back to the baseline.
describe("PacksPanel custom prices and Your values", () => {
  afterEach(() => overrides.clearAll("nae"));

  it("counts only price edits, not the bar's gem and potion values", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
      bundles: {},
    } as unknown as typeof app.payload;
    const note = (): string =>
      (render(PacksPanel).body.match(/<p class="note[^"]*">[\s\S]*?<\/p>/)?.[0] ?? "")
        .replace(/<!--[^>]*-->/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
    overrides.set("nae", "lv-8-gem", 300000);
    overrides.set("nae", "basic-life-energy-potion", 1500);
    expect(note()).not.toContain("custom price");
    overrides.set("nae", "abidos-fusion-material", 95);
    expect(note()).toContain("1 custom price");
  });

  it("keeps the bar's values on reset all, on Packs and on a pack's page", () => {
    expect([...BAR_OVERRIDES].sort()).toEqual(["basic-life-energy-potion", "lv-8-gem"]);
    for (const f of ["../src/lib/components/packs/PacksPanel.svelte", "../src/routes/pack/[slug]/+page.svelte"]) {
      const src = readFileSync(new URL(f, import.meta.url), "utf-8");
      expect(src, f).toContain("overrides.count(app.region, BAR_OVERRIDES)");
      expect(src, f).toContain("overrides.clearAll(app.region, BAR_OVERRIDES)");
      expect(src, f).not.toContain("overrides.clearAll(app.region)");
    }
  });
});
