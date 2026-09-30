import { describe, it, expect, beforeEach } from "vitest";
import { render } from "svelte/server";
import HellKeyMath from "../src/lib/components/packs/HellKeyMath.svelte";
import { app } from "../src/lib/app.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import fixture from "./fixtures/tjw-nae-prices.json";

// The singletons persist across cases within this file, so every case starts from the same
// fresh NA snapshot with no tap or price overrides. The default tier is the newest (1750),
// whose "Prices used" table carries the Transferred tap and superior fusions.
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
  overrides.clearAll("nae");
});

/** The "Prices used" rows for one reward column, across every rendered key card. */
function sourceRows(body: string, column: string): string[] {
  return (body.match(/<tr[\s\S]*?<\/tr>/g) ?? []).filter((r) => r.includes(`>${column}</td>`) && r.includes("src-"));
}

describe("HellKeyMath prices used", () => {
  it("labels market and computed prices live by default", () => {
    const { body } = render(HellKeyMath);
    const taps = sourceRows(body, "Free taps");
    const fusions = sourceRows(body, "Fusions");
    expect(taps.length).toBeGreaterThan(0);
    expect(fusions.length).toBeGreaterThan(0);
    for (const r of [...taps, ...fusions]) expect(r).toContain(">live</span>");
  });

  it("labels an overridden Free taps price as an override", () => {
    hellSettings.setTapOverride("nae", { transferred: 1234 });
    const { body } = render(HellKeyMath);
    const taps = sourceRows(body, "Free taps");
    expect(taps.length).toBeGreaterThan(0);
    for (const r of taps) {
      expect(r).toContain("src-override");
      expect(r).toContain(">override</span>");
      expect(r).toContain("1,234");
    }
    // Only the tap row moved: a market-priced row keeps its live label.
    for (const r of sourceRows(body, "Fusions")) expect(r).toContain(">live</span>");
  });

  it("keeps a cleared tap override field labelled live", () => {
    hellSettings.setTapOverride("nae", { transferred: NaN });
    const { body } = render(HellKeyMath);
    for (const r of sourceRows(body, "Free taps")) expect(r).toContain(">live</span>");
  });

  it("labels a reward priced by a Packs-page override as an override", () => {
    overrides.set("nae", "superior-abidos-fusion-material", 1);
    const { body } = render(HellKeyMath);
    const fusions = sourceRows(body, "Fusions");
    expect(fusions.length).toBeGreaterThan(0);
    for (const r of fusions) expect(r).toContain(">override</span>");
    for (const r of sourceRows(body, "Free taps")) expect(r).toContain(">live</span>");
  });

  it("ignores the other region's overrides", () => {
    hellSettings.setTapOverride("euc", { transferred: 1234 });
    overrides.set("euc", "superior-abidos-fusion-material", 1);
    try {
      const { body } = render(HellKeyMath);
      expect(body).not.toContain("src-override");
    } finally {
      hellSettings.setTapOverride("euc", {});
      overrides.clearAll("euc");
    }
  });
});
