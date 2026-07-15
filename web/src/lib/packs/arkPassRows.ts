// Pure valuation for the Ark Pass reward track: one row per level with its chosen line and the
// full option list (for the picker). Default-pick and rounding come from the shared
// valueChestOptions helper, so totals agree with the rest of the app by construction. Per-level
// picks are passed in (keyed by level number), keeping this function free of stores and the DOM
// so it can be unit-tested.

import { ARK_PASS_LEVELS } from "./data/arkPass";
import { RESOLVER } from "./data/resolver";
import { valueChestOptions } from "./packValue";

export interface ArkPassOption {
  slug: string;
  totalQty: number;
  perUnit: number;
  lineGold: number;
  isBound?: boolean;
  chosen: boolean;
}

export interface ArkPassRow {
  level: number;
  chest: string;
  milestone: boolean;
  icon: string | null;
  unresolved: boolean;
  chosenSlug: string | null;
  chestQty: number;
  qty: number;
  gold: number;
  options: ArkPassOption[];
  optionCount: number;
}

export function arkPassRows(
  prices: Record<string, number>,
  picks: Record<number, string> = {},
): ArkPassRow[] {
  return ARK_PASS_LEVELS.map((lvl) => {
    const chest = lvl.unresolved ? undefined : RESOLVER[lvl.chest];
    if (!chest) {
      return {
        level: lvl.level,
        chest: lvl.chest,
        milestone: !!lvl.milestone,
        icon: lvl.iconSlug ?? null,
        unresolved: true,
        chosenSlug: null,
        chestQty: lvl.qty,
        qty: 0,
        gold: 0,
        options: [],
        optionCount: 0,
      };
    }

    const { options: valued, chosenIndex, gold } = valueChestOptions(chest, prices, lvl.qty, picks[lvl.level]);
    // Selection chests count their picked option; fixed/multi rows key icon + qty off the first
    // output (matching the previous resolveChest-lines[0] behavior).
    const chosen = chosenIndex !== null ? valued[chosenIndex] : valued[0];
    const chosenSlug = chosen?.slug ?? null;

    const options: ArkPassOption[] = valued.map((o) => ({
      slug: o.slug,
      totalQty: o.qtyPerChest * lvl.qty,
      perUnit: o.perUnit,
      lineGold: o.lineGold,
      isBound: o.isBound,
      chosen: o.chosen,
    }));

    return {
      level: lvl.level,
      chest: lvl.chest,
      milestone: !!lvl.milestone,
      icon: chosenSlug,
      unresolved: false,
      chosenSlug,
      chestQty: lvl.qty,
      qty: (chosen?.qtyPerChest ?? 0) * lvl.qty,
      gold,
      options,
      optionCount: chest.outputs.length,
    };
  });
}
