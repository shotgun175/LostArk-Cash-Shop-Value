import { FETCH_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { sanitizeRows, buildRegionSnapshot, buildPayload, type RegionSnapshot, type PricePayload } from "./normalize";
import { readPayload, writePayload } from "./store";
import { fetchG2gRates } from "./g2g";
import type { G2gRate } from "./normalize";
import { BUNDLES } from "./bundles";

export async function refresh(kv: KVNamespace, fetchImpl: FetchLike = fetch): Promise<PricePayload> {
  const prev = await readPayload(kv);
  const regions: Partial<Record<Region, RegionSnapshot>> = { ...(prev?.regions ?? {}) };

  for (const region of REGIONS) {
    try {
      const good = sanitizeRows(await fetchRegion(region, FETCH_SLUGS, fetchImpl));
      if (good.length === 0) continue; // empty/garbage -> keep previous snapshot
      const snap = buildRegionSnapshot(good);
      const prevSnap = prev?.regions?.[region];
      // write-on-advance: skip if upstream isn't strictly newer than what we already have
      if (prevSnap && Date.parse(snap.source_valid_at) <= Date.parse(prevSnap.source_valid_at)) continue;
      regions[region] = snap;
    } catch (err) {
      // network/HTTP error -> keep previous snapshot for this region, but make it visible
      console.error(`refresh: region ${region} failed; keeping last-known-good`, err);
    }
  }

  // Poll the live real-money rates too; keep each currency's last good value if its fetch fails.
  const fetched = await fetchG2gRates(fetchImpl);
  const usd = fetched?.usdPer1kGold ?? prev?.g2g?.usdPer1kGold;
  const eur = fetched?.eurPer1kGold ?? prev?.g2g?.eurPer1kGold;
  let g2g: G2gRate | undefined;
  if (usd != null || eur != null) {
    g2g = {};
    if (usd != null) g2g.usdPer1kGold = usd;
    if (eur != null) g2g.eurPer1kGold = eur;
  }
  const payload = buildPayload(regions, BUNDLES, new Date().toISOString(), g2g);

  // Only write when a region or the g2g rate actually changed — keeps KV writes far under the cap.
  const changed =
    !prev ||
    JSON.stringify(prev.regions) !== JSON.stringify(regions) ||
    JSON.stringify(prev.g2g) !== JSON.stringify(g2g);
  if (changed) {
    await writePayload(kv, payload);
  }
  return payload;
}
