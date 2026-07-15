// The wire types are imported type-only from the worker source (src/normalize.ts, src/items.ts),
// the single source of truth, so the contract is compiler-enforced: payload drift now fails
// svelte-check instead of breaking at runtime in the browser. Type-only imports are erased at
// build time, so this adds no runtime coupling between the two npm projects.
import type { PricePayload } from "../../../src/normalize";

export type { PricePayload, RegionSnapshot } from "../../../src/normalize";
export type { Region } from "../../../src/items";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

// Same-origin "/v1/prices" for the Cloudflare/dev build; an absolute Worker URL for the GitHub
// Pages build (set via VITE_API_BASE at build time) so the static site fetches prices cross-origin.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function loadPrices(fetchImpl: FetchLike = fetch): Promise<PricePayload> {
  const res = await fetchImpl(`${API_BASE}/v1/prices`, { cache: "no-store" });
  if (!res.ok) throw new Error(`prices HTTP ${res.status}`);
  return (await res.json()) as PricePayload;
}
