import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "svelte/server";
import MarisShop from "../src/lib/components/packs/MarisShop.svelte";
import { app } from "../src/lib/app.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
import { F4_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import { effectivePrices, layeredPrices } from "../src/lib/packs/prices.svelte";
import { LE_PER_BASIC_POTION, bestToolGoldPerLe, potionDefault } from "../src/lib/packs/lifeEnergy";
import { MARIS_WARES, BC_PER_BUNDLE } from "../src/lib/packs/data/marisShop";
import { formatGold, formatSignedPct } from "../src/lib/format";
import fixture from "./fixtures/tjw-nae-prices.json";

// The Mari's Shop tab, rendered on the server against the shared NA fixture at a 30,000 exchange
// input (gold per BC = 30,000 / 95). The tab reads layeredPrices(), so its two Basic Life Energy
// Potion rows take the logging default (lifeEnergy.ts) or the user's Bonus Room value, footnoted
// because potions are not on the Auction House. Every other row must read as it did when the tab
// read effectivePrices(). (The file name differs from any other test file by more than case.)
const NOW = Date.parse("2026-10-25T12:00:00Z");
const F4 = 30000;
const POTION_X10 = "Basic Life Energy Potion ×10";
const POTION_X15 = "Basic Life Energy Potion ×15";
const POTIONS = [POTION_X10, POTION_X15];
const NOTE_ID = 'id="maris-potion-note"';
const MARKER = /<sup class="fn[^"]*" aria-hidden="true">\*<\/sup>/;
const DEFAULT_NOTE = /Life Energy Potions aren(?:'|&#39;)t on the Auction House, so they(?:'|&#39;)re valued at what 3,000 Life Energy\s+earns logging at live timber prices: <b class="num[^"]*">([\d,]+)<\/b> gold per potion\s+with no tool bonuses \(<b class="num[^"]*">([\d,]+)<\/b> with a best-in-slot tool\)\. A potion\s+value you set on the Bonus Room tab replaces it\./;
const USER_NOTE = /Life Energy Potions aren(?:'|&#39;)t on the Auction House, so they(?:'|&#39;)re valued at your potion value from\s+the Bonus Room tab\./;

// NA live logging mat prices per unit (2026-10-25), as in BonusRoomTab.test.ts. The fixture has none.
const TIMBER = { timber: 0.85, "tender-timber": 1.78, "sturdy-timber": 8.2, "abidos-timber": 9.26 };

function loadFixture(extra: Record<string, number> = {}): void {
  app.region = "nae";
  app.status = "ok";
  app.now = NOW;
  app.payload = {
    schema_version: 1,
    generated_at: new Date(NOW).toISOString(),
    regions: { nae: { prices: { ...fixture.prices, ...extra }, source_valid_at: new Date(NOW).toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
}

function text(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

interface Row {
  html: string;
  cells: string[]; // icon, material, qty, BC cost, cost in gold, AH value, savings
  value: string; // the AH value cell's markup
}

// The table body's rows in data order (the data has two rows each for some slugs, never a repeated name).
function tableRows(body: string): Row[] {
  const tbody = body.split("<tbody>")[1]?.split("</tbody>")[0];
  expect(tbody, "table body").toBeDefined();
  const rows = tbody!.split("<tr").slice(1).map((tr) => {
    const tds = tr.split("<td").slice(1).map((td) => td.split("</td>")[0]);
    return { html: tr, cells: tds.map((td) => text(td.slice(td.indexOf(">") + 1))), value: tds[5] };
  });
  expect(rows).toHaveLength(MARIS_WARES.length);
  return rows;
}

function byName(body: string): Map<string, Row> {
  const rows = tableRows(body);
  return new Map(MARIS_WARES.map((w, i) => [w.name, rows[i]]));
}

// The cells the tab rendered before it read layeredPrices(): straight from effectivePrices().
function oldCells(w: (typeof MARIS_WARES)[number], prices: Record<string, number>): string[] {
  const cost = Math.round(w.bc * (F4 / BC_PER_BUNDLE));
  const unit = w.slug ? (prices[w.slug] ?? 0) : 0;
  const value = w.slug && unit > 0 ? Math.round(unit * w.qty) : null;
  const savings = value == null ? null : value - cost;
  const pct = value == null || cost <= 0 ? null : (value / cost - 1) * 100;
  return [
    "",
    `${w.name} (Bound)`,
    w.qty.toLocaleString("en-US"),
    `${w.wasBc ?? ""}${w.bc} BC`, // the struck-out price, then the price (no space in the markup)
    formatGold(cost),
    value == null ? "no price" : formatGold(value),
    savings == null || pct == null ? "—" : `${formatSignedPct(pct)} (${savings >= 0 ? "+" : "−"}${formatGold(Math.abs(savings))} g)`,
  ];
}

// The potion row's cells given its value: cost, value with the footnote marker, savings and %.
function potionCells(name: string, value: number): string[] {
  const w = MARIS_WARES.find((x) => x.name === name)!;
  const cost = Math.round(w.bc * (F4 / BC_PER_BUNDLE));
  const savings = value - cost;
  const pct = (value / cost - 1) * 100;
  return [
    "",
    `${name} (Bound)`,
    String(w.qty),
    `${w.wasBc ?? ""}${w.bc} BC`, // the struck-out price, then the price (no space in the markup)
    formatGold(cost),
    `${formatGold(value)}*`,
    `${formatSignedPct(pct)} (${savings >= 0 ? "+" : "−"}${formatGold(Math.abs(savings))} g)`,
  ];
}

beforeEach(() => {
  hellSettings.setIncludePheons(false);
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  f4.map = { nae: F4, euc: F4 };
  loadFixture();
});

afterEach(() => {
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  f4.map = { nae: F4_DEFAULT_INPUT, euc: F4_DEFAULT_INPUT };
});

describe("MarisShop", () => {
  it("leaves the potion rows unpriced without timber, and every other row as effectivePrices() values it", () => {
    const body = render(MarisShop).body;
    const rows = byName(body);
    for (const name of POTIONS) {
      const r = rows.get(name)!;
      expect(r.cells[5], name).toBe("no price");
      expect(r.cells[6], name).toBe("—");
      expect(r.html, name).not.toMatch(MARKER);
      expect(r.html, name).not.toContain("aria-describedby");
    }
    expect(body).not.toContain(NOTE_ID);
    expect(body).not.toContain("Life Energy Potions aren");

    const prices = effectivePrices();
    let valued = 0;
    for (const w of MARIS_WARES) {
      if (POTIONS.includes(w.name)) continue;
      const cells = rows.get(w.name)!.cells;
      expect(cells, w.name).toEqual(oldCells(w, prices));
      if (cells[5] !== "no price") valued++;
    }
    // Every AH ware is priced in the fixture (the soaring kit chest alone has no slug), so the
    // comparison above checks real values, not a table of "no price".
    expect(valued).toBe(MARIS_WARES.length - 3);
    expect(rows.get("Stone of Soaring Engraving Setting Kit Chest")!.cells[5]).toBe("no price");
  });

  it("values the potion rows at the logging default with timber prices, footnoted", () => {
    const plain = byName(render(MarisShop).body);
    loadFixture(TIMBER);
    const body = render(MarisShop).body;
    const rows = byName(body);

    // Cross-check against the module: the unrounded default per potion, rounded per row.
    const layered = layeredPrices();
    const def = potionDefault(layered)!;
    expect(def).toBeCloseTo(2264.77, 2);
    expect(layered["basic-life-energy-potion"]).toBe(def);
    expect(Math.round(def * 10)).toBe(22648);
    expect(Math.round(def * 15)).toBe(33972);

    expect(rows.get(POTION_X10)!.cells).toEqual(potionCells(POTION_X10, 22648));
    expect(rows.get(POTION_X15)!.cells).toEqual(potionCells(POTION_X15, 33972));
    expect(rows.get(POTION_X10)!.cells.slice(4)).toEqual(["72,632", "22,648*", "-69% (−49,984 g)"]);
    expect(rows.get(POTION_X15)!.cells.slice(4)).toEqual(["104,211", "33,972*", "-67% (−70,239 g)"]);
    for (const name of POTIONS) {
      expect(rows.get(name)!.value, name).toMatch(MARKER);
      expect(rows.get(name)!.value, name).toContain('aria-describedby="maris-potion-note"');
    }

    expect(body).toContain(NOTE_ID);
    const [, shownDef, shownBest] = body.match(DEFAULT_NOTE) ?? [];
    expect(shownDef).toBe("2,265");
    expect(shownBest).toBe("3,424");
    expect(shownBest).toBe(formatGold(LE_PER_BASIC_POTION * bestToolGoldPerLe(layered)!.goldPerLe));
    expect(body).not.toMatch(USER_NOTE);

    // Timber moves nothing else: every other row's markup is identical to the no-timber render.
    for (const w of MARIS_WARES) {
      if (POTIONS.includes(w.name)) continue;
      expect(rows.get(w.name)!.html, w.name).toBe(plain.get(w.name)!.html);
      expect(rows.get(w.name)!.html, w.name).not.toMatch(MARKER);
    }
    expect((body.match(new RegExp(MARKER, "g")) ?? []).length).toBe(2);
  });

  it("uses the user's potion value over the default and keeps the logging numbers in the footnote", () => {
    loadFixture(TIMBER);
    overrides.set("nae", "basic-life-energy-potion", 5000);
    const body = render(MarisShop).body;
    const rows = byName(body);
    expect(rows.get(POTION_X10)!.cells).toEqual(potionCells(POTION_X10, 50000));
    expect(rows.get(POTION_X15)!.cells).toEqual(potionCells(POTION_X15, 75000));
    expect(rows.get(POTION_X10)!.cells[5]).toBe("50,000*");
    expect(rows.get(POTION_X15)!.cells[5]).toBe("75,000*");
    const [, shownDef, shownBest] = body.match(DEFAULT_NOTE) ?? [];
    expect(shownDef).toBe("2,265");
    expect(shownBest).toBe("3,424");
    expect(body).not.toMatch(USER_NOTE);
  });

  it("uses the user's potion value without timber, with the Bonus Room wording", () => {
    overrides.set("nae", "basic-life-energy-potion", 5000);
    const body = render(MarisShop).body;
    const rows = byName(body);
    expect(rows.get(POTION_X10)!.cells).toEqual(potionCells(POTION_X10, 50000));
    expect(rows.get(POTION_X15)!.cells).toEqual(potionCells(POTION_X15, 75000));
    expect(body).toContain(NOTE_ID);
    expect(body).toMatch(USER_NOTE);
    expect(body).not.toMatch(DEFAULT_NOTE);
    expect(body).not.toContain("2,265");
  });
});
