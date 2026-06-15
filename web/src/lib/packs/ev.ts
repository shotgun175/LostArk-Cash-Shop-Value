// Expected-value (EV) engine for hell/netherworld keys and ebony cubes.
// Faithful reimplementation of TheJungleWalrus's verified math: per-floor best-of-3
// chest pick (with a small epic-rarity blend onto best-of-4), weighted by
// P(floor | rarity) and summed across floors, then renormalized. Independently
// verified to reproduce his live /math values exactly (see test/ev.test.ts).

import {
  HELL_TIERS,
  PROBABILITIES,
  HELL_KEY_MAP,
  COLUMN_VALUATION,
  SKIP_COLUMNS,
  EV_CONSTANTS,
} from "./data/hellRewards";
import { CUBE_REWARDS, CUBE_MAP } from "./data/cube";
import { RELIC_ENGRAVING_SLUGS } from "./data/constants";

const { h, topK, astrogem } = EV_CONSTANTS;

// Base-reward columns valued separately from the best-of-k chest pick.
const BASE_COLUMNS = [
  "Base red stones",
  "Base blue stones",
  "Base leapstones",
  "Base shards",
];

/** Integer binomial coefficient C(n, k). */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/**
 * Expected value of the BEST chest when opening k of arr.length chests.
 * arr must be DESC-sorted. Closed form: sum over the position o (0-indexed) of the
 * max, weighted by the number of size-k subsets whose max sits at o.
 */
export function G(arr: number[], k: number): number {
  if (arr.length === 0 || k <= 0) return 0;
  if (k >= arr.length) return arr[0];
  const r = binomial(arr.length, k);
  let sum = 0;
  for (let o = 0; o <= arr.length - k; o++) {
    sum += (arr[o] * binomial(arr.length - o - 1, k - 1)) / r;
  }
  return sum;
}

/** Per-unit gold value of a tradable column at the given prices / tier. */
export function columnPrice(
  column: string,
  prices: Record<string, number>,
  is1730: boolean,
): number {
  const c = COLUMN_VALUATION[column];
  if (!c) return 0;
  if (c.flat !== undefined) return c.flat;
  if (c.untradable) return 0;
  const slug = c.slug ?? (is1730 ? c.slug1730 : c.slugNon1730);
  const fb = c.fallback ?? (is1730 ? c.fallback1730 : c.fallbackNon1730) ?? 0;
  if (!slug) return 0;
  return prices[slug] ?? fb;
}

/** Gold value of one chest cell (a quantity, an astrogem "a|b|c" string, or Stones). */
export function chestVal(
  column: string,
  cellValue: number | string,
  prices: Record<string, number>,
  is1730: boolean,
): number {
  if (typeof cellValue === "string" && cellValue.includes("|")) {
    const [a, b, c] = cellValue.split("|").map(Number);
    return a * astrogem.uncommon + b * astrogem.rare + c * astrogem.epic;
  }
  const qty = Number(cellValue);
  if (column === "Stones") {
    const x = Math.max(
      qty * columnPrice("Stones", prices, is1730),
      qty * 3 * columnPrice("Base blue stones", prices, is1730),
    );
    return Number.isFinite(x) ? x : 0;
  }
  const x = qty * columnPrice(column, prices, is1730);
  return Number.isFinite(x) ? x : 0;
}

/** Gold value of the four base-reward columns for one floor. */
export function baseGold(
  floorRewards: Record<string, number | string>,
  prices: Record<string, number>,
  is1730: boolean,
): number {
  let sum = 0;
  for (const col of BASE_COLUMNS) {
    const v = floorRewards[col];
    if (typeof v === "number") sum += v * columnPrice(col, prices, is1730);
  }
  return sum;
}

/**
 * EV of one of the 4 hell/netherworld keys. Sums per-floor (best-of-3 blended with
 * best-of-4 at weight h) chest pick plus base rewards, weighted by P(floor | rarity),
 * then renormalizes by the probability mass. Not rounded; callers round for display.
 */
export function hellKeyEv(
  slug: string,
  prices: Record<string, number>,
): number {
  const m = HELL_KEY_MAP[slug];
  if (!m) return 0;
  const tier = HELL_TIERS[m.tierLabel];
  const is1730 =
    m.tierLabel.startsWith("1730 ") && !m.tierLabel.includes("Old");
  const probs = PROBABILITIES[m.probKey as keyof typeof PROBABILITIES];
  let g = 0;
  let sump = 0;
  for (let i = 0; i < probs.length; i++) {
    const floorRange = probs[i].range;
    const rewards = tier.floors[floorRange];
    const p = Number(probs[i][m.rarityTier]) || 0;
    sump += p;
    const candidates: number[] = [];
    for (const column of tier.columns) {
      if (SKIP_COLUMNS.has(column)) continue;
      if (!rewards[column]) continue;
      const v = chestVal(column, rewards[column], prices, is1730);
      // Only chests with positive gold value count toward the best-of-k pick;
      // zero-value (untradable / unpriced) chests are not candidates. This is
      // load-bearing: including them dilutes G and underprices every floor.
      if (v > 0) candidates.push(v);
    }
    candidates.sort((x, y) => y - x);
    const bestPick =
      (1 - h) * G(candidates, topK) + h * G(candidates, topK + 1);
    g += (bestPick + baseGold(rewards, prices, is1730)) * p;
  }
  if (Math.abs(sump - 1) > 0.001) g /= sump;
  return g;
}

/** EV of an ebony-cube unlock, in gold. Rounded. */
export function cubeEv(
  slug: string,
  prices: Record<string, number>,
): number {
  const row = CUBE_REWARDS[CUBE_MAP[slug]];
  if (!row) return 0;
  return Math.round(
    row.lv2Gems * (prices["lv-2-gem"] ?? 500) +
      row.leapstones * (prices["great-destiny-leapstone"] ?? 107) +
      row.blueJuice * (prices["glaciers-breath"] ?? 200) +
      row.redJuice * (prices["lavas-breath"] ?? 400),
  );
}

/** Value of the relic combat engraving recipe: the priciest of the 23 engravings. */
export function relicRecipe(prices: Record<string, number>): number {
  return Math.max(0, ...RELIC_ENGRAVING_SLUGS.map((s) => prices[s] ?? 0));
}
