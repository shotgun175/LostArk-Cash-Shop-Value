import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import JumpUpBoost from "../src/lib/components/packs/JumpUpBoost.svelte";
import { app } from "../src/lib/app.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
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

// TJW's Jump-Up parity golden (2,225,158) is defined at a 30,000 exchange input, which was the
// app's seed until 2026-10-25; the seed is now 35,000, so the parity cases set 30,000 explicitly.
function withExchange<T>(gold: number, fn: () => T): T {
  const saved = f4.value;
  f4.value = gold;
  try {
    return fn();
  } finally {
    f4.value = saved;
  }
}

describe("JumpUpBoost", () => {
  it("renders the five milestones with TJW-parity totals at a 30,000 exchange input", () => {
    loadFixture();
    const body = withExchange(30000, () => render(JumpUpBoost).body); // body renders lazily: read it inside
    expect(body).toContain("Jump-Up Boost");
    for (const ilvl of ["1,700", "1,705", "1,710", "1,715", "1,720"]) {
      expect(body).toContain(`Reach Item Lv. ${ilvl}`);
    }
    // Lv 1 = 200,000 bound gold + the aura at 238 BC x 30,000/95; the track totals 2,225,158.
    expect(body).toContain("275,158");
    expect(body).toContain("2,225,158");
    expect(body).toContain("741.7");
    // Azena's Blessing and the two Ancient chests carry no market value.
    expect((body.match(/no price/g) ?? []).length).toBe(3);
    // The chest subline only appears when it adds information: "4x 50,000 Gold Bars" under the
    // gold line, but not "2x Lv. 8 Brilliant Gem (Bound)" under a line already named that.
    expect(body).toContain("4× 50,000 Gold Bars");
    expect(body).not.toContain("2× Lv. 8 Brilliant Gem (Bound)");
  });

  it("shows a neutral placeholder for vs F4 while the exchange input is cleared", () => {
    loadFixture();
    const saved = f4.value;
    try {
      f4.value = NaN; // the store allows the transient NaN a cleared number input produces
      const { body } = render(JumpUpBoost);
      const vs = body.match(/<dd[^>]*>—<\/dd>/)?.[0] ?? "";
      expect(vs).not.toBe("");
      expect(vs).not.toMatch(/class="[^"]*\b(good|bad)\b/);
    } finally {
      f4.value = saved;
    }
  });

  it("values the whole track off baked seeds and the exchange input, so a cold payload still renders numbers", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: {} };
    const body = withExchange(30000, () => render(JumpUpBoost).body); // body renders lazily: read it inside
    expect(body).toContain("2,225,158");
  });

  it("prices the aura off the default 35,000 exchange seed when the user has typed nothing", () => {
    loadFixture();
    const { body } = render(JumpUpBoost);
    // Aura: 238 BC x 35,000 / 95 = 87,684 (per-chest rounding); Lv 1 = 200,000 + 87,684, and the
    // track totals 2,237,684 (the 30,000 parity total plus 12,526 more aura).
    expect(body).toContain("287,684");
    expect(body).toContain("2,237,684");
  });
});
