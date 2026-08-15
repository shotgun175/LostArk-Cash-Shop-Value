// Typed interfaces for the static pack-engine dataset.
// All data is transcribed verbatim from TheJungleWalrus's compiled app (see docs/TJW-Pack-Engine-Extracted-2026-06-15.md).

export interface Pack {
  name: string;
  slug: string;
  royalCrystalCost: number;
  limited: boolean;
  recurrence?: "monthly" | "weekly";
  retired: boolean;
  retiredOn?: string; // ISO date (YYYY-MM-DD) the pack left the shop, shown on the retired card
  frozenTotal?: number; // gold value AT retirement — display-frozen so retired stats don't drift live
  contents: { chest: string; qty: number }[];
  // Choose-N-of-M packs (2026-08-12 Summer Custom I/II): the buyer takes `pick` of the
  // `options` chest lines. contents stays empty; the engine values the N highest-gold options
  // by default, overridable per pack by the user's checkbox picks (customSel store).
  customSelection?: { pick: number; options: { chest: string; qty: number }[] };
}

export interface Chest {
  name: string;
  type: "fixed" | "selection" | "multi";
  outputs: {
    slug: string;
    qtyPerChest: number;
    isCurrency?: boolean;
    isBound?: boolean;
  }[];
  defaultPickSlug?: string;
}

export interface HellTier {
  ilvl: number;
  mode: string;
  columns: string[];
  floors: Record<string, Record<string, number | string>>;
  // Per-tier overrides of COLUMN_VALUATION, for tiers whose columns pay out different mats
  // (1640-1700 drop raw destiny stones / plain abidos fusions, not crystallized/superior).
  valuation?: Record<string, ColumnVal>;
}

// Per-rarity probabilities for one floor bucket. Destiny has Common/Uncommon/Rare/
// Epic/Legendary/Relic/Ancient; Flame/Frost have Rare/Epic/Legendary.
export type FloorProb = { range: string } & Record<string, number | string>;

export interface ColumnVal {
  slug1730?: string;
  fallback1730?: number;
  slug?: string;
  fallback?: number;
  flat?: number;
  currency?: boolean;
  untradable?: boolean;
  // Per-unit values for a two-part "a|b" pick-one cell (1750 "Karma/Quality"): the player
  // takes one side, so the cell is worth max(a x maxPair[0], b x maxPair[1]).
  maxPair?: readonly [number, number];
}

export interface CubeRow {
  lv2Gems: number;
  leapstones: number;
  blueJuice: number;
  redJuice: number;
}
