import { PACKS } from "./data/packs";
import { packValue, type PackResult } from "./packValue";
import { buildPriceMap } from "./priceMap";
import { f4Baseline, vsExchangePct, g2gGoldPerDollar, vsG2GPct } from "./exchange";
import { BC_PER_BUNDLE } from "./data/marisShop";
import type { TapOverrides } from "./tapPrices";

export interface PackRow extends PackResult {
  vsExchange: number | null;
  vsG2G: number | null;
}

interface PackRowOpts {
  f4Input: number;
  g2gInput: number;
  picks?: Record<string, string>;
  cashPerRc?: number; // region cost of one RC ($100/12k NA, €94.99/12k EU); defaults to NA in packValue
  // The Hell Key tab's per-region tap-price override, so a manual tap price moves every pack
  // that contains a hell/netherworld key, not just that tab. Caller passes it in (keeps this pure).
  tapOverrides?: TapOverrides;
}

/**
 * Value every pack against the region price map and layer on the two comparison columns.
 * buildPriceMap is called once (not per pack) — it computes the hell-key/cube EVs. Active
 * packs sort before retired; within each group, highest gold-per-RC first.
 */
export function buildPackRows(
  regionPrices: Record<string, number>,
  opts: PackRowOpts,
): PackRow[] {
  // Blue Crystal ("Crystal" packs) tracks the same F4 gold input, at input/95 (vs input/238 for RC).
  const prices = buildPriceMap(regionPrices, {
    blueCrystalGold: opts.f4Input / BC_PER_BUNDLE,
    tapOverrides: opts.tapOverrides,
  });
  const baseline = f4Baseline(opts.f4Input);
  const g2gGpd = g2gGoldPerDollar(opts.g2gInput);

  const rows: PackRow[] = PACKS.map((p) => {
    const v = packValue(p, prices, opts.picks, opts.cashPerRc, true);
    return {
      ...v,
      vsExchange: v.goldPerRc == null ? null : vsExchangePct(v.goldPerRc, baseline),
      vsG2G: v.goldPerDollar == null ? null : vsG2GPct(v.goldPerDollar, g2gGpd),
    };
  });

  return rows.sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1;
    // Retired packs surface most-recently-retired first (ISO dates sort lexically); a shared
    // retirement date — and the whole active group — falls back to gold-per-RC desc.
    if (a.retired && b.retired && a.retiredOn !== b.retiredOn) {
      return (b.retiredOn ?? "").localeCompare(a.retiredOn ?? "");
    }
    return (b.goldPerRc ?? 0) - (a.goldPerRc ?? 0);
  });
}
