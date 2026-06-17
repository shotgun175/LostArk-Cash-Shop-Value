// Chest resolver + pack-value engine. Turns a Pack's chest contents into a single gold
// total and a per-slug line breakdown, using the price map produced by buildPriceMap
// (so EV slugs like the hell keys and ebony cubes are already priced). Validated to match
// TheJungleWalrus's live pack cards (see test/packValue.test.ts).

import type { Chest, Pack } from "./data/types";
import { RESOLVER } from "./data/resolver";
import { cashPerRc } from "./exchange";

// NA cost of one Royal Crystal and the DEFAULT cash-per-RC. Sourced from the single RC-cash table
// in exchange.ts (cashPerRc) so the NA rate isn't duplicated here; callers pass a region-aware value
// (EU RC is priced in EUR, €94.99 / 12000) so the "% vs G2G" and "g per $/€" figures compare within
// one currency per region.
export const USD_PER_RC = cashPerRc("nae");

interface ResolvedLine {
  slug: string;
  qty: number;
  gold: number;
  isBound?: boolean;
}

interface ChestResult {
  gold: number;
  lines: ResolvedLine[];
}

export interface PackLine {
  slug: string;
  qty: number;
  gold: number;
  isBound?: boolean;
  unresolved?: boolean;
}

export interface PackResult {
  slug: string;
  name: string;
  royalCrystalCost: number;
  retired: boolean;
  retiredOn?: string;
  limited: boolean;
  recurrence?: "monthly" | "weekly";
  total: number;
  goldPerRc: number | null;
  goldPerDollar: number | null;
  lines: PackLine[];
}

/**
 * Value ONE chest (its per-chest output(s)) against the price map.
 *
 * Every output is priced uniformly off the map: outputs with no price-map slug resolve to 0
 * (recorded as a line). The isBound flag is preserved on each line for UI display but does NOT
 * force gold to 0 — many "bound" battle-item consumables are AH-tradable and ARE in the price
 * map (TJW prices them); only items genuinely absent from the map (e.g. 30-day brews) show 0.
 * For "fixed" and "multi" chests the gold is the sum of all output lineGolds. For "selection"
 * chests exactly one output is taken: the user's pickSlug if it names a valid output, else the
 * defaultPickSlug output if set, else the output with the highest lineGold (ties -> first). The
 * "highest lineGold" rule is load-bearing for matching TJW, who values a selection chest at its
 * best tradable option; pickSlug lets the user override that to value their own choice instead.
 */
export function resolveChest(
  chest: Chest,
  prices: Record<string, number>,
  pickSlug?: string,
): ChestResult {
  const lines: ResolvedLine[] = chest.outputs.map((o) => {
    const gold = Math.round((prices[o.slug] ?? 0) * o.qtyPerChest);
    return { slug: o.slug, qty: o.qtyPerChest, gold, isBound: o.isBound };
  });

  if (chest.type === "selection") {
    let chosen: ResolvedLine | undefined =
      pickSlug !== undefined ? lines.find((l) => l.slug === pickSlug) : undefined;
    if (!chosen) {
      if (chest.defaultPickSlug !== undefined) {
        chosen = lines.find((l) => l.slug === chest.defaultPickSlug) ?? lines[0];
      } else {
        chosen = lines.reduce((best, l) => (l.gold > best.gold ? l : best), lines[0]);
      }
    }
    return { gold: Math.max(0, chosen.gold), lines: [chosen] };
  }

  // "fixed" and "multi": every output contributes.
  const gold = lines.reduce((sum, l) => sum + l.gold, 0);
  return { gold, lines };
}

/**
 * Value a whole Pack: resolve each content chest, scale by its quantity, and aggregate the
 * terminal lines per slug for display. Returns the gold total plus gold-per-RC and
 * gold-per-dollar (null when the pack has no RC cost).
 */
export function packValue(
  pack: Pack,
  prices: Record<string, number>,
  picks: Record<string, string> = {},
  cashPerRc: number = USD_PER_RC,
  useFrozen = false, // display layer only: retired packs show their frozen value-at-retirement total
): PackResult {
  let liveTotal = 0;
  // slug -> aggregated line. Insertion order preserved for stable display.
  const agg = new Map<string, PackLine>();

  const add = (
    slug: string,
    qty: number,
    gold: number,
    flags: { isBound?: boolean; unresolved?: boolean },
  ) => {
    const existing = agg.get(slug);
    if (existing) {
      existing.qty += qty;
      existing.gold += gold;
    } else {
      agg.set(slug, { slug, qty, gold, ...flags });
    }
  };

  for (const content of pack.contents) {
    const chest = RESOLVER[content.chest];
    if (!chest) {
      // Per Task 1 all chests resolve; this guard records an unresolved line at 0 gold
      // rather than throwing, so a future unmapped chest fails visibly instead of silently.
      add(content.chest, content.qty, 0, { unresolved: true });
      continue;
    }
    const result = resolveChest(chest, prices, picks[content.chest]);
    liveTotal += result.gold * content.qty;
    for (const line of result.lines) {
      add(line.slug, line.qty * content.qty, line.gold * content.qty, {
        isBound: line.isBound,
      });
    }
  }

  // Retired packs display their frozen value-at-retirement (live math still runs for the line
  // breakdown, and stays untouched when useFrozen is false — e.g. the golden-parity tests).
  const total = useFrozen && pack.frozenTotal != null ? pack.frozenTotal : liveTotal;
  const goldPerRc = pack.royalCrystalCost ? total / pack.royalCrystalCost : null;
  const goldPerDollar = pack.royalCrystalCost
    ? total / (pack.royalCrystalCost * cashPerRc)
    : null;

  return {
    slug: pack.slug,
    name: pack.name,
    royalCrystalCost: pack.royalCrystalCost,
    retired: pack.retired,
    retiredOn: pack.retiredOn,
    limited: pack.limited,
    recurrence: pack.recurrence,
    total,
    goldPerRc,
    goldPerDollar,
    lines: [...agg.values()],
  };
}
