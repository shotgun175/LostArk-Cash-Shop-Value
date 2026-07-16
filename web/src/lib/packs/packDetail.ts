import { RESOLVER } from "./data/resolver";
import type { Pack } from "./data/types";
import { valueChestOptions } from "./packValue";

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
  gold: number; // chest's contribution to the pack total (scaled by qty)
  options: DetailOption[];
  unresolved?: boolean;
}

// Full per-chest breakdown for the drill-down: every selection option is included (with the chosen
// one flagged), unlike packValue which aggregates only the terminal lines. Pick + rounding come
// from the shared valueChestOptions helper, so the totals agree with the card by construction.
export function packDetail(
  pack: Pack,
  prices: Record<string, number>,
  picks: Record<string, string> = {},
): DetailChest[] {
  return pack.contents.map((content) => {
    const chest = RESOLVER[content.chest];
    if (!chest) {
      return { chest: content.chest, qty: content.qty, type: "fixed", isSelection: false, gold: 0, options: [], unresolved: true };
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

    return { chest: content.chest, qty: content.qty, type: chest.type, isSelection: chest.type === "selection", gold, options };
  });
}
