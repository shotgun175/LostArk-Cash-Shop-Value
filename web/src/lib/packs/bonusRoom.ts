// Bonus Room valuation (pure: no stores, so the caller passes the layered price map, the F4 and
// G2G inputs and the region's cash per RC). Each product is valued by the shared pack engine
// (packValue) and compared the same way as a Packs card (withComparisons); each group adds its
// free bonus pack and compares the whole purchase, mixing RC and BC through one F4 listing
// (238 RC = 95 BC). Ported from TJW's 2026-10-21 Bonus Room logic with two of our rules kept:
//   - Gold is rounded per chest, then scaled by the chest count (valueChestOptions), where TJW
//     rounds per line. So the Astrogem Packs' Crystal x600 is 600 x round(30,000 / 95) = 189,600
//     here vs TJW's round(600 x 30,000 / 95) = 189,474 at the 30,000 seed.
//   - A product or bonus with no priced line has no value (TJW's "no price"): its chips are null
//     instead of reading 0 gold and -100%. "Priced" means the slug is in the layered map, so an
//     explicit 0 (a user override, or the soaring kit with Include pheons off) counts as priced.

import type { BonusRoom, BonusProduct, BonusReward } from "./data/bonusRoom";
import type { Pack } from "./data/types";
import { packValue, type PackLine } from "./packValue";
import { withComparisons, type PackRow } from "./packRows";
import { F4_DIVISOR, f4Baseline, vsExchangePct, g2gGoldPerDollar, vsG2GPct } from "./exchange";
import { BC_PER_BUNDLE } from "./data/marisShop";

export interface BonusRowOpts {
  f4Input: number; // gold per F4 listing (238 RC / 95 BC); 0 or not finite means no exchange rate
  g2gInput: number; // G2G price per 1,000 gold; 0 means none
  cashPerRc: number; // the region's real-money cost of one RC
  picks?: Record<string, string>; // selection-chest picks (chest name -> slug)
}

/** A product card row: a Packs-style row plus the Bonus Room's priced/unpriced flags and gold cost. */
export interface BonusProductRow extends PackRow {
  icon: string;
  calculator?: "gem-fuse" | "life-energy";
  valueSet: boolean; // at least one content line is priced; false means "no price" (total 0, null chips)
  hasUnpriced: boolean; // some content line is unpriced or unresolved
  costGold: number | null; // the product's price in gold at the F4 input; null with no exchange rate
}

/** The group's free bonus pack (no cost, so no rates or chips of its own). */
export interface BonusRewardRow {
  slug: string;
  name: string;
  icon: string;
  total: number; // gold of the priced lines (0 when nothing is priced)
  valueSet: boolean;
  hasUnpriced: boolean;
  lines: PackLine[];
}

/** One group: its product rows, its bonus row and the whole-group comparison. */
export interface BonusGroupRow {
  slug: string;
  name: string;
  products: BonusProductRow[];
  bonus: BonusRewardRow;
  total: number | null; // priced products + priced bonus; null when nothing in the group is priced
  rcCost: number; // sum of the RC-priced products
  bcCost: number; // sum of the BC-priced products
  rcEquiv: number; // rcCost + bcCost x 238 / 95 (one F4 listing buys 238 RC or 95 BC)
  costGold: number | null; // rcEquiv in gold at the F4 input; null with no exchange rate
  goldPerDollar: number | null; // total per real-money unit (shop-money cost of rcEquiv)
  vsExchange: number | null;
  vsG2G: number | null;
  hasUnpriced: boolean; // any product or the bonus has an unpriced line
}

/** True while the room is open: from startsAt (when set) up to, but not including, endsAt. */
export function bonusRoomActive(room: BonusRoom | null, now: number): boolean {
  if (!room) return false;
  return (room.startsAt ? now >= Date.parse(room.startsAt) : true) && now < Date.parse(room.endsAt);
}

/** Countdown text for `ms` left (TJW's format): "3d 4h", "5h 12m", "42m", or "ended" at 0 or below. */
export function timeLeft(ms: number): string {
  if (!(ms > 0)) return "ended";
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

/** The priced/unpriced flags for a valued product's lines (TJW's rule: priced = slug in the map). */
function pricing(lines: PackLine[], prices: Record<string, number>): { valueSet: boolean; hasUnpriced: boolean } {
  const priced = (l: PackLine): boolean => !l.unresolved && l.slug in prices;
  return { valueSet: lines.some(priced), hasUnpriced: lines.some((l) => !priced(l)) };
}

function productRow(p: BonusProduct, prices: Record<string, number>, opts: BonusRowOpts): BonusProductRow {
  const v = packValue(p, prices, opts.picks, opts.cashPerRc);
  const { valueSet, hasUnpriced } = pricing(v.lines, prices);
  const row: PackRow = valueSet
    ? withComparisons(v, opts)
    : { ...v, total: 0, goldPerRc: null, goldPerBc: null, goldPerDollar: null, vsExchange: null, vsG2G: null };
  const price = p.royalCrystalCost ?? p.blueCrystalCost ?? 0;
  const per = p.royalCrystalCost != null ? F4_DIVISOR : BC_PER_BUNDLE;
  return {
    ...row,
    icon: p.icon,
    calculator: p.calculator,
    valueSet,
    hasUnpriced,
    costGold: opts.f4Input > 0 ? (price * opts.f4Input) / per : null,
  };
}

function rewardRow(b: BonusReward, prices: Record<string, number>, opts: BonusRowOpts): BonusRewardRow {
  // A Pack with neither cost field: packValue leaves every rate null, only the gold matters.
  const pack: Pack = { slug: b.slug, name: b.name, limited: false, retired: false, contents: b.contents };
  const v = packValue(pack, prices, opts.picks, opts.cashPerRc);
  const { valueSet, hasUnpriced } = pricing(v.lines, prices);
  return {
    slug: b.slug,
    name: b.name,
    icon: b.icon,
    total: valueSet ? v.total : 0,
    valueSet,
    hasUnpriced,
    lines: v.lines,
  };
}

/**
 * Value every group of the room against the fully layered price map (layeredPrices(), the same
 * map the Packs tab reads, so user price edits apply). Groups keep the data's order.
 */
export function bonusRoomRows(
  room: BonusRoom,
  prices: Record<string, number>,
  opts: BonusRowOpts,
): BonusGroupRow[] {
  const exchangeSet = opts.f4Input > 0;
  const g2gGpd = g2gGoldPerDollar(opts.g2gInput);
  return room.groups.map((g) => {
    const products = g.products.map((p) => productRow(p, prices, opts));
    const bonus = rewardRow(g.bonus, prices, opts);
    const anyValue = products.some((p) => p.valueSet) || bonus.valueSet;
    const total = anyValue
      ? products.reduce((s, p) => s + (p.valueSet ? p.total : 0), 0) + (bonus.valueSet ? bonus.total : 0)
      : null;
    const rcCost = g.products.reduce((s, p) => s + (p.royalCrystalCost ?? 0), 0);
    const bcCost = g.products.reduce((s, p) => s + (p.blueCrystalCost ?? 0), 0);
    const rcEquiv = rcCost + (bcCost * F4_DIVISOR) / BC_PER_BUNDLE;
    const costGold = exchangeSet ? (rcEquiv * opts.f4Input) / F4_DIVISOR : null;
    const vsExchange =
      total != null && exchangeSet && rcEquiv > 0 ? vsExchangePct(total / rcEquiv, f4Baseline(opts.f4Input)) : null;
    const goldPerDollar = total != null && rcEquiv > 0 ? total / (rcEquiv * opts.cashPerRc) : null;
    const vsG2G = goldPerDollar != null ? vsG2GPct(goldPerDollar, g2gGpd) : null;
    return {
      slug: g.slug,
      name: g.name,
      products,
      bonus,
      total,
      rcCost,
      bcCost,
      rcEquiv,
      costGold,
      goldPerDollar,
      vsExchange,
      vsG2G,
      hasUnpriced: products.some((p) => p.hasUnpriced) || bonus.hasUnpriced,
    };
  });
}
