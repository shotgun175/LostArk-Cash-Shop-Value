import { app } from "../app.svelte";
import { overrides } from "./overrides.svelte";
import { tradeUp } from "./tradeup.svelte";
import { TRADE_UP } from "./data/constants";

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
