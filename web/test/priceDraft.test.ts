import { describe, it, expect } from "vitest";
import { draftFor, commitDraft } from "../src/lib/packs/priceDraft";

describe("draftFor", () => {
  it("opens with the unit price at up to 4 decimals below 100, or empty when unpriced", () => {
    expect(draftFor(null)).toBe("");
    expect(draftFor(0)).toBe("0");
    expect(draftFor(12.3456789)).toBe("12.3457");
    expect(draftFor(0.1 + 0.2)).toBe("0.3");
    expect(draftFor(99.99)).toBe("99.99");
  });

  it("opens with whole gold from 100 up, as the cell shows it (formatGold)", () => {
    expect(draftFor(75000)).toBe("75000");
    expect(draftFor(87684.2105)).toBe("87684"); // the BC-costed aura at the 35,000 seed
    expect(draftFor(100.4)).toBe("100");
    expect(draftFor(348000)).toBe("348000");
  });
});

describe("commitDraft", () => {
  it("sets a typed number of 0 or more", () => {
    expect(commitDraft("10000", "")).toEqual({ kind: "set", value: 10000 });
    expect(commitDraft("12.5", "75000")).toEqual({ kind: "set", value: 12.5 });
    expect(commitDraft(" 1e3 ", "")).toEqual({ kind: "set", value: 1000 });
    // An explicit 0 is a value, both on an unpriced line and over a price.
    expect(commitDraft("0", "")).toEqual({ kind: "set", value: 0 });
    expect(commitDraft("0", "75000")).toEqual({ kind: "set", value: 0 });
  });

  it("clears the price when the box is emptied, back to the market or default value", () => {
    expect(commitDraft("", "75000")).toEqual({ kind: "clear" });
    expect(commitDraft("   ", "10000")).toEqual({ kind: "clear" });
    expect(commitDraft("", "")).toEqual({ kind: "clear" }); // nothing saved: clearing changes nothing
  });

  it("keeps the price for a half-typed, unreadable or negative entry", () => {
    expect(commitDraft("", "75000", true)).toEqual({ kind: "keep" }); // "1e" reads as empty text
    for (const raw of ["abc", "-1", "-5"]) expect(commitDraft(raw, "75000")).toEqual({ kind: "keep" });
  });

  it("keeps the price for the value the editor opened with, so opening and closing saves nothing", () => {
    expect(commitDraft("75000", "75000")).toEqual({ kind: "keep" });
    expect(commitDraft("0", "0")).toEqual({ kind: "keep" });
    // The rounded opening text still blocks a spurious override on a fractional price.
    expect(commitDraft("87684", draftFor(87684.2105))).toEqual({ kind: "keep" });
  });

  it('saves a typed "-0" as 0, never -0', () => {
    const a = commitDraft("-0", "75000");
    expect(a.kind).toBe("set");
    expect(Object.is(a.kind === "set" ? a.value : NaN, 0)).toBe(true);
  });
});
