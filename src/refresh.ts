import { FETCH_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { sanitizeRows, buildRegionSnapshot, buildPayload, type RegionSnapshot, type PricePayload } from "./normalize";
import { readPayload, writePayload } from "./store";
import { fetchG2gRates } from "./g2g";
import type { G2gRate } from "./normalize";
import { BUNDLES } from "./bundles";

// g2g moves slowly and would otherwise rewrite KV every 60s cron (blowing the daily write cap), so we
// re-poll it on a slow timer (every 30 min) rather than every run. Injectable for tests.
const G2G_INTERVAL_MS = 30 * 60 * 1000;

export async function refresh(
  kv: KVNamespace,
  fetchImpl: FetchLike = fetch,
  g2gIntervalMs: number = G2G_INTERVAL_MS,
): Promise<PricePayload> {
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

  // Re-poll the live real-money rates only when the interval has elapsed; otherwise carry the last
  // values forward. Each currency keeps its own last-good value if that leg of the fetch fails.
  const prevG2g = prev?.g2g;
  const lastFetched = prevG2g?.fetchedAt ? Date.parse(prevG2g.fetchedAt) : 0;
  const due = !Number.isFinite(lastFetched) || Date.now() - lastFetched >= g2gIntervalMs;
  let g2g: G2gRate | undefined = prevG2g;
  if (due) {
    const fetched = await fetchG2gRates(fetchImpl);
    const usd = fetched?.usdPer1kGold ?? prevG2g?.usdPer1kGold;
    const eur = fetched?.eurPer1kGold ?? prevG2g?.eurPer1kGold;
    if (fetched && (usd != null || eur != null)) {
      g2g = { fetchedAt: new Date().toISOString() };
      if (usd != null) g2g.usdPer1kGold = usd;
      if (eur != null) g2g.eurPer1kGold = eur;
    }
    // fetch failed (null) -> keep prevG2g (and its old fetchedAt), so the next cron retries.
  }
  const payload = buildPayload(regions, BUNDLES, new Date().toISOString(), g2g);

  // Only write when a region or the g2g block actually changed — keeps KV writes far under the cap.
  const changed =
    !prev ||
    JSON.stringify(prev.regions) !== JSON.stringify(regions) ||
    JSON.stringify(prev.g2g) !== JSON.stringify(g2g);
  if (changed) {
    await writePayload(kv, payload);
  }
  return payload;
}
