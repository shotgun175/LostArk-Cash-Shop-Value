export const REGIONS = ["nae", "euc"] as const;
export type Region = (typeof REGIONS)[number];

// The full tracked slug universe (95). Source: design doc Appendix B.
// 76 carry live prices in both regions; 19 are bundle-only pack-content slugs.
export const ALL_SLUGS: readonly string[] = [
  "abidos-fusion-material", "adrenaline", "all-out-attack", "ambush-master",
  "artisans-metallurgy-level-1", "artisans-metallurgy-level-2", "artisans-metallurgy-level-3", "artisans-metallurgy-level-4",
  "artisans-tailoring-level-1", "artisans-tailoring-level-2", "artisans-tailoring-level-3", "artisans-tailoring-level-4",
  "atropine-potion-bound", "awakening", "barricade", "crystallized-destruction-stone", "crystallized-guardian-stone", "cursed-doll",
  "destiny-crystallized-destruction-stone", "destiny-crystallized-guardian-stone", "destiny-destruction-stone", "destiny-guardian-stone",
  "destiny-leapstone", "destiny-shard", "destiny-shard-pouch-l", "destiny-shard-pouch-m", "destiny-shard-pouch-s",
  "destruction-stone", "destruction-stone-fragment", "drops-of-ether",
  "ebony-cube-1st-forbiddance", "ebony-cube-1st-unlock", "ebony-cube-2nd-forbiddance", "ebony-cube-2nd-unlock",
  "ebony-cube-3rd-forbiddance", "ebony-cube-3rd-unlock", "ebony-cube-4th-forbiddance", "ebony-cube-4th-unlock", "ebony-cube-5th-forbiddance",
  "elysian-attempt-plus-1", "expert", "explosive-expert", "glaciers-breath", "great-destiny-leapstone", "great-honor-leapstone", "grudge",
  "guardian-stone", "guardian-stone-fragment", "harmony-leapstone", "heavy-armor", "hit-master", "honor-leapstone", "honor-shard-pouch-l",
  "keen-blunt-weapon", "lavas-breath", "lv-3-blazing-gem", "lv-3-doomfire-gem", "magick-stream", "marvelous-honor-leapstone", "mass-increase",
  "master-brawler", "metallurgy-hellfire-11-14", "metallurgy-hellfire-15-18", "metallurgy-hellfire-19-20", "moon-s-breath",
  "mp-efficiency-increase", "oreha-fusion-material", "powder-of-sage", "precise-dagger", "prime-oreha-fusion-material", "radiant-honor-leapstone",
  "raid-captain", "refined-obliteration-stone", "refined-protection-stone", "sidereal-energy", "solar-blessing", "solar-grace", "solar-protection",
  "spirit-absorption", "splendid-dark-grenade-bound", "splendid-elemental-hp-potion-bound", "splendid-hell-key-of-destiny-v",
  "splendid-hell-key-of-destiny-v-epic", "splendid-netherworld-flame-key", "splendid-netherworld-frost-key", "splendid-sacred-bomb-bound",
  "splendid-sacred-charm-bound", "stabilized-status", "stimulant-bound", "super-charge", "superior-abidos-fusion-material",
  "tailoring-hellfire-11-14", "tailoring-hellfire-15-18", "tailoring-hellfire-19-20", "vital-point-hit",
] as const;

// The 6 bound battle-item pack consumables are never listed on the AH, so the feed returns
// nothing for them. Their gold value is their *tradeable* (unbound) variant's market price.
// We fetch the unbound variants as price sources and re-key each onto its bound slug in
// normalize (the unbound key is then stripped, so only the bound item — which has an icon —
// is served). Map: unbound source slug -> bound slug it prices.
export const BOUND_FROM_UNBOUND: Readonly<Record<string, string>> = {
  "splendid-elemental-hp-potion": "splendid-elemental-hp-potion-bound",
  "stimulant": "stimulant-bound",
  "atropine-potion": "atropine-potion-bound",
  "splendid-dark-grenade": "splendid-dark-grenade-bound",
  "splendid-sacred-bomb": "splendid-sacred-bomb-bound",
  "splendid-sacred-charm": "splendid-sacred-charm-bound",
};

// Extra slugs we POST to the feed purely as price sources (stripped from the served payload).
export const PRICE_SOURCE_SLUGS: readonly string[] = Object.keys(BOUND_FROM_UNBOUND);

// What the cron actually requests: the 95-slug display universe + the price-source slugs.
export const FETCH_SLUGS: readonly string[] = [...ALL_SLUGS, ...PRICE_SOURCE_SLUGS];
