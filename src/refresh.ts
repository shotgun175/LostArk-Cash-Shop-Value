import { FETCH_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { sanitizeRows, buildRegionSnapshot, buildPayload, type RegionSnapshot, type PricePayload } from "./normalize";
import { readPayload, writePayload } from "./store";
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

  const payload = buildPayload(regions, BUNDLES, new Date().toISOString());

  // Only write when a region actually changed — keeps KV writes far under the free cap.
  if (!prev || JSON.stringify(prev.regions) !== JSON.stringify(regions)) {
    await writePayload(kv, payload);
  }
  return payload;
}
