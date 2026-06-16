import type { FeedRow } from "./feed";
import { FETCH_SLUGS, BOUND_FROM_UNBOUND, type Region } from "./items";
import { BUNDLES } from "./bundles";

export interface RegionSnapshot {
  source_valid_at: string; // ISO-8601
  prices: Record<string, number>;
}

// Live real-money reference rate (marketplace-displayed price per 1,000 gold), polled server-side on
// a slow timer (not every cron). USD is the NA (US-East) figure, EUR the EU-Central figure; each is
// present only when its poll succeeded. fetchedAt stamps the last successful poll — it both rate-limits
// re-polling and serves as a freshness signal.
export interface G2gRate {
  usdPer1kGold?: number;
  eurPer1kGold?: number;
  fetchedAt?: string; // ISO-8601 of the last successful poll
}

export interface PricePayload {
  schema_version: 1;
  generated_at: string;
  regions: Partial<Record<Region, RegionSnapshot>>;
  bundles: Record<string, number>;
  g2g?: G2gRate;
}

// The feed is an unauthenticated third-party endpoint — treat every row as untrusted.
const SLUG_SET: ReadonlySet<string> = new Set(FETCH_SLUGS);
// A Large Destiny Shard Pouch yields 3000 shards (matches the pack resolver's
// "Destiny Shard Pouch (L)" qtyPerChest). Shards aren't listed raw on our feed, so derive the
// per-shard price from the live L-pouch price.
const DESTINY_SHARD_PER_L_POUCH = 3000;
const MIN_TS = 1_500_000_000; // ~2017-07; rejects millisecond-scale timestamps and junk
const MAX_TS = 9_000_000_000; // ~2255; rejects ms-scale (~1.7e12), Infinity, and huge values
const MAX_PRICE = 1e12; // generous ceiling; rejects Infinity/NaN/absurd magnitudes
const MAX_ROWS = 5000; // we only ever query ~95 slugs; anything beyond is junk/DoS

export function isValidRow(r: FeedRow): boolean {
  return (
    typeof r?.item_slug === "string" &&
    SLUG_SET.has(r.item_slug) && // allowlist: kills __proto__/constructor/unknown keys
    Number.isFinite(r.price) &&
    r.price > 0 &&
    r.price < MAX_PRICE &&
    Number.isInteger(r.timestamp) &&
    r.timestamp >= MIN_TS &&
    r.timestamp <= MAX_TS
  );
}

// Drop malformed/untrusted rows; bound the count first (DoS guard). One bad row
// no longer discards a whole region — only the bad rows are dropped.
export function sanitizeRows(rows: FeedRow[]): FeedRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, MAX_ROWS).filter(isValidRow);
}

export function maxTimestamp(rows: FeedRow[]): number {
  return rows.reduce((m, r) => Math.max(m, r.timestamp), 0);
}

// Re-key price-source slugs onto the items they value, in place:
//   - each unbound battle-item price -> its bound slug (then the source key is removed), and
//   - destiny-shard derived from the Large pouch when shards aren't listed directly.
// Bound and unbound variants share a stack size of 1, so the per-unit price copies straight over.
export function applyDerivedPrices(prices: Record<string, number>): void {
  for (const [unbound, bound] of Object.entries(BOUND_FROM_UNBOUND)) {
    const p = prices[unbound];
    if (p !== undefined) {
      prices[bound] = p;
      delete prices[unbound];
    }
  }
  if (prices["destiny-shard"] === undefined && prices["destiny-shard-pouch-l"] > 0) {
    prices["destiny-shard"] = prices["destiny-shard-pouch-l"] / DESTINY_SHARD_PER_L_POUCH;
  }
}

// Assumes rows are already sanitized. Duplicate slug -> last row wins.
// Converts the raw per-STACK feed price to a per-UNIT price via the stack-size map, then maps
// price-source slugs onto the bound items / derived currencies they value (applyDerivedPrices).
export function buildRegionSnapshot(rows: FeedRow[]): RegionSnapshot {
  const prices: Record<string, number> = {};
  for (const r of rows) prices[r.item_slug] = r.price / (BUNDLES[r.item_slug] ?? 1);
  applyDerivedPrices(prices);
  return { source_valid_at: new Date(maxTimestamp(rows) * 1000).toISOString(), prices };
}

export function buildPayload(
  regions: Partial<Record<Region, RegionSnapshot>>,
  bundles: Record<string, number>,
  generatedAt: string,
  g2g?: G2gRate,
): PricePayload {
  const payload: PricePayload = { schema_version: 1, generated_at: generatedAt, regions, bundles };
  if (g2g) payload.g2g = g2g;
  return payload;
}
