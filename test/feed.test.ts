import { describe, it, expect } from "vitest";
import { fetchRegion } from "../src/feed";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("fetchRegion", () => {
  it("posts region_slug + item_slugs and parses rows", async () => {
    let capturedBody: unknown;
    const stub = async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse([{ item_slug: "grudge", price: 100, timestamp: 1781506594 }]);
    };
    const rows = await fetchRegion("nae", ["grudge"], stub);
    expect(capturedBody).toEqual({ region_slug: "nae", item_slugs: ["grudge"] });
    expect(rows).toEqual([{ item_slug: "grudge", price: 100, timestamp: 1781506594 }]);
  });

  it("throws on a non-200 response", async () => {
    const stub = async () => new Response("nope", { status: 502 });
    await expect(fetchRegion("nae", ["grudge"], stub)).rejects.toThrow("HTTP 502");
  });

  it("throws when the body is not an array", async () => {
    const stub = async () => jsonResponse({ error: "bad" });
    await expect(fetchRegion("nae", ["grudge"], stub)).rejects.toThrow("not an array");
  });
});
