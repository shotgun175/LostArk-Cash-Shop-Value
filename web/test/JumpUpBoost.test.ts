import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import JumpUpBoost from "../src/lib/components/packs/JumpUpBoost.svelte";
import { app } from "../src/lib/app.svelte";
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

describe("JumpUpBoost", () => {
  it("renders the five milestones with TJW-parity totals at the default 30,000 seed", () => {
    loadFixture();
    const { body } = render(JumpUpBoost);
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
  });

  it("values the whole track off baked seeds and the exchange input, so a cold payload still renders numbers", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: {} };
    const { body } = render(JumpUpBoost);
    expect(body).toContain("2,225,158");
  });
});
