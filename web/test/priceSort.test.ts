import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "svelte/server";
import { sortPriceRows, loadPriceSort } from "../src/lib/priceSort";
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

describe("sortPriceRows", () => {
  it("sorts A-Z by display name", () => {
    const names = sortPriceRows(PRICES, "name").map(([s]) => displayName(s));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts highest gold first, ties broken A-Z", () => {
    const rows = sortPriceRows(PRICES, "gold");
    expect(rows.map(([, g]) => g)).toEqual([38899, 430, 430, 104]);
    const tied = rows.filter(([, g]) => g === 430).map(([s]) => displayName(s));
    expect(tied).toEqual([...tied].sort((a, b) => a.localeCompare(b)));
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

  it("defaults to A-Z and remembers a valid stored choice", () => {
    expect(loadPriceSort()).toBe("name");
    localStorage.setItem("csv.priceSort", "gold");
    expect(loadPriceSort()).toBe("gold");
  });

  it("ignores an unknown stored value", () => {
    localStorage.setItem("csv.priceSort", "bogus");
    expect(loadPriceSort()).toBe("name");
  });
});

describe("PriceTable sort control", () => {
  it("renders both sort options with A-Z pressed by default", () => {
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
    expect(body).toMatch(/aria-pressed="true"[^>]*>A-Z</);
    expect(body).toMatch(/aria-pressed="false"[^>]*>Highest gold</);
  });
});
