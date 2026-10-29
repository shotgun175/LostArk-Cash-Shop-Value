import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import JumpUpBoost from "../src/lib/components/packs/JumpUpBoost.svelte";
import { app } from "../src/lib/app.svelte";
import { f4 } from "../src/lib/packs/f4.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import fixture from "./fixtures/tjw-nae-prices.json";

function loadFixture(): void {
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
}

// The Jump-Up golden is defined at a 30,000 exchange input, which was the app's seed until
// 2026-10-25; the seed is now 35,000, so those cases set 30,000 explicitly. It was TJW's 2,225,158
// until the Lv. 8 gems moved to the NA default baseline of 348,000 (2026-10-25): 2,117,158.
function withExchange<T>(gold: number, fn: () => T): T {
  const saved = f4.value;
  f4.value = gold;
  try {
    return fn();
  } finally {
    f4.value = saved;
  }
}

describe("JumpUpBoost", () => {
  it("renders the five milestones with the golden totals at a 30,000 exchange input", () => {
    loadFixture();
    const body = withExchange(30000, () => render(JumpUpBoost).body); // body renders lazily: read it inside
    expect(body).toContain("Jump-Up Boost");
    for (const ilvl of ["1,700", "1,705", "1,710", "1,715", "1,720"]) {
      expect(body).toContain(`Reach Item Lv. ${ilvl}`);
    }
    // Lv 1 = 200,000 bound gold + the aura at 238 BC x 30,000/95; the track totals 2,117,158.
    expect(body).toContain("275,158");
    expect(body).toContain("2,117,158");
    expect(body).toContain("705.7");
    // Azena's Blessing and the two Ancient chests carry no market value.
    expect((body.match(/no price/g) ?? []).length).toBe(3);
    // The chest subline only appears when it adds information: "4x 50,000 Gold Bars" under the
    // gold line, but not "2x Lv. 8 Brilliant Gem (Bound)" under a line already named that.
    expect(body).toContain("4× 50,000 Gold Bars");
    expect(body).not.toContain("2× Lv. 8 Brilliant Gem (Bound)");
    // The F4 input is in the shared "Your values" bar now, not on this tab.
    expect(body).not.toContain("<input");
  });

  it("shows a neutral placeholder for vs F4 while the exchange input is cleared", () => {
    loadFixture();
    const saved = f4.value;
    try {
      f4.value = NaN; // the store allows the transient NaN a cleared number input produces
      const { body } = render(JumpUpBoost);
      const vs = body.match(/<dd[^>]*>—<\/dd>/)?.[0] ?? "";
      expect(vs).not.toBe("");
      expect(vs).not.toMatch(/class="[^"]*\b(good|bad)\b/);
    } finally {
      f4.value = saved;
    }
  });

  it("values the whole track off baked seeds and the exchange input, so a cold payload still renders numbers", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: {} };
    const body = withExchange(30000, () => render(JumpUpBoost).body); // body renders lazily: read it inside
    expect(body).toContain("2,117,158");
  });

  it("prices the aura off the default 35,000 exchange seed when the user has typed nothing", () => {
    loadFixture();
    const { body } = render(JumpUpBoost);
    // Aura: 238 BC x 35,000 / 95 = 87,684 (per-chest rounding); Lv 1 = 200,000 + 87,684, and the
    // track totals 2,129,684 (the 30,000 golden total plus 12,526 more aura).
    expect(body).toContain("287,684");
    expect(body).toContain("2,129,684");
  });
});

// The overrides store is a module singleton: set values only inside the render, read the lazy body
// there, and always clear them again so later cases start clean.
function renderWith(set: Record<string, number>): string {
  for (const [s, v] of Object.entries(set)) overrides.set("nae", s, v);
  try {
    return render(JumpUpBoost).body;
  } finally {
    for (const s of Object.keys(set)) overrides.clear("nae", s);
  }
}

const rowsOf = (body: string): string[] => body.match(/<tr[\s\S]*?<\/tr>/g) ?? [];

describe("JumpUpBoost click-to-edit prices", () => {
  it("offers an edit on every reward's unit price except the gold bars", () => {
    loadFixture();
    const body = render(JumpUpBoost).body;
    const goldRow = rowsOf(body).find((r) => r.includes("4× 50,000 Gold Bars"));
    expect(goldRow).toBeDefined();
    expect(goldRow!).toContain("price-ro");
    expect(goldRow!).toContain('title="Gold counts at face value."');
    expect(goldRow!).not.toContain("price-btn");
    // The aura, Azena's Blessing, the two Ancient chests, two gem rows and two astrogem rows.
    expect((body.match(/class="price-btn/g) ?? []).length).toBe(8);
    // The three no-market items invite a value instead of showing a bare dash.
    expect((body.match(/>set price<\/button>/g) ?? []).length).toBe(3);
    expect(body).toContain("Click a unit price to enter your own value");
    expect(body).not.toContain("custom price"); // no chip until something here is priced
  });

  it("a price entered for a no-market item moves the totals and shows the reset chip", () => {
    loadFixture();
    const body = renderWith({ "azenas-blessing-28d": 10000 });
    expect(body).toContain("2,139,684"); // 2,129,684 at the 35,000 seed, plus 10,000
    expect((body.match(/no price/g) ?? []).length).toBe(2);
    const azena = rowsOf(body).find((r) => r.includes("Azena")); // the apostrophe may be escaped
    expect(azena!).toMatch(/class="price-btn num[^"]*\bedited\b[^>]*>10,000<\/button>/);
    expect(body).toMatch(/<b class="num[^"]*">1<\/b> custom price</);
    expect(body).toContain(">reset</button>");
  });

  it("an explicit 0 reads 0 in the Gold column, not no price", () => {
    loadFixture();
    const body = renderWith({ "ancient-bracelet-chest": 0 });
    expect((body.match(/no price/g) ?? []).length).toBe(2);
    const bracelet = rowsOf(body).find((r) => r.includes("1× Ancient Bracelet Chest"));
    // Strip Svelte's hydration markers (<!--[0-->) so the cell reads as plain markup.
    expect(bracelet!.replace(/<!--[\s\S]*?-->/g, "")).toMatch(/accent[^"]*">0<\/td>/);
    expect(body).toContain("2,129,684"); // a 0 adds nothing
  });

  it("keeps the aura a plain dash while no exchange rate is set, instead of inviting a price", () => {
    loadFixture();
    const saved = f4.value;
    try {
      f4.value = NaN; // a cleared exchange input: the BC-costed aura has no price
      const body = render(JumpUpBoost).body;
      const aura = rowsOf(body).find((r) => r.includes("Crystalline Aura Plus"));
      expect(aura!).toMatch(/class="price-btn num[^"]*"[^>]*>—<\/button>/);
      expect((body.match(/>set price<\/button>/g) ?? []).length).toBe(3);
    } finally {
      f4.value = saved;
    }
  });

  it("counts a price set on another tab for an item shown here, but not the Lv. 8 gem setting", () => {
    loadFixture();
    // The astrogem chest is also a Bonus Room line; its override shows and counts here.
    expect(renderWith({ "fixed-epic-astrogem-selection": 50000 })).toMatch(/<b class="num[^"]*">1<\/b> custom price</);
    // The gem price belongs to Your values: edited on the gem rows, but not counted or reset here.
    const gem = renderWith({ "lv-8-gem": 300000 });
    expect(gem).not.toContain("custom price");
    const gemRow = rowsOf(gem).find((r) => r.includes("Lv. 8 Brilliant Gem"));
    expect(gemRow!).toMatch(/class="price-btn num[^"]*\bedited\b/);
  });
});
