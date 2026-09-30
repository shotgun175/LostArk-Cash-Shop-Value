import { describe, it, expect, beforeEach, vi } from "vitest";

// Same harness as overrides.test.ts: an in-memory Storage installed before the module loads,
// re-imported per case to re-run the constructor's load path.
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

/** An f4 store built fresh from whatever is currently in storage (region: NA). */
async function freshF4() {
  vi.resetModules();
  return (await import("../src/lib/packs/f4.svelte")).f4;
}

beforeEach(() => {
  mem.clear();
});

describe("f4 exchange input load", () => {
  it("seeds 30000 when nothing is stored", async () => {
    expect((await freshF4()).value).toBe(30000);
  });

  it("round-trips a typed value", async () => {
    (await freshF4()).value = 21500;
    expect((await freshF4()).value).toBe(21500);
  });

  it("round-trips 0 instead of reverting to the seed", async () => {
    (await freshF4()).value = 0;
    expect((await freshF4()).value).toBe(0);
  });

  it("falls back to the seed for a negative or non-numeric stored value", async () => {
    mem.setItem("csv.f4.nae", "-5");
    expect((await freshF4()).value).toBe(30000);
    mem.setItem("csv.f4.nae", "abc");
    expect((await freshF4()).value).toBe(30000);
  });
});
