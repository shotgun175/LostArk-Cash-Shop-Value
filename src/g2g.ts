import type { FetchLike } from "./feed";
import type { G2gRate } from "./normalize";
import { readJsonCapped } from "./http";

// Backend-only live "price per 1,000 gold" reference, polled from a single fixed public marketplace
// seller. We read converted_unit_price — the price the marketplace actually DISPLAYS to buyers in the
// queried currency (higher than the seller's raw base) — so our number matches what a user sees there.
// USD comes from the US-East server offer, EUR from the same seller's EU-Central offer. Only the
// resulting rates are exposed; the endpoint and seller are kept off the frontend. Any failure returns
// null for that currency and the caller carries the previous value forward, so the feed never breaks.
const BASE =
  "https://sls.g2g.com/offer/search?service_id=lgc_service_1&brand_id=lgc_game_23027" +
  "&seo_term=lost-ark-gold&page_size=48&seller=Droku&sort=lowest_price";
const MIN_RATE = 0.001; // per-1k-gold sanity floor
const MAX_RATE = 1; // per-1k-gold sanity ceiling
const MAX_BODY_BYTES = 5_000_000; // same cap as the market feed; an offer page is a few KB

interface G2gOffer {
  title?: unknown;
  converted_unit_price?: unknown;
}

// Fetch one currency variant and return the displayed per-1k price of the first matching offer.
async function fetchOne(
  fetchImpl: FetchLike,
  currency: string,
  country: string,
  match: (title: string) => boolean,
): Promise<number | null> {
  let res: Response;
  try {
    res = await fetchImpl(`${BASE}&currency=${currency}&country=${country}`, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; LostArkCashShopValue/1.0)",
      },
    });
  } catch (e) {
    console.error("g2g: fetch failed", currency, e);
    return null;
  }
  if (!res.ok) {
    console.error("g2g: HTTP", currency, res.status);
    return null;
  }
  let body: { code?: unknown; payload?: { results?: unknown } };
  try {
    // Same stream-enforced size cap as the feed: this endpoint is just as untrusted.
    body = (await readJsonCapped(res, MAX_BODY_BYTES, `g2g ${currency}`)) as typeof body;
  } catch (e) {
    console.error("g2g: bad JSON or oversized body", currency, e);
    return null;
  }
  const results = body?.payload?.results;
  if (body?.code !== 2000 || !Array.isArray(results)) {
    console.error("g2g: unexpected response shape", currency, body?.code);
    return null;
  }
  const offer = (results as G2gOffer[]).find((o) => typeof o?.title === "string" && match(o.title));
  const rate = offer ? Number(offer.converted_unit_price) : NaN;
  if (!Number.isFinite(rate) || rate < MIN_RATE || rate > MAX_RATE) {
    console.error("g2g: rate missing or out of range", currency, rate);
    return null;
  }
  // Round to 6 dp only: this preserves the value the marketplace displays exactly (e.g. 0.03186,
  // 0.029691) while damping any deeper FX jitter, so the write-on-change guard doesn't churn KV.
  return Math.round(rate * 1e6) / 1e6;
}

export async function fetchG2gRates(fetchImpl: FetchLike = fetch): Promise<Partial<G2gRate> | null> {
  const [usd, eur] = await Promise.all([
    fetchOne(fetchImpl, "USD", "US", (t) => t === "Balthorr - US East"),
    fetchOne(fetchImpl, "EUR", "DE", (t) => t === "Ratik - EU Central"),
  ]);
  if (usd == null && eur == null) return null;
  const out: Partial<G2gRate> = {};
  if (usd != null) out.usdPer1kGold = usd;
  if (eur != null) out.eurPer1kGold = eur;
  return out;
}
