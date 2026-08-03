// Expected-value (EV) engine for hell/netherworld keys and ebony cubes.
// Faithful reimplementation of TheJungleWalrus's verified math: per-floor best-of-3
// chest pick (with a small epic-rarity blend onto best-of-4), weighted by
// P(floor | rarity) and summed across floors, then renormalized. The ALGORITHM was
// independently verified to reproduce his live /math values exactly; since 2026-07-30
// the VALUES deliberately diverge from his because Juice is live-priced here (zeroing
// juice restores his numbers — see test/ev.test.ts).

import {
  HELL_TIERS,
  PROBABILITIES,
  HELL_KEY_MAP,
  COLUMN_VALUATION,
  SKIP_COLUMNS,
  EV_CONSTANTS,
  WEALTH_BASE_MULT,
} from "./data/hellRewards";
import { CUBE_REWARDS, CUBE_MAP } from "./data/cube";
import { RELIC_ENGRAVING_SLUGS } from "./data/constants";
import type { HellTier, ColumnVal } from "./data/types";

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

/** Per-unit gold value of a tradable column at the given prices (tier-scoped when given). */
export function columnPrice(
  column: string,
  prices: Record<string, number>,
  tier?: HellTier,
): number {
  const c = colVal(column, tier);
  if (!c) return 0;
  if (c.flat !== undefined) return c.flat;
  if (c.untradable) return 0;
  const slug = c.slug ?? c.slug1730;
  const fb = c.fallback ?? c.fallback1730 ?? 0;
  if (!slug) return 0;
  return prices[slug] ?? fb;
}

/**
 * Per-unit gold value of a Juice chest unit: 1 Lava's Breath + 3 Glacier's Breath (the 1:3
 * ratio holds on every floor of every tier; fallbacks match cubeEv's). Priced on ALL tiers
 * (user 2026-07-30) — this deliberately diverges from TJW, whose engine leaves Juice unvalued.
 */
export function juiceUnitPrice(prices: Record<string, number>): number {
  return (prices["lavas-breath"] ?? 400) + 3 * (prices["glaciers-breath"] ?? 200);
}

/** A column's valuation: the tier's override if it has one, else the global map. */
function colVal(column: string, tier?: HellTier): ColumnVal | undefined {
  return tier?.valuation?.[column] ?? COLUMN_VALUATION[column];
}

/**
 * The Stones pick-one: a stack of red (Destruction) stones OR 3x that many blue (Guardian)
 * stones, whichever is worth more. `red` says which side won (ties go to red), so the
 * breakdown can label the pick; `gold` is the raw max (callers guard non-finite).
 */
function stonesPick(
  qty: number,
  prices: Record<string, number>,
  tier?: HellTier,
): { gold: number; red: boolean } {
  const red = qty * columnPrice("Stones", prices, tier);
  const blue = qty * 3 * columnPrice("Base blue stones", prices, tier);
  const gold = Math.max(red, blue);
  return { gold, red: gold === red };
}

/** Gold value of one chest cell (a quantity, an astrogem "a|b|c" string, or Stones). */
export function chestVal(
  column: string,
  cellValue: number | string,
  prices: Record<string, number>,
  tier?: HellTier,
): number {
  const mp = colVal(column, tier)?.maxPair;
  if (mp && typeof cellValue === "string" && cellValue.includes("|")) {
    const [a, b] = cellValue.split("|").map(Number);
    const x = Math.max(a * mp[0], b * mp[1]);
    return Number.isFinite(x) ? x : 0;
  }
  if (typeof cellValue === "string" && cellValue.includes("|")) {
    const [a, b, c] = cellValue.split("|").map(Number);
    return a * astrogem.uncommon + b * astrogem.rare + c * astrogem.epic;
  }
  const qty = Number(cellValue);
  if (column === "Juice") {
    const x = qty * juiceUnitPrice(prices);
    return Number.isFinite(x) ? x : 0;
  }
  if (column === "Stones") {
    const x = stonesPick(qty, prices, tier).gold;
    return Number.isFinite(x) ? x : 0;
  }
  const x = qty * columnPrice(column, prices, tier);
  return Number.isFinite(x) ? x : 0;
}

/**
 * Display quantity and explanatory note for one chest cell. `note` is non-null only where the
 * cell's gold is not "qty x one item": the Stones pick side, the Juice pair, the karma side of
 * a pick-one cell, and the rarity split of an astrogem cell. `qty` counts the items actually
 * taken (the karma side of a pick-one, the sum of an astrogem split).
 */
function chestLabel(
  column: string,
  cellValue: number | string,
  prices: Record<string, number>,
  tier?: HellTier,
): { qty: number; note: string | null } {
  if (typeof cellValue === "string" && cellValue.includes("|")) {
    const parts = cellValue.split("|").map(Number);
    // Pick-one pair ("Karma/Quality"): the karma side is the first part and always wins,
    // since the quality side is valued 0 (see COLUMN_VALUATION).
    if (colVal(column, tier)?.maxPair) return { qty: parts[0], note: "Karma side" };
    const [a, b, c] = parts;
    return { qty: a + b + c, note: `${a} unc | ${b} rare | ${c} epic` };
  }
  const qty = Number(cellValue);
  if (column === "Juice") return { qty, note: `${qty} Lava's + ${qty * 3} Glacier's` };
  if (column === "Stones") {
    const side = stonesPick(qty, prices, tier).red ? "Destruction (Red)" : "Guardian (Blue)";
    return { qty, note: `Pick ${side}` };
  }
  return { qty, note: null };
}

/** Gold value of the four base-reward columns for one floor (tier-scoped when given). */
export function baseGold(
  floorRewards: Record<string, number | string>,
  prices: Record<string, number>,
  tier?: HellTier,
): number {
  let sum = 0;
  for (const col of BASE_COLUMNS) {
    const v = floorRewards[col];
    if (typeof v === "number") sum += v * columnPrice(col, prices, tier);
  }
  return sum;
}

export interface ChestCandidate {
  column: string; // reward column (the chest's name in the tables)
  qty: number; // items taken from the cell
  gold: number; // the cell's gold value, exactly as fed to G()
  note: string | null; // how the gold was reached, when it is not "qty x one item"
}

export interface FloorBreakdown {
  range: string;
  p: number; // P(floor | rarity)
  bestPick: number; // best-of-k chest pick value
  base: number; // base-reward gold
  baseWealth: number; // base gold at Wealth +1 (base x WEALTH_BASE_MULT); 0 on Netherworld tiers
  floorTotal: number; // bestPick + base (per-floor value before weighting)
  contribution: number; // floorTotal * p, before renormalization
  candidates: ChestCandidate[]; // the positive-gold chests, DESC by gold
}

export interface ColumnPrice {
  column: string;
  slug: string | null;
  perUnit: number;
  source: "live" | "fallback" | "flat" | "untradable" | "—";
}

export interface HellKeyBreakdownOpts {
  /** Weight the floors by this rarity column instead of the key's own rarity (what-if view). */
  rarity?: string;
}

export interface HellKeyBreakdown {
  slug: string;
  ev: number; // renormalized expected value (not rounded)
  sump: number; // total probability mass (renormalization divisor)
  rarityTier: string; // the key's own rarity
  effectiveRarity: string; // the rarity column actually weighted (opts.rarity when supported)
  rarityClamped: boolean; // true when opts.rarity was asked for but the tier has no such column
  tierLabel: string;
  floors: FloorBreakdown[];
}

/**
 * Full per-floor breakdown of a hell/netherworld key's EV (drives the "Hell Key math" view).
 * Each floor's best-of-3 (blended with best-of-4 at weight h) chest pick plus base rewards,
 * weighted by P(floor | rarity); the EV is the renormalized sum. `opts.rarity` re-weights the
 * floors for the rarity what-if; without opts every number matches the key's own rarity.
 */
export function hellKeyBreakdown(
  slug: string,
  prices: Record<string, number>,
  opts?: HellKeyBreakdownOpts,
): HellKeyBreakdown | null {
  const m = HELL_KEY_MAP[slug];
  if (!m) return null;
  const tier = HELL_TIERS[m.tierLabel];
  const probs = PROBABILITIES[m.probKey as keyof typeof PROBABILITIES];
  // A rarity is supported only if the tier's probability rows carry that column as an own numeric
  // field (Netherworld tables have Rare/Epic/Legendary only); anything else, including the row's
  // own "range" string and inherited keys like "toString", falls back to the key's own rarity.
  const requested = opts?.rarity;
  const supported =
    requested !== undefined &&
    probs.length > 0 &&
    Object.prototype.hasOwnProperty.call(probs[0], requested) &&
    typeof probs[0][requested] === "number";
  const effectiveRarity = supported ? requested! : m.rarityTier;
  const rarityClamped = requested !== undefined && !supported;
  const floors: FloorBreakdown[] = [];
  let g = 0;
  let sump = 0;
  for (let i = 0; i < probs.length; i++) {
    const floorRange = probs[i].range;
    const rewards = tier.floors[floorRange];
    const p = Number(probs[i][effectiveRarity]) || 0;
    sump += p;
    const candidates: ChestCandidate[] = [];
    for (const column of tier.columns) {
      if (SKIP_COLUMNS.has(column)) continue;
      if (!rewards[column]) continue;
      const v = chestVal(column, rewards[column], prices, tier);
      // Only chests with positive gold value count toward the best-of-k pick;
      // zero-value (untradable / unpriced) chests are not candidates. This is
      // load-bearing: including them dilutes G and underprices every floor.
      if (v > 0) candidates.push({ column, ...chestLabel(column, rewards[column], prices, tier), gold: v });
    }
    candidates.sort((x, y) => y.gold - x.gold);
    const golds = candidates.map((c) => c.gold);
    const bestPick = (1 - h) * G(golds, topK) + h * G(golds, topK + 1);
    const base = baseGold(rewards, prices, tier);
    const floorTotal = bestPick + base;
    floors.push({
      range: floorRange,
      p,
      bestPick,
      base,
      baseWealth: base * WEALTH_BASE_MULT,
      floorTotal,
      contribution: floorTotal * p,
      candidates,
    });
    g += floorTotal * p;
  }
  const ev = Math.abs(sump - 1) > 0.001 ? g / sump : g;
  return { slug, ev, sump, rarityTier: m.rarityTier, effectiveRarity, rarityClamped, tierLabel: m.tierLabel, floors };
}

/** The per-unit price (and its source) used for each priced reward column — the "prices used" table. */
export function hellKeyColumnPrices(slug: string, prices: Record<string, number>): ColumnPrice[] {
  const m = HELL_KEY_MAP[slug];
  if (!m) return [];
  const tier = HELL_TIERS[m.tierLabel];
  const out: ColumnPrice[] = [];
  for (const column of tier.columns) {
    if (SKIP_COLUMNS.has(column)) continue;
    if (column === "Juice") {
      const live = prices["lavas-breath"] !== undefined && prices["glaciers-breath"] !== undefined;
      out.push({
        column,
        slug: "lavas-breath + 3x glaciers-breath",
        perUnit: juiceUnitPrice(prices),
        source: live ? "live" : "fallback",
      });
      continue;
    }
    const c = colVal(column, tier);
    if (!c) continue; // e.g. astrogem columns are valued by constants, not a price
    if (c.flat !== undefined) {
      out.push({ column, slug: null, perUnit: c.flat, source: "flat" });
    } else if (c.maxPair) {
      // Pick-one pair: show the winning side's per-unit (quality side is valued 0).
      out.push({ column, slug: null, perUnit: Math.max(c.maxPair[0], c.maxPair[1]), source: "flat" });
    } else if (c.untradable) {
      out.push({ column, slug: null, perUnit: 0, source: "untradable" });
    } else {
      const s = c.slug ?? c.slug1730 ?? null;
      const fb = c.fallback ?? c.fallback1730;
      const source: ColumnPrice["source"] = s && prices[s] !== undefined ? "live" : fb !== undefined ? "fallback" : "—";
      out.push({ column, slug: s, perUnit: columnPrice(column, prices, tier), source });
    }
  }
  return out;
}

/**
 * EV of one of the 4 hell/netherworld keys, in gold. Not rounded; callers round for display.
 * Delegates to hellKeyBreakdown so the math has a single source of truth.
 */
export function hellKeyEv(slug: string, prices: Record<string, number>): number {
  return hellKeyBreakdown(slug, prices)?.ev ?? 0;
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
