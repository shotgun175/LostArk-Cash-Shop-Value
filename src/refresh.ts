import { FETCH_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { sanitizeRows, buildRegionSnapshot, buildPayload, type RegionSnapshot, type PricePayload } from "./normalize";
import { readPayload, writePayload } from "./store";
import { fetchG2gRate } from "./g2g";
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

  // Poll the live real-money rate too; keep the last good value if this fetch fails.
  const g2g = (await fetchG2gRate(fetchImpl)) ?? prev?.g2g;
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
