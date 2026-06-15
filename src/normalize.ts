import type { FeedRow } from "./feed";
import type { Region } from "./items";

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

export function isValidRows(rows: FeedRow[]): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.every(
    (r) =>
      typeof r.item_slug === "string" &&
      typeof r.price === "number" &&
      r.price > 0 &&
      typeof r.timestamp === "number" &&
      r.timestamp > 0,
  );
}

export function maxTimestamp(rows: FeedRow[]): number {
  return rows.reduce((m, r) => Math.max(m, r.timestamp), 0);
}

export function buildRegionSnapshot(rows: FeedRow[]): RegionSnapshot {
  const prices: Record<string, number> = {};
  for (const r of rows) prices[r.item_slug] = r.price;
  return { source_valid_at: new Date(maxTimestamp(rows) * 1000).toISOString(), prices };
}

export function buildPayload(
  regions: Partial<Record<Region, RegionSnapshot>>,
  bundles: Record<string, number>,
  generatedAt: string,
): PricePayload {
  return { schema_version: 1, generated_at: generatedAt, regions, bundles };
}
