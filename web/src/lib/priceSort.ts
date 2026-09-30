import { displayName } from "./catalog";
import { load } from "./storage";

// Prices tab ordering: alphabetical by item name, or most valuable first. The choice is a global
// display preference (shared by NA and EU), stored like the region pick.
export type PriceSort = "name" | "gold";

export const PRICE_SORT_KEY = "csv.priceSort";

/** The stored sort choice, defaulting to A-Z for a missing or unknown value. */
export function loadPriceSort(): PriceSort {
  return load(PRICE_SORT_KEY) === "gold" ? "gold" : "name";
}

/** [slug, gold] rows in the chosen order; equal gold falls back to A-Z so ties stay stable. */
export function sortPriceRows(prices: Record<string, number>, sort: PriceSort): [string, number][] {
  const byName = (a: [string, number], b: [string, number]) =>
    displayName(a[0]).localeCompare(displayName(b[0]));
  return Object.entries(prices).sort(sort === "gold" ? (a, b) => b[1] - a[1] || byName(a, b) : byName);
}
