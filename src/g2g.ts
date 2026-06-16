import type { FetchLike } from "./feed";
import type { G2gRate } from "./normalize";

// Backend-only live "USD per 1,000 gold" reference, polled from a single fixed public marketplace
// listing (one US-East seller offer). Only the resulting rate is exposed in the API payload and UI —
// the source endpoint and seller are deliberately kept off the frontend. Any failure returns null;
// the caller carries the previous rate forward, so a blocked or slow upstream never breaks the feed.
const ENDPOINT =
  "https://sls.g2g.com/offer/search?service_id=lgc_service_1&brand_id=lgc_game_23027" +
  "&seo_term=lost-ark-gold&page_size=48&currency=USD&country=US&seller=Droku&sort=lowest_price";
const TARGET_TITLE = "Balthorr - US East";
const MIN_RATE = 0.001; // $/1k gold sanity floor
const MAX_RATE = 1; // $/1k gold sanity ceiling

interface G2gOffer {
  title?: unknown;
  unit_price_in_usd?: unknown;
}

export async function fetchG2gRate(fetchImpl: FetchLike = fetch): Promise<G2gRate | null> {
  let res: Response;
  try {
    res = await fetchImpl(ENDPOINT, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; LostArkCashShopValue/1.0)",
      },
    });
  } catch (e) {
    console.error("g2g: fetch failed", e);
    return null;
  }
  if (!res.ok) {
    console.error("g2g: HTTP", res.status);
    return null;
  }
  let body: { code?: unknown; payload?: { results?: unknown } };
  try {
    body = (await res.json()) as typeof body;
  } catch (e) {
    console.error("g2g: bad JSON", e);
    return null;
  }
  const results = body?.payload?.results;
  if (body?.code !== 2000 || !Array.isArray(results)) {
    console.error("g2g: unexpected response shape", body?.code);
    return null;
  }
  const offer = (results as G2gOffer[]).find((o) => o?.title === TARGET_TITLE);
  const rate = offer ? Number(offer.unit_price_in_usd) : NaN;
  if (!Number.isFinite(rate) || rate < MIN_RATE || rate > MAX_RATE) {
    console.error("g2g: rate missing or out of range", rate);
    return null;
  }
  return { usdPer1kGold: rate };
}
