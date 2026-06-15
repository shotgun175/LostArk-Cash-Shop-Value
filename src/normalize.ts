import type { FeedRow } from "./feed";
import { ALL_SLUGS, type Region } from "./items";
import { BUNDLES } from "./bundles";

export interface RegionSnapshot {
  source_valid_at: string; // ISO-8601
  prices: Record<string, number>;
}

export interface PricePayload {
  schema_version: 1;
  generated_at: string;
  regions: Partial<Record<Region, RegionSnapshot>>;
  bundles: Record<string, number>;
}

// The feed is an unauthenticated third-party endpoint — treat every row as untrusted.
const SLUG_SET: ReadonlySet<string> = new Set(ALL_SLUGS);
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

// Assumes rows are already sanitized. Duplicate slug -> last row wins.
// Converts the raw per-STACK feed price to a per-UNIT price via the stack-size map.
export function buildRegionSnapshot(rows: FeedRow[]): RegionSnapshot {
  const prices: Record<string, number> = {};
  for (const r of rows) prices[r.item_slug] = r.price / (BUNDLES[r.item_slug] ?? 1);
  return { source_valid_at: new Date(maxTimestamp(rows) * 1000).toISOString(), prices };
}

export function buildPayload(
  regions: Partial<Record<Region, RegionSnapshot>>,
  bundles: Record<string, number>,
  generatedAt: string,
): PricePayload {
  return { schema_version: 1, generated_at: generatedAt, regions, bundles };
}
