import { RESOLVER } from "./data/resolver";
import type { Pack } from "./data/types";
import { customChosen, valueChestOptions } from "./packValue";

export interface DetailOption {
  slug: string;
  qtyPerChest: number;
  totalQty: number; // qtyPerChest * how many of this chest the pack grants
  perUnit: number;
  lineGold: number; // per-chest round(perUnit*qtyPerChest), scaled by the pack's chest qty
  isBound?: boolean;
  chosen: boolean; // the option(s) that count toward the pack total
}

interface DetailChest {
  chest: string; // chest display name
  qty: number; // how many of this chest the pack grants
  type: "fixed" | "selection" | "multi";
  isSelection: boolean;
  gold: number; // chest's (would-be) contribution to the pack total (scaled by qty)
  options: DetailOption[];
  // Whether this chest counts toward the pack total. Always true for ordinary packs; on a
  // choose-N-of-M pack only the chosen options count (the rest are listed for comparison).
  counted: boolean;
  unresolved?: boolean;
}

// Full per-chest breakdown for the drill-down: every selection option is included (with the chosen
// one flagged), unlike packValue which aggregates only the terminal lines. Pick + rounding come
// from the shared valueChestOptions helper, so the totals agree with the card by construction.
// Choose-N-of-M packs list ALL their options (chosen set via the shared customChosen rule).
export function packDetail(
  pack: Pack,
  prices: Record<string, number>,
  picks: Record<string, string> = {},
  customPicks: Record<string, string[]> = {},
): DetailChest[] {
  const chosenSet = customChosen(pack, prices, picks, customPicks[pack.slug]);
  const contents = chosenSet ? pack.customSelection!.options : pack.contents;
  return contents.map((content) => {
    const counted = chosenSet ? chosenSet.has(content.chest) : true;
    const chest = RESOLVER[content.chest];
    if (!chest) {
      return { chest: content.chest, qty: content.qty, type: "fixed" as const, isSelection: false, gold: 0, options: [], counted, unresolved: true };
    }

    const { options: valued, gold } = valueChestOptions(chest, prices, content.qty, picks[content.chest]);
    const options: DetailOption[] = valued.map((o) => ({
      slug: o.slug,
      qtyPerChest: o.qtyPerChest,
      totalQty: o.qtyPerChest * content.qty,
      perUnit: o.perUnit,
      lineGold: o.lineGold,
      isBound: o.isBound,
      chosen: o.chosen,
    }));

    return { chest: content.chest, qty: content.qty, type: chest.type, isSelection: chest.type === "selection", gold, options, counted };
  });
}
