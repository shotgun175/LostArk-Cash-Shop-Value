import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import BonusRoom from "../src/lib/components/packs/BonusRoom.svelte";
import { app } from "../src/lib/app.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { hellSettings } from "../src/lib/packs/hellSettings.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
import fixture from "./fixtures/tjw-nae-prices.json";

// The Bonus Room tab, rendered on the server against the shared NA fixture (the valuation rows
// are tested in bonusRoom.test.ts; this file's name differs by more than case so the two cannot
// collide on a case-insensitive filesystem). The clock is pinned
// (inside the Autumn room, which ends 2026-11-18T04:00Z, or after it) so the active check and the
// countdown are deterministic. Values match the bonusRoom.test.ts pins (same fixture, F4 30,000).
const INSIDE = Date.parse("2026-10-25T12:00:00Z");
const AFTER = Date.parse("2026-11-19T00:00:00Z");
const KIT_NOTE = "Counts as 0 gold while pheons are excluded (setting above).";

function loadFixture(now = INSIDE): void {
  app.region = "nae";
  app.status = "ok";
  app.now = now;
  app.payload = {
    schema_version: 1,
    generated_at: new Date(INSIDE).toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date(INSIDE).toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
}

// One product card's markup: from its title up to the next card or the group's bonus block.
function card(body: string, name: string): string {
  const piece = body.split('<div class="card').find((p) => p.includes(`>${name}</span>`));
  expect(piece, `card "${name}"`).toBeDefined();
  return piece!.split('class="bonus')[0];
}

beforeEach(() => {
  // Include pheons is a shared singleton that moves the kit and every key value.
  hellSettings.setIncludePheons(false);
  overrides.clearAll("nae");
  overrides.clearAll("euc");
  loadFixture();
});

afterEach(() => {
  overrides.clearAll("nae");
  overrides.clearAll("euc");
});

describe("BonusRoom while the room runs", () => {
  it("renders every group with its products, bonus and whole-group comparison", () => {
    const { body } = render(BonusRoom);
    expect(body).toContain("Autumn rotation. One purchase of each product per roster; buy all 3 in a group to get its bonus.");
    expect(body).toContain("23d 16h left");
    expect(body).toContain("Scheduled maintenance on 11/18/2026");

    for (const group of ["Autumn Ark Grid", "Gems &amp; Cards", "Growth &amp; Life Skills"]) {
      expect(body).toContain(`>${group}</h3>`);
    }
    for (const n of ["01", "02", "03"]) expect(body).toContain(`>${n}</span>`);
    for (const product of [
      "Autumn Astrogem Pack I",
      "Autumn Astrogem Pack II",
      "Autumn Astrogem Pack III",
      "T4 Gem Chest (Lv. 3) X 125",
      "Stone of Soaring Engraving Setting Kit Chest",
      "Joyful Legendary - Epic Card Pack X10",
      "(NEW) Ebony Cube Entrance Ticket Selection Chest II",
      "Basic Life Energy Potion X20",
      "Superior Abidos Fusion Material Chest",
    ]) {
      expect(body).toContain(`>${product}</span>`);
    }
    // Product titles are plain text: the Bonus Room has no drill-down pages.
    expect(body).not.toContain('href="/pack/autumn-astrogem-i"');
    expect((body.match(/Bonus for buying all 3/g) ?? []).length).toBe(3);
    expect(body).toContain("[Bonus] Autumn Ark Grid Support Pack");
    expect(body).toContain("/icons/ancient-bracelet-chest.png"); // the data's bonus icon, kept as is

    // Engine values (pinned in bonusRoom.test.ts): Astrogem Pack 896,775 each, the Ark Grid
    // group 3 x 896,775 + the 600,000 bonus, +117.5% vs exchange on 12,000 RC.
    expect(card(body, "Autumn Astrogem Pack I")).toContain("896,775");
    expect(body).toContain("3,290,325");
    expect(body).toContain("+118%");
    expect(body).toContain("(1,512,605 gold at your F4 rate)"); // 12,000 RC x 30,000 / 238
    expect(body).toContain("147,127"); // Growth & Life Skills: cube + Abidos + bonus, potion unpriced

    // The Packs-style card pieces: collapsed contents and the shared material table inside it.
    expect(body).toContain("Contents · 6 materials");
    expect(body).toContain("Contents · 1 material<");
    expect(body).toContain('class="tscroll');
  });

  it("marks unpriced products and groups instead of reading 0 gold", () => {
    const { body } = render(BonusRoom);
    // Exactly three things have no priced line at this fixture: the Joyful x10 and potion
    // products, and the Gems & Cards bonus (Joyful Legendary Card Pack x3).
    expect((body.match(/no price</g) ?? []).length).toBe(3);
    const joyful = card(body, "Joyful Legendary - Epic Card Pack X10");
    expect(joyful).toContain("no price");
    expect(joyful).not.toMatch(/<b class="num[^"]*">0<\/b>/);
    expect(joyful).not.toContain("-100%");
    expect(joyful).not.toContain("Some contents have no price");
    // Two groups hold an unpriced line, so two footers carry the note.
    expect((body.match(/Total includes priced contents only\./g) ?? []).length).toBe(2);
  });

  it("explains the soaring kit's 0 gold while pheons are excluded, and drops the note when included", () => {
    let body = render(BonusRoom).body;
    expect(card(body, "Stone of Soaring Engraving Setting Kit Chest")).toContain(KIT_NOTE);
    expect(card(body, "T4 Gem Chest (Lv. 3) X 125")).not.toContain(KIT_NOTE);
    expect((body.match(/Counts as 0 gold while pheons/g) ?? []).length).toBe(1);

    hellSettings.setIncludePheons(true);
    body = render(BonusRoom).body;
    expect(body).not.toContain(KIT_NOTE);
    expect(card(body, "Stone of Soaring Engraving Setting Kit Chest")).not.toContain("-100%");
  });

  it("flags a valued product that has an unpriced line", () => {
    const saved = f4.value;
    try {
      // With no F4 rate the Crystal and Reset Ticket lines (both F4-priced) drop out of the
      // Astrogem Packs, which keep a value from their other lines.
      f4.value = 0;
      const { body } = render(BonusRoom);
      const pack = card(body, "Autumn Astrogem Pack I");
      expect(pack).toContain("Some contents have no price");
      expect(pack).toContain("391,385");
      expect(body).not.toContain("gold at your F4 rate"); // no exchange rate, no gold cost
    } finally {
      f4.value = saved;
    }
  });

  it("renders the value controls without writing any price override", () => {
    const writes: string[] = [];
    const prior = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: (k: string) => writes.push(`set ${k}`),
        removeItem: (k: string) => writes.push(`remove ${k}`),
      },
    });
    try {
      const before = JSON.stringify(overrides.map);
      const { body } = render(BonusRoom);
      expect(JSON.stringify(overrides.map)).toBe(before);
      expect(overrides.has("nae", "lv-3-gem")).toBe(false);
      expect(writes).toEqual([]);

      expect(body).toContain('aria-label="F4 exchange gold"'); // the shared exchange row
      expect(body).toContain("Your Lv. 7 gem price");
      // Empty box, the default Lv. 3 seed (1,850) x 81 as the placeholder.
      expect(body).toMatch(/id="br-gem"[^>]*placeholder="149850"[^>]*value=""/);
      expect(body).toContain("Default Lv. 3 gem value:");
      expect(body).toContain("Life Energy Potion value");
      expect(body).toMatch(/id="br-potion"[^>]*value=""/);
      expect(body).toContain("Include pheons");
      expect(body).toContain("On this tab the same setting values the Stone of Soaring Engraving Setting Kit");
    } finally {
      if (prior) Object.defineProperty(globalThis, "localStorage", prior);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it("has no mount-time hook that could write an override on page load", () => {
    // A server render runs no $effect or onMount, so the render test above cannot see a write
    // made on mount in the browser. The inputs may only write from their input events
    // (DECISIONS 2026-10-25), so the component must not have a mount-time hook at all.
    const src = readFileSync(new URL("../src/lib/components/packs/BonusRoom.svelte", import.meta.url), "utf-8");
    expect(src).not.toMatch(/\$effect|onMount|beforeUpdate|afterUpdate|bind:value/);
    expect(src.match(/overrides\.(set|clear)\(/g)).toHaveLength(2); // both inside onPriceInput
  });

  it("shows this region's own gem and potion overrides", () => {
    overrides.set("euc", "lv-3-gem", 150000 / 81);
    overrides.set("nae", "basic-life-energy-potion", 50);

    let body = render(BonusRoom).body; // NA: the potion only
    expect(body).toMatch(/id="br-gem"[^>]*value=""/);
    expect(body).toMatch(/id="br-potion"[^>]*value="50"/);
    expect(card(body, "Basic Life Energy Potion X20")).toContain("1,000"); // 20 x 50
    expect(body).toContain("148,127"); // the Growth group gains the 1,000

    app.region = "euc";
    body = render(BonusRoom).body; // EU: the gem only (no EU payload, so no groups render)
    expect(body).toMatch(/id="br-gem"[^>]*value="150000"/);
    expect(body).toContain("Lv. 7 / 81 = ");
    expect(body).toContain("1,852");
    expect(body).toMatch(/id="br-potion"[^>]*value=""/);
    expect(body).toContain("No prices yet. The feed may be refreshing.");
  });
});

describe("BonusRoom states", () => {
  it("shows the loading state, with the controls, while there is no payload", () => {
    app.status = "loading";
    app.payload = null;
    const { body } = render(BonusRoom);
    expect(body).toContain("Loading prices…");
    expect(body).toContain("Your Lv. 7 gem price");
    expect(body).not.toContain("Autumn Ark Grid");
  });

  it("shows the error state when prices failed to load", () => {
    app.status = "error";
    app.payload = null;
    expect(render(BonusRoom).body).toContain("Failed to load prices.");
  });

  it("shows only the ended notice once the room is over", () => {
    loadFixture(AFTER);
    const { body } = render(BonusRoom);
    expect(body).toContain("No Bonus Room is running right now.");
    expect(body).toContain("The Autumn Bonus Room ended with the scheduled maintenance on 11/18/2026.");
    expect(body).toMatch(/<a class="back[^"]*" href="\/">Back to Packs<\/a>/);
    expect(body).not.toContain("Autumn Ark Grid");
    expect(body).not.toContain("Your Lv. 7 gem price");
    expect(body).not.toContain("Bonus for buying");
  });
});
