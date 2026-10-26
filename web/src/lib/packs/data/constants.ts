// Baked numeric constants from TJW's `ie` object (source B bakedConstants). These seed the
// price map before the live feed / EV overrides are applied.
export const BAKED: Record<string, number> = {
  // T4 gems (lv-1/2/3/8-gem) are not baked: buildPriceMap prices every level from the region's
  // Lv. 8 gem price (see gems.ts, 2026-10-25).
  "elysian-attempt-plus-1": 3000,
  gold: 1,
  // Astrogem anchors, re-based 2026-08-14 (user sign-off; DECISIONS.md): the NPC-price anchor
  // for a chosen epic stays 43,000g; the random epic adopts TJW's 33,000 (his 2026-08-12
  // re-anchor, which independently converged on our 43,000 for the picked one); the rare-epic
  // box follows the official KR probability disclosure for the chest (90% rare / 10% epic):
  // 0.9 x 500 (rare) + 0.1 x 33,000 = 3,750 (replaces the earlier ~20%-epic estimate of 4,300).
  "epic-astrogem": 33000,
  "epic-astrogem-selected": 43000,
  "rare-epic-astrogem": 3750,
  "relic-combat-engraving-recipe": 30000,
  // "Enhanced" Hellfire [19-20] scrolls (Collective Support Materials Selection Chests,
  // 2026-09-16): AH-tradable, but the upstream scraper behind our feed does not track them
  // (probed 2026-09-16), so they carry TJW's same-day AH-screenshot prices until it does.
  "enhanced-metallurgy-hellfire-19-20": 14000,
  "enhanced-tailoring-hellfire-19-20": 12000,
  // Jump-Up Boost Powerpass Premium rewards (2026-09-16, TJW's seeds, user sign-off). The Lv. 8
  // gem is priced by gems.ts (2026-10-25), not baked. The Fixed Epic
  // Astrogem Selection Chest grants one epic astrogem with PRE-SET options, a different item
  // from the regular picked epic (epic-astrogem-selected stays 43,000): flat 75,000.
  "fixed-epic-astrogem-selection": 75000,
  // Autumn Bonus Room Ark Grid bonus (2026-10-21): TJW's seeds (his app, "user-specified"
  // 2026-10-21), adopted 2026-10-25. The astrogem chest lets the buyer choose an Attack or
  // Support astrogem selection chest; the core chest grants one Ancient Order or Chaos
  // Sun/Moon/Star core random chest. Neither has a market; both are editable by click-to-edit.
  "ancient-astrogem-selection-chest": 500000,
  "ancient-core-random-selection-chest": 100000,
};

// Blue-Crystal store cost of untradable BC-store items: the Arkgrid processing tickets (reset
// 100 BC; refresh 18 BC each, the store sells a 10-pack for 180 BC), Pheons (8.5 BC each, the
// store sells 100 for 850 BC; added 2026-09-16 for the [3+1] Dimensionalist Welcome Package) and
// the Jump-Up Boost's 14-day Crystalline Aura Plus (the store sells 30 days for 510 BC, pro-rated
// to 238 BC). buildPriceMap converts these to gold at the F4 gold-per-BC rate when an exchange
// input is set; with no input they stay unpriced (0-gold lines), matching the pre-2026-08-14
// behavior.
export const BC_COSTS: Record<string, number> = {
  "astrogem-processing-reset-ticket": 100,
  "astrogem-processing-option-refresh-ticket": 18,
  pheon: 8.5,
  "crystalline-aura-plus-14d": 238,
};

// 5:1 NPC trade-up pairs (source B tradeUpTable). Optional UI toggle, not baked into pack math.
export const TRADE_UP: { fromSlug: string; toSlug: string; ratio: number }[] = [
  { fromSlug: "destiny-leapstone", toSlug: "great-destiny-leapstone", ratio: 5 },
  { fromSlug: "destiny-destruction-stone", toSlug: "destiny-crystallized-destruction-stone", ratio: 5 },
  { fromSlug: "destiny-guardian-stone", toSlug: "destiny-crystallized-guardian-stone", ratio: 5 },
  { fromSlug: "abidos-fusion-material", toSlug: "superior-abidos-fusion-material", ratio: 5 },
  { fromSlug: "honor-leapstone", toSlug: "great-honor-leapstone", ratio: 5 },
  { fromSlug: "great-honor-leapstone", toSlug: "marvelous-honor-leapstone", ratio: 5 },
  { fromSlug: "marvelous-honor-leapstone", toSlug: "radiant-honor-leapstone", ratio: 5 },
];

// The 23 relic combat engraving slugs the relic-combat-engraving-recipe value maxes over
// (source A/B `he()` / Se list).
export const RELIC_ENGRAVING_SLUGS: string[] = [
  "grudge",
  "raid-captain",
  "keen-blunt-weapon",
  "adrenaline",
  "mass-increase",
  "cursed-doll",
  "hit-master",
  "ambush-master",
  "awakening",
  "expert",
  "master-brawler",
  "super-charge",
  "drops-of-ether",
  "magick-stream",
  "barricade",
  "vital-point-hit",
  "stabilized-status",
  "all-out-attack",
  "mp-efficiency-increase",
  "heavy-armor",
  "explosive-expert",
  "precise-dagger",
  "spirit-absorption",
];
