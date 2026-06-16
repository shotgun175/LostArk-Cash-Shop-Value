import { env } from "cloudflare:test";
import { describe, it, expect, vi } from "vitest";
import { refresh } from "../src/refresh";
import { readPayload } from "../src/store";
import type { FetchLike } from "../src/feed";

const T_NEW = 1781506594;
const T_OLD = 1781506000;
const T_EUC = 1781506261;
const T_MS = 1781506594000; // millisecond-scale -> must be rejected, must not poison

// Constant canned g2g rates (USD + EUR offers); constant so the write-on-change guard sees no change.
const G2G_USD = 0.03186;
const G2G_EUR = 0.029691;
function g2gResponse(): Response {
  return new Response(
    JSON.stringify({
      code: 2000,
      payload: {
        results: [
          { title: "Balthorr - US East", converted_unit_price: G2G_USD },
          { title: "Ratik - EU Central", converted_unit_price: G2G_EUR },
        ],
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

// Stub fetch that returns canned rows per region_slug; listed regions throw (network error).
// The g2g offer endpoint (a GET with no body) is answered with a fixed rate.
function feedStub(rowsByRegion: Record<string, unknown[]>, throwRegions: string[] = []): FetchLike {
  return async (url, init) => {
    if (String(url).includes("sls.g2g.com")) return g2gResponse();
    const body = JSON.parse(String(init?.body)) as { region_slug: string };
    if (throwRegions.includes(body.region_slug)) throw new Error("network down");
    const rows = rowsByRegion[body.region_slug] ?? [];
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  };
}

describe("refresh", () => {
  it("writes validated prices for both regions", async () => {
    const stub = feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: T_EUC }],
    });
    const payload = await refresh(env.PRICES, stub);
    expect(payload.regions.nae?.prices.grudge).toBe(100);
    expect(payload.regions.euc?.prices.grudge).toBe(50);
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("does not overwrite good data when the feed returns empty", async () => {
    await refresh(env.PRICES, feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: T_EUC }],
    }));
    await refresh(env.PRICES, feedStub({ nae: [], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("ignores an older upstream timestamp", async () => {
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 999, timestamp: T_OLD }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("does not advance on an equal timestamp", async () => {
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 999, timestamp: T_NEW }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("rejects a millisecond-scale timestamp instead of freezing the region", async () => {
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    // a poisoned ms-scale row must be dropped (not stored as a year-58423 source_valid_at)
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 200, timestamp: T_MS }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100); // unchanged
    // and a later genuine advance still lands (region is NOT frozen)
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 300, timestamp: T_NEW + 10 }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(300);
  });

  it("keeps a region on network error and still advances the other", async () => {
    await refresh(env.PRICES, feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: T_EUC }],
    }));
    // nae throws; euc returns a newer price
    await refresh(env.PRICES, feedStub({ euc: [{ item_slug: "grudge", price: 60, timestamp: T_EUC + 10 }] }, ["nae"]));
    const stored = await readPayload(env.PRICES);
    expect(stored?.regions.nae?.prices.grudge).toBe(100); // retained
    expect(stored?.regions.euc?.prices.grudge).toBe(60); // advanced
  });

  it("lets a region recover after being empty", async () => {
    const first = await refresh(env.PRICES, feedStub({ nae: [], euc: [] }));
    expect(first.regions.nae).toBeUndefined();
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    expect((await readPayload(env.PRICES))?.regions.nae?.prices.grudge).toBe(100);
  });

  it("does not write to KV when nothing changed", async () => {
    const stub = feedStub({
      nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }],
      euc: [{ item_slug: "grudge", price: 50, timestamp: T_EUC }],
    });
    await refresh(env.PRICES, stub); // first write
    const putSpy = vi.spyOn(env.PRICES, "put");
    await refresh(env.PRICES, stub); // identical -> must be a no-op
    expect(putSpy).not.toHaveBeenCalled();
    putSpy.mockRestore();
  });

  it("does not re-poll g2g within the refresh interval", async () => {
    let g2gFetches = 0;
    const feed: FetchLike = async (url, init) => {
      if (String(url).includes("sls.g2g.com")) {
        g2gFetches++;
        return g2gResponse();
      }
      const body = JSON.parse(String(init?.body)) as { region_slug: string };
      const rows = body.region_slug === "nae" ? [{ item_slug: "grudge", price: 100, timestamp: T_NEW }] : [];
      return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
    };
    await refresh(env.PRICES, feed, 0); // force a poll -> stamps fetchedAt = now (independent of prior KV)
    const primed = g2gFetches;
    await refresh(env.PRICES, feed); // default 1h interval, fetchedAt just set -> must NOT poll again
    expect(g2gFetches).toBe(primed);
  });

  it("includes the live g2g USD + EUR rates in the payload", async () => {
    const payload = await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    expect(payload.g2g?.usdPer1kGold).toBe(G2G_USD);
    expect(payload.g2g?.eurPer1kGold).toBe(G2G_EUR);
  });

  it("keeps the last good g2g rates when the upstream offer fetch fails", async () => {
    await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    // A fetcher that errors on the g2g endpoint but still serves the feed.
    const noG2g: FetchLike = async (url, init) => {
      if (String(url).includes("sls.g2g.com")) throw new Error("blocked");
      const body = JSON.parse(String(init?.body)) as { region_slug: string };
      const rows = body.region_slug === "nae" ? [{ item_slug: "grudge", price: 200, timestamp: T_NEW + 10 }] : [];
      return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
    };
    const payload = await refresh(env.PRICES, noG2g, 0); // interval 0 -> force a (failing) re-poll
    expect(payload.g2g?.usdPer1kGold).toBe(G2G_USD); // carried forward from the prior good fetch
    expect(payload.g2g?.eurPer1kGold).toBe(G2G_EUR);
  });

  it("includes the bundles stack-size map in the payload", async () => {
    const payload = await refresh(env.PRICES, feedStub({ nae: [{ item_slug: "grudge", price: 100, timestamp: T_NEW }], euc: [] }));
    expect(payload.bundles["destruction-stone"]).toBe(1000);
    expect(payload.bundles.grudge).toBe(1);
  });
});
