// T4 gem prices: every level comes from ONE value, the region's Lv. 8 gem price, at the 3:1 fuse
// rule (3 gems of one level fuse into 1 of the next): Lv. N = Lv. 8 / 3^(8 - N), so Lv. 7 = /3,
// Lv. 3 = /243, Lv. 2 = /729 and Lv. 1 = /2,187. Locked in .claude/DECISIONS.md, "T4 gems: one
// Lv. 8 baseline per region" (user 2026-10-25). The user's baseline is the region's lv-8-gem
// override; an override on another level replaces only that level (buildPriceMap's gem layer).

import type { Region } from "../api";

/** Default Lv. 8 gem price per region (the user's market prices, 2026-10-25). */
export const GEM_LV8_DEFAULT: Readonly<Record<Region, number>> = { nae: 348000, euc: 398000 };

/** The baseline slug: the user's Lv. 8 gem price is stored as this region override. */
export const GEM_LV8_SLUG = "lv-8-gem";

/** Every T4 gem slug the price map fills, with its gem level. */
export const T4_GEM_LEVELS: Readonly<Record<string, number>> = {
  "lv-1-gem": 1,
  "lv-2-gem": 2,
  "lv-3-gem": 3,
  "lv-8-gem": 8,
};

/** Gold value of one gem of `level` when a Lv. 8 gem is worth `lv8`. */
export function gemPriceAt(level: number, lv8: number): number {
  return lv8 / 3 ** (8 - level);
}

/**
 * The effective Lv. 8 baseline for a region.
 *
 * Args:
 *   prices: the region's effective prices (live feed plus user overrides).
 *   region: the region whose default applies when the user set no value.
 *
 * Returns:
 *   `lv8`: the user's lv-8-gem value when it is a finite number >= 0 (0 counts), else the
 *   regional default; `isDefault`: true when the default was used.
 */
export function gemBaseline(
  prices: Readonly<Record<string, number>>,
  region: Region,
): { lv8: number; isDefault: boolean } {
  const v = prices[GEM_LV8_SLUG];
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return { lv8: v, isDefault: false };
  return { lv8: GEM_LV8_DEFAULT[region], isDefault: true };
}
