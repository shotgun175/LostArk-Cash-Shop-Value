import { PACKS } from "./data/packs";
import { packValue, type PackResult } from "./packValue";
import { buildPriceMap } from "./priceMap";
import { f4Baseline, vsExchangePct, g2gGoldPerDollar, vsG2GPct, F4_DIVISOR } from "./exchange";
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
  customPicks?: Record<string, string[]>; // choose-N-of-M packs: pack slug -> checked chest names
  cashPerRc?: number; // region cost of one RC ($100/12k NA, €94.99/12k EU); defaults to NA in packValue
  // The Hell Key tab's per-region tap-price override, so a manual tap price moves every pack
  // that contains a hell/netherworld key, not just that tab. Caller passes it in (keeps this pure).
  tapOverrides?: TapOverrides;
}

/**
 * Value every pack against the region price map and layer on the two comparison columns.
 * buildPriceMap is called once (not per pack) — it computes the hell-key/cube EVs. Active
 * packs sort before retired; within each group, highest gold-per-RC first (choose-N packs
 * rank at their default-pick value so checkbox toggling never reshuffles the grid).
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

  // BC-priced packs compare their gold/BC to the same F4 input at the BC denominator.
  const bcBaseline = opts.f4Input / BC_PER_BUNDLE;

  const rows: PackRow[] = PACKS.map((p) => {
    const v = packValue(p, prices, opts.picks, opts.cashPerRc, true, opts.customPicks);
    return {
      ...v,
      vsExchange:
        v.goldPerRc != null
          ? vsExchangePct(v.goldPerRc, baseline)
          : v.goldPerBc != null
            ? vsExchangePct(v.goldPerBc, bcBaseline)
            : null,
      vsG2G: v.goldPerDollar == null ? null : vsG2GPct(v.goldPerDollar, g2gGpd),
    };
  });

  // One F4 listing trades the same gold for 238 RC or 95 BC, so a BC pack's gold/BC converts
  // to a gold-per-RC-equivalent at x(95/238) — this keeps one sort scale across both currencies.
  const asRank = (r: Pick<PackResult, "goldPerRc" | "goldPerBc">) =>
    r.goldPerRc ?? (r.goldPerBc != null ? (r.goldPerBc * BC_PER_BUNDLE) / F4_DIVISOR : 0);

  // Choose-N packs rank at their DEFAULT picks (the highest-gold N), not the user's current
  // checkbox picks: the card still displays the picked value, but its grid position must not
  // reshuffle under the cursor while the user is toggling options.
  const pinnedRank = new Map<string, number>();
  for (const p of PACKS) {
    if (p.customSelection) {
      pinnedRank.set(p.slug, asRank(packValue(p, prices, opts.picks, opts.cashPerRc, true)));
    }
  }
  const sortKey = (r: PackRow) => pinnedRank.get(r.slug) ?? asRank(r);

  return rows.sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1;
    // Retired packs surface most-recently-retired first (ISO dates sort lexically); a shared
    // retirement date — and the whole active group — falls back to gold-per-RC (equivalent) desc.
    if (a.retired && b.retired && a.retiredOn !== b.retiredOn) {
      return (b.retiredOn ?? "").localeCompare(a.retiredOn ?? "");
    }
    return sortKey(b) - sortKey(a);
  });
}
