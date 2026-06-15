// Slugs we ship a real icon file for (TJW's slug-named set, copied into static/icons).
export const ICON_SLUGS = new Set<string>([
  "prime-oreha-fusion-material", "solar-grace", "epic-astrogem", "royal-crystal", "gold",
  "gold-bars", "artisans-metallurgy-level-3", "artisans-metallurgy-level-4",
  "artisans-tailoring-level-3", "artisans-tailoring-level-4", "atropine-potion-bound",
  "stimulant-bound", "elysian-attempt-plus-1", "ebony-cube-4th-unlock",
  "relic-combat-engraving-recipe", "splendid-dark-grenade-bound",
  "splendid-elemental-hp-potion-bound", "splendid-hell-key-of-destiny-v",
  "splendid-hell-key-of-destiny-v-epic", "splendid-netherworld-flame-key",
  "splendid-netherworld-frost-key", "splendid-sacred-bomb-bound", "splendid-sacred-charm-bound",
]);

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
  return ICON_SLUGS.has(slug);
}

export function iconUrl(slug: string): string {
  return `/icons/${slug}.png`;
}
