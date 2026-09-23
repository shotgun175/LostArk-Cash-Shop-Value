import { app } from "../app.svelte";
import { overrides } from "./overrides.svelte";
import { tradeUp } from "./tradeup.svelte";
import { TRADE_UP } from "./data/constants";
import { f4 } from "./f4.svelte";
import { hellSettings } from "./hellSettings.svelte";
import { buildPriceMap } from "./priceMap";

const BY_FROM: Record<string, { fromSlug: string; toSlug: string; ratio: number }> =
  Object.fromEntries(TRADE_UP.map((t) => [t.fromSlug, t]));

// Live region prices + user overrides + active trade-up re-routing, in that order. Reads reactive
// store state, so call it inside a $derived (the Packs list and the drill-down page both do).
export function effectivePrices(): Record<string, number> {
  const p: Record<string, number> = { ...(app.snapshot?.prices ?? {}), ...overrides.forRegion(app.region) };
  for (const slug of Object.keys(tradeUp.active)) {
    const t = BY_FROM[slug];
    if (t && p[t.toSlug] > 0) p[slug] = p[t.toSlug] / t.ratio;
  }
  return p;
}

// The fully layered map every pack-valuing view reads (Packs, the drill-down, Ark Pass, Jump-Up):
// effectivePrices() plus baked seeds, tap prices with the Hell Key tab's per-region override,
// key/cube EVs and the F4-priced blue crystal and BC items. Reactive like effectivePrices().
export function layeredPrices(): Record<string, number> {
  return buildPriceMap(effectivePrices(), {
    blueCrystalGold: f4.perBc,
    tapOverrides: hellSettings.tapOverride[app.region],
  });
}
