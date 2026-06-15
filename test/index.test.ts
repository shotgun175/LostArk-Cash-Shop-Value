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

  it("404s unknown routes", async () => {
    const res = await call("/nope");
    expect(res.status).toBe(404);
  });
});
