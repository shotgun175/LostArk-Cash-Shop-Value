import { describe, it, expect, beforeEach, vi } from "vitest";
import { ARK_PASS_SEASON_ID } from "../src/lib/packs/data/arkPass";

// Same harness as customSel.test.ts: the suite runs in node, so the persistence round-trip is
// exercised against an in-memory Storage installed before the module loads, re-imported per case
// to re-run the constructor's load path.
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
  return (await import("../src/lib/packs/arkSelection.svelte")).arkSelection;
}

beforeEach(() => {
  mem.clear();
});

describe("arkSelection store", () => {
  it("round-trips picks made this season", async () => {
    const a = await freshStore();
    a.set(2, "destiny-guardian-stone");
    const b = await freshStore();
    expect(b.get(2)).toBe("destiny-guardian-stone");
    expect(b.count()).toBe(1);
  });

  it("drops picks saved before picks were stamped with a season", async () => {
    // The pre-2026-09-19 format: a bare level -> slug map (Wanderer's season picks).
    mem.setItem("csv.arkpick", JSON.stringify({ 2: "refined-protection-stone", 5: "solar-grace" }));
    const s = await freshStore();
    expect(s.count()).toBe(0);
    expect(mem.getItem("csv.arkpick")).toBeNull();
  });

  it("drops picks saved during a different season", async () => {
    mem.setItem("csv.arkpick", JSON.stringify({ season: "some-older-season", picks: { 2: "destiny-guardian-stone" } }));
    const s = await freshStore();
    expect(s.count()).toBe(0);
    expect(mem.getItem("csv.arkpick")).toBeNull();
  });

  it("stamps saved picks with the current season", async () => {
    const s = await freshStore();
    s.set(3, "lavas-breath");
    expect(JSON.parse(mem.getItem("csv.arkpick")!)).toEqual({ season: ARK_PASS_SEASON_ID, picks: { 3: "lavas-breath" } });
  });
});
