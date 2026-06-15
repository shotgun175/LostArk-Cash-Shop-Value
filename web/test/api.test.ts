import { describe, it, expect } from "vitest";
import { loadPrices } from "../src/lib/api";

const sample = {
  schema_version: 1, generated_at: "2026-06-15T06:00:00.000Z",
  regions: { nae: { source_valid_at: "2026-06-15T05:58:00.000Z", prices: { grudge: 100 } } },
  bundles: {},
};

describe("loadPrices", () => {
  it("fetches and returns the payload", async () => {
    const fake = async () => new Response(JSON.stringify(sample), { status: 200 });
    const p = await loadPrices(fake);
    expect(p.regions.nae?.prices.grudge).toBe(100);
  });
  it("throws on non-200", async () => {
    const fake = async () => new Response("nope", { status: 503 });
    await expect(loadPrices(fake)).rejects.toThrow("HTTP 503");
  });
});
