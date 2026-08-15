import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import PacksPanel from "../src/lib/components/packs/PacksPanel.svelte";
import { app } from "../src/lib/app.svelte";
import fixture from "./fixtures/tjw-nae-prices.json";

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
});
