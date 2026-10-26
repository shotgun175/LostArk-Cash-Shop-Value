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
  it("seeds 35000 when nothing is stored", async () => {
    expect((await freshF4()).value).toBe(35000);
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
    expect((await freshF4()).value).toBe(35000);
    mem.setItem("csv.f4.nae", "abc");
    expect((await freshF4()).value).toBe(35000);
  });
});

describe("f4 seed fallback", () => {
  it("is the default with nothing stored, and offers the seed as the box's watermark", async () => {
    const f = await freshF4();
    expect(f.isDefault).toBe(true);
    expect(f.seed).toBe(35000);
    expect(f.value).toBe(35000);
  });

  it("a typed value, 0 included, is not the default, and a reload agrees", async () => {
    const f = await freshF4();
    f.value = 21500;
    expect(f.isDefault).toBe(false);
    expect(mem.getItem("csv.f4.nae")).toBe("21500");
    f.value = 0;
    expect(f.isDefault).toBe(false);
    const again = await freshF4();
    expect(again.value).toBe(0);
    expect(again.isDefault).toBe(false);
  });

  it("typing the seed's own number still saves it as yours", async () => {
    (await freshF4()).value = 35000;
    expect(mem.getItem("csv.f4.nae")).toBe("35000");
    expect((await freshF4()).isDefault).toBe(false);
  });

  it("reset returns the region to the seed and removes the stored key, and a reload agrees", async () => {
    mem.setItem("csv.f4.euc", "30000");
    const f = await freshF4();
    f.value = 21500;
    f.reset();
    expect(f.value).toBe(35000);
    expect(f.isDefault).toBe(true);
    expect(mem.getItem("csv.f4.nae")).toBeNull();
    expect(mem.getItem("csv.f4.euc")).toBe("30000"); // the other region keeps its own value
    const again = await freshF4();
    expect(again.value).toBe(35000);
    expect(again.isDefault).toBe(true);
    expect(again.map.euc).toBe(30000);
  });

  it("a NaN never saves and never counts as your own value", async () => {
    const f = await freshF4();
    f.value = Number.NaN;
    expect(mem.getItem("csv.f4.nae")).toBeNull();
    expect(f.isDefault).toBe(true);
  });

  it("an invalid stored value reads as the default and is left alone until you type", async () => {
    mem.setItem("csv.f4.nae", "-5");
    expect((await freshF4()).isDefault).toBe(true);
    expect(mem.getItem("csv.f4.nae")).toBe("-5");
  });
});
