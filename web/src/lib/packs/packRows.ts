import { PACKS } from "./data/packs";
import { packValue, type PackResult } from "./packValue";
import { buildPriceMap } from "./priceMap";
import { f4Baseline, vsExchangePct, g2gGoldPerDollar, vsG2GPct } from "./exchange";

export interface PackRow extends PackResult {
  vsExchange: number | null;
  vsG2G: number | null;
}

export interface PackRowOpts {
  f4Input: number;
  g2gInput: number;
  picks?: Record<string, string>;
  cashPerRc?: number; // region cost of one RC ($100/12k NA, €94.99/12k EU); defaults to NA in packValue
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
  const prices = buildPriceMap(regionPrices);
  const baseline = f4Baseline(opts.f4Input);
  const g2gGpd = g2gGoldPerDollar(opts.g2gInput);

  const rows: PackRow[] = PACKS.map((p) => {
    const v = packValue(p, prices, opts.picks, opts.cashPerRc);
    return {
      ...v,
      vsExchange: v.goldPerRc == null ? null : vsExchangePct(v.goldPerRc, baseline),
      vsG2G: v.goldPerDollar == null ? null : vsG2GPct(v.goldPerDollar, g2gGpd),
    };
  });

  return rows.sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1;
    return (b.goldPerRc ?? 0) - (a.goldPerRc ?? 0);
  });
}
