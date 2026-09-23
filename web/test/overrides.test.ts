import { describe, it, expect, beforeEach, vi } from "vitest";

// Same harness as customSel.test.ts: an in-memory Storage installed before the module loads,
// re-imported per case to re-run the constructor's load/validation path.
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

/** A store instance built fresh from whatever is currently in storage. */
async function freshStore() {
  vi.resetModules();
  return (await import("../src/lib/packs/overrides.svelte")).overrides;
}

beforeEach(() => {
  mem.clear();
});

describe("overrides store load", () => {
  it("round-trips values it wrote", async () => {
    const a = await freshStore();
    a.set("nae", "abidos-fusion-material", 95.5);
    const b = await freshStore();
    expect(b.forRegion("nae")).toEqual({ "abidos-fusion-material": 95.5 });
  });

  it("rejects a stored array (no phantom override on slug '0')", async () => {
    mem.setItem("csv.ov.nae", "[5]");
    const s = await freshStore();
    expect(s.count("nae")).toBe(0);
  });

  it("drops string values and keeps valid numbers", async () => {
    mem.setItem("csv.ov.nae", JSON.stringify({ a: "abc", b: "12", c: 7 }));
    const s = await freshStore();
    expect(s.forRegion("nae")).toEqual({ c: 7 });
  });

  it("drops negative, non-finite and object values", async () => {
    mem.setItem("csv.ov.euc", '{"a": -1, "b": 1e999, "c": {"x": 1}, "d": 0}');
    const s = await freshStore();
    expect(s.forRegion("euc")).toEqual({ d: 0 });
  });
});
