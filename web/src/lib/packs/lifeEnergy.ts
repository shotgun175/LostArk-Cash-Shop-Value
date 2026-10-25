// The default gold value of a Basic Life Energy Potion: 3,000 Life Energy x the gold one LE
// earns logging (DECISIONS 2026-10-25, "Life Energy Potion default").
//
// A bit-exact port of the passive gold per LE (column J, cells J4:J10) of the Tool Efficiency
// tab of "Lulu's Logging Tool Efficiency Calculator" by Lulu (IGN Espeon, NAE Balthorr); the
// user's copy is "Valluru's Logging Guide". Assumptions, fixed by the user: Lv. 70 Logging and
// Relic charm passives only, NO tool bonus lines, duo logging, 10% Epic trees. Cell names are
// kept in the comments so the port can be audited against the xlsx.
//
// The best-in-slot figure (bestToolGoldPerLe) ports the same tab's all-in-one tool check (rows
// 15 to 22 and cell Q22). It is shown beside the default for reference only; the default stays
// at no tool bonuses.
//
// Prices are read per UNIT from the slug -> gold map (the feed quotes timber per stack of 100 and
// the Worker divides by the bundle size). The sheet's inputs I4:I7 are per 100, so I = 100 x p.

export const LE_PER_BASIC_POTION = 3000; // the potion's in-game tooltip; the sheet's C22 check

/** The four logging mats, in the sheet's row order (rows 4 to 7). */
export const TIMBER_SLUGS = ["timber", "tender-timber", "sturdy-timber", "abidos-timber"] as const;

/** A Master Logging Tool bonus line, in the sheet's row order (rows 15 to 22). */
export const TOOL_LINES = [
  "Common", "Uncommon", "Rare", "Kick Reward", "Kick Attempt", "Durability", "Treasure Attempt", "All Materials Drop",
] as const;
export type ToolLine = (typeof TOOL_LINES)[number];

// Each line's max roll: the top of the range in its row label (H15:H22, e.g. "Durability
// (20%-40%)"), which column L applies.
const MAX_ROLL: Readonly<Record<ToolLine, number>> = {
  Common: 0.5, Uncommon: 0.5, Rare: 0.5, "Kick Reward": 0.5, "Kick Attempt": 0.5,
  Durability: 0.4, "Treasure Attempt": 1, "All Materials Drop": 0.167,
};
const ALL_IN_ONE_LINES = 5; // an all-in-one tool carries five lines (Q22 takes ranks 1 to 5)

const REWARD_BONUS = 0.504; // D10:D12: Lv. 70 Logging + Relic charm, Common/Uncommon/Rare rewards
const DURABILITY_BONUS = 0.2031; // D15: Lv. 70 Logging + Relic charm durability reduction
const LE_PER_ACTION = 60; // LE spent per tree-cut action
const EPIC_FACTOR = 1.1; // 10% of trees are Epic and yield 2x
const KICK = (1 - 0.955 ** 6) / 6; // Kick Tree effective acquisition per action (duo logging)
const POUCH_CHANCE = 0.01; // Treasure Pouch chance per action
const KICK_YIELD = 36; // AVERAGE(24, 48)

// Per timber line (rows 4 to 7): drop share w, average tree-cut yield c (AVERAGE(4,8) or
// AVERAGE(2,4)) and average pouch yield q (AVERAGE(72,144) or AVERAGE(36,72)).
const LINES: readonly { w: number; c: number; q: number }[] = [
  { w: 1, c: 6, q: 108 }, // timber
  { w: 0.5, c: 6, q: 108 }, // tender-timber
  { w: 0.2, c: 3, q: 54 }, // sturdy-timber
  { w: 0.2, c: 3, q: 54 }, // abidos-timber
];

/** A finite, positive price, else null. */
function positive(v: number | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/** Kick Tree effective acquisition per action with a Kick Attempt bonus (the sheet's tool form). */
function kickRate(attemptBonus: number): number {
  return (1 - (1 - 0.045 * (1 + attemptBonus)) ** 6) / 6;
}

/** The sheet's per-LE building blocks at the current timber prices. */
interface Parts {
  cut: number[]; // O4:O7, tree-cut gold per LE before any reward bonus
  kick: number; // R10, Kick Tree gold per LE
  pouch: number; // T10, Treasure Pouch gold per LE (timber T4:T7 plus Tool Crafting Parts T8)
  durabilityCost: number; // I9, gold per max-durability point (negative)
}

/** The building blocks, or null unless all four timber prices are finite and positive. */
function parts(m: Record<string, number>): Parts | null {
  const p = TIMBER_SLUGS.map((s) => positive(m[s]));
  if (p.some((v) => v === null)) return null;
  const unit = p as number[];

  const cut = LINES.map(({ w, c }, i) => (c / LE_PER_ACTION) * w * EPIC_FACTOR * unit[i]); // O4:O7
  let kick = 0;
  let pouch = 0;
  for (let i = 0; i < LINES.length; i++) {
    const { w, q } = LINES[i];
    kick += ((KICK_YIELD * w * EPIC_FACTOR) / (LE_PER_ACTION / KICK)) * unit[i]; // R4:R7
    pouch += ((q * w) / (LE_PER_ACTION / POUCH_CHANCE)) * unit[i]; // T4:T7
  }

  // Per-100 prices, as the sheet's input cells hold them.
  const I4 = 100 * unit[0];
  const I5 = 100 * unit[1];
  const I6 = 100 * unit[2];
  // I8: Tool Crafting Part value.
  const part = (I6 * 1.2 / 100 * 22 + I6 / 100 * 22 + I5 * 1.2 / 100 * 88 + I5 / 100 * 88 + 18) / (30 * 1.05);
  pouch += ((1 + 2 * 0.2 + 30 * POUCH_CHANCE) / (LE_PER_ACTION / POUCH_CHANCE)) * part; // T8
  // I9: max-durability cost, the cheaper of crafting and BC restoration (negative = a cost).
  const craft = (-5 * (40 * part + I6 / 100 * 26 + I5 * 1.2 / 100 * 88 + I4 * 1.2 / 100 * 128 + 37)) / (80 * 1.05);
  const goldPerBc = positive(m["blue-crystal"]);
  const durabilityCost = goldPerBc !== null ? Math.max((-goldPerBc * 10) / 4, craft) : craft;

  return { cut, kick, pouch, durabilityCost };
}

/**
 * Gold per LE for a tool with the given line rolls; no rolls is the passive J10. The terms
 * follow the sheet's tool formulas (L15:L22, Q22): reward lines add to the cut multiplier, Kick
 * Attempt scales the acquisition rate, Kick Reward and Treasure Attempt scale their yields, and
 * Durability lowers the max-durability loss (J9).
 */
function goldPerLe(x: Parts, roll: Partial<Record<ToolLine, number>>): number {
  const r = (line: ToolLine): number => roll[line] ?? 0;
  const all = r("All Materials Drop");
  const cut =
    x.cut[0] * (1 + REWARD_BONUS + all + r("Common")) +
    x.cut[1] * (1 + REWARD_BONUS + all + r("Uncommon")) +
    x.cut[2] * (1 + REWARD_BONUS + all + r("Rare")) +
    x.cut[3] * (1 + REWARD_BONUS + all + r("Rare"));
  const attempt = r("Kick Attempt");
  const kick = x.kick * (attempt > 0 ? kickRate(attempt) / KICK : 1) * (1 + r("Kick Reward"));
  const pouch = x.pouch * (1 + r("Treasure Attempt"));
  const durability = ((0.025 * (1 - DURABILITY_BONUS - r("Durability"))) / LE_PER_ACTION) * x.durabilityCost; // J9
  return cut + kick + pouch + durability;
}

/**
 * Passive gold per Life Energy from logging (sheet J10), or null unless all four timber prices
 * are finite and positive. `m["blue-crystal"]` (gold per BC, present only when the F4 input is
 * set) prices the durability restoration route; without it the crafting route is used.
 */
export function loggingGoldPerLe(m: Record<string, number>): number | null {
  const x = parts(m);
  return x === null ? null : goldPerLe(x, {});
}

/** Default gold per Basic Life Energy Potion (3,000 LE x gold per LE), or null without timber prices. */
export function potionDefault(m: Record<string, number>): number | null {
  const g = loggingGoldPerLe(m);
  return g === null ? null : LE_PER_BASIC_POTION * g;
}

/** A best-in-slot all-in-one tool: its gold per LE and its five lines, best first. */
export interface BestTool {
  goldPerLe: number;
  lines: ToolLine[];
}

/**
 * Gold per LE with a best-in-slot all-in-one Master Logging Tool (sheet J10 x (1 + Q22)), or
 * null without all four timber prices. Each line is scored alone at its max roll (L15:L22),
 * ranked with ties going to the earlier row (M15:M22), and the five best are combined at max
 * rolls. Which lines win depends on the timber prices, as in the sheet.
 */
export function bestToolGoldPerLe(m: Record<string, number>): BestTool | null {
  const x = parts(m);
  if (x === null) return null;
  const ranked = TOOL_LINES.map((line, i) => {
    const roll: Partial<Record<ToolLine, number>> = {};
    roll[line] = MAX_ROLL[line];
    return { line, i, gold: goldPerLe(x, roll) };
  }).sort((a, b) => b.gold - a.gold || a.i - b.i);
  const lines = ranked.slice(0, ALL_IN_ONE_LINES).map((e) => e.line);
  const roll: Partial<Record<ToolLine, number>> = {};
  for (const line of lines) roll[line] = MAX_ROLL[line];
  return { goldPerLe: goldPerLe(x, roll), lines };
}
