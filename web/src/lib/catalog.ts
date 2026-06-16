import { RELIC_ENGRAVING_SLUGS } from "./packs/data/constants";

// slug -> icon filename under /static/icons. Several item families share one piece of art
// (all 23 relic engraving recipes; metallurgy+tailoring at each artisan tier; the three hellfire
// brackets per profession), so this is a slug->file map, not a `${slug}.png` convention.
const SHARED: Record<string, string> = {
  ...Object.fromEntries(RELIC_ENGRAVING_SLUGS.map((s) => [s, "relic-engraving-recipe.png"])),
  "artisans-metallurgy-level-1": "artisans-level-1.png",
  "artisans-tailoring-level-1": "artisans-level-1.png",
  "artisans-metallurgy-level-2": "artisans-level-2.png",
  "artisans-tailoring-level-2": "artisans-level-2.png",
  "artisans-metallurgy-level-3": "artisans-level-3.png",
  "artisans-tailoring-level-3": "artisans-level-3.png",
  "artisans-metallurgy-level-4": "artisans-level-4.png",
  "artisans-tailoring-level-4": "artisans-level-4.png",
  "metallurgy-hellfire-11-14": "metallurgy-hellfire.png",
  "metallurgy-hellfire-15-18": "metallurgy-hellfire.png",
  "metallurgy-hellfire-19-20": "metallurgy-hellfire.png",
  "tailoring-hellfire-11-14": "tailoring-hellfire.png",
  "tailoring-hellfire-15-18": "tailoring-hellfire.png",
  "tailoring-hellfire-19-20": "tailoring-hellfire.png",
  "epic-astrogem": "epic-astrogem-random.png",
};

// Items whose icon file is named after the slug (`${slug}.png`): the original set + the 1:1 drops.
const ONE_TO_ONE: readonly string[] = [
  "ebony-cube-4th-unlock", "elysian-attempt-plus-1", "gold", "gold-bars",
  "prime-oreha-fusion-material", "relic-combat-engraving-recipe", "royal-crystal", "solar-grace",
  "splendid-hell-key-of-destiny-v", "splendid-hell-key-of-destiny-v-epic",
  "splendid-netherworld-flame-key", "splendid-netherworld-frost-key",
  "atropine-potion-bound", "stimulant-bound", "splendid-dark-grenade-bound",
  "splendid-elemental-hp-potion-bound", "splendid-sacred-bomb-bound", "splendid-sacred-charm-bound",
  "abidos-fusion-material", "aura-of-resonance-recov-brew-30d",
  "crystallized-destruction-stone", "crystallized-guardian-stone",
  "destiny-crystallized-destruction-stone", "destiny-crystallized-guardian-stone",
  "destiny-destruction-stone", "destiny-guardian-stone", "destiny-leapstone", "destiny-shard",
  "destiny-shard-pouch-l", "destiny-shard-pouch-m", "destiny-shard-pouch-s",
  "destruction-stone", "destruction-stone-fragment", "epic-astrogem-selected",
  "glaciers-breath", "great-destiny-leapstone", "great-honor-leapstone",
  "guardian-stone", "guardian-stone-fragment", "harmony-leapstone", "honor-leapstone",
  "honor-shard-pouch-l", "lavas-breath", "lv-3-gem", "marvelous-honor-leapstone",
  "radiant-honor-leapstone", "refined-obliteration-stone", "refined-protection-stone",
  "rest-bonus-recovery-brew-30d", "sidereal-energy", "solar-blessing", "solar-protection",
  "superior-abidos-fusion-material",
];

export const ICON_FILES: Readonly<Record<string, string>> = {
  ...SHARED,
  ...Object.fromEntries(ONE_TO_ONE.map((s) => [s, `${s}.png`])),
};

// Names that don't title-case cleanly from the slug.
const NAME_OVERRIDES: Record<string, string> = {
  "moon-s-breath": "Moon's Breath",
  "lv-3-blazing-gem": "Lv. 3 Blazing Gem",
  "lv-3-doomfire-gem": "Lv. 3 Doomfire Gem",
  "mp-efficiency-increase": "MP Efficiency Increase",
  "elysian-attempt-plus-1": "Elysian Attempt +1",
};

export function displayName(slug: string): string {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug];
  return slug.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

export function hasIcon(slug: string): boolean {
  return slug in ICON_FILES;
}

export function iconUrl(slug: string): string {
  return `/icons/${ICON_FILES[slug] ?? `${slug}.png`}`;
}
