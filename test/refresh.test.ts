import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { refresh } from "../src/refresh";
import { readPayload } from "../src/store";
import type { FetchLike } from "../src/feed";

// Build a fetch stub that returns canned rows per region_slug.
function feedStub(rowsByRegion: Record<string, unknown[]>): FetchLike {
  return async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { region_slug: string };
    const rows = rowsByRegion[body.region_slug] ?? [];
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  };
}

describe("refresh", () => {
  it("writes validated prices for both regions", async () => {
    const stub = feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: 1781506594 }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: 1781506261 }],
    });
    const payload = await refresh(env.PRICES, stub);
    expect(payload.regions.nae?.prices.grudge).toBe(100);
    expect(payload.regions.euc?.prices.grudge).toBe(50);
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("does not overwrite good data when the feed returns empty", async () => {
    await refresh(env.PRICES, feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: 1781506594 }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: 1781506261 }],
    }));
    await refresh(env.PRICES, feedStub({ nae: [], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("ignores an older upstream timestamp", async () => {
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: 2000 }], euc: [] }));
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 999, timestamp: 1000 }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });
});
