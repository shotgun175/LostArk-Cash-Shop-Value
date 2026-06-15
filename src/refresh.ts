import { ALL_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { isValidRows, buildRegionSnapshot, buildPayload, type RegionSnapshot, type PricePayload } from "./normalize";
import { readPayload, writePayload } from "./store";
import { BUNDLES } from "./bundles";

export async function refresh(kv: KVNamespace, fetchImpl: FetchLike = fetch): Promise<PricePayload> {
  const prev = await readPayload(kv);
  const regions: Partial<Record<Region, RegionSnapshot>> = { ...(prev?.regions ?? {}) };

  for (const region of REGIONS) {
    try {
      const rows = await fetchRegion(region, ALL_SLUGS, fetchImpl);
      if (!isValidRows(rows)) continue; // empty/garbage -> keep previous snapshot
      const snap = buildRegionSnapshot(rows);
      const prevSnap = prev?.regions?.[region];
      // write-on-advance: skip if upstream isn't newer than what we already have
      if (prevSnap && Date.parse(snap.source_valid_at) <= Date.parse(prevSnap.source_valid_at)) continue;
      regions[region] = snap;
    } catch {
      // network/HTTP error -> keep previous snapshot for this region
    }
  }

  const payload = buildPayload(regions, BUNDLES, new Date().toISOString());

  // Only write when a region actually changed — keeps KV writes far under the free cap.
  if (!prev || JSON.stringify(prev.regions) !== JSON.stringify(regions)) {
    await writePayload(kv, payload);
  }
  return payload;
}
