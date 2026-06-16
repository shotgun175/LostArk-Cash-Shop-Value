import { RESOLVER } from "./data/resolver";
import type { Pack } from "./data/types";

export interface DetailOption {
  slug: string;
  qtyPerChest: number;
  totalQty: number; // qtyPerChest * how many of this chest the pack grants
  perUnit: number;
  lineGold: number; // per-chest round(perUnit*qtyPerChest), scaled by the pack's chest qty
  isBound?: boolean;
  chosen: boolean; // the option(s) that count toward the pack total
}

export interface DetailChest {
  chest: string; // chest display name
  qty: number; // how many of this chest the pack grants
  type: "fixed" | "selection" | "multi";
  isSelection: boolean;
  gold: number; // chest's contribution to the pack total (scaled by qty)
  options: DetailOption[];
  unresolved?: boolean;
}

// Full per-chest breakdown for the drill-down: every selection option is included (with the chosen
// one flagged), unlike packValue which aggregates only the terminal lines. Rounding matches
// packValue exactly (round per-chest, then scale by qty) so the totals agree with the card.
export function packDetail(pack: Pack, prices: Record<string, number>): DetailChest[] {
  return pack.contents.map((content) => {
    const chest = RESOLVER[content.chest];
    if (!chest) {
      return { chest: content.chest, qty: content.qty, type: "fixed", isSelection: false, gold: 0, options: [], unresolved: true };
    }

    const options: DetailOption[] = chest.outputs.map((o) => {
      const perUnit = prices[o.slug] ?? 0;
      const perChestGold = Math.round(perUnit * o.qtyPerChest);
      return {
        slug: o.slug,
        qtyPerChest: o.qtyPerChest,
        totalQty: o.qtyPerChest * content.qty,
        perUnit,
        lineGold: perChestGold * content.qty,
        isBound: o.isBound,
        chosen: false,
      };
    });

    let gold: number;
    if (chest.type === "selection") {
      let pick = 0;
      if (chest.defaultPickSlug !== undefined) {
        const i = options.findIndex((o) => o.slug === chest.defaultPickSlug);
        pick = i >= 0 ? i : 0;
      } else {
        pick = options.reduce((best, o, i) => (o.lineGold > options[best].lineGold ? i : best), 0);
      }
      options[pick].chosen = true;
      gold = Math.max(0, options[pick].lineGold);
    } else {
      options.forEach((o) => (o.chosen = true));
      gold = options.reduce((s, o) => s + o.lineGold, 0);
    }

    return { chest: content.chest, qty: content.qty, type: chest.type, isSelection: chest.type === "selection", gold, options };
  });
}
