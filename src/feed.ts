import type { Region } from "./items";
import { readJsonCapped } from "./http";

export interface FeedRow {
  item_slug: string;
  price: number;
  timestamp: number;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const FEED_URL = "https://marketdata-api.yrzhao1068589.workers.dev/v1/prices/latest";
const MAX_BODY_BYTES = 5_000_000; // ~95 slugs is a few KB; reject absurd bodies (DoS guard)

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
  // Cap enforced on the actual bytes (readJsonCapped), so a chunked response with no Content-Length
  // or a malformed declared length can't buffer an unbounded body.
  const data: unknown = await readJsonCapped(res, MAX_BODY_BYTES, `feed ${region}`);
  if (!Array.isArray(data)) throw new Error(`feed ${region} response not an array`);
  return data as FeedRow[];
}
