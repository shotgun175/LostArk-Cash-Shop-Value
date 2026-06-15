import { refresh } from "./refresh";
import { readPayload } from "./store";
import type { RegionSnapshot } from "./normalize";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/v1/prices") {
      const cache = caches.default;
      const hit = await cache.match(request);
      if (hit) return hit;

      // cold-KV safety net: serve an inline refresh on the very first hit before the cron runs
      let payload = await readPayload(env.PRICES);
      if (!payload) payload = await refresh(env.PRICES);

      const res = new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=60", ...CORS },
      });
      ctx.waitUntil(cache.put(request, res.clone()).catch((e) => console.error("cache put failed", e)));
      return res;
    }

    if (url.pathname === "/healthz") {
      const payload = await readPayload(env.PRICES);
      const snaps = payload ? (Object.values(payload.regions) as RegionSnapshot[]) : [];
      const newestMs = snaps.reduce((m, s) => Math.max(m, Date.parse(s.source_valid_at)), 0);
      const ageSeconds = newestMs ? Math.round((Date.now() - newestMs) / 1000) : null;
      return new Response(JSON.stringify({ ok: snaps.length > 0, source_age_seconds: ageSeconds }), {
        headers: { "content-type": "application/json", ...CORS },
      });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refresh(env.PRICES));
  },
} satisfies ExportedHandler<Env>;
