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

export interface ChestOptionValue {
  slug: string;
  qtyPerChest: number;
  perUnit: number;
  perChestGold: number; // Math.round(perUnit * qtyPerChest): THE rounding point for all consumers
  lineGold: number; // perChestGold * qty (the chest count the caller is valuing)
  isBound?: boolean;
  chosen: boolean; // counts toward the chest gold (selection: exactly one; fixed/multi: all)
}

export interface ChestValue {
  options: ChestOptionValue[];
  chosenIndex: number | null; // selection chests: index of the counted option; null otherwise
  gold: number; // chest contribution scaled by qty (selection value clamped at 0)
}

/**
 * The ONE shared pick + rounding rule for valuing a chest's options, consumed by resolveChest
 * (pack cards), packDetail (drill-down) and arkPassRows (Ark Pass), so the three surfaces can
 * never silently disagree.
 *
 * Every output is priced uniformly off the map: outputs with no price-map slug resolve to 0
 * (recorded as an option). The isBound flag is preserved for UI display but does NOT force gold
 * to 0; many "bound" battle-item consumables are AH-tradable and ARE in the price map (TJW
 * prices them). Only items genuinely absent from the map (e.g. 30-day brews) show 0. Gold is
 * rounded per chest, then scaled by qty. For "fixed" and "multi" chests every option counts.
 * For "selection" chests exactly one output is taken: the user's pickSlug if it names a valid
 * output, else the defaultPickSlug output if set, else the output with the highest per-chest
 * gold (ties -> first); the chest gold is clamped at 0. The "highest gold" rule is load-bearing
 * for matching TJW, who values a selection chest at its best tradable option; pickSlug lets the
 * user override that to value their own choice instead.
 */
export function valueChestOptions(
  chest: Chest,
  prices: Record<string, number>,
  qty: number,
  pickSlug?: string,
): ChestValue {
  const options: ChestOptionValue[] = chest.outputs.map((o) => {
    const perUnit = prices[o.slug] ?? 0;
    const perChestGold = Math.round(perUnit * o.qtyPerChest);
    return {
      slug: o.slug,
      qtyPerChest: o.qtyPerChest,
      perUnit,
      perChestGold,
      lineGold: perChestGold * qty,
      isBound: o.isBound,
      chosen: false,
    };
  });

  if (chest.type === "selection") {
    let pick = pickSlug !== undefined ? options.findIndex((o) => o.slug === pickSlug) : -1;
    if (pick < 0) {
      if (chest.defaultPickSlug !== undefined) {
        const i = options.findIndex((o) => o.slug === chest.defaultPickSlug);
        pick = i >= 0 ? i : 0;
      } else {
        pick = options.reduce((best, o, i) => (o.perChestGold > options[best].perChestGold ? i : best), 0);
      }
    }
    options[pick].chosen = true;
    return { options, chosenIndex: pick, gold: Math.max(0, options[pick].lineGold) };
  }

  // "fixed" and "multi": every output contributes.
  for (const o of options) o.chosen = true;
  return { options, chosenIndex: null, gold: options.reduce((sum, o) => sum + o.lineGold, 0) };
}

/**
 * Value ONE chest (its per-chest output(s)) against the price map. Thin wrapper over
 * valueChestOptions (qty 1): selection chests return only the chosen line, fixed/multi all lines.
 */
export function resolveChest(
  chest: Chest,
  prices: Record<string, number>,
  pickSlug?: string,
): ChestResult {
  const { options, chosenIndex, gold } = valueChestOptions(chest, prices, 1, pickSlug);
  const toLine = (o: ChestOptionValue): ResolvedLine => ({
    slug: o.slug,
    qty: o.qtyPerChest,
    gold: o.lineGold, // qty 1 -> lineGold === perChestGold
    isBound: o.isBound,
  });
  return chosenIndex !== null
    ? { gold, lines: [toLine(options[chosenIndex])] }
    : { gold, lines: options.map(toLine) };
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
