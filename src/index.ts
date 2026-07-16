import { refresh } from "./refresh";
import { readPayload } from "./store";
import type { RegionSnapshot, PricePayload } from "./normalize";
import { BUNDLES } from "./bundles";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

function emptyPayload(): PricePayload {
  return { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: BUNDLES };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/v1/prices") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405, headers: { ...CORS, allow: "GET, OPTIONS" } });
      }

      // Normalize the cache key to origin + path (ignore query string) so cache-busting
      // can't bypass the shared edge cache.
      const cacheKey = new Request(new URL(url.pathname, url.origin).toString());
      const cache = caches.default;
      const hit = await cache.match(cacheKey);
      if (hit) return hit;

      // KV is filled and kept fresh by the 60s cron (and KV persists). If it's still cold —
      // only right after the very first deploy — serve a valid empty payload with a short
      // cache. No inline upstream fetch: nothing unauthenticated can trigger the feed, and
      // there is no cold-start thundering herd.
      let payload: PricePayload;
      try {
        payload = (await readPayload(env.PRICES)) ?? emptyPayload();
      } catch (e) {
        // KV read failed (cap exhausted or platform error). Degrade honestly with a 503: the SPA's
        // poller keeps last-good data on a failed fetch, whereas a 200 with an empty payload would
        // silently replace users' live prices with nothing while status reads "ok".
        console.error("prices: KV read failed", e);
        return new Response(JSON.stringify({ error: { code: "kv_unavailable", message: "price store unavailable" } }), {
          status: 503,
          headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
        });
      }
      const isCold = Object.keys(payload.regions).length === 0;

      const res = new Response(JSON.stringify(payload), {
        headers: {
          "content-type": "application/json",
          "cache-control": `public, max-age=${isCold ? 10 : 60}`,
          ...CORS,
        },
      });
      // Don't edge-cache the cold/empty payload, so the cron's first fill is served immediately.
      if (!isCold) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()).catch((e) => console.error("cache put failed", e)));
      }
      return res;
    }

    if (url.pathname === "/healthz") {
      let payload: PricePayload | null;
      try {
        payload = await readPayload(env.PRICES);
      } catch (e) {
        // Same degradation as /v1/prices: monitors get a structured not-ok instead of a platform
        // "Worker threw exception" page when KV reads fail.
        console.error("healthz: KV read failed", e);
        return new Response(JSON.stringify({ ok: false, source_age_seconds: null, g2g_age_seconds: null }), {
          status: 503,
          headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
        });
      }
      const snaps = payload ? (Object.values(payload.regions) as RegionSnapshot[]) : [];
      const times = snaps.map((s) => Date.parse(s.source_valid_at)).filter((t) => !Number.isNaN(t));
      const newestMs = times.length ? Math.max(...times) : 0;
      const ageSeconds = newestMs ? Math.round((Date.now() - newestMs) / 1000) : null;
      // g2g observability: age of the OLDEST per-currency success stamp (worst case), so a single
      // frozen leg is visible to a monitor instead of hidden behind the other leg's fresh poll.
      // null = no successful poll recorded. Advisory only; deliberately not folded into `ok`,
      // which stays the market-feed signal (the g2g rate is a slow-moving reference, not price data).
      const g2gStamps = [payload?.g2g?.usdFetchedAt, payload?.g2g?.eurFetchedAt]
        .map((s) => (s ? Date.parse(s) : NaN))
        .filter((t) => !Number.isNaN(t));
      const g2gAgeSeconds = g2gStamps.length ? Math.round((Date.now() - Math.min(...g2gStamps)) / 1000) : null;
      // Freshness is minute-granular anyway, so let well-behaved clients cache for 30s instead of
      // converting every anonymous hit 1:1 into a KV read against the free-tier daily read cap
      // (this is the only endpoint with that property; /v1/prices is edge-cached).
      return new Response(
        JSON.stringify({ ok: times.length > 0, source_age_seconds: ageSeconds, g2g_age_seconds: g2gAgeSeconds }),
        { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", ...CORS } },
      );
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refresh(env.PRICES).catch((e) => console.error("scheduled refresh failed", e)));
  },
} satisfies ExportedHandler<Env>;
