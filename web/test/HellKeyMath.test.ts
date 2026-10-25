import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "svelte/server";
import HellKeyMath from "../src/lib/components/packs/HellKeyMath.svelte";
import HellFloorChests from "../src/lib/components/packs/HellFloorChests.svelte";
import PheonPanel from "../src/lib/components/packs/PheonPanel.svelte";
import { app } from "../src/lib/app.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
import { hellKeyBreakdown, type FloorBreakdown } from "../src/lib/packs/ev";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import fixture from "./fixtures/tjw-nae-prices.json";

// The singletons persist across cases within this file, so every case starts from the same
// fresh NA snapshot with no tap or price overrides and Include pheons off. The default tier is
// the newest (1750), whose "Prices used" table carries the Transferred tap and superior fusions.
// No localStorage in node, so the F4 input sits at its 30,000 seed: 30,000 / 95 gold per BC x
// 8.5 BC per pheon x 9 pheons = 24,158 gold per Ability stone (rounded).
beforeEach(() => {
  app.region = "nae";
  app.status = "ok";
  app.now = Date.now();
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
  hellSettings.setTapOverride("nae", {});
  hellSettings.setIncludePheons(false);
  overrides.clearAll("nae");
});

/** The "Prices used" rows for one reward column, across every rendered key card. */
function sourceRows(body: string, column: string): string[] {
  return (body.match(/<tr[\s\S]*?<\/tr>/g) ?? []).filter((r) => r.includes(`>${column}</td>`) && r.includes("src-"));
}

describe("HellKeyMath prices used", () => {
  it("labels market and computed prices live by default", () => {
    const { body } = render(HellKeyMath);
    const taps = sourceRows(body, "Free taps");
    const fusions = sourceRows(body, "Fusions");
    expect(taps.length).toBeGreaterThan(0);
    expect(fusions.length).toBeGreaterThan(0);
    for (const r of [...taps, ...fusions]) expect(r).toContain(">live</span>");
  });

  it("labels an overridden Free taps price as an override", () => {
    hellSettings.setTapOverride("nae", { transferred: 1234 });
    const { body } = render(HellKeyMath);
    const taps = sourceRows(body, "Free taps");
    expect(taps.length).toBeGreaterThan(0);
    for (const r of taps) {
      expect(r).toContain("src-override");
      expect(r).toContain(">override</span>");
      expect(r).toContain("1,234");
    }
    // Only the tap row moved: a market-priced row keeps its live label.
    for (const r of sourceRows(body, "Fusions")) expect(r).toContain(">live</span>");
  });

  it("keeps a cleared tap override field labelled live", () => {
    hellSettings.setTapOverride("nae", { transferred: NaN });
    const { body } = render(HellKeyMath);
    for (const r of sourceRows(body, "Free taps")) expect(r).toContain(">live</span>");
  });

  it("labels a reward priced by a Packs-page override as an override", () => {
    overrides.set("nae", "superior-abidos-fusion-material", 1);
    const { body } = render(HellKeyMath);
    const fusions = sourceRows(body, "Fusions");
    expect(fusions.length).toBeGreaterThan(0);
    for (const r of fusions) expect(r).toContain(">override</span>");
    for (const r of sourceRows(body, "Free taps")) expect(r).toContain(">live</span>");
  });

  it("ignores the other region's overrides", () => {
    hellSettings.setTapOverride("euc", { transferred: 1234 });
    overrides.set("euc", "superior-abidos-fusion-material", 1);
    try {
      const { body } = render(HellKeyMath);
      expect(body).not.toContain("src-override");
    } finally {
      hellSettings.setTapOverride("euc", {});
      overrides.clearAll("euc");
    }
  });
});

describe("HellKeyMath Include pheons", () => {
  const box = /<input type="checkbox"[^>]*aria-describedby="pheon-help-hell"[^>]*>/;
  // The PheonPanel's markup, from its price line's opening div up to its help text.
  const panel = (body: string): string =>
    body.slice(body.lastIndexOf('<div class="line', body.indexOf("Ability stone (9 pheons)")), body.indexOf('id="pheon-help-hell"'));

  it("lists Ability stones as excluded and renders the box unchecked by default", () => {
    const { body } = render(HellKeyMath);
    const rows = sourceRows(body, "Ability stones");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r).toContain("pheon x 9");
      expect(r).toContain(">excluded</span>");
    }
    expect(body).toContain("Include pheons");
    expect(body.match(box)?.[0]).not.toContain("checked");
    // The panel still shows what a stone would be worth, dimmed while the box is off.
    expect(panel(body)).toContain("24,158");
    expect(panel(body)).toMatch(/class="line[^"]*\boff\b/);
    expect(panel(body)).not.toContain("no exchange rate");
    // The intro states the zero-gold offer rule.
    expect(body.replace(/\s+/g, " ")).toContain(
      "Each floor offers 3 chests (with a 5% chance of a 4th) and you keep the best one. Any chest on the floor can be offered, even one worth no gold, so a worthless chest can take a slot.",
    );
  });

  it("prices Ability stones off the exchange rate when on", () => {
    hellSettings.setIncludePheons(true);
    const { body } = render(HellKeyMath);
    expect(body.match(box)?.[0]).toContain("checked");
    expect(panel(body)).not.toMatch(/class="line[^"]*\boff\b/);
    const rows = sourceRows(body, "Ability stones");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r).toContain(">exchange</span>");
      expect(r).toContain("24,158");
    }
  });

  it("labels a user pheon price as an override when on, and keeps the row excluded when off", () => {
    overrides.set("nae", "pheon", 2000);
    const off = render(HellKeyMath).body;
    expect(panel(off)).toContain(">override</span>");
    for (const r of sourceRows(off, "Ability stones")) expect(r).toContain(">excluded</span>");
    hellSettings.setIncludePheons(true);
    const on = sourceRows(render(HellKeyMath).body, "Ability stones");
    expect(on.length).toBeGreaterThan(0);
    for (const r of on) {
      expect(r).toContain(">override</span>");
      expect(r).toContain("18,000"); // 9 x 2,000
    }
  });

  it("raises every key card's EV when on", () => {
    const evs = (body: string): number[] =>
      [...body.matchAll(/<span class="ev num accent[^"]*">([\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, "")));
    const off = evs(render(HellKeyMath).body);
    hellSettings.setIncludePheons(true);
    const on = evs(render(HellKeyMath).body);
    expect(off.length).toBe(4);
    expect(on.length).toBe(4);
    on.forEach((v, i) => expect(v).toBeGreaterThan(off[i]));
  });

  it("flags a missing exchange rate and points at the Packs tab", () => {
    const seed = f4.value;
    f4.value = 0;
    try {
      hellSettings.setIncludePheons(true);
      const { body } = render(HellKeyMath);
      expect(panel(body)).toContain(">no exchange rate</span>");
      expect(body).toContain("Set an F4 exchange rate on the Packs tab to price pheons.");
      // No price at all: the prices-used row falls to the no-data source.
      for (const r of sourceRows(body, "Ability stones")) expect(r).toContain('src-—');
    } finally {
      f4.value = seed;
    }
  });
});

describe("PheonPanel copy", () => {
  const help = (body: string): string =>
    (body.match(/<p class="help[^"]*" id="pheon-help-[a-z]+">([\s\S]*?)<\/p>/)?.[1] ?? "").replace(/<!--[^>]*-->/g, "").replace(/\s+/g, " ").trim();
  const HELL =
    "Ability stones can't be traded, so they count as 0 gold by default. Turn this on to value each one at 9 pheons (a pheon is 8.5 Blue Crystals at your F4 exchange rate). At today's rate that makes ability stones the best chest on most floors, so every Hell and Netherworld Key value, and every pack holding a key, rises several times over.";

  it("renders the Hell Key help text, plus the Bonus Room sentence in that context", () => {
    expect(help(render(PheonPanel).body)).toBe(HELL);
    expect(help(render(PheonPanel, { props: { context: "bonus" } }).body)).toBe(
      `${HELL} On this tab the same setting values the Stone of Soaring Engraving Setting Kit at 9 pheons (0 when off).`,
    );
  });

  it("points at the right F4 input when there is no exchange rate", () => {
    const seed = f4.value;
    f4.value = 0;
    try {
      expect(help(render(PheonPanel).body)).toBe(`${HELL} Set an F4 exchange rate on the Packs tab to price pheons.`);
      expect(help(render(PheonPanel, { props: { context: "bonus" } }).body)).toBe(
        `${HELL} On this tab the same setting values the Stone of Soaring Engraving Setting Kit at 9 pheons (0 when off). Set an F4 exchange rate above to price pheons.`,
      );
    } finally {
      f4.value = seed;
    }
  });
});

describe("HellKeyMath sub-1730 Astrogem chests source", () => {
  it("tags the baked rare-epic-astrogem box flat, not live", () => {
    // The 1700 tier carries the "Astrogem chests" column. layeredPrices() supplies its slug from
    // BAKED only: a fixed seed, not a market price.
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (k === "csv.hellTier" ? "1700" : null),
      setItem: () => {},
      removeItem: () => {},
    });
    try {
      const rows = sourceRows(render(HellKeyMath).body, "Astrogem chests");
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r).toContain(">flat</span>");
        expect(r).toContain("3,750");
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("HellFloorChests zero-gold offers", () => {
  const floorOf = (range: string): FloorBreakdown =>
    hellKeyBreakdown("hell-key-of-destiny-vi", buildPriceMap(fixture.prices as Record<string, number>))!.floors.find(
      (f) => f.range === range,
    )!;
  const bodyRows = (body: string): string[] =>
    (body.slice(body.indexOf("<tbody")).match(/<tr[\s\S]*?<\/tr>/g) ?? []);

  it("lists a 0-gold chest dimmed, with its note and no crown; the best row keeps the crown", () => {
    const { body } = render(HellFloorChests, { props: { floor: floorOf("50 - 59"), wealth: false } });
    const rows = bodyRows(body);
    const stones = rows.find((r) => r.includes("Ability stones"))!;
    expect(stones).toMatch(/<tr class="[^"]*\bzero\b/);
    expect(stones).not.toMatch(/<tr class="[^"]*\bbest\b/);
    expect(stones).not.toContain("👑");
    expect(stones).toContain("Pheons excluded");
    expect(rows[0]).toContain("👑");
    expect(rows[0]).toMatch(/<tr class="[^"]*\bbest\b/);
    expect(rows[0]).not.toMatch(/<tr class="[^"]*\bzero\b/);
  });

  it("never crowns a floor whose every offer is worth 0", () => {
    const f = floorOf("50 - 59");
    const allZero: FloorBreakdown = { ...f, candidates: f.candidates.map((c) => ({ ...c, gold: 0 })) };
    const { body } = render(HellFloorChests, { props: { floor: allZero, wealth: false } });
    expect(body).not.toContain("👑");
    expect(body).not.toMatch(/<tr class="[^"]*\bbest\b/);
  });

  it("says so when a floor has no chests", () => {
    const empty: FloorBreakdown = { ...floorOf("50 - 59"), candidates: [] };
    expect(render(HellFloorChests, { props: { floor: empty, wealth: false } }).body).toContain("No chests on this floor.");
  });
});

describe("HellKeyMath prices live note", () => {
  it("says prices are live for a fresh snapshot", () => {
    expect(render(HellKeyMath).body).toContain("prices live");
  });

  it("drops the claim once the snapshot is past the stale line", () => {
    // Every poll failing leaves status "ok" with the old payload; only the clock moves.
    app.now = Date.now() + 2 * 3_600_000;
    expect(render(HellKeyMath).body).not.toContain("prices live");
  });

  it("drops the claim when the region has no snapshot", () => {
    app.region = "euc";
    try {
      expect(render(HellKeyMath).body).not.toContain("prices live");
    } finally {
      app.region = "nae";
    }
  });
});
