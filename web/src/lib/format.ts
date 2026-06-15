const STALE_MS = 30 * 60 * 1000;

export function formatGold(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export interface Freshness { label: string; stale: boolean; }

// `now` is injectable for tests; defaults to current time.
export function freshness(generatedAt: string, sourceValidAt: string, now = Date.now()): Freshness {
  const src = Date.parse(sourceValidAt);
  const ageMs = Number.isNaN(src) ? Infinity : now - src;
  const hhmm = Number.isNaN(src) ? "—" : new Date(src).toISOString().slice(11, 16);
  return { label: `prices as of ${hhmm} UTC`, stale: ageMs > STALE_MS };
}
