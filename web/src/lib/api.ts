export type Region = "nae" | "euc";
export interface RegionSnapshot { source_valid_at: string; prices: Record<string, number>; }
export interface PricePayload {
  schema_version: number;
  generated_at: string;
  regions: Partial<Record<Region, RegionSnapshot>>;
  bundles: Record<string, number>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function loadPrices(fetchImpl: FetchLike = fetch): Promise<PricePayload> {
  const res = await fetchImpl("/v1/prices", { cache: "no-store" });
  if (!res.ok) throw new Error(`prices HTTP ${res.status}`);
  return (await res.json()) as PricePayload;
}
