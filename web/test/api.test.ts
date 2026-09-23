import { describe, it, expect, vi } from "vitest";
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
  it("gives up after 10 s when the request hangs", async () => {
    vi.useFakeTimers();
    // Fake timers do not drive the native AbortSignal.timeout, so route it onto the fake clock.
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
      const c = new AbortController();
      setTimeout(() => c.abort(new DOMException("timed out", "TimeoutError")), ms);
      return c.signal;
    });
    try {
      // Never answers; rejects only once the request signal aborts.
      const hung = (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)));
      const run = loadPrices(hung);
      expect(timeoutSpy).toHaveBeenCalledWith(10_000);
      const rejected = expect(run).rejects.toThrow("timed out");
      await vi.advanceTimersByTimeAsync(10_000);
      await rejected;
    } finally {
      timeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
