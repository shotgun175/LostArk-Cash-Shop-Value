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

// Clearing storage also resets Include pheons: every case builds a fresh store from it.
beforeEach(() => {
  mem.clear();
});

describe("hellSettings", () => {
  it("defaults to the actual-rarity, wealth-off, no-override, pheons-excluded view", async () => {
    const s = await freshStore();
    expect(s.rarity).toBe("Actual");
    expect(s.wealth).toBe(false);
    expect(s.tapOverride).toEqual({ nae: {}, euc: {} });
    expect(s.includePheons).toBe(false);
  });

  it("round-trips wealth, Include pheons and tap overrides through storage; rarity resets to Actual", async () => {
    const a = await freshStore();
    a.setRarity("Ancient");
    a.setWealth(true);
    a.setIncludePheons(true);
    a.setTapOverride("nae", { transferred: 1234, target: 20 });
    a.setTapOverride("euc", { circulated: 77, target: "auto" });
    expect(localStorage.getItem("csv.hellPheons")).toBe("1");

    const b = await freshStore();
    // A what-if rarity is a lens, not a preference: every load starts at "Actual".
    expect(b.rarity).toBe("Actual");
    expect(b.wealth).toBe(true);
    expect(b.includePheons).toBe(true);
    expect(b.tapOverride.nae).toEqual({ transferred: 1234, target: 20 });
    expect(b.tapOverride.euc).toEqual({ circulated: 77, target: "auto" });
  });

  it("turns Include pheons back off and remembers that too", async () => {
    const a = await freshStore();
    a.setIncludePheons(true);
    a.setIncludePheons(false);
    expect(localStorage.getItem("csv.hellPheons")).toBe("0");
    expect((await freshStore()).includePheons).toBe(false);
  });

  it("reads anything but a stored \"1\" as Include pheons off", async () => {
    localStorage.setItem("csv.hellPheons", "true");
    expect((await freshStore()).includePheons).toBe(false);
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

  it("drops negative, cleared and non-numeric stored tap prices but keeps the rest", async () => {
    // A cleared override field is NaN in memory, which JSON persists as null; a reload must
    // land unchecked instead of ticked-with-a-blank-field. Negatives never survive either.
    localStorage.setItem("csv.tap.nae", JSON.stringify({ transferred: -5, circulated: null, target: 20 }));
    localStorage.setItem("csv.tap.euc", JSON.stringify({ transferred: "9", circulated: 40 }));
    const s = await freshStore();
    expect(s.tapOverride.nae).toEqual({ target: 20 });
    expect(s.tapOverride.euc).toEqual({ circulated: 40 });
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
