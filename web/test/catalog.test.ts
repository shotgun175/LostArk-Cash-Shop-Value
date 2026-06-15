import { describe, it, expect } from "vitest";
import { displayName, iconUrl, hasIcon } from "../src/lib/catalog";

describe("displayName", () => {
  it("title-cases simple slugs", () => {
    expect(displayName("destiny-leapstone")).toBe("Destiny Leapstone");
  });
  it("applies special-case overrides", () => {
    expect(displayName("moon-s-breath")).toBe("Moon's Breath");
    expect(displayName("lv-3-blazing-gem")).toBe("Lv. 3 Blazing Gem");
    expect(displayName("mp-efficiency-increase")).toBe("MP Efficiency Increase");
  });
});

describe("icons", () => {
  it("builds an icon URL for known slug icons", () => {
    expect(iconUrl("solar-grace")).toBe("/icons/solar-grace.png");
    expect(hasIcon("solar-grace")).toBe(true);
  });
  it("reports no icon for game-id-only items", () => {
    expect(hasIcon("destiny-leapstone")).toBe(false);
  });
});
