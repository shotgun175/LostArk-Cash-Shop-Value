import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import ValuesBar from "../src/lib/components/ValuesBar.svelte";
import { app } from "../src/lib/app.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
import { g2g } from "../src/lib/packs/g2g.svelte";
import { valuesBar } from "../src/lib/valuesBarState.svelte";
import { F4_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import fixture from "./fixtures/tjw-nae-prices.json";

// The "Your values" bar, rendered on the server per route against the shared NA fixture (the
// relevance rules are tested in valuesBar.test.ts; this file's name differs by more than case).
// A server render emits no event handlers, so the store writes are tested through the same
// functions the inputs call, and the wiring through the component source. The clock sits inside
// the Autumn Bonus Room. The F4 input is the app's 35,000 seed: 147.06 gold per RC, 368 per BC,
// and 35,000 / 95 x 8.5 x 9 = 28,184 gold per Ability stone or Soaring kit.
const INSIDE = Date.parse("2026-10-25T12:00:00Z");
// NA live logging mat prices per unit (2026-10-25), as in BonusRoomTab.test.ts; the fixture has none.
const TIMBER = { timber: 0.85, "tender-timber": 1.78, "sturdy-timber": 8.2, "abidos-timber": 9.26 };

function loadFixture(extra: Record<string, number> = {}, g2gBlock?: Record<string, unknown>): void {
  app.region = "nae";
  app.status = "ok";
  app.now = INSIDE;
  app.payload = {
    schema_version: 1,
    generated_at: new Date(INSIDE).toISOString(),
    regions: { nae: { prices: { ...fixture.prices, ...extra }, source_valid_at: new Date(INSIDE).toISOString() } },
    bundles: {},
    ...(g2gBlock ? { g2g: g2gBlock } : {}),
  } as unknown as typeof app.payload;
}

/** The bar's markup for `path`, collapsed or open. Read inside: the body renders lazily. */
function bar(path: string, open = false): string {
  valuesBar.setOpen(open);
  return render(ValuesBar, { props: { path } }).body;
}
/** The visible text: tags and comments dropped, whitespace collapsed (alt and title are not text). */
const text = (html: string): string =>
  html.replace(/<!--[^>]*-->/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
/** One chip's markup by a piece of its content. */
function chip(body: string, has: string): string {
  const piece = body.split('<span class="chip').find((p) => p.includes(has));
  expect(piece, `chip with ${has}`).toBeDefined();
  return '<span class="chip' + piece!.split("<button")[0];
}
/** The visible text of the element opened by the first tag carrying `attr`, up to `close`. */
const inner = (html: string, attr: string, close: string): string => {
  const at = html.indexOf(attr);
  expect(at, attr).toBeGreaterThanOrEqual(0);
  return text(html.slice(html.indexOf(">", at) + 1, html.indexOf(close, at)));
};
/** One expanded field's markup by its heading text. */
function field(body: string, heading: string): string {
  const piece = body.split('<div class="field').find((p) => text(p).includes(heading));
  expect(piece, `field "${heading}"`).toBeDefined();
  return '<div class="field' + piece!;
}

beforeEach(() => {
  hellSettings.setIncludePheons(false);
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  f4.map = { nae: F4_DEFAULT_INPUT, euc: F4_DEFAULT_INPUT };
  loadFixture();
});

afterEach(() => {
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  g2g.setFromInput(Number.NaN);
  valuesBar.setOpen(false);
  app.region = "nae";
});

describe("ValuesBar per route (collapsed)", () => {
  it("renders nothing on the Prices tab or an unknown page", () => {
    for (const p of ["/prices", "/nope"]) {
      expect(bar(p), p).not.toContain("Your values");
      expect(bar(p, true), p).not.toContain("Your values");
    }
  });

  it("Packs: exchange, G2G, gem and pheons chips with an Edit button, and no potion", () => {
    const body = bar("/");
    expect(body).toContain('<section class="vb bar');
    expect(text(body)).toBe("Your values 35,000 = 238 no rate Lv. 8 348,000 default Pheons excluded Edit ▾");
    expect(body).toMatch(/<button[^>]*class="btn primary[^"]*"[^>]*aria-expanded="false"/);
    expect(body).toContain("/icons/f4-shop.png");
    expect(body).toContain("/icons/lv-8-gem.png");
    expect(body).toContain("/icons/pheon.png");
    expect(body).not.toContain("/icons/basic-life-energy-potion.png");
  });

  it("shows G2G as its icon only, never the word", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    for (const open of [false, true]) {
      const body = bar("/", open);
      expect(body).toContain("/icons/g2g.png");
      // Not in the text, and not in an attribute either (alt, title, aria-label).
      expect(body).not.toContain("G2G");
    }
    expect(text(chip(bar("/"), "/icons/g2g.png"))).toBe("$2.05 / 100k");
  });

  it("reads 'Pheons included', highlighted, once the setting is on", () => {
    hellSettings.setIncludePheons(true);
    const pheons = chip(bar("/"), "/icons/pheon.png");
    expect(pheons).toMatch(/^[^>]*\bon\b/);
    expect(text(pheons)).toBe("Pheons included");
    expect(chip(bar("/"), "/icons/pheon.png")).not.toContain("Pheons excluded");
  });

  it("dims 'Pheons excluded' while it is off", () => {
    expect(chip(bar("/"), "/icons/pheon.png")).toMatch(/^[^>]*\boff\b/);
  });

  it("drops the gem's default tag for the region's own Lv. 8 price, and uses the EU default in EU", () => {
    overrides.set("nae", "lv-8-gem", 400000);
    expect(text(chip(bar("/"), "/icons/lv-8-gem.png"))).toBe("Lv. 8 400,000");
    app.region = "euc";
    expect(text(chip(bar("/"), "/icons/lv-8-gem.png"))).toBe("Lv. 8 398,000 default");
  });

  it("Mari's Shop: exchange, potion and pheons", () => {
    expect(text(bar("/maris"))).toBe("Your values 35,000 = 238 no value Pheons excluded Edit ▾");
    loadFixture(TIMBER);
    expect(text(chip(bar("/maris"), "/icons/basic-life-energy-potion.png"))).toBe("2,265 default");
    overrides.set("nae", "basic-life-energy-potion", 50);
    expect(text(chip(bar("/maris"), "/icons/basic-life-energy-potion.png"))).toBe("50");
  });

  it("Bonus Room: all five while the room runs, nothing after it", () => {
    expect(text(bar("/bonus-room"))).toBe("Your values 35,000 = 238 no rate Lv. 8 348,000 default no value Pheons excluded Edit ▾");
    app.now = Date.parse("2026-11-19T00:00:00Z");
    expect(bar("/bonus-room")).not.toContain("Your values");
  });

  it("Ark Pass, Jump-Up Boost and Hell Key math show only their own values", () => {
    expect(text(bar("/ark-pass"))).toBe("Your values Lv. 8 348,000 default Edit ▾");
    expect(text(bar("/jump-up"))).toBe("Your values 35,000 = 238 Lv. 8 348,000 default Edit ▾");
    expect(text(bar("/hell-key"))).toBe("Your values 35,000 = 238 Pheons excluded Edit ▾");
  });

  it("says 'not set' for a cleared exchange box", () => {
    f4.value = Number.NaN;
    expect(text(chip(bar("/hell-key"), "/icons/f4-shop.png"))).toBe("not set");
  });
});

describe("ValuesBar expanded", () => {
  it("opens one card with a field per value the page uses, a Done button and the region footer", () => {
    const body = bar("/maris", true);
    expect(body).toContain('<section class="vb card');
    expect(body).not.toContain('class="vb bar');
    expect(body).toMatch(/<button[^>]*aria-expanded="true"[^>]*>Done/);
    expect(body).toContain('id="vb-f4"');
    expect(body).toContain('id="vb-potion"');
    expect(body).toContain('aria-labelledby="vb-pheons-label"');
    expect(body).not.toContain('id="vb-g2g"');
    expect(body).not.toContain('id="vb-gem"');
    expect(text(body)).toContain("Saved for NA. Shared with every tab that uses them.");
    app.region = "euc";
    expect(text(bar("/maris", true))).toContain("Saved for EU. Shared with every tab that uses them.");
  });

  it("Packs opens exchange, G2G, gem and pheons; Jump-Up opens exchange and gem", () => {
    const packs = bar("/", true);
    for (const id of ['id="vb-f4"', 'id="vb-g2g"', 'id="vb-gem"', 'aria-labelledby="vb-pheons-label"']) expect(packs).toContain(id);
    expect(packs).not.toContain('id="vb-potion"');
    const ju = bar("/jump-up", true);
    expect(ju).toContain('id="vb-f4"');
    expect(ju).toContain('id="vb-gem"');
    expect(ju).not.toContain('id="vb-g2g"');
    expect(ju).not.toContain("vb-pheons-label");
  });

  it("exchange: the F4 input with = 238 RC, and gold per RC and per BC", () => {
    const f = field(bar("/hell-key", true), "Currency exchange (F4)");
    expect(f).toContain("/icons/f4-shop.png");
    expect(f).toMatch(/id="vb-f4"[^>]*value="35000"/);
    expect(text(f)).toBe("Currency exchange (F4) = 238 147.06 per , 368 per");
    expect(f).toContain('alt="RC"');
    expect(f).toContain('alt="BC"');
  });

  it("G2G: the per-1k input, the per-100k readout and a hint, without the word", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    const f = field(bar("/", true), "Real-money gold price");
    expect(f).toMatch(/id="vb-g2g"[^>]*value="0.0205"/);
    expect(text(f)).toBe("Real-money gold price $ per 1k = $2.05 / 100k Your own rate wins; clear the box to use the live rate.");
    expect(f).toMatch(/<img class="g2g[^"]*" src="\/icons\/g2g.png" alt="" title="Rate updated [^"]+"/);
  });

  it("gem: the Lv. 8 input with the regional default as placeholder, and the effective lower levels", () => {
    const f = field(bar("/", true), "Lv. 8 gem price");
    expect(f).toMatch(/id="vb-gem"[^>]*placeholder="348000"[^>]*value=""/);
    // 348,000 / 3, / 243, / 729, / 2,187.
    expect(inner(f, 'id="vb-gem-levels"', "</ul>")).toBe("Lv. 7 116,000 Lv. 3 1,432 Lv. 2 477 Lv. 1 159");
    expect(f).not.toContain("(your edit)");
    app.region = "euc";
    expect(field(bar("/", true), "Lv. 8 gem price")).toMatch(/id="vb-gem"[^>]*placeholder="398000"/);
  });

  it("gem: shows the user's Lv. 8 price, and a per-level edit with a reset button", () => {
    overrides.set("nae", "lv-8-gem", 400000);
    overrides.set("nae", "lv-3-gem", 1500);
    const f = field(bar("/", true), "Lv. 8 gem price");
    expect(f).toMatch(/id="vb-gem"[^>]*value="400000"/);
    const levels = inner(f, 'id="vb-gem-levels"', "</ul>");
    expect(levels).toBe("Lv. 7 133,333 Lv. 3 1,500 (your edit) reset Lv. 2 549 Lv. 1 183");
    expect((f.match(/class="reset/g) ?? []).length).toBe(1);
    // An old Lv. 3 edit from the Bonus Room's former Lv. 7 box shows the same way in EU.
    app.region = "euc";
    overrides.set("euc", "lv-3-gem", 150000 / 81);
    expect(text(field(bar("/", true), "Lv. 8 gem price"))).toContain("Lv. 3 1,852 (your edit) reset");
  });

  it("potion: the default as placeholder and both logging values in the hint", () => {
    loadFixture(TIMBER);
    const f = field(bar("/maris", true), "Life Energy Potion value");
    expect(f).toContain("/icons/basic-life-energy-potion.png");
    expect(f).toMatch(/id="vb-potion"[^>]*aria-describedby="vb-potion-hint vb-potion-note"[^>]*placeholder="2265"[^>]*value=""/);
    // The best-in-slot all-in-one tool: 3,000 x 1.141325... = 3,423.98 gold; the hover text
    // carries the gold per LE and the tool's five lines.
    const [, title, hint] = f.match(/id="vb-potion-hint" title="([^"]*)">([\s\S]*?)<\/p>/) ?? [];
    expect(title).toBe(
      "Logging at live timber prices: 3,000 LE × 0.755 gold per LE with no tool bonuses, or × 1.141 with a best-in-slot all-in-one tool (Rare, Treasure Attempt, Kick Reward, All Materials Drop and Kick Attempt at max rolls).",
    );
    expect(text(hint)).toBe("No tool bonuses (default): 2,265 per potion Best-in-slot tool: 3,424 per potion");
    expect(text(f)).toContain(
      "The default is what 3,000 Life Energy earns logging at live timber prices (Lv. 70 Logging, Relic charm, no tool bonuses). Clear the box to go back to it.",
    );
  });

  it("potion: a typed value fills the box and keeps both logging values in the hint", () => {
    loadFixture(TIMBER);
    overrides.set("nae", "basic-life-energy-potion", 50);
    const f = field(bar("/bonus-room", true), "Life Energy Potion value");
    expect(f).toMatch(/id="vb-potion"[^>]*value="50"/);
    expect(text(f)).toContain("No tool bonuses (default): 2,265 per potion Best-in-slot tool: 3,424 per potion");
  });

  it("potion: no hint and a plain note without timber prices", () => {
    const f = field(bar("/maris", true), "Life Energy Potion value");
    expect(f).not.toContain("vb-potion-hint");
    expect(f).toMatch(/id="vb-potion"[^>]*placeholder="Your value"/);
    expect(text(f)).toContain("Gold per potion. Leave empty for no price; 0 counts as zero.");
  });

  it("pheons: an Excluded / Included switch and the per-stone value from the exchange", () => {
    const f = field(bar("/hell-key", true), "Pheons");
    expect(f).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Excluded<\/button>/);
    expect(f).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Included<\/button>/);
    expect(inner(f, 'id="vb-pheons-hint"', "</p>")).toBe(
      "Ability stones can't be traded, so they count as 0 gold while pheons are excluded. Included, each counts as 9 pheons: 28,184 at 8.5 BC per pheon and your exchange rate. Including them raises every Hell and Netherworld Key value, and every pack holding a key, several times over.",
    );
    hellSettings.setIncludePheons(true);
    const on = field(bar("/hell-key", true), "Pheons");
    expect(on).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Excluded<\/button>/);
    expect(on).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Included<\/button>/);
  });

  it("pheons: names the Soaring kits where they appear, and a user pheon price as the source", () => {
    overrides.set("nae", "pheon", 2000);
    expect(text(field(bar("/maris", true), "Pheons"))).toContain(
      "Stone of Soaring kits can't be traded, so they count as 0 gold while pheons are excluded. Included, each counts as 9 pheons: 18,000 at your own pheon price.",
    );
    expect(text(field(bar("/bonus-room", true), "Pheons"))).toContain("Stone of Soaring kits can't be traded");
    expect(text(field(bar("/", true), "Pheons"))).toContain("Ability stones can't be traded");
  });

  it("pheons: says pheons have no price with no exchange rate and no pheon price", () => {
    f4.value = 0;
    expect(text(field(bar("/hell-key", true), "Pheons"))).toContain(
      "Included, each counts as 9 pheons, but pheons have no price until you set an exchange rate or your own pheon price.",
    );
  });
});

// A frozen G2G rate (the pinned offer stopped matching, so usdFetchedAt stops advancing) must not
// read as live: past 6 h the readout turns amber and the open card says when the rate is from. A
// typed override is the user's own number, so it never shows the cue. (Moved from the Packs tab.)
describe("ValuesBar stale G2G rate", () => {
  function seedG2g(ageMinutes: number): void {
    loadFixture({}, { usdPer1kGold: 0.05, usdFetchedAt: new Date(INSIDE - ageMinutes * 60_000).toISOString() });
  }
  const staleReadout = /<b class="num[^"]*\bstale\b/;

  it("marks a 7 h old rate stale and says when it is from", () => {
    seedG2g(7 * 60);
    expect(bar("/")).toMatch(staleReadout);
    const open = bar("/", true);
    expect(open).toMatch(staleReadout);
    expect(open).toContain("rate from");
  });

  it("turns stale as time passes with no newer payload (our API unreachable)", () => {
    seedG2g(10);
    app.now = INSIDE + 7 * 3_600_000;
    const open = bar("/", true);
    expect(open).toMatch(staleReadout);
    expect(open).toContain("rate from");
  });

  it("shows neither for a 10 minute old rate", () => {
    seedG2g(10);
    const open = bar("/", true);
    expect(open).not.toMatch(staleReadout);
    expect(open).not.toContain("rate from");
  });

  it("shows neither when the region has a stored override", () => {
    seedG2g(7 * 60);
    g2g.setFromInput(0.06);
    const open = bar("/", true);
    expect(open).not.toMatch(staleReadout);
    expect(open).not.toContain("rate from");
    expect(open).toContain('value="0.06"');
  });
});

describe("ValuesBar writes", () => {
  it("Edit and Done toggle the bar and remember it", () => {
    const writes: string[] = [];
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: (k: string, v: string) => writes.push(`${k}=${v}`),
      removeItem: () => {},
    });
    try {
      valuesBar.setOpen(true);
      expect(valuesBar.open).toBe(true);
      expect(render(ValuesBar, { props: { path: "/" } }).body).toContain(">Done");
      valuesBar.setOpen(false);
      expect(valuesBar.open).toBe(false);
      expect(render(ValuesBar, { props: { path: "/" } }).body).toContain(">Edit");
      expect(writes).toEqual(["csv.valuesBar.open=1", "csv.valuesBar.open=0"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("opens on load when the viewer left it open, and stays closed by default", async () => {
    for (const [stored, open] of [["1", true], ["0", false], [null, false]] as const) {
      vi.resetModules();
      vi.stubGlobal("localStorage", { getItem: (k: string) => (k === "csv.valuesBar.open" ? stored : null), setItem: () => {}, removeItem: () => {} });
      try {
        const fresh = await import("../src/lib/valuesBarState.svelte");
        expect(fresh.valuesBar.open, String(stored)).toBe(open);
      } finally {
        vi.unstubAllGlobals();
      }
    }
  });

  it("the gem box writes the region's lv-8-gem override and clears it when emptied", () => {
    valuesBar.writeOverride("lv-8-gem", "400000");
    expect(overrides.forRegion("nae")["lv-8-gem"]).toBe(400000);
    expect(overrides.has("euc", "lv-8-gem")).toBe(false);
    valuesBar.writeOverride("lv-8-gem", "-1"); // a negative number never saves
    expect(overrides.forRegion("nae")["lv-8-gem"]).toBe(400000);
    valuesBar.writeOverride("lv-8-gem", "", true); // half-typed: keep the last value
    expect(overrides.forRegion("nae")["lv-8-gem"]).toBe(400000);
    valuesBar.writeOverride("lv-8-gem", "");
    expect(overrides.has("nae", "lv-8-gem")).toBe(false);
  });

  it("the potion box writes the potion override, 0 included", () => {
    valuesBar.writeOverride("basic-life-energy-potion", "0");
    expect(overrides.forRegion("nae")["basic-life-energy-potion"]).toBe(0);
    valuesBar.writeOverride("basic-life-energy-potion", "");
    expect(overrides.has("nae", "basic-life-energy-potion")).toBe(false);
  });

  it("renders without writing anything", () => {
    const writes: string[] = [];
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: (k: string) => writes.push(k), removeItem: (k: string) => writes.push(k) });
    try {
      const before = JSON.stringify(overrides.map);
      for (const p of ["/", "/maris", "/bonus-room", "/jump-up", "/hell-key"]) {
        render(ValuesBar, { props: { path: p } });
      }
      expect(JSON.stringify(overrides.map)).toBe(before);
      expect(writes).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("wires each input to its store, writing only from events, with no mount-time hook", () => {
    // A server render runs no handlers, $effect or onMount, so check the source: each value box
    // writes from its input event only (DECISIONS 2026-10-25), and the switch and the buttons
    // call their store setters.
    const src = readFileSync(new URL("../src/lib/components/ValuesBar.svelte", import.meta.url), "utf-8");
    expect(src).not.toMatch(/\$effect|onMount|beforeUpdate|afterUpdate|bind:value/);
    expect(src).toContain("oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)}");
    expect(src).toContain("oninput={(e) => g2g.setFromInput(e.currentTarget.valueAsNumber)}");
    expect(src).toContain("oninput={(e) => valuesBar.writeOverride(GEM_LV8_SLUG, e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("oninput={(e) => valuesBar.writeOverride(LIFE_ENERGY_POTION, e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("onclick={() => hellSettings.setIncludePheons(false)}>Excluded</button>");
    expect(src).toContain("onclick={() => hellSettings.setIncludePheons(true)}>Included</button>");
    expect(src).toContain("onclick={() => valuesBar.setOpen(true)}>Edit");
    expect(src).toContain("onclick={() => valuesBar.setOpen(false)}>Done");
    expect(src).toContain("onclick={() => overrides.clear(region, l.slug!)}>reset</button>");
    expect(src.match(/overrides\.(set|clear)\(/g)).toHaveLength(1); // only the per-level reset
  });
});
