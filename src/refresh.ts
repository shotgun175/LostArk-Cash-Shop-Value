import { FETCH_SLUGS, REGIONS, type Region } from "./items";
import { fetchRegion, type FetchLike } from "./feed";
import { sanitizeRows, buildRegionSnapshot, buildPayload, MAX_FUTURE_SKEW_S, type RegionSnapshot, type PricePayload } from "./normalize";
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

  const nowMs = Date.now();
  // A stored stamp beyond now + skew is poison (a future row written before this guard existed, or a
  // past upstream clock spike). It must not gate genuine updates, or the region stays frozen forever.
  const maxAcceptableMs = nowMs + MAX_FUTURE_SKEW_S * 1000;

  for (const region of REGIONS) {
    try {
      const good = sanitizeRows(await fetchRegion(region, FETCH_SLUGS, fetchImpl), nowMs);
      if (good.length === 0) continue; // empty/garbage -> keep previous snapshot
      const snap = buildRegionSnapshot(good);
      const prevSnap = prev?.regions?.[region];
      const prevMs = prevSnap ? Date.parse(prevSnap.source_valid_at) : NaN;
      // Self-heal: only let a previous snapshot gate the write if its own stamp is trustworthy (not
      // future-poisoned). Fresh rows are already clamped to <= now + skew by sanitizeRows, so a
      // genuine update overwrites a poisoned prevSnap instead of being blocked by it.
      const prevUsable = Number.isFinite(prevMs) && prevMs <= maxAcceptableMs;
      // write-on-advance: skip only when a usable previous snapshot is at least as new as upstream.
      if (prevUsable && Date.parse(snap.source_valid_at) <= prevMs) continue;
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
