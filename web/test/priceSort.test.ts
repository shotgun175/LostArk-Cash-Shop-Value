import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "svelte/server";
import { sortPriceRows, loadPriceSort, nextPriceSort, PRICE_SORT_KEY } from "../src/lib/priceSort";
import PriceTable from "../src/lib/components/PriceTable.svelte";
import { app } from "../src/lib/app.svelte";
import { displayName } from "../src/lib/catalog";
import type { PricePayload } from "../src/lib/api";

// Real slugs so displayName() resolves; values chosen so A-Z and gold order disagree.
const PRICES: Record<string, number> = {
  "lavas-breath": 430,
  "abidos-fusion-material": 104,
  "glaciers-breath": 430,
  grudge: 38899,
};
const az = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));

describe("sortPriceRows", () => {
  it("sorts by name A-Z and Z-A", () => {
    const asc = sortPriceRows(PRICES, { key: "name", dir: "asc" }).map(([s]) => displayName(s));
    expect(asc).toEqual(az(asc));
    const desc = sortPriceRows(PRICES, { key: "name", dir: "desc" }).map(([s]) => displayName(s));
    expect(desc).toEqual(az(desc).reverse());
  });

  it("sorts by gold either way, ties always broken A-Z", () => {
    const high = sortPriceRows(PRICES, { key: "gold", dir: "desc" });
    expect(high.map(([, g]) => g)).toEqual([38899, 430, 430, 104]);
    const low = sortPriceRows(PRICES, { key: "gold", dir: "asc" });
    expect(low.map(([, g]) => g)).toEqual([104, 430, 430, 38899]);
    for (const rows of [high, low]) {
      const tied = rows.filter(([, g]) => g === 430).map(([s]) => displayName(s));
      expect(tied).toEqual(az(tied));
    }
  });
});

describe("nextPriceSort", () => {
  it("a new column starts at its natural direction (Item A-Z, Gold highest first)", () => {
    expect(nextPriceSort({ key: "name", dir: "asc" }, "gold")).toEqual({ key: "gold", dir: "desc" });
    expect(nextPriceSort({ key: "gold", dir: "asc" }, "name")).toEqual({ key: "name", dir: "asc" });
  });

  it("clicking the active column flips its direction", () => {
    expect(nextPriceSort({ key: "gold", dir: "desc" }, "gold")).toEqual({ key: "gold", dir: "asc" });
    expect(nextPriceSort({ key: "name", dir: "asc" }, "name")).toEqual({ key: "name", dir: "desc" });
  });
});

// The web suite runs in node (no DOM localStorage), so give the loader a minimal in-memory one.
describe("loadPriceSort", () => {
  beforeEach(() => {
    const map = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to Item A-Z and remembers a stored column and direction", () => {
    expect(loadPriceSort()).toEqual({ key: "name", dir: "asc" });
    localStorage.setItem(PRICE_SORT_KEY, "gold:asc");
    expect(loadPriceSort()).toEqual({ key: "gold", dir: "asc" });
  });

  it("keeps a 1.12.1 choice (stored as a bare column) at that column's natural direction", () => {
    localStorage.setItem(PRICE_SORT_KEY, "gold");
    expect(loadPriceSort()).toEqual({ key: "gold", dir: "desc" });
    localStorage.setItem(PRICE_SORT_KEY, "name");
    expect(loadPriceSort()).toEqual({ key: "name", dir: "asc" });
  });

  it("ignores an unknown stored value", () => {
    localStorage.setItem(PRICE_SORT_KEY, "bogus:up");
    expect(loadPriceSort()).toEqual({ key: "name", dir: "asc" });
  });
});

describe("PriceTable sortable headers", () => {
  it("renders both headers as sort buttons, with an arrow and aria-sort on the active one", () => {
    const payload: PricePayload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { source_valid_at: new Date().toISOString(), prices: PRICES } },
      bundles: {},
    };
    app.region = "nae";
    app.payload = payload;
    app.status = "ok";
    const { body } = render(PriceTable);
    expect(body).toMatch(/<th[^>]*aria-sort="ascending"[^>]*>\s*<button[^>]*>Item[^<]*<span[^>]*>▲<\/span>/);
    expect(body).toMatch(/<th[^>]*aria-sort="none"[^>]*>\s*<button[^>]*>Gold/);
    expect(body).not.toContain("Highest gold"); // the old toggle bar is gone
  });
});
