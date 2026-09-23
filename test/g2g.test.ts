import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchG2gRates } from "../src/g2g";
import type { FetchLike } from "../src/feed";

// src/g2g.ts is the only code that turns a marketplace number into a displayed money rate. These
// cases pin the Droku server matcher and the guards behind it: a widened or dropped check, or a
// pin that silently stops matching, should fail here rather than only show up as frozen stamps.

interface Leg {
  status?: number;
  code?: number;
  results?: unknown[];
}

// Answers the USD and EUR offer searches separately, keyed on the currency query parameter.
function stub(usd: Leg, eur: Leg): FetchLike {
  return async (url) => {
    const leg = String(url).includes("currency=USD") ? usd : eur;
    return new Response(JSON.stringify({ code: leg.code ?? 2000, payload: { results: leg.results ?? [] } }), {
      status: leg.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
}

// Each search returns every server the seller lists; only the pinned title may be read.
const DECOYS = [
  { title: "Luterra - US East", converted_unit_price: 0.5 },
  { title: "Inanna - US West", converted_unit_price: 0.4 },
  { title: "Elpon - EU West", converted_unit_price: 0.3 },
];
const USD_OK: Leg = { results: [...DECOYS, { title: "Inanna - US East", converted_unit_price: 0.023857 }] };
const EUR_OK: Leg = { results: [...DECOYS, { title: "Elpon - EU Central", converted_unit_price: 0.024442 }] };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("fetchG2gRates", () => {
  it("reads only the pinned Inanna (USD) and Elpon (EUR) offers", async () => {
    expect(await fetchG2gRates(stub(USD_OK, EUR_OK))).toEqual({ usdPer1kGold: 0.023857, eurPer1kGold: 0.024442 });
  });

  it("rounds the displayed price to 6 dp", async () => {
    const usd: Leg = { results: [{ title: "Inanna - US East", converted_unit_price: 0.02385657 }] };
    expect((await fetchG2gRates(stub(usd, EUR_OK)))?.usdPer1kGold).toBe(0.023857);
  });

  it("drops a rate above MAX_RATE", async () => {
    const usd: Leg = { results: [{ title: "Inanna - US East", converted_unit_price: 5.2 }] };
    expect(await fetchG2gRates(stub(usd, EUR_OK))).toEqual({ eurPer1kGold: 0.024442 });
  });

  it("drops a leg whose response code is not 2000", async () => {
    expect(await fetchG2gRates(stub({ ...USD_OK, code: 4000 }, EUR_OK))).toEqual({ eurPer1kGold: 0.024442 });
  });

  it("drops a leg that answers HTTP 500", async () => {
    expect(await fetchG2gRates(stub(USD_OK, { ...EUR_OK, status: 500 }))).toEqual({ usdPer1kGold: 0.023857 });
  });

  it("returns null only when both legs fail", async () => {
    expect(await fetchG2gRates(stub({ status: 500 }, { code: 4000 }))).toBeNull();
  });

  it("leaves usdPer1kGold absent when only a stale pre-merge title is listed", async () => {
    const usd: Leg = { results: [{ title: "Balthorr - US East", converted_unit_price: 0.03 }] };
    const out = await fetchG2gRates(stub(usd, EUR_OK));
    expect(out).not.toHaveProperty("usdPer1kGold");
    expect(out).toEqual({ eurPer1kGold: 0.024442 });
  });
});
