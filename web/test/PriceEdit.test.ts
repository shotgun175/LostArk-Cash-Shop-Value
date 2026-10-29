import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import PriceEdit from "../src/lib/components/packs/PriceEdit.svelte";
import { app } from "../src/lib/app.svelte";
import { overrides } from "../src/lib/packs/overrides.svelte";
import { COMPUTED_PRICE_NOTES } from "../src/lib/packs/priceMap";

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
});
