import { displayName } from "./catalog";
import { load } from "./storage";

// Prices tab ordering, picked by clicking a column header. The choice is a global display
// preference (shared by NA and EU), stored like the region pick as "<key>:<dir>".
export type PriceSortKey = "name" | "gold";
export type PriceSortDir = "asc" | "desc";
export interface PriceSort {
  key: PriceSortKey;
  dir: PriceSortDir;
}

export const PRICE_SORT_KEY = "csv.priceSort";

// A column's first click: names read A-Z, gold reads most valuable first.
const NATURAL_DIR: Record<PriceSortKey, PriceSortDir> = { name: "asc", gold: "desc" };

/** The stored sort, defaulting to Item A-Z. A bare "name"/"gold" (1.12.1) gets its natural direction. */
export function loadPriceSort(): PriceSort {
  const [key, dir] = (load(PRICE_SORT_KEY) ?? "").split(":");
  if (key !== "name" && key !== "gold") return { key: "name", dir: "asc" };
  return { key, dir: dir === "asc" || dir === "desc" ? dir : NATURAL_DIR[key] };
}

/** The sort after clicking `key`'s header: the active column flips, another starts at its natural direction. */
export function nextPriceSort(cur: PriceSort, key: PriceSortKey): PriceSort {
  if (cur.key === key) return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
  return { key, dir: NATURAL_DIR[key] };
}

/** [slug, gold] rows in the chosen order; equal gold falls back to A-Z so ties stay stable. */
export function sortPriceRows(prices: Record<string, number>, sort: PriceSort): [string, number][] {
  const sign = sort.dir === "asc" ? 1 : -1;
  const byName = (a: [string, number], b: [string, number]) =>
    displayName(a[0]).localeCompare(displayName(b[0]));
  return Object.entries(prices).sort(
    sort.key === "gold" ? (a, b) => sign * (a[1] - b[1]) || byName(a, b) : (a, b) => sign * byName(a, b),
  );
}
