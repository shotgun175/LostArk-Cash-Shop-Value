import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import PriceEdit from "../src/lib/components/packs/PriceEdit.svelte";
import PackLinesTable from "../src/lib/components/packs/PackLinesTable.svelte";
import PackPage from "../src/routes/pack/[slug]/+page.svelte";
import { app } from "../src/lib/app.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { buildPriceMap, COMPUTED_PRICE_NOTES, F4_DERIVED_SLUGS } from "../src/lib/packs/priceMap";
import { packDetail } from "../src/lib/packs/packDetail";
import { PACKS } from "../src/lib/packs/data/packs";
import { displayName } from "../src/lib/catalog";
import fixture from "./fixtures/tjw-nae-prices.json";

type Props = {
  slug: string;
  value: number | null;
  readOnly?: boolean;
  readOnlyTitle?: string;
  emptyText?: string;
};

// The overrides store is a module singleton: set values only inside the render, read the lazy body
// there, and always clear them again.
function html(props: Props, set: Record<string, number> = {}): string {
  app.region = "nae";
  for (const [s, v] of Object.entries(set)) overrides.set("nae", s, v);
  try {
    return render(PriceEdit, { props }).body;
  } finally {
    for (const s of Object.keys(set)) overrides.clear("nae", s);
  }
}

describe("PriceEdit", () => {
  it("renders an editable price as a button showing the formatted unit price", () => {
    const body = html({ slug: "fixed-epic-astrogem-selection", value: 75000 });
    expect(body).toMatch(/<button[^>]*class="price-btn num/);
    expect(body).toContain(">75,000</button>");
    expect(body).toContain('title="Click to enter your own AH price"');
    expect(body).not.toContain("edited");
    expect(body).not.toContain("<input"); // the editor only opens on click
  });

  it("reads a dash when unpriced, or the caller's word", () => {
    expect(html({ slug: "azenas-blessing-28d", value: null })).toContain(">—</button>");
    expect(html({ slug: "azenas-blessing-28d", value: null, emptyText: "set price" })).toContain(">set price</button>");
    // An explicit 0 is a price, not a gap.
    expect(html({ slug: "azenas-blessing-28d", value: 0, emptyText: "set price" })).toContain(">0</button>");
  });

  it("marks a slug the user has priced in the current region", () => {
    const body = html({ slug: "azenas-blessing-28d", value: 5000 }, { "azenas-blessing-28d": 5000 });
    expect(body).toMatch(/class="price-btn num[^"]*\bedited\b/);
  });

  it("never offers an edit on F4-derived, computed or caller-locked prices", () => {
    const bc = html({ slug: "blue-crystal", value: 368.42 });
    expect(bc).toContain("price-ro");
    expect(bc).not.toContain("price-btn");
    expect(bc).toContain("Priced from the F4 exchange input");

    const key = [...COMPUTED_PRICE_NOTES.keys()][0];
    const computed = html({ slug: key, value: 1000 });
    expect(computed).toContain("price-ro");
    expect(computed).not.toContain("price-btn");

    const gold = html({ slug: "gold", value: 1, readOnly: true, readOnlyTitle: "Gold counts at face value." });
    expect(gold).toContain("price-ro");
    expect(gold).toContain('title="Gold counts at face value."');
    expect(gold).not.toContain("price-btn");
  });

  it("names each price button after its item, starting with the visible text", () => {
    expect(html({ slug: "fixed-epic-astrogem-selection", value: 75000 })).toContain(
      'aria-label="75,000, Fixed Epic Astrogem (player-picked)"',
    );
    expect(html({ slug: "azenas-blessing-28d", value: null, emptyText: "set price" })).toMatch(/aria-label="set price, Azena/);
    // A bare dash is named "unpriced" (never "no price", which the tabs reserve for the Gold column).
    expect(html({ slug: "azenas-blessing-28d", value: null })).toMatch(/aria-label="unpriced, Azena/);
  });
});

// The callers map a 0 price to null, so a 0-priced line still reads as a dash on Packs, the Bonus
// Room (both PackLinesTable) and the pack drill-down, as before the shared cell.
describe("PriceEdit callers keep the dash for a 0 price", () => {
  it("PackLinesTable", () => {
    app.region = "nae";
    const body = render(PackLinesTable, { props: { lines: [{ slug: "lv-3-gem", qty: 5, gold: 0 }] } }).body;
    expect(body).toMatch(/class="price-btn num[^"]*"[^>]*>—<\/button>/);
  });

  it("the pack drill-down", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
      bundles: {},
    } as unknown as typeof app.payload;
    // An editable line of a fixed chest on a live pack.
    const prices = buildPriceMap(fixture.prices as Record<string, number>);
    const editable = (s: string) => !F4_DERIVED_SLUGS.has(s) && !COMPUTED_PRICE_NOTES.has(s);
    let found: { pack: (typeof PACKS)[number]; slug: string } | null = null;
    for (const pack of PACKS.filter((p) => !p.retired && !p.customSelection)) {
      const chest = packDetail(pack, prices, {}, {}).find((c) => !c.isSelection && !c.unresolved && c.options.some((o) => editable(o.slug)));
      if (chest) {
        found = { pack, slug: chest.options.find((o) => editable(o.slug))!.slug };
        break;
      }
    }
    expect(found).not.toBeNull();
    const { pack, slug } = found!;
    overrides.set("nae", slug, 0);
    try {
      const rows = render(PackPage, { props: { data: { pack } } }).body.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
      const row = rows.find((r) => r.includes(`>${displayName(slug)}<`));
      expect(row, slug).toBeDefined();
      expect(row!).toMatch(/class="price-btn num[^"]*\bedited\b[^"]*"[^>]*>—<\/button>/);
    } finally {
      overrides.clear("nae", slug);
    }
  });
});
