import { describe, it, expect, beforeEach, vi } from "vitest";

// The web suite runs in node, so there is no DOM localStorage. The store's whole job is the
// persistence round-trip, so it is exercised against a minimal in-memory Storage installed
// before the module is ever imported, and re-imported per case to re-run its load path.
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
  return (await import("../src/lib/packs/hellSettings.svelte")).hellSettings;
}

beforeEach(() => {
  mem.clear();
});

describe("hellSettings", () => {
  it("defaults to the actual-rarity, wealth-off, no-override view", async () => {
    const s = await freshStore();
    expect(s.rarity).toBe("Actual");
    expect(s.wealth).toBe(false);
    expect(s.tapOverride).toEqual({ nae: {}, euc: {} });
  });

  it("round-trips wealth and tap overrides through storage; rarity resets to Actual", async () => {
    const a = await freshStore();
    a.setRarity("Ancient");
    a.setWealth(true);
    a.setTapOverride("nae", { transferred: 1234, target: 20 });
    a.setTapOverride("euc", { circulated: 77, target: "auto" });

    const b = await freshStore();
    // A what-if rarity is a lens, not a preference: every load starts at "Actual".
    expect(b.rarity).toBe("Actual");
    expect(b.wealth).toBe(true);
    expect(b.tapOverride.nae).toEqual({ transferred: 1234, target: 20 });
    expect(b.tapOverride.euc).toEqual({ circulated: 77, target: "auto" });
  });

  it("keeps the two regions' tap overrides independent", async () => {
    const a = await freshStore();
    a.setTapOverride("nae", { transferred: 500 });
    expect(a.tapOverride.euc).toEqual({});

    const b = await freshStore();
    expect(b.tapOverride.nae).toEqual({ transferred: 500 });
    expect(b.tapOverride.euc).toEqual({});
  });

  it("turns wealth back off and remembers that too", async () => {
    const a = await freshStore();
    a.setWealth(true);
    a.setWealth(false);
    expect((await freshStore()).wealth).toBe(false);
  });

  it("tolerates unparseable stored tap overrides", async () => {
    localStorage.setItem("csv.tap.nae", "{not json");
    localStorage.setItem("csv.tap.euc", "null");
    const s = await freshStore();
    expect(s.tapOverride).toEqual({ nae: {}, euc: {} });
    expect(s.rarity).toBe("Actual");
  });

  it("ignores and removes a legacy stored rarity", async () => {
    // An earlier build persisted csv.hellRarity; loads now discard and delete it.
    localStorage.setItem("csv.hellRarity", "Ancient");
    expect((await freshStore()).rarity).toBe("Actual");
    expect(localStorage.getItem("csv.hellRarity")).toBeNull();
  });

  it("refuses to set a rarity that is not an offered option", async () => {
    const s = await freshStore();
    s.setRarity("Epic");
    s.setRarity("Mythic");
    expect(s.rarity).toBe("Epic");
  });

  it("offers Actual plus the seven rarity columns, in game order", async () => {
    vi.resetModules();
    const { RARITY_OPTIONS, REWARD_DATA_VINTAGE } = await import("../src/lib/packs/hellSettings.svelte");
    expect([...RARITY_OPTIONS]).toEqual([
      "Actual",
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Relic",
      "Ancient",
    ]);
    expect(REWARD_DATA_VINTAGE).toBe("sekwahar Season-4 datamine, 2026-07-30");
  });
});
