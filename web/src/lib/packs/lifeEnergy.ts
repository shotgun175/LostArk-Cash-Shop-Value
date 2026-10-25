// The default gold value of a Basic Life Energy Potion: 3,000 Life Energy x the gold one LE
// earns logging (DECISIONS 2026-10-25, "Life Energy Potion default").
//
// A bit-exact port of the passive gold per LE (column J, cells J4:J10) of the Tool Efficiency
// tab of "Lulu's Logging Tool Efficiency Calculator" by Lulu (IGN Espeon, NAE Balthorr); the
// user's copy is "Valluru's Logging Guide". Assumptions, fixed by the user: Lv. 70 Logging and
// Relic charm passives only, NO tool bonus lines, duo logging, 10% Epic trees. Cell names are
// kept in the comments so the port can be audited against the xlsx.
//
// Prices are read per UNIT from the slug -> gold map (the feed quotes timber per stack of 100 and
// the Worker divides by the bundle size). The sheet's inputs I4:I7 are per 100, so I = 100 x p.

export const LE_PER_BASIC_POTION = 3000; // the potion's in-game tooltip; the sheet's C22 check

/** The four logging mats, in the sheet's row order (rows 4 to 7). */
export const TIMBER_SLUGS = ["timber", "tender-timber", "sturdy-timber", "abidos-timber"] as const;

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

/**
 * Passive gold per Life Energy from logging (sheet J10), or null unless all four timber prices
 * are finite and positive. `m["blue-crystal"]` (gold per BC, present only when the F4 input is
 * set) prices the durability restoration route; without it the crafting route is used.
 */
export function loggingGoldPerLe(m: Record<string, number>): number | null {
  const p = TIMBER_SLUGS.map((s) => positive(m[s]));
  if (p.some((v) => v === null)) return null;
  const unit = p as number[];

  let sum = 0;
  for (let i = 0; i < LINES.length; i++) {
    const { w, c, q } = LINES[i];
    const cut = (c / LE_PER_ACTION) * w * EPIC_FACTOR * unit[i] * (1 + REWARD_BONUS); // P4:P7 = O4:O7 x (1 + D)
    const kick = ((KICK_YIELD * w * EPIC_FACTOR) / (LE_PER_ACTION / KICK)) * unit[i]; // R4:R7
    const pouch = ((q * w) / (LE_PER_ACTION / POUCH_CHANCE)) * unit[i]; // T4:T7
    sum += cut + kick + pouch;
  }

  // Per-100 prices, as the sheet's input cells hold them.
  const I4 = 100 * unit[0];
  const I5 = 100 * unit[1];
  const I6 = 100 * unit[2];
  // I8: Tool Crafting Part value.
  const part = (I6 * 1.2 / 100 * 22 + I6 / 100 * 22 + I5 * 1.2 / 100 * 88 + I5 / 100 * 88 + 18) / (30 * 1.05);
  const partsLine = ((1 + 2 * 0.2 + 30 * POUCH_CHANCE) / (LE_PER_ACTION / POUCH_CHANCE)) * part; // T8
  // I9: max-durability cost, the cheaper of crafting and BC restoration (negative = a cost).
  const craft = (-5 * (40 * part + I6 / 100 * 26 + I5 * 1.2 / 100 * 88 + I4 * 1.2 / 100 * 128 + 37)) / (80 * 1.05);
  const goldPerBc = positive(m["blue-crystal"]);
  const I9 = goldPerBc !== null ? Math.max((-goldPerBc * 10) / 4, craft) : craft;
  const durabilityLine = ((0.025 * (1 - DURABILITY_BONUS)) / LE_PER_ACTION) * I9; // J9

  return sum + partsLine + durabilityLine; // J10
}

/** Default gold per Basic Life Energy Potion (3,000 LE x gold per LE), or null without timber prices. */
export function potionDefault(m: Record<string, number>): number | null {
  const g = loggingGoldPerLe(m);
  return g === null ? null : LE_PER_BASIC_POTION * g;
}
