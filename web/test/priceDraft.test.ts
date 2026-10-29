import { describe, it, expect } from "vitest";
import { draftFor, parseDraft } from "../src/lib/packs/priceDraft";

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

describe("parseDraft", () => {
  it("returns the typed value, from the number input's numeric binding or from text", () => {
    expect(parseDraft(10000, "")).toBe(10000);
    expect(parseDraft("12.5", "75000")).toBe(12.5);
    // An explicit 0 is a value, both on an unpriced line and over a price.
    expect(parseDraft(0, "")).toBe(0);
    expect(parseDraft(0, "75000")).toBe(0);
  });

  it("ignores empty, unreadable and negative entries", () => {
    for (const d of ["", undefined, null, "abc", NaN, -1, "-5"]) expect(parseDraft(d, "75000")).toBeNull();
  });

  it("ignores the value the editor opened with, so opening and closing creates no override", () => {
    expect(parseDraft(75000, "75000")).toBeNull();
    expect(parseDraft("75000", "75000")).toBeNull();
    expect(parseDraft(0, "0")).toBeNull();
    // The rounded opening text still blocks a spurious override on a fractional price.
    expect(parseDraft(87684, draftFor(87684.2105))).toBeNull();
  });

  it('saves a typed "-0" as 0, never -0', () => {
    expect(Object.is(parseDraft(-0, ""), 0)).toBe(true);
    expect(Object.is(parseDraft("-0", "75000"), 0)).toBe(true);
  });
});
