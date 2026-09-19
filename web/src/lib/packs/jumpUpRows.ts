// Pure valuation for the Jump-Up Boost track: one row per milestone with its reward lines, the
// level's gold, and the running total ("what you'd have banked if this is the last milestone you
// reach"). Rounding comes from the shared valueChestOptions helper, so totals agree with the rest
// of the app by construction. Takes the fully layered price map (buildPriceMap with the F4
// input): every reward here is baked or exchange-priced, never a raw feed slug, so the raw
// effectivePrices() map would value the whole track at 0.

import { JUMP_UP_LEVELS, JUMP_UP_RC } from "./data/jumpUp";
import { RESOLVER } from "./data/resolver";
import { valueChestOptions } from "./packValue";

export interface JumpUpLine {
  slug: string;
  chest: string; // the reward chest granting this line
  chestQty: number; // chests granted at this milestone
  qty: number; // units after scaling by chestQty
  perUnit: number;
  gold: number;
  isBound?: boolean;
  unresolved?: boolean; // chest name missing from the resolver (a typo), never a price gap
}

export interface JumpUpRow {
  level: number;
  ilvl: number;
  chest: string;
  lines: JumpUpLine[];
  gold: number;
  cumulativeGold: number;
  cumulativeGoldPerRc: number;
}

export interface JumpUpResult {
  rows: JumpUpRow[];
  total: number;
  goldPerRc: number;
}

export function jumpUpRows(prices: Record<string, number>): JumpUpResult {
  let running = 0;
  const rows: JumpUpRow[] = JUMP_UP_LEVELS.map((lvl) => {
    const lines: JumpUpLine[] = [];
    let gold = 0;
    for (const r of lvl.rewards) {
      const chest = RESOLVER[r.chest];
      if (!chest) {
        lines.push({ slug: r.chest, chest: r.chest, chestQty: r.qty, qty: 0, perUnit: 0, gold: 0, unresolved: true });
        continue;
      }
      const v = valueChestOptions(chest, prices, r.qty);
      for (const o of v.options) {
        if (!o.chosen) continue;
        lines.push({
          slug: o.slug,
          chest: r.chest,
          chestQty: r.qty,
          qty: o.qtyPerChest * r.qty,
          perUnit: o.perUnit,
          gold: o.lineGold,
          isBound: o.isBound,
        });
      }
      gold += v.gold;
    }
    running += gold;
    return {
      level: lvl.level,
      ilvl: lvl.ilvl,
      chest: lvl.chest,
      lines,
      gold,
      cumulativeGold: running,
      cumulativeGoldPerRc: running / JUMP_UP_RC,
    };
  });
  return { rows, total: running, goldPerRc: running / JUMP_UP_RC };
}
