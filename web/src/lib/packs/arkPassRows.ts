// Pure valuation for the Ark Pass reward track: one row per level with its chosen line and the
// full option list (for the picker). Default-pick and rounding match resolveChest / packValue, so
// totals agree with the rest of the app. Per-level picks are passed in (keyed by level number),
// keeping this function free of stores and the DOM so it can be unit-tested.

import { ARK_PASS_LEVELS } from "./data/arkPass";
import { RESOLVER } from "./data/resolver";
import { resolveChest } from "./packValue";

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

    const r = resolveChest(chest, prices, picks[lvl.level]);
    const chosenLine = r.lines[0];
    const chosenSlug = chosenLine?.slug ?? null;
    const isSelection = chest.type === "selection";

    const options: ArkPassOption[] = chest.outputs.map((o) => {
      const perUnit = prices[o.slug] ?? 0;
      const perChestGold = Math.round(perUnit * o.qtyPerChest);
      return {
        slug: o.slug,
        totalQty: o.qtyPerChest * lvl.qty,
        perUnit,
        lineGold: perChestGold * lvl.qty,
        isBound: o.isBound,
        chosen: isSelection ? o.slug === chosenSlug : true,
      };
    });

    return {
      level: lvl.level,
      chest: lvl.chest,
      milestone: !!lvl.milestone,
      icon: chosenSlug,
      unresolved: false,
      chosenSlug,
      chestQty: lvl.qty,
      qty: (chosenLine?.qty ?? 0) * lvl.qty,
      gold: r.gold * lvl.qty,
      options,
      optionCount: chest.outputs.length,
    };
  });
}
