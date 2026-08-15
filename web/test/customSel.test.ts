import { describe, it, expect, beforeEach, vi } from "vitest";

// Same harness as hellSettings.test.ts: the suite runs in node, so the persistence round-trip
// is exercised against an in-memory Storage installed before the module loads, re-imported per
// case to re-run the constructor's load/validation path.
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
  return (await import("../src/lib/packs/customSel.svelte")).customSel;
}

beforeEach(() => {
  mem.clear();
});

describe("customSel store", () => {
  it("starts empty and round-trips picks through storage", async () => {
    const a = await freshStore();
    expect(a.count()).toBe(0);
    a.set("summer-custom-pack-1", ["A", "B"]);

    const b = await freshStore();
    expect(b.get("summer-custom-pack-1")).toEqual(["A", "B"]);
    expect(b.has("summer-custom-pack-1")).toBe(true);
    expect(b.count()).toBe(1);
  });

  it("toggle adds until the pick cap, then ignores further checks", async () => {
    const s = await freshStore();
    // counted = the effective set the UI shows (default or stored); cap 2.
    s.toggle("p", "A", 2, []);
    expect(s.get("p")).toEqual(["A"]);
    s.toggle("p", "B", 2, ["A"]);
    expect(s.get("p")).toEqual(["A", "B"]);
    // At the cap, checking a third option is a no-op.
    s.toggle("p", "C", 2, ["A", "B"]);
    expect(s.get("p")).toEqual(["A", "B"]);
  });

  it("toggle removes a counted option; unchecking the last one clears the entry (back to defaults)", async () => {
    const s = await freshStore();
    s.set("p", ["A", "B"]);
    s.toggle("p", "B", 2, ["A", "B"]);
    expect(s.get("p")).toEqual(["A"]);
    s.toggle("p", "A", 2, ["A"]);
    // Empty set = no stored entry, which customChosen treats as "use the default top-N".
    expect(s.has("p")).toBe(false);
    expect(s.count()).toBe(0);
  });

  it("clearOne and clearAll drop entries and persist", async () => {
    const a = await freshStore();
    a.set("p1", ["A"]);
    a.set("p2", ["B"]);
    a.clearOne("p1");
    expect(a.has("p1")).toBe(false);
    expect(a.has("p2")).toBe(true);
    a.clearAll();
    const b = await freshStore();
    expect(b.count()).toBe(0);
  });

  it("drops malformed stored values on load instead of poisoning the engine", async () => {
    // A non-array value would throw inside customChosen's filter (white-screening the Packs
    // tab); the load path must keep only well-formed string arrays.
    mem.setItem(
      "csv.customSel",
      JSON.stringify({ good: ["A"], bad: "x", worse: 5, mixed: ["A", 7] }),
    );
    const s = await freshStore();
    expect(s.get("good")).toEqual(["A"]);
    expect(s.has("bad")).toBe(false);
    expect(s.has("worse")).toBe(false);
    expect(s.has("mixed")).toBe(false);

    // Outright junk JSON is ignored wholesale.
    mem.setItem("csv.customSel", "{not json");
    const t = await freshStore();
    expect(t.count()).toBe(0);
  });
});
