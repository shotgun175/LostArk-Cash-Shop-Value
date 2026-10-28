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
import { VALUE_KEYS, type ValueKey } from "../src/lib/valuesBar";
import fixture from "./fixtures/tjw-nae-prices.json";

// The "Your values" bar, rendered on the server per route against the shared NA fixture (the
// relevance rules are tested in valuesBar.test.ts; this file's name differs by more than case).
// A server render emits no event handlers, so the store writes are tested through the same
// functions the inputs call, and the wiring through the component source (the popover's click,
// Escape and focus behavior is checked in a real browser). The clock sits inside the Autumn Bonus
// Room. The F4 input is the app's 35,000 seed: 147.06 gold per RC, 368 per BC, and
// 35,000 / 95 x 8.5 x 9 = 28,184 gold per Ability stone or Soaring kit.
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

/** The bar's markup for `path`, with `open`'s popover open or none. Read inside: the body renders lazily. */
function bar(path: string, open: ValueKey | null = null): string {
  if (open) valuesBar.open(open, path);
  else valuesBar.close();
  return render(ValuesBar, { props: { path } }).body;
}
/** The visible text: tags, comments and screen-reader-only spans dropped, whitespace collapsed (alt and title are not text). */
const text = (html: string): string =>
  html.replace(/<!--[^>]*-->/g, "").replace(/<span class="vh[^"]*">[^<]*<\/span>/g, " ").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
/** Every chip button's markup, in order. */
const chips = (body: string): string[] =>
  body
    .split("<button")
    .filter((p) => /^[^>]*class="chip/.test(p))
    .map((p) => "<button" + p.slice(0, p.indexOf("</button>")));
/** One chip's markup by a piece of its content. */
function chip(body: string, has: string): string {
  const piece = chips(body).find((p) => p.includes(has));
  expect(piece, `chip with ${has}`).toBeDefined();
  return piece!;
}
/** The popover's markup (from its opening tag to the end of the bar), or "" when none is open. */
function dialog(body: string): string {
  const at = body.indexOf('role="dialog"');
  return at < 0 ? "" : body.slice(body.lastIndexOf("<div", at), body.lastIndexOf("</section>"));
}
// Each value's field, by an id only that field renders.
const FIELD_ID: Record<ValueKey, string> = {
  exchange: 'id="vb-f4"',
  g2g: 'id="vb-g2g"',
  gem: 'id="vb-gem"',
  potion: 'id="vb-potion"',
  pheons: 'id="vb-pheons-label"',
};
/** The visible text of the element opened by the first tag carrying `attr`, up to `close`. */
const inner = (html: string, attr: string, close: string): string => {
  const at = html.indexOf(attr);
  expect(at, attr).toBeGreaterThanOrEqual(0);
  return text(html.slice(html.indexOf(">", at) + 1, html.indexOf(close, at)));
};
/** The open popover's field markup by its heading text (the footer and Done are left out). */
function field(body: string, heading: string): string {
  const piece = body.split('<div class="field').slice(1).find((p) => text(p).includes(heading));
  expect(piece, `field "${heading}"`).toBeDefined();
  return '<div class="field' + piece!.split('<div class="pfoot')[0];
}
/** A chip's visible text on a phone, where the `wide` spans (and everything inside them) are hidden. */
function phoneText(html: string): string {
  let out = html;
  for (let at = out.indexOf('<span class="wide'); at >= 0; at = out.indexOf('<span class="wide')) {
    const tags = /<span\b|<\/span>/g;
    tags.lastIndex = at;
    let depth = 0;
    let end = out.length;
    for (let m = tags.exec(out); m; m = tags.exec(out)) {
      depth += m[0] === "</span>" ? -1 : 1;
      if (depth === 0) {
        end = tags.lastIndex;
        break;
      }
    }
    out = out.slice(0, at) + out.slice(end);
  }
  return text(out);
}

beforeEach(() => {
  hellSettings.setIncludePheons(false);
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  f4.reset("nae");
  f4.reset("euc");
  loadFixture();
});

afterEach(() => {
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  g2g.setFromInput(Number.NaN);
  valuesBar.close();
  app.region = "nae";
});

describe("ValuesBar per route (collapsed)", () => {
  it("renders nothing on the Prices tab or an unknown page", () => {
    for (const p of ["/prices", "/nope"]) {
      expect(bar(p), p).not.toContain("Your values");
      expect(bar(p, "exchange"), p).not.toContain("Your values");
    }
  });

  it("Packs: exchange, G2G, gem and pheons chips, and no potion", () => {
    const body = bar("/");
    expect(body).toContain('<section class="vb bar');
    expect(text(body)).toBe("Your values 35,000 = 238 no rate Lv. 8 348,000 Pheons excluded");
    expect(chips(body)).toHaveLength(4);
    expect(body).toContain("/icons/f4-shop.png");
    expect(body).toContain("/icons/lv-8-gem.png");
    expect(body).toContain("/icons/pheon.png");
    expect(body).not.toContain("/icons/basic-life-energy-potion.png");
  });

  it("each chip is a button that opens a dialog, collapsed while none is open", () => {
    const all = chips(bar("/bonus-room"));
    expect(all).toHaveLength(5);
    all.forEach((c, i) => {
      expect(c, VALUE_KEYS[i]).toMatch(/^<button type="button"/);
      expect(c).toContain(`id="vb-chip-${VALUE_KEYS[i]}"`);
      expect(c).toContain('aria-haspopup="dialog"');
      expect(c).toContain('aria-expanded="false"');
      // No dialog is rendered, so no chip points at one.
      expect(c).not.toContain("aria-controls");
    });
  });

  it("has no whole-bar Edit or Done", () => {
    for (const open of [null, ...VALUE_KEYS]) {
      const body = bar("/bonus-room", open);
      expect(body).not.toContain("vb card");
      expect(text(body)).not.toMatch(/\bEdit\b/);
      expect(body).not.toContain('class="grid');
      // The only Done is the open popover's own.
      expect(body.split(">Done<").length - 1).toBe(open ? 1 : 0);
      if (open) expect(dialog(body)).toContain(">Done<");
    }
  });

  it("shows G2G as its icon only, never the word", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    for (const open of [null, ...VALUE_KEYS]) {
      const body = bar("/bonus-room", open);
      expect(body).toContain("/icons/g2g.png");
      // Not in the text, and not in an attribute either (alt, title, aria-label).
      expect(body).not.toContain("G2G");
    }
    expect(text(chip(bar("/"), "/icons/g2g.png"))).toBe("$2.05 / 100k");
    // Screen readers still hear what the number is (the icon's alt is empty).
    expect(chip(bar("/"), "/icons/g2g.png")).toMatch(/<span class="vh[^"]*">Real-money gold price<\/span>/);
  });

  it("never labels a chip 'default' (the popover's watermark shows a default instead)", () => {
    loadFixture(TIMBER, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    for (const p of ["/", "/maris", "/bonus-room", "/ark-pass", "/jump-up", "/hell-key"]) {
      const all = chips(bar(p));
      expect(all.length, p).toBeGreaterThan(0);
      for (const c of all) expect(text(c), p).not.toMatch(/default/i);
    }
  });

  it("shows the live G2G rate until one is typed, and the live rate again once the box is cleared", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    expect(text(chip(bar("/"), "/icons/g2g.png"))).toBe("$2.05 / 100k");
    valuesBar.writeG2g("0.03");
    expect(text(chip(bar("/"), "/icons/g2g.png"))).toBe("$3.00 / 100k");
    valuesBar.writeG2g("");
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

  it("on a phone each chip keeps its icon and a short value; the extras are in wide-only spans", () => {
    loadFixture(TIMBER, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    const body = bar("/bonus-room");
    expect(chips(body).map(phoneText)).toEqual(["35,000", "$2.05", "348,000", "2,265", "excluded"]);
    // Wider screens show the full chips, as before.
    expect(chips(body).map(text)).toEqual(["35,000 = 238", "$2.05 / 100k", "Lv. 8 348,000", "2,265", "Pheons excluded"]);
    // A real space follows the wide-only "Pheons" (text() would hide a missing one); phones
    // capitalize the state word.
    expect(chip(body, "/icons/pheon.png")).toMatch(/>Pheons<\/span> excluded</);
    hellSettings.setIncludePheons(true);
    expect(phoneText(chip(bar("/bonus-room"), "/icons/pheon.png"))).toBe("included");
  });

  it("shows the region's own Lv. 8 price, the EU baseline in EU, and the baseline again once cleared", () => {
    valuesBar.writeOverride("lv-8-gem", "400000");
    expect(text(chip(bar("/"), "/icons/lv-8-gem.png"))).toBe("Lv. 8 400,000");
    app.region = "euc";
    expect(text(chip(bar("/"), "/icons/lv-8-gem.png"))).toBe("Lv. 8 398,000");
    app.region = "nae";
    valuesBar.writeOverride("lv-8-gem", "");
    expect(text(chip(bar("/"), "/icons/lv-8-gem.png"))).toBe("Lv. 8 348,000");
  });

  it("Mari's Shop: exchange, potion and pheons; a cleared potion box goes back to the logging value", () => {
    expect(text(bar("/maris"))).toBe("Your values 35,000 = 238 no value Pheons excluded");
    loadFixture(TIMBER);
    expect(text(chip(bar("/maris"), "/icons/basic-life-energy-potion.png"))).toBe("2,265");
    overrides.set("nae", "basic-life-energy-potion", 50);
    expect(text(chip(bar("/maris"), "/icons/basic-life-energy-potion.png"))).toBe("50");
    valuesBar.writeOverride("basic-life-energy-potion", "");
    expect(text(chip(bar("/maris"), "/icons/basic-life-energy-potion.png"))).toBe("2,265");
  });

  it("Bonus Room: all five while the room runs, nothing after it", () => {
    expect(text(bar("/bonus-room"))).toBe("Your values 35,000 = 238 no rate Lv. 8 348,000 no value Pheons excluded");
    app.now = Date.parse("2026-11-19T00:00:00Z");
    expect(bar("/bonus-room")).not.toContain("Your values");
  });

  it("Ark Pass, Jump-Up Boost and Hell Key math show only their own values", () => {
    expect(text(bar("/ark-pass"))).toBe("Your values Lv. 8 348,000");
    expect(text(bar("/jump-up"))).toBe("Your values 35,000 = 238 Lv. 8 348,000");
    expect(text(bar("/hell-key"))).toBe("Your values 35,000 = 238 Pheons excluded");
  });

  it("shows the exchange seed until a value is typed, and the seed again once the box is cleared", () => {
    const ex = (): string => text(chip(bar("/hell-key"), "/icons/f4-shop.png"));
    expect(ex()).toBe("35,000 = 238");
    f4.value = 21500;
    expect(ex()).toBe("21,500 = 238");
    f4.value = 0;
    expect(ex()).toBe("0 = 238");
    app.region = "euc";
    expect(ex()).toBe("35,000 = 238");
    app.region = "nae";
    valuesBar.writeF4("");
    expect(ex()).toBe("35,000 = 238");
    expect(f4.isDefault).toBe(true);
  });

  it("says 'not set' for a NaN exchange value", () => {
    f4.value = Number.NaN;
    expect(text(chip(bar("/hell-key"), "/icons/f4-shop.png"))).toBe("not set");
  });
});

describe("ValuesBar popovers", () => {
  it("shows no field and no dialog while no chip is open", () => {
    for (const p of ["/", "/maris", "/bonus-room", "/ark-pass", "/jump-up", "/hell-key"]) {
      const body = bar(p);
      expect(body, p).not.toContain('role="dialog"');
      expect(body, p).not.toContain('class="field');
      for (const id of Object.values(FIELD_ID)) expect(body, `${p} ${id}`).not.toContain(id);
    }
  });

  it("an open chip shows only its own field, in a named dialog, with that chip expanded", () => {
    const TITLES: Record<ValueKey, string> = {
      exchange: "Currency exchange (F4)",
      g2g: "Real-money gold price",
      gem: "Lv. 8 gem price",
      potion: "Life Energy Potion value",
      pheons: "Pheons",
    };
    for (const k of VALUE_KEYS) {
      const body = bar("/bonus-room", k);
      expect(body.split('role="dialog"').length - 1, k).toBe(1);
      const d = dialog(body);
      expect(d, k).toMatch(/^<div class="pop[^"]*" id="vb-pop" role="dialog" aria-labelledby="([^"]+)"/);
      // The dialog's name is its field's title, which carries the value's icon.
      const name = /aria-labelledby="([^"]+)"/.exec(d)![1];
      expect(inner(d, `id="${name}"`, k === "pheons" ? "</div>" : "</label>"), k).toBe(TITLES[k]);
      for (const other of VALUE_KEYS) {
        if (other === k) expect(d).toContain(FIELD_ID[other]);
        else expect(body, `${k} shows ${other}`).not.toContain(FIELD_ID[other]);
      }
      for (const c of chips(body)) {
        const mine = c.includes(`id="vb-chip-${k}"`);
        expect(c).toContain(mine ? 'aria-expanded="true"' : 'aria-expanded="false"');
        // Only the open chip points at the dialog.
        if (mine) expect(c).toContain('aria-controls="vb-pop"');
        else expect(c).not.toContain("aria-controls");
      }
    }
    expect(dialog(bar("/", "g2g"))).toContain("/icons/g2g.png");
    expect(dialog(bar("/", "gem"))).toContain("/icons/lv-8-gem.png");
    expect(dialog(bar("/maris", "potion"))).toContain("/icons/basic-life-energy-potion.png");
    expect(dialog(bar("/maris", "pheons"))).toContain("/icons/pheon.png");
  });

  it("a popover for a value the page does not use, or opened on another page, does not render", () => {
    expect(bar("/ark-pass", "exchange")).not.toContain('role="dialog"');
    valuesBar.open("gem", "/");
    expect(render(ValuesBar, { props: { path: "/jump-up" } }).body).not.toContain('role="dialog"');
  });

  it("each popover ends with the region footer and a Done button", () => {
    for (const k of ["exchange", "potion"] as const) {
      const d = dialog(bar("/maris", k));
      expect(text(d)).toMatch(/Saved for NA\. Shared with every tab that uses it\. Done$/);
      expect(d).toMatch(/<button type="button" class="btn primary[^"]*">Done<\/button>/);
    }
    app.region = "euc";
    expect(text(dialog(bar("/maris", "exchange")))).toContain("Saved for EU. Shared with every tab that uses it.");
    // The pheons setting is one switch for both regions.
    expect(text(dialog(bar("/maris", "pheons")))).toContain("Saved for NA and EU. Shared with every tab that uses it.");
  });

  it("Packs opens exchange, G2G, gem and pheons; Jump-Up opens exchange and gem", () => {
    for (const k of ["exchange", "g2g", "gem", "pheons"] as const) expect(bar("/", k)).toContain(FIELD_ID[k]);
    expect(bar("/", "potion")).not.toContain('role="dialog"');
    expect(bar("/jump-up", "exchange")).toContain('id="vb-f4"');
    expect(bar("/jump-up", "gem")).toContain('id="vb-gem"');
    expect(bar("/jump-up", "g2g")).not.toContain('role="dialog"');
    expect(bar("/jump-up", "pheons")).not.toContain("vb-pheons-label");
  });

  it("exchange: the F4 input with = 238 RC, and gold per RC and per BC", () => {
    const f = field(bar("/hell-key", "exchange"), "Currency exchange (F4)");
    expect(f).toContain("/icons/f4-shop.png");
    // The region's seed is the watermark and the box is empty while the region uses it.
    expect(f).toMatch(/id="vb-f4"[^>]*placeholder="35000"[^>]*value=""/);
    expect(text(f)).toBe("Currency exchange (F4) = 238 147.06 per , 368 per");
    expect(f).toContain('alt="RC"');
    expect(f).toContain('alt="BC"');
  });

  it("exchange: a typed value, 0 included, fills the box and moves the hint", () => {
    f4.value = 23800;
    const f = field(bar("/hell-key", "exchange"), "Currency exchange (F4)");
    expect(f).toMatch(/id="vb-f4"[^>]*placeholder="35000"[^>]*value="23800"/);
    expect(text(f)).toBe("Currency exchange (F4) = 238 100.00 per , 251 per");
    f4.value = 0;
    const zero = field(bar("/hell-key", "exchange"), "Currency exchange (F4)");
    expect(zero).toMatch(/id="vb-f4"[^>]*value="0"/);
    expect(text(zero)).toBe("Currency exchange (F4) = 238 0.00 per , 0 per");
  });

  it("G2G: the per-1k input, the per-100k readout and a hint, without the word", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    const f = field(bar("/", "g2g"), "Real-money gold price");
    // Like the exchange box: empty while the live rate applies, which shows as the watermark.
    expect(f).toMatch(/id="vb-g2g"[^>]*placeholder="0.0205"/);
    expect(f).not.toMatch(/id="vb-g2g"[^>]*value="0/);
    valuesBar.writeG2g("0.03");
    expect(field(bar("/", "g2g"), "Real-money gold price")).toMatch(/id="vb-g2g"[^>]*value="0.03"/);
    valuesBar.writeG2g("");
    expect(text(f)).toBe("Real-money gold price $ per 1k = $2.05 / 100k Your own rate wins; clear the box to use the live rate.");
    expect(f).toMatch(/<img class="g2g[^"]*" src="\/icons\/g2g.png" alt="" title="Rate updated [^"]+"/);
  });

  it("gem: the Lv. 8 input with the regional default as placeholder, and the effective lower levels", () => {
    const f = field(bar("/", "gem"), "Lv. 8 gem price");
    expect(f).toMatch(/id="vb-gem"[^>]*placeholder="348000"[^>]*value=""/);
    // 348,000 / 3, / 243, / 729, / 2,187.
    expect(inner(f, 'id="vb-gem-levels"', "</ul>")).toBe("Lv. 7 116,000 Lv. 3 1,432 Lv. 2 477 Lv. 1 159");
    expect(f).not.toContain("(your edit)");
    app.region = "euc";
    expect(field(bar("/", "gem"), "Lv. 8 gem price")).toMatch(/id="vb-gem"[^>]*placeholder="398000"/);
  });

  it("gem: shows the user's Lv. 8 price, and a per-level edit with a reset button", () => {
    overrides.set("nae", "lv-8-gem", 400000);
    overrides.set("nae", "lv-3-gem", 1500);
    const f = field(bar("/", "gem"), "Lv. 8 gem price");
    expect(f).toMatch(/id="vb-gem"[^>]*value="400000"/);
    const levels = inner(f, 'id="vb-gem-levels"', "</ul>");
    expect(levels).toBe("Lv. 7 133,333 Lv. 3 1,500 (your edit) reset Lv. 2 549 Lv. 1 183");
    expect((f.match(/class="reset/g) ?? []).length).toBe(1);
    // An old Lv. 3 edit from the Bonus Room's former Lv. 7 box shows the same way in EU.
    app.region = "euc";
    overrides.set("euc", "lv-3-gem", 150000 / 81);
    expect(text(field(bar("/", "gem"), "Lv. 8 gem price"))).toContain("Lv. 3 1,852 (your edit) reset");
  });

  it("potion: the default as placeholder and both logging values in the hint", () => {
    loadFixture(TIMBER);
    const f = field(bar("/maris", "potion"), "Life Energy Potion value");
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
    const f = field(bar("/bonus-room", "potion"), "Life Energy Potion value");
    expect(f).toMatch(/id="vb-potion"[^>]*value="50"/);
    expect(text(f)).toContain("No tool bonuses (default): 2,265 per potion Best-in-slot tool: 3,424 per potion");
  });

  it("potion: no hint and a plain note without timber prices", () => {
    const f = field(bar("/maris", "potion"), "Life Energy Potion value");
    expect(f).not.toContain("vb-potion-hint");
    expect(f).toMatch(/id="vb-potion"[^>]*placeholder="Your value"/);
    expect(text(f)).toContain("Gold per potion. Leave empty for no price; 0 counts as zero.");
  });

  it("pheons: an Excluded / Included switch and the per-stone value from the exchange", () => {
    const f = field(bar("/hell-key", "pheons"), "Pheons");
    expect(f).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Excluded<\/button>/);
    expect(f).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Included<\/button>/);
    expect(inner(f, 'id="vb-pheons-hint"', "</p>")).toBe(
      "Ability stones can't be traded, so they count as 0 gold while pheons are excluded. Included, each counts as 9 pheons: 28,184 at 8.5 BC per pheon and your exchange rate. Including them raises every Hell and Netherworld Key value, and every pack holding a key, several times over.",
    );
    hellSettings.setIncludePheons(true);
    const on = field(bar("/hell-key", "pheons"), "Pheons");
    expect(on).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Excluded<\/button>/);
    expect(on).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Included<\/button>/);
  });

  it("pheons: names the Soaring kits where they appear, and a user pheon price as the source", () => {
    overrides.set("nae", "pheon", 2000);
    expect(text(field(bar("/maris", "pheons"), "Pheons"))).toContain(
      "Stone of Soaring kits can't be traded, so they count as 0 gold while pheons are excluded. Included, each counts as 9 pheons: 18,000 at your own pheon price.",
    );
    expect(text(field(bar("/bonus-room", "pheons"), "Pheons"))).toContain("Stone of Soaring kits can't be traded");
    expect(text(field(bar("/", "pheons"), "Pheons"))).toContain("Ability stones can't be traded");
  });

  it("pheons: says pheons have no price with no exchange rate and no pheon price", () => {
    f4.value = 0;
    expect(text(field(bar("/hell-key", "pheons"), "Pheons"))).toContain(
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
    const open = bar("/", "g2g");
    expect(open).toMatch(staleReadout);
    expect(open).toContain("rate from");
  });

  it("turns stale as time passes with no newer payload (our API unreachable)", () => {
    seedG2g(10);
    app.now = INSIDE + 7 * 3_600_000;
    const open = bar("/", "g2g");
    expect(open).toMatch(staleReadout);
    expect(open).toContain("rate from");
  });

  it("shows neither for a 10 minute old rate", () => {
    seedG2g(10);
    const open = bar("/", "g2g");
    expect(open).not.toMatch(staleReadout);
    expect(open).not.toContain("rate from");
  });

  it("shows neither when the region has a stored override", () => {
    seedG2g(7 * 60);
    g2g.setFromInput(0.06);
    const open = bar("/", "g2g");
    expect(open).not.toMatch(staleReadout);
    expect(open).not.toContain("rate from");
    expect(open).toContain('value="0.06"');
  });
});

describe("ValuesBar writes", () => {
  it("never reads or writes the old bar's open flag, and opening a popover saves nothing", async () => {
    const writes: string[] = [];
    vi.resetModules();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (k === "csv.valuesBar.open" ? "1" : null),
      setItem: (k: string, v: string) => writes.push(`${k}=${v}`),
      removeItem: (k: string) => writes.push(`-${k}`),
    });
    try {
      // The G2G store retires two pre-region keys when it first loads; that cleanup is not the
      // bar's doing, so load it before counting.
      await import("../src/lib/packs/g2g.svelte");
      writes.length = 0;
      const fresh = await import("../src/lib/valuesBarState.svelte");
      expect(fresh.valuesBar.at).toBeNull();
      expect(fresh.valuesBar.openFor("/")).toBeNull();
      fresh.valuesBar.toggle("gem", "/");
      expect(fresh.valuesBar.openFor("/")).toBe("gem");
      fresh.valuesBar.toggle("gem", "/");
      expect(fresh.valuesBar.openFor("/")).toBeNull();
      expect(writes).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
    for (const f of ["../src/lib/components/ValuesBar.svelte", "../src/lib/valuesBarState.svelte.ts"]) {
      expect(readFileSync(new URL(f, import.meta.url), "utf-8"), f).not.toContain("csv.valuesBar.open");
    }
  });

  it("the real-money box saves a rate above 0, keeps half-typed input, 0 and negatives, and an empty box returns to the live rate", () => {
    loadFixture({}, { usdPer1kGold: 0.0205, usdFetchedAt: new Date(INSIDE - 10 * 60_000).toISOString() });
    valuesBar.writeG2g("0.03");
    expect(g2g.override).toBe(0.03);
    valuesBar.writeG2g("0"); // on the way to "0.02": keep the last rate
    expect(g2g.override).toBe(0.03);
    valuesBar.writeG2g("", true); // half-typed ("1e"): keep
    expect(g2g.override).toBe(0.03);
    valuesBar.writeG2g("-1");
    expect(g2g.override).toBe(0.03);
    valuesBar.writeG2g(""); // cleared: back to the live rate
    expect(g2g.override).toBeNull();
    expect(g2g.value).toBe(0.0205);
  });

  it("the exchange box saves a typed value, 0 included, and an empty box returns to the seed", () => {
    valuesBar.writeF4("21500");
    expect(f4.value).toBe(21500);
    expect(f4.isDefault).toBe(false);
    expect(f4.map.euc).toBe(35000); // per region
    valuesBar.writeF4("-1"); // a negative number never saves
    expect(f4.value).toBe(21500);
    valuesBar.writeF4("", true); // half-typed ("1e"): keep the last value
    expect(f4.value).toBe(21500);
    expect(f4.isDefault).toBe(false);
    valuesBar.writeF4("0"); // still means no exchange rate
    expect(f4.value).toBe(0);
    expect(f4.perBc).toBe(0);
    expect(f4.isDefault).toBe(false);
    valuesBar.writeF4("");
    expect(f4.value).toBe(35000);
    expect(f4.isDefault).toBe(true);
  });

  it("the exchange box removes the saved value when emptied", () => {
    const writes: string[] = [];
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: (k: string, v: string) => writes.push(`${k}=${v}`),
      removeItem: (k: string) => writes.push(`-${k}`),
    });
    try {
      valuesBar.writeF4("21500");
      valuesBar.writeF4("1e", true);
      valuesBar.writeF4("");
      app.region = "euc";
      valuesBar.writeF4("0");
      expect(writes).toEqual(["csv.f4.nae=21500", "-csv.f4.nae", "csv.f4.euc=0"]);
    } finally {
      vi.unstubAllGlobals();
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
        for (const k of VALUE_KEYS) {
          valuesBar.open(k, p); // an open popover writes nothing either
          expect(render(ValuesBar, { props: { path: p } }).body).toContain("Your values");
        }
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
    expect(src).toContain("oninput={(e) => valuesBar.writeF4(e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("oninput={(e) => valuesBar.writeG2g(e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("oninput={(e) => valuesBar.writeOverride(GEM_LV8_SLUG, e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("oninput={(e) => valuesBar.writeOverride(LIFE_ENERGY_POTION, e.currentTarget.value, e.currentTarget.validity?.badInput)}");
    expect(src).toContain("onclick={() => hellSettings.setIncludePheons(false)}>Excluded</button>");
    expect(src).toContain("onclick={() => hellSettings.setIncludePheons(true)}>Included</button>");
    for (const k of VALUE_KEYS) expect(src).toContain(`onclick={() => valuesBar.toggle("${k}", path)}>`);
    expect(src).toContain("onclick={() => dismiss(openKey!, true)}>Done</button>");
    expect(src).not.toMatch(/f4\.value\s*=/); // the exchange box writes through valuesBar.writeF4 only
    expect(src).toContain("onclick={() => overrides.clear(region, l.slug!)}>reset</button>");
    expect(src.match(/overrides\.(set|clear)\(/g)).toHaveLength(1); // only the per-level reset
  });
});
