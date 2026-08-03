#!/usr/bin/env node
// Regenerates the HELL_TIERS block of web/src/lib/packs/data/hellRewards.ts from the
// sekwahar Season-4 datamine (docs/hell-1750-sources/hell_tables_v2.json). Check mode
// (default) exits 1 if the generated block differs from the file; --write applies it.
// Also asserts the Wealth rule: "Additional Rewards (Wealth)" === 10x "Additional Rewards"
// item-for-item on every floor of every generated tier.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/hell-1750-sources/hell_tables_v2.json";
const OUT = "web/src/lib/packs/data/hellRewards.ts";
const BEGIN = "// === BEGIN GENERATED: HELL_TIERS (scripts/gen-hell-rewards.mjs) ===";
const END = "// === END GENERATED ===";

const FLOORS = { Base: "0 - 9", "Level 1": "10 - 19", "Level 2": "20 - 29", "Level 3": "30 - 39",
  "Level 4": "40 - 49", "Level 5": "50 - 59", "Level 6": "60 - 69", "Level 7": "70 - 79",
  "Level 8": "80 - 89", "Level 9": "90 - 99", Max: "100" };

function parseQty(line) { // "Honor Shard x18000" | "... x75 (Epic)" -> { name, qty, rarity }
  const m = line.trim().match(/^(.*?)(?: \(Bound\))? x([\d,]+)(?: \((\w+)\))?$/);
  if (!m) throw new Error(`unparseable line: ${line}`);
  return { name: m[1], qty: Number(m[2].replaceAll(",", "")), rarity: m[3] ?? null };
}

// --- Cell encoders (one per column shape found in the current file) -----------------------
// Every encoder takes the cell's entry list (possibly empty) and returns the emitted value,
// or null when the slot is empty for that floor (sparse floors omit the key entirely).

// Plain count: the entry quantity (Fusions, Leapstones, Free taps, Elysian ticket, ...).
function encQty(cell) {
  if (!cell?.length) return null;
  return cell.reduce((n, e) => n + parseQty(e.line).qty, 0);
}

// Gold: the bar denomination is baked into the item name ("5,500 Gold Bars x5" -> 27500).
function encGold(cell) {
  if (!cell?.length) return null;
  return cell.reduce((n, e) => {
    const { name, qty } = parseQty(e.line);
    const m = name.match(/^([\d,]+) Gold Bars$/);
    if (!m) throw new Error(`not a gold-bar line: ${e.line}`);
    return n + Number(m[1].replaceAll(",", "")) * qty;
  }, 0);
}

// Juice: the Lava's Breath count only (the 1:3 Lava:Glacier ratio is encoded in
// ev.ts juiceUnitPrice, not in data).
function encJuice(cell) {
  if (!cell?.length) return null;
  const lava = cell.find((e) => parseQty(e.line).name.startsWith("Lava's Breath"));
  if (!lava) throw new Error("juice cell without Lava's Breath");
  return parseQty(lava.line).qty;
}

// Stones: the red-stone count inside the Destruction/Guardian selection chest (the 1:3
// red:blue ratio is a fixed game rule; only red is stored).
function encStones(cell) {
  if (!cell?.length) return null;
  const chest = cell[0];
  const red = (chest.contents ?? []).find((c) => parseQty(c.line).name.includes("Destruction"));
  if (!red) throw new Error(`stones chest without a Destruction stone: ${chest.line}`);
  return parseQty(chest.line).qty * parseQty(red.line).qty;
}

// Karma/Quality: "karma|quality" from the Processed Chaos/Destiny Stone selection chest.
// Karma = outer count x Processed Destiny Stone count. Quality at 1750 is the nested Chaos
// chest's per-stone count (deep); at 1730 and below it is the nested-chest count itself
// (shallow), matching the hand-verified tables this file historically carried.
function encKarma(deep) {
  return (cell) => {
    if (!cell?.length) return null;
    const outer = cell[0];
    const n = parseQty(outer.line).qty;
    const karmaItem = (outer.contents ?? []).find((c) => c.type === "item");
    const qualityChest = (outer.contents ?? []).find((c) => c.type === "chest");
    if (!karmaItem || !qualityChest) throw new Error(`unexpected karma chest: ${outer.line}`);
    const qualityPer = deep
      ? parseQty(qualityChest.line).qty * parseQty(qualityChest.contents[0].line).qty
      : parseQty(qualityChest.line).qty;
    return `${n * parseQty(karmaItem.line).qty}|${n * qualityPer}`;
  };
}

// Selectable Astrogems: "unc|rare|epic" pipe string; the selection chest's own rarity
// decides the slot its count lands in.
function encAstroSel(cell) {
  if (!cell?.length) return null;
  const slots = { Uncommon: 0, Rare: 0, Epic: 0 };
  for (const e of cell) {
    const { qty, rarity } = parseQty(e.line);
    if (!(rarity in slots)) throw new Error(`unexpected astrogem chest rarity: ${e.line}`);
    slots[rarity] += qty;
  }
  return `${slots.Uncommon}|${slots.Rare}|${slots.Epic}`;
}

// Cards: full-Legendary-pack equivalents. The "- Epic" and "- Rare" variants are worth 1/5
// and 1/25 of a full pack; integer 25ths keep the emitted decimals exact (1.8, 7.4, ...).
function encCards(cell) {
  if (!cell?.length) return null;
  let units25 = 0;
  for (const e of cell) {
    const { name, qty } = parseQty(e.line);
    units25 += qty * (name.includes(" - Epic ") ? 5 : name.includes(" - Rare ") ? 1 : 25);
  }
  return units25 / 25;
}

// Base columns: one item out of the "Additional Rewards" cell, picked by name.
function encAddl(word) {
  return (cell) => {
    if (!cell?.length) return null;
    const hit = cell.find((e) => parseQty(e.line).name.includes(word));
    return hit ? parseQty(hit.line).qty : null;
  };
}

// --- Per-tier layout (column order, slot mapping, hand-curated comment blocks) ------------
// The comment blocks and valuation overrides are curated context, kept verbatim so the
// emitted block byte-matches the file; only the quantities come from the datamine.

const ADDL = "Additional Rewards";
const col = (name, slot, enc) => ({ name, slot, enc });

const BASE_COLS = [
  col("Base shards", ADDL, encAddl("Shard")),
  col("Base red stones", ADDL, encAddl("Destruction")),
  col("Base blue stones", ADDL, encAddl("Guardian")),
  col("Base leapstones", ADDL, encAddl("Leapstone")),
];

// Shared by the three sub-1730 Destiny tiers (they drop raw destiny mats).
const SUB1730_VALUATION = [
  "    valuation: {",
  "      // Circulated (sub-1730) free taps: Arkemys' T4 unit of 100/tap, NOT the 1000/tap",
  "      // Transferred convention of 1730/1750 (D6) \u2014 at 1000 the lower tiers' huge tap counts",
  "      // (up to 3000) would absurdly outvalue the 1750 keys.",
  '      "Free taps": { flat: 100 },',
  '      Stones: { slug: "destiny-destruction-stone", fallback: 5 },',
  '      "Base red stones": { slug: "destiny-destruction-stone", fallback: 5 },',
  '      "Base blue stones": { slug: "destiny-guardian-stone", fallback: 0.1 },',
  '      "Base leapstones": { slug: "destiny-leapstone", fallback: 13 },',
  '      Fusions: { slug: "abidos-fusion-material", fallback: 160 },',
  "    },",
];

const FF_NO_MATS_COMMENT =
  "    // FlameFrost drops no tier-specific priced mats; the global map covers it.";

// Destiny 1730/1750 share one layout; only the Karma/Quality depth differs.
function destinyHighCols(deep) {
  return [
    col("Stones", "MainDropId1", encStones),
    col("Juice", "MainDropId5", encJuice),
    col("Fusions", "MainDropId3", encQty),
    col("Leapstones", "MainDropId6", encQty),
    col("Gold", "MainDropId7", encGold),
    col("Free taps", "MainDropId12", encQty),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(deep)),
    col("Selectable Astrogems", "MainDropId18", encAstroSel),
    col("Elysian ticket", "MainDropId2", encQty),
    ...BASE_COLS,
  ];
}

// Destiny 1640-1700: Shards replace Leapstones; 1700 alone adds the Astrogem chests slot.
function destinyLowCols(withAstroChests) {
  return [
    col("Stones", "MainDropId1", encStones),
    col("Juice", "MainDropId5", encJuice),
    col("Fusions", "MainDropId3", encQty),
    col("Shards", "MainDropId4", encQty),
    col("Gold", "MainDropId7", encGold),
    col("Free taps", "MainDropId12", encQty),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(false)),
    ...(withAstroChests ? [col("Astrogem chests", "MainDropId19", encQty)] : []),
    col("Elysian ticket", "MainDropId2", encQty),
    ...BASE_COLS,
  ];
}

// FlameFrost layouts vary per ilvl (column order and the astrogem slot flavor).
const FF_COLS = {
  1730: [
    col("Juice", "MainDropId5", encJuice),
    col("Gold", "MainDropId7", encGold),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Engravings", "MainDropId15", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(false)),
    col("Selectable Astrogems", "MainDropId18", encAstroSel),
    col("Cards", "MainDropId17", encCards),
    col("Lv. 8 Gems", "MainDropId16", encQty),
  ],
  1750: [
    col("Gold", "MainDropId7", encGold),
    col("Juice", "MainDropId5", encJuice),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(true)),
    col("Engravings", "MainDropId15", encQty),
    col("Selectable Astrogems", "MainDropId18", encAstroSel),
    col("Cards", "MainDropId17", encCards),
    col("Lv. 8 Gems", "MainDropId16", encQty),
  ],
  1700: [
    col("Juice", "MainDropId5", encJuice),
    col("Gold", "MainDropId7", encGold),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Engravings", "MainDropId15", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(false)),
    col("Astrogem chests", "MainDropId19", encQty),
    col("Cards", "MainDropId17", encCards),
    col("Lv. 8 Gems", "MainDropId16", encQty),
  ],
  1680: [
    col("Juice", "MainDropId5", encJuice),
    col("Gold", "MainDropId7", encGold),
    col("Ability stones", "MainDropId13", encQty),
    col("Bracelets", "MainDropId10", encQty),
    col("Engravings", "MainDropId15", encQty),
    col("Karma/Quality", "MainDropId20", encKarma(false)),
    col("Cards", "MainDropId17", encCards),
    col("Lv. 8 Gems", "MainDropId16", encQty),
  ],
};
FF_COLS[1640] = FF_COLS[1680];

// Emission order matches the current file: 1730 pair, 1750 pair, then 1700/1680/1640.
// *|1580 exists in the JSON and is deliberately skipped (out of scope per spec).
const TIERS = [
  { key: "Destiny|1730", label: "1730 Destiny Rewards", ilvl: 1730, mode: "Destiny",
    headComment: [
      "  // The 1730 pair was RE-GENERATED from the sekwahar Season-4 datamine on 2026-07-30",
      "  // (user decision: every tier from one source). The original TJW-verbatim transcription is",
      "  // preserved in git history; TJW-visible diffs: merged Karma/Quality, selection-chest",
      "  // astrogem counts, no Accessories/Random Astrogems, base red/blue 26/170 at floor 0-9.",
    ],
    cols: destinyHighCols(false) },
  { key: "Netherworld|1730", label: "1730 FlameFrost Rewards", ilvl: 1730, mode: "FlameFrost",
    cols: FF_COLS[1730] },
  { key: "Destiny|1750", label: "1750 Destiny Rewards", ilvl: 1750, mode: "Destiny",
    headComment: [
      "  // 1750 drops the Accessories and Random Astrogems columns and merges Karma + Quality into",
      '  // one pick-one "Karma/Quality" chest ("karma|quality"). Chest pool: 10 chests below floor',
      "  // 50, 11 with the Elysian chest at 50+.",
    ],
    cols: destinyHighCols(true) },
  { key: "Netherworld|1750", label: "1750 FlameFrost Rewards", ilvl: 1750, mode: "FlameFrost",
    headComment: [
      "  // One shared rewards table for Flame and Frost VI; only the floor-probability tables",
      "  // differ (as at 1730). Juice is live-priced (1 lavas-breath + 3 glaciers-breath per",
      "  // unit) like on every tier.",
    ],
    cols: FF_COLS[1750] },
  { key: "Destiny|1700", label: "1700 Destiny Rewards", ilvl: 1700, mode: "Destiny",
    headComment: [
      "  // The 1640/1680/1700 tiers are generated from the sekwahar Season-4 datamine",
      "  // (docs/hell-1750-sources/hell_tables_v2.json) by a deterministic converter; do not hand-edit",
      "  // quantities without re-checking that source. Lower tiers drop raw destiny mats, so these",
      "  // carry per-tier valuation overrides. Karma/Quality quality-side counts at these tiers are",
      "  // nested-chest counts (EV-neutral: quality is valued 0, the karma side always wins).",
    ],
    valuation: true, cols: destinyLowCols(true) },
  { key: "Netherworld|1700", label: "1700 FlameFrost Rewards", ilvl: 1700, mode: "FlameFrost",
    ffComment: true, cols: FF_COLS[1700] },
  { key: "Destiny|1680", label: "1680 Destiny Rewards", ilvl: 1680, mode: "Destiny",
    valuation: true, cols: destinyLowCols(false) },
  { key: "Netherworld|1680", label: "1680 FlameFrost Rewards", ilvl: 1680, mode: "FlameFrost",
    ffComment: true, cols: FF_COLS[1680] },
  { key: "Destiny|1640", label: "1640 Destiny Rewards", ilvl: 1640, mode: "Destiny",
    valuation: true, cols: destinyLowCols(false) },
  { key: "Netherworld|1640", label: "1640 FlameFrost Rewards", ilvl: 1640, mode: "FlameFrost",
    ffComment: true, cols: FF_COLS[1640] },
];

// --- Emission -----------------------------------------------------------------------------

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const objKey = (name) => (IDENT.test(name) ? name : JSON.stringify(name));
const fmtVal = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));

function emitTier(cfg, table) {
  const lines = [];
  if (cfg.headComment) lines.push(...cfg.headComment);
  lines.push(`  ${JSON.stringify(cfg.label)}: {`);
  lines.push(`    ilvl: ${cfg.ilvl},`);
  lines.push(`    mode: "${cfg.mode}",`);
  if (cfg.valuation) lines.push(...SUB1730_VALUATION);
  if (cfg.ffComment) lines.push(FF_NO_MATS_COMMENT);
  lines.push("    columns: [");
  for (const c of cfg.cols) lines.push(`      ${JSON.stringify(c.name)},`);
  lines.push("    ],");
  lines.push("    floors: {");
  for (const row of table.rows) {
    const range = FLOORS[row.tier];
    if (!range) throw new Error(`${cfg.key}: unknown floor label ${row.tier}`);
    lines.push(`      ${JSON.stringify(range)}: {`);
    for (const c of cfg.cols) {
      const v = c.enc(row.cells[c.slot]);
      if (v !== null) lines.push(`        ${objKey(c.name)}: ${fmtVal(v)},`);
    }
    lines.push("      },");
  }
  lines.push("    },");
  lines.push("  },");
  return lines;
}

function generateBlock(src) {
  const lines = ["export const HELL_TIERS: Record<string, HellTier> = {"];
  let floorCount = 0;
  for (const cfg of TIERS) {
    const table = src[cfg.key];
    if (!table) throw new Error(`datamine table missing: ${cfg.key}`);
    if (table.rows.length !== 11) throw new Error(`${cfg.key}: expected 11 rows, got ${table.rows.length}`);
    lines.push(...emitTier(cfg, table));
    floorCount += table.rows.length;
  }
  lines.push("};");
  return { block: lines.join("\n"), floorCount };
}

// --- Wealth rule --------------------------------------------------------------------------
// "Additional Rewards (Wealth)" must be the same item multiset as "Additional Rewards" with
// every quantity exactly 10x. Only the Destiny tables carry the pair; Netherworld tables
// have neither column, which trivially satisfies the rule.

function itemMultiset(cell) {
  const map = new Map();
  for (const e of cell ?? []) {
    const { name, qty } = parseQty(e.line);
    map.set(name, (map.get(name) ?? 0) + qty);
  }
  return map;
}

function assertWealthRule(src) {
  for (const cfg of TIERS) {
    for (const row of src[cfg.key].rows) {
      const base = itemMultiset(row.cells["Additional Rewards"]);
      const wealth = itemMultiset(row.cells["Additional Rewards (Wealth)"]);
      const names = new Set([...base.keys(), ...wealth.keys()]);
      for (const name of names) {
        if ((wealth.get(name) ?? 0) !== 10 * (base.get(name) ?? 0)) {
          console.error(`${cfg.key} floor ${FLOORS[row.tier]}: "${name}" base=${base.get(name) ?? 0} wealth=${wealth.get(name) ?? 0}`);
          console.error("WEALTH RULE VIOLATION: regenerate with explicit wealth tables (see spec section 1)");
          process.exit(1);
        }
      }
    }
  }
}

// --- Main ---------------------------------------------------------------------------------

const src = JSON.parse(readFileSync(SRC, "utf8"));
assertWealthRule(src);
const { block, floorCount } = generateBlock(src);

const out = readFileSync(OUT, "utf8");
const beginAt = out.indexOf(BEGIN);
const endAt = out.indexOf(END);
if (beginAt === -1 || endAt === -1 || endAt < beginAt) {
  console.error(`generated-block markers not found in ${OUT}`);
  process.exit(1);
}
const current = out.slice(beginAt + BEGIN.length + 1, endAt - 1); // exclusive of markers and their newlines

if (process.argv.includes("--write")) {
  writeFileSync(OUT, out.slice(0, beginAt + BEGIN.length + 1) + block + out.slice(endAt - 1), "utf8");
  console.log(`HELL_TIERS: block written (${TIERS.length} tiers, ${floorCount} floors). Wealth x10 rule holds on every floor.`);
} else if (current === block) {
  console.log(`HELL_TIERS: generated block matches (${TIERS.length} tiers, ${floorCount} floors). Wealth x10 rule holds on every floor.`);
} else {
  const curLines = current.split("\n");
  const genLines = block.split("\n");
  console.error(`HELL_TIERS: generated block differs from ${OUT} (current ${curLines.length} lines, generated ${genLines.length}).`);
  let shown = 0;
  for (let i = 0; i < Math.max(curLines.length, genLines.length) && shown < 20; i++) {
    if (curLines[i] !== genLines[i]) {
      console.error(`  line ${i + 1}:`);
      console.error(`    file: ${curLines[i] ?? "<missing>"}`);
      console.error(`    gen:  ${genLines[i] ?? "<missing>"}`);
      shown++;
    }
  }
  process.exit(1);
}
