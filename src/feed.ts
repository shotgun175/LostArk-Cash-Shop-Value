import type { Region } from "./items";

export interface FeedRow {
  item_slug: string;
  price: number;
  timestamp: number;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const FEED_URL = "https://marketdata-api.yrzhao1068589.workers.dev/v1/prices/latest";

export async function fetchRegion(
  region: Region,
  slugs: readonly string[],
  fetchImpl: FetchLike = fetch,
): Promise<FeedRow[]> {
  const res = await fetchImpl(FEED_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ region_slug: region, item_slugs: slugs }),
  });
  if (!res.ok) throw new Error(`feed ${region} HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error(`feed ${region} response not an array`);
  return data as FeedRow[];
}
