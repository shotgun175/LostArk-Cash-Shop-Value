import { describe, it, expect } from "vitest";
import { displayName, iconUrl, hasIcon, isPreframed } from "../src/lib/catalog";

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
  it("maps shared art: engravings and hellfire books", () => {
    expect(iconUrl("grudge")).toBe("/icons/relic-engraving-recipe.png");
    expect(iconUrl("raid-captain")).toBe("/icons/relic-engraving-recipe.png");
    expect(iconUrl("tailoring-hellfire-19-20")).toBe("/icons/tailoring-hellfire.png");
  });
  it("gives each artisan profession/tier its own icon (metallurgy != tailoring)", () => {
    expect(iconUrl("artisans-metallurgy-level-1")).toBe("/icons/artisans-metallurgy-level-1.png");
    expect(iconUrl("artisans-tailoring-level-1")).toBe("/icons/artisans-tailoring-level-1.png");
    expect(iconUrl("artisans-metallurgy-level-4")).toBe("/icons/artisans-metallurgy-level-4.png");
    expect(iconUrl("artisans-tailoring-level-4")).toBe("/icons/artisans-tailoring-level-4.png");
    expect(iconUrl("artisans-metallurgy-level-1")).not.toBe(iconUrl("artisans-tailoring-level-1"));
  });
  it("maps raw destiny-shard to the L-pouch art", () => {
    expect(iconUrl("destiny-shard")).toBe("/icons/destiny-shard-pouch-l.png");
  });
  it("now has icons for the newly-supplied slugs (oreha + the two Mari's-only items)", () => {
    expect(hasIcon("oreha-fusion-material")).toBe(true);
    expect(iconUrl("oreha-fusion-material")).toBe("/icons/oreha-fusion-material.png");
    expect(iconUrl("stone-of-soaring-kit")).toBe("/icons/stone-of-soaring-kit.png");
    expect(iconUrl("basic-life-energy-potion")).toBe("/icons/basic-life-energy-potion.png");
  });
  it("maps the 2026-07-15 astrogem items (shared chest art + the two ticket crops)", () => {
    expect(iconUrl("rare-epic-astrogem")).toBe("/icons/epic-astrogem-random.png");
    expect(displayName("rare-epic-astrogem")).toBe("Rare/Epic Astrogem");
    expect(iconUrl("astrogem-processing-reset-ticket")).toBe("/icons/astrogem-processing-reset-ticket.png");
    expect(iconUrl("astrogem-processing-option-refresh-ticket")).toBe("/icons/astrogem-processing-option-refresh-ticket.png");
  });
});

describe("isPreframed", () => {
  it("flags the six bound battle items whose art already includes the frame", () => {
    for (const s of [
      "atropine-potion-bound", "stimulant-bound", "splendid-dark-grenade-bound",
      "splendid-elemental-hp-potion-bound", "splendid-sacred-bomb-bound", "splendid-sacred-charm-bound",
    ]) {
      expect(isPreframed(s)).toBe(true);
    }
  });
  it("does not flag ordinary icons (they receive the overlay frame)", () => {
    expect(isPreframed("destiny-leapstone")).toBe(false);
    expect(isPreframed("gold")).toBe(false);
    expect(isPreframed("splendid-hell-key-of-destiny-v")).toBe(false);
  });
});

describe("Jump-Up Boost items (2026-09-16)", () => {
  it("maps the TJW and user crops and shares the Ancient chest and picked-astrogem art", () => {
    expect(hasIcon("lv-8-gem")).toBe(true);
    expect(hasIcon("ancient-bracelet-chest")).toBe(true);
    expect(iconUrl("ancient-accessory-set-chest")).toContain("ancient-bracelet-chest.png");
    expect(iconUrl("fixed-epic-astrogem-selection")).toContain("epic-astrogem-selected.png");
    // The two timed buffs use the user's in-game tooltip crops (2026-09-16).
    expect(hasIcon("crystalline-aura-plus-14d")).toBe(true);
    expect(hasIcon("azenas-blessing-28d")).toBe(true);
  });
  it("names the new slugs the way the game does", () => {
    expect(displayName("crystalline-aura-plus-14d")).toBe("Crystalline Aura Plus (14 days)");
    expect(displayName("azenas-blessing-28d")).toBe("Azena's Blessing (28 days)");
    expect(displayName("lv-8-gem")).toBe("Lv. 8 Brilliant Gem");
    expect(displayName("fixed-epic-astrogem-selection")).toBe("Fixed Epic Astrogem (player-picked)");
    expect(displayName("ancient-accessory-set-chest")).toBe("Ancient Accessory Set");
    expect(displayName("ancient-bracelet-chest")).toBe("Ancient Bracelet");
  });
});
