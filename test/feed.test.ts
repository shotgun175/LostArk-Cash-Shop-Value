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

  it("throws on an oversized chunked body with no content-length (stream cap)", async () => {
    // 6MB in 1MB chunks and no content-length header: the old header-only guard never fired and
    // res.json() buffered the whole body before any row-count truncation could run.
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 6; i++) controller.enqueue(new Uint8Array(1_000_000));
        controller.close();
      },
    });
    const stub = async () => new Response(stream, { status: 200 });
    await expect(fetchRegion("nae", ["grudge"], stub)).rejects.toThrow("body too large");
  });

  it("throws on a malformed content-length instead of bypassing the cap", async () => {
    // NaN > cap is false, so a garbage declared length used to skip the fast-reject entirely.
    const stub = async () =>
      new Response(JSON.stringify([]), { status: 200, headers: { "content-length": "banana" } });
    await expect(fetchRegion("nae", ["grudge"], stub)).rejects.toThrow("body too large");
  });

  it("still parses a normal chunked body under the cap", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify([{ item_slug: "grudge", price: 100, timestamp: 1781506594 }]));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
    const rows = await fetchRegion("nae", ["grudge"], async () => new Response(stream, { status: 200 }));
    expect(rows).toEqual([{ item_slug: "grudge", price: 100, timestamp: 1781506594 }]);
  });
});
