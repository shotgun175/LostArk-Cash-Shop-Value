// Baked numeric constants from TJW's `ie` object (source B bakedConstants). These seed the
// price map before the live feed / EV overrides are applied.
export const BAKED: Record<string, number> = {
  // T4 gems (Lv.1/2/3). lv-1-gem (171) prices the "Rest Bonus Recovery Brew" run-reward
  // (12x Lv.1 gem) in the [Monthly] 1200 Crystal Pack; matches TJW's baked 171.
  "lv-1-gem": 171,
  "lv-2-gem": 514,
  "lv-3-gem": 1543,
  "elysian-attempt-plus-1": 3000,
  gold: 1,
  // Astrogem anchors re-based 2026-07-15: the NPC sells a chosen epic astrogem for 43,000g.
  // Random-of-6 keeps TJW's half-of-selection ratio (was 15,000 vs 30,000); the Summer
  // Astrogem Package's rare-epic box is ~20% epic x 21,500 (rares aren't worth cutting).
  "epic-astrogem": 21500,
  "epic-astrogem-selected": 43000,
  "rare-epic-astrogem": 4300,
  "relic-combat-engraving-recipe": 30000,
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
