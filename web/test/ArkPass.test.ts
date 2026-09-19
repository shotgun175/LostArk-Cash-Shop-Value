import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import ArkPass from "../src/lib/components/packs/ArkPass.svelte";
import { app } from "../src/lib/app.svelte";
import { ARK_PASS_SEASON } from "../src/lib/packs/data/arkPass";
import fixture from "./fixtures/tjw-nae-prices.json";

function loadFixture(): void {
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
}

describe("ArkPass", () => {
  it("values the track against the fully layered price map, like the Packs tab", () => {
    loadFixture();
    const { body } = render(ArkPass);
    expect(body).toContain(ARK_PASS_SEASON);
    // Match "<qty> <gold>" cell pairs in the rendered text: a bare "99,000" is ambiguous, since a
    // Support row (300 breaths) totals the same at the fixture prices.
    const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    // Lv 16/17: Ebony Cube ticket chests at the cube EV (no live price for the ticket slug).
    expect(text.match(/ 2 36,854 /g)?.length).toBe(2);
    // Lv 18/19: 3 Epic Astrogem Chests at BAKED 33,000; Lv 20: fixed epic astrogem at 75,000.
    expect(text.match(/ 3 99,000 /g)?.length).toBe(2);
    expect(text).toContain(" 1 75,000 ");
    // The raw effectivePrices() map would leave Lv 16-20 at 0 and total 3,035,255.
    expect(body).toContain("3,381,963");
    expect(body).not.toContain("3,035,255");
  });
});
