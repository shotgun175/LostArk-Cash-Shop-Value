import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";
import { writePayload } from "../src/store";
import type { PricePayload } from "../src/normalize";

const seed: PricePayload = {
  schema_version: 1,
  generated_at: "2026-06-15T00:00:00.000Z",
  regions: { nae: { source_valid_at: "2026-06-15T00:00:00.000Z", prices: { grudge: 100 } } },
  bundles: {},
};

async function call(path: string, method = "GET"): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request("http://x" + path, { method }), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

describe("worker fetch", () => {
  it("serves /v1/prices from KV with cache + CORS headers", async () => {
    await writePayload(env.PRICES, seed);
    const res = await call("/v1/prices");
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toContain("max-age=60");
    const body = (await res.json()) as PricePayload;
    expect(body.regions.nae?.prices.grudge).toBe(100);
  });

  it("answers a CORS preflight (OPTIONS)", async () => {
    const res = await call("/v1/prices", "OPTIONS");
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("serves a valid empty payload when KV is cold (no upstream fetch)", async () => {
    const res = await call("/v1/prices");
    expect(res.status).toBe(200);
    const body = (await res.json()) as PricePayload;
    expect(body.schema_version).toBe(1);
    expect(body.regions).toEqual({});
  });

  it("rejects non-GET methods on /v1/prices with 405", async () => {
    const res = await call("/v1/prices", "POST");
    expect(res.status).toBe(405);
  });

  it("/healthz reports ok and a numeric source age when data exists", async () => {
    await writePayload(env.PRICES, seed);
    const res = await call("/healthz");
    const body = (await res.json()) as { ok: boolean; source_age_seconds: number };
    expect(body.ok).toBe(true);
    expect(typeof body.source_age_seconds).toBe("number");
  });

  it("/healthz reports not-ok with null age when KV is empty", async () => {
    const res = await call("/healthz");
    const body = (await res.json()) as { ok: boolean; source_age_seconds: number | null };
    expect(body.ok).toBe(false);
    expect(body.source_age_seconds).toBeNull();
  });

  it("/healthz surfaces g2g_age_seconds from the oldest per-currency success stamp", async () => {
    const now = Date.now();
    await writePayload(env.PRICES, {
      ...seed,
      g2g: {
        usdPer1kGold: 0.032,
        eurPer1kGold: 0.03,
        fetchedAt: new Date(now).toISOString(), // a fresh poll ATTEMPT must not mask...
        usdFetchedAt: new Date(now - 60_000).toISOString(), // ...a 1-min-old USD leg
        eurFetchedAt: new Date(now - 7_200_000).toISOString(), // ...or a 2h-frozen EUR leg
      },
    });
    const res = await call("/healthz");
    const body = (await res.json()) as { ok: boolean; g2g_age_seconds: number | null };
    expect(body.ok).toBe(true); // advisory only: g2g staleness does not flip ok
    expect(body.g2g_age_seconds).toBeGreaterThanOrEqual(7200); // worst (oldest) leg wins
    expect(body.g2g_age_seconds).toBeLessThan(7300); // and it is the leg stamp, not the attempt stamp
  });

  it("/healthz reports null g2g age when no successful g2g poll is recorded", async () => {
    await writePayload(env.PRICES, seed); // no g2g block at all
    const res = await call("/healthz");
    const body = (await res.json()) as { g2g_age_seconds: number | null };
    expect(body.g2g_age_seconds).toBeNull();
  });

  it("404s unknown routes", async () => {
    const res = await call("/nope");
    expect(res.status).toBe(404);
  });
});
