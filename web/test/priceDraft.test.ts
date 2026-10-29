import { describe, it, expect } from "vitest";
import { draftFor, parseDraft } from "../src/lib/packs/priceDraft";

describe("draftFor", () => {
  it("opens with the shown unit price at up to 4 decimals, or empty when unpriced", () => {
    expect(draftFor(null)).toBe("");
    expect(draftFor(75000)).toBe("75000");
    expect(draftFor(0)).toBe("0");
    expect(draftFor(12.3456789)).toBe("12.3457");
    expect(draftFor(0.1 + 0.2)).toBe("0.3");
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
  });
});
