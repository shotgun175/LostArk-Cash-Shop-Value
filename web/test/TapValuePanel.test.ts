import { describe, it, expect, beforeEach } from "vitest";
import { render } from "svelte/server";
import TapValuePanel from "../src/lib/components/packs/TapValuePanel.svelte";
import { app } from "../src/lib/app.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import fixture from "./fixtures/tjw-nae-prices.json";

// The Override checkbox and the price field track whether an override key exists at all, so a
// field cleared mid-edit (NaN) stays mounted for the next keystroke. Only a real number replaces
// the computed price, so only a real number may dim it as superseded.
beforeEach(() => {
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
  hellSettings.setTapOverride("nae", {});
});

const superseded = /class="line[^"]*\bsuperseded\b/;

describe("TapValuePanel", () => {
  it("shows the computed price undimmed with no override", () => {
    const { body } = render(TapValuePanel, { props: { ilvl: 1750 } });
    expect(body).not.toMatch(superseded);
    expect(body).not.toContain('class="val num');
  });

  it("dims the computed price when a numeric override replaces it", () => {
    hellSettings.setTapOverride("nae", { transferred: 1234 });
    const { body } = render(TapValuePanel, { props: { ilvl: 1750 } });
    expect(body).toMatch(superseded);
    expect(body).toMatch(/<input[^>]*class="val num[^>]*value="1234"/);
  });

  it("keeps the field open but the computed price live while the field is cleared", () => {
    hellSettings.setTapOverride("nae", { transferred: NaN });
    const { body } = render(TapValuePanel, { props: { ilvl: 1750 } });
    expect(body).toMatch(/<input type="checkbox" checked/);
    expect(body).toContain('class="val num');
    expect(body).not.toMatch(superseded);
  });
});
