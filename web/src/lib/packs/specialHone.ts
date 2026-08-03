// Special Hone (free tap) gold-per-tap engine: a faithful port of the honing
// expected-cost model in TheJungleWalrus's compiled hell-rewards-picker
// (docs/hell-rewards-picker-main/app.js: Um is the cost recursion, Cf/Km the
// per-row scan; he credits Maxroll's Special Hones upgrade calculator). The
// port was proven against his running app on 2026-08-02: served locally, his
// default view displays 992.7521097045062 g/tap Transferred, and this engine
// reproduces that number bit-for-bit at the same inputs (specialHone.test.ts
// documents the anchors). Do not "improve" the math; it is his.
//
// Exact reductions vs his compiled code, all verified equivalent:
// - His Um takes four additive (juice) slots; Cf zeroes slots 1..3 (cost 0,
//   chance 0, olimit 0), so only one slot ever enumerates. Ported as one slot.
// - His Um walks the whole attempt chain through a callback; Cf consumes only
//   the first callback's cost, which is the root expected cost. Ported as a
//   plain return. honingMode is pinned to 1 (optimal juice) and the luckMode
//   branches only affect the unused chain walk, so neither knob is ported.
// - His hardcoded silver and shard weights (Om=1, Am=0.25 gold per unit) are
//   taken from TapPriceInputs instead: our live valuation prices silver at 0
//   (omit the field) and shards at the destiny-shard market price; the parity
//   tests pass his weights to reproduce his numbers.
//
// All chances are TJW's 0.01% fixed point (1e4 = 100%); ARTISAN_THRESHOLD
// (21500) is artisan-energy pity in the same units, accrued per failed attempt
// by that attempt's success chance.

import {
  HONE_TABLES,
  ARTISAN_THRESHOLD,
  type HoneKind,
  type HoneSlot,
  type HoneLevelRow,
} from "./data/specialHoneTables";

export type LeapKind = HoneKind;

// Per-unit gold prices the engine values an attempt's materials at. Weapon rows
// consume redStones, armor rows blueStones; Transferred callers should pass
// T4.5-track prices and Circulated callers T4-track prices (the tables carry
// the quantities, the caller decides the market). Optional fields default to 0:
// juice at 0 disables the juice enumeration entirely (his own behavior for an
// unpriced additive), silver at 0 matches our valuation model.
export interface TapPriceInputs {
  fusions: number;
  redStones: number;
  blueStones: number;
  leapstones: number;
  shards: number;
  redJuice?: number;
  blueJuice?: number;
  silver?: number;
}

export interface TapValue {
  goldPerTap: number;
  level: number;
  slot: HoneSlot;
}

// One enumerated way to spend juice on an attempt: total added success chance
// (fixed point, capped by the row's additiveMax) and its gold cost.
interface JuiceOption {
  addedChance: number;
  cost: number;
}

// His Cf attempt cost: silver + shards + each mats column at its price.
function attemptMatCost(row: HoneLevelRow, inputs: TapPriceInputs): number {
  let cost = row.extra.silver * (inputs.silver ?? 0) + row.extra.shards * inputs.shards;
  cost += (row.mats.Fusions ?? 0) * inputs.fusions;
  cost += (row.mats.Stones ?? 0) * inputs.redStones;
  cost += (row.mats["Base blue stones"] ?? 0) * inputs.blueStones;
  cost += (row.mats.Leapstones ?? 0) * inputs.leapstones;
  return cost;
}

// His Um juice enumeration: 0..juiceLimit units, keeping the cheapest cost per
// distinct added chance, iterated in ascending added-chance order. His olimit
// quirk is preserved: a 0-gold juice price enumerates nothing (no-juice only).
function juiceOptions(row: HoneLevelRow, juicePrice: number): JuiceOption[] {
  const maxUnits = juicePrice ? row.juiceLimit : 0;
  const byChance = new Map<number, JuiceOption>();
  for (let units = 0; units <= maxUnits; units++) {
    const addedChance = Math.min(row.additiveMax, units * row.juiceChance);
    const cost = units * juicePrice;
    const prev = byChance.get(addedChance);
    if (!prev || cost < prev.cost) byChance.set(addedChance, { addedChance, cost });
  }
  return [...byChance.values()].sort((a, b) => a.addedChance - b.addedChance);
}

// His Um recursion d(fails, energy): expected gold to reach success from this
// state, choosing the juice option that minimizes it at every state. Artisan
// pity: once accumulated energy reaches the threshold the next attempt is a
// guaranteed success at bare attempt cost (no juice).
function expectedHoneCost(row: HoneLevelRow, attemptCost: number, options: JuiceOption[]): number {
  const maxFails = row.failMax ? Math.ceil(row.failMax / row.failBonus) : 0;
  const failureMultiply = 1; // his Cf config; energy accrues at 1x the attempt's chance

  interface Node {
    cost: number;
    chance: number;
  }
  const pity: Node = { cost: attemptCost, chance: 1e4 };
  const memo = new Map<number, Node>();

  function solve(fails: number, energy: number): Node {
    if (energy >= ARTISAN_THRESHOLD) return pity;
    if (fails > maxFails) fails = maxFails; // fail bonus is capped; higher counts are identical states
    const key = fails * ARTISAN_THRESHOLD + energy;
    const hit = memo.get(key);
    if (hit) return hit;
    let best: Node | undefined;
    for (const opt of options) {
      const chance = row.success + Math.min(row.failBonus * fails, row.failMax) + opt.addedChance;
      let cost = attemptCost + opt.cost;
      if (chance < 1e4) {
        const next = solve(fails + 1, energy + chance * failureMultiply);
        cost += (next.cost * (1e4 - chance)) / 1e4;
      }
      if (!best || cost < best.cost) best = { cost, chance };
    }
    memo.set(key, best!);
    return best!;
  }

  return solve(0, 0).cost;
}

// His Cf/Km scan: value every candidate row (both slots unless a fixed target
// level filters) and keep the best gold-per-tap. His final expression verbatim:
// C = expectedCost * baseSuccess / 1e4 / tapsPerAttempt.
export function tapValue(inputs: TapPriceInputs, kind: LeapKind, target: number | "auto"): TapValue {
  let best: TapValue | null = null;
  for (const slot of ["weapon", "armor"] as const) {
    const table = HONE_TABLES[kind][slot];
    const juicePrice = (table.additiveKey === "Red juice (T4.5)" ? inputs.redJuice : inputs.blueJuice) ?? 0;
    for (const row of table.levels) {
      if (target !== "auto" && row.level !== target) continue;
      const cost = expectedHoneCost(row, attemptMatCost(row, inputs), juiceOptions(row, juicePrice));
      const goldPerTap = (cost * row.success) / 1e4 / row.tapsPerAttempt;
      if (!best || goldPerTap > best.goldPerTap) best = { goldPerTap, level: row.level, slot };
    }
  }
  // An unknown target matches no row; mirror his 0 rather than throwing.
  return best ?? { goldPerTap: 0, level: typeof target === "number" ? target : 0, slot: "weapon" };
}
