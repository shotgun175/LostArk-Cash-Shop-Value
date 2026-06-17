// The upstream is a periodic batch scrape that's routinely 20-40 min behind, so only
// flag data that's far enough behind to suggest a real outage (e.g. patch-day breakage).
const STALE_MS = 90 * 60 * 1000;

export function formatGold(n: number): string {
  if (n >= 100) return Math.round(n).toLocaleString("en-US");
  if (n > 0 && n < 0.005) return "<0.01"; // genuinely-nonzero but sub-cent per-unit price
  if (n > 0 && n < 1) return n.toFixed(2); // sub-1 per-unit prices (e.g. 0.27)
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 }); // 12 -> "12", 1.45 -> "1.5"
}

export function formatSignedPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const r = Math.round(n);
  return `${r >= 0 ? "+" : ""}${r}%`;
}

export function formatMoney(n: number, sym: string): string {
  return `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Freshness { label: string; stale: boolean; }

// `now` is injectable for tests; defaults to current time. Time is shown in the viewer's local
// timezone (with the tz abbreviation) — UTC reads as confusing to most users.
export function freshness(generatedAt: string, sourceValidAt: string, now = Date.now()): Freshness {
  const src = Date.parse(sourceValidAt);
  const ageMs = Number.isNaN(src) ? Infinity : now - src;
  const time = Number.isNaN(src)
    ? "—"
    : new Date(src).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return { label: `prices as of ${time}`, stale: ageMs > STALE_MS };
}
