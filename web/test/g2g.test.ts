import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PricePayload } from "../src/lib/api";

// Same harness as f4.test.ts: an in-memory Storage installed before the module loads, re-imported
// per case to re-run the constructor's load path. The app singleton is re-imported in the same
// module cycle, so the payload a case seeds is the one the store reads.
class MemoryStorage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

const mem = new MemoryStorage();
globalThis.localStorage = mem as unknown as Storage;

const NOW = Date.parse("2026-10-25T12:00:00Z");
const HOUR = 3_600_000;

/** A g2g store and app singleton built fresh from whatever is currently in storage (region: NA). */
async function fresh() {
  vi.resetModules();
  const { app } = await import("../src/lib/app.svelte");
  const { g2g } = await import("../src/lib/packs/g2g.svelte");
  app.now = NOW;
  return { app, g2g };
}

/** A payload carrying only the G2G block (NA rate 0.05 stamped `usdAgeMs` ago, EU 0.04 fresh). */
function payload(usdAgeMs: number | null): PricePayload {
  return {
    schema_version: 1,
    generated_at: new Date(NOW).toISOString(),
    regions: {},
    bundles: {},
    g2g: {
      usdPer1kGold: 0.05,
      eurPer1kGold: 0.04,
      ...(usdAgeMs === null ? {} : { usdFetchedAt: new Date(NOW - usdAgeMs).toISOString() }),
      eurFetchedAt: new Date(NOW - 60_000).toISOString(),
    },
  } as unknown as PricePayload;
}

beforeEach(() => {
  mem.clear();
});

describe("g2g override store load", () => {
  it("starts with no override when nothing is stored", async () => {
    const { g2g } = await fresh();
    expect(g2g.override).toBeNull();
    expect(g2g.value).toBeNull(); // no payload yet either
  });

  it("round-trips a typed value per region under csv.g2g.override.<region>", async () => {
    const a = await fresh();
    a.g2g.setFromInput(0.031);
    a.app.region = "euc";
    a.g2g.setFromInput(0.027);
    expect(mem.getItem("csv.g2g.override.nae")).toBe("0.031");
    expect(mem.getItem("csv.g2g.override.euc")).toBe("0.027");
    const b = await fresh();
    b.app.region = "nae";
    expect(b.g2g.override).toBe(0.031);
    b.app.region = "euc";
    expect(b.g2g.override).toBe(0.027);
  });

  it("clears the override (and its key) on 0, a negative or a non-number", async () => {
    const { g2g } = await fresh();
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      g2g.setFromInput(0.031);
      g2g.setFromInput(v);
      expect(g2g.override).toBeNull();
      expect(mem.getItem("csv.g2g.override.nae")).toBeNull();
    }
  });

  it("rejects junk stored values", async () => {
    for (const raw of ["abc", "-1", "0", "Infinity", ""]) {
      mem.setItem("csv.g2g.override.nae", raw);
      expect((await fresh()).g2g.override, raw).toBeNull();
    }
  });

  it("removes the pre-region legacy keys without reading them as overrides", async () => {
    mem.setItem("csv.g2g", "0.03");
    mem.setItem("csv.g2g.override", "0.04");
    const { g2g } = await fresh();
    expect(mem.getItem("csv.g2g")).toBeNull();
    expect(mem.getItem("csv.g2g.override")).toBeNull();
    expect(g2g.override).toBeNull();
  });
});

describe("g2g effective rate", () => {
  it("reads the live rate for the selected region and lets an override win", async () => {
    const { app, g2g } = await fresh();
    app.payload = payload(10 * 60_000);
    expect(g2g.live).toBe(0.05);
    expect(g2g.value).toBe(0.05);
    app.region = "euc";
    expect(g2g.live).toBe(0.04);
    app.region = "nae";
    g2g.setFromInput(0.06);
    expect(g2g.value).toBe(0.06);
    expect(g2g.live).toBe(0.05);
  });
});

describe("g2g stale flag", () => {
  it("is false for a 10 minute old rate and true past 6 h", async () => {
    const { app, g2g } = await fresh();
    app.payload = payload(10 * 60_000);
    expect(g2g.stale).toBe(false);
    expect(g2g.tooltip).toMatch(/^Rate updated /);
    app.payload = payload(7 * HOUR);
    expect(g2g.stale).toBe(true);
    expect(g2g.when).not.toBeNull();
  });

  it("turns stale as app.now advances with no newer payload", async () => {
    const { app, g2g } = await fresh();
    app.payload = payload(10 * 60_000);
    app.now = NOW + 7 * HOUR;
    expect(g2g.stale).toBe(true);
  });

  it("is never stale with an override, or with no stamp to judge", async () => {
    const { app, g2g } = await fresh();
    app.payload = payload(7 * HOUR);
    g2g.setFromInput(0.06);
    expect(g2g.stale).toBe(false);
    g2g.setFromInput(Number.NaN);
    app.payload = payload(null);
    expect(g2g.stale).toBe(false);
    expect(g2g.at).toBeNull();
    expect(g2g.tooltip).toBe("Live exchange rate");
  });
});
