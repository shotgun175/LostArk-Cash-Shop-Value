import { describe, it, expect, vi } from "vitest";

// effectivePrices() is the input to every valuation on the site, so a layering-order regression
// here would move every number while the goldens (handed a price map directly) stay green. The
// stores are module singletons: each case re-imports them from one fresh module graph. There is
// no localStorage in node, so storage/load() reads nothing and nothing persists between cases.
async function fresh(prices: Record<string, number>) {
  vi.resetModules();
  const { app } = await import("../src/lib/app.svelte");
  const { overrides } = await import("../src/lib/packs/overrides.svelte");
  const { tradeUp } = await import("../src/lib/packs/tradeup.svelte");
  const mod = await import("../src/lib/packs/prices.svelte");
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
  return { overrides, tradeUp, ...mod };
}

const HONOR = {
  "honor-leapstone": 10,
  "great-honor-leapstone": 100,
  "marvelous-honor-leapstone": 1000,
};

describe("effectivePrices", () => {
  it("lets a user override win over the live snapshot", async () => {
    const { overrides, effectivePrices } = await fresh({ "destiny-leapstone": 50, "lv-3-gem": 1800 });
    overrides.set("nae", "destiny-leapstone", 70);
    const p = effectivePrices();
    expect(p["destiny-leapstone"]).toBe(70);
    expect(p["lv-3-gem"]).toBe(1800);
  });

  it("rewrites an active trade-up's from-slug to toSlug / ratio", async () => {
    const { tradeUp, effectivePrices } = await fresh({ "destiny-leapstone": 50, "great-destiny-leapstone": 400 });
    tradeUp.toggle("destiny-leapstone");
    const p = effectivePrices();
    expect(p["destiny-leapstone"]).toBe(80); // 400 / 5
    expect(p["great-destiny-leapstone"]).toBe(400);
  });

  it("leaves the original price alone when the trade-up target has no price", async () => {
    const { tradeUp, effectivePrices } = await fresh({ "destiny-guardian-stone": 12 });
    tradeUp.toggle("destiny-guardian-stone");
    expect(effectivePrices()["destiny-guardian-stone"]).toBe(12);
  });

  // Pins TODAY's behavior, not a product decision: TRADE_UP chains honor -> great -> marvelous,
  // and effectivePrices walks the active toggles in insertion order over the already-rewritten
  // map, so with both on, the honor price depends on which the user toggled first (the order
  // persists in localStorage). Whether both orders should agree is the maintainer's call.
  it("gives an order-dependent honor price when both chained honor trade-ups are on", async () => {
    const a = await fresh(HONOR);
    a.tradeUp.toggle("great-honor-leapstone");
    a.tradeUp.toggle("honor-leapstone");
    const greatFirst = a.effectivePrices();
    expect(greatFirst["great-honor-leapstone"]).toBe(200); // marvelous / 5
    expect(greatFirst["honor-leapstone"]).toBe(40); // rewritten great / 5 = marvelous / 25

    const b = await fresh(HONOR);
    b.tradeUp.toggle("honor-leapstone");
    b.tradeUp.toggle("great-honor-leapstone");
    const honorFirst = b.effectivePrices();
    expect(honorFirst["great-honor-leapstone"]).toBe(200);
    expect(honorFirst["honor-leapstone"]).toBe(20); // market great / 5
  });
});

describe("layeredPrices", () => {
  it("carries the Hell Key tab's tap override for the current region", async () => {
    const { layeredPrices } = await fresh({});
    const { hellSettings } = await import("../src/lib/packs/hellSettings.svelte");
    hellSettings.setTapOverride("nae", { transferred: 2000 });
    expect(layeredPrices()["special-hone-tap-transferred"]).toBe(2000);
  });
});
