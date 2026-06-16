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
  it("builds an icon URL for 1:1 slug icons", () => {
    expect(iconUrl("solar-grace")).toBe("/icons/solar-grace.png");
    expect(hasIcon("solar-grace")).toBe(true);
    expect(hasIcon("destiny-leapstone")).toBe(true); // now has a real icon
  });
  it("maps shared art: engravings, artisan tiers, hellfire books", () => {
    expect(iconUrl("grudge")).toBe("/icons/relic-engraving-recipe.png");
    expect(iconUrl("raid-captain")).toBe("/icons/relic-engraving-recipe.png");
    expect(iconUrl("artisans-metallurgy-level-1")).toBe("/icons/artisans-level-1.png");
    expect(iconUrl("artisans-tailoring-level-1")).toBe("/icons/artisans-level-1.png");
    expect(iconUrl("tailoring-hellfire-19-20")).toBe("/icons/tailoring-hellfire.png");
  });
  it("maps raw destiny-shard to the L-pouch art, reports none for oreha", () => {
    expect(iconUrl("destiny-shard")).toBe("/icons/destiny-shard-pouch-l.png");
    expect(hasIcon("oreha-fusion-material")).toBe(false);
  });
});
