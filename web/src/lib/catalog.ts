import { base } from "$app/paths";
import { RELIC_ENGRAVING_SLUGS } from "./packs/data/constants";

// slug -> icon filename under /static/icons. Several item families share one piece of art
// (all 23 relic engraving recipes; the three hellfire brackets per profession), so this is a
// slug->file map, not a `${slug}.png` convention.
const SHARED: Record<string, string> = {
  ...Object.fromEntries(RELIC_ENGRAVING_SLUGS.map((s) => [s, "relic-engraving-recipe.png"])),
  "metallurgy-hellfire-11-14": "metallurgy-hellfire.png",
  "metallurgy-hellfire-15-18": "metallurgy-hellfire.png",
  "metallurgy-hellfire-19-20": "metallurgy-hellfire.png",
  "tailoring-hellfire-11-14": "tailoring-hellfire.png",
  "tailoring-hellfire-15-18": "tailoring-hellfire.png",
  "tailoring-hellfire-19-20": "tailoring-hellfire.png",
  "epic-astrogem": "epic-astrogem-random.png",
  // The in-game "Rare - Epic Astrogem Chest" uses the same blue "?" chest art.
  "rare-epic-astrogem": "epic-astrogem-random.png",
  // Gold only ever appears as a material line via the "10k Gold Bars" chest, so show the
  // bars art rather than the coin (gold.png is still used directly by the rate/total badges).
  "gold": "gold-bars.png",
  // Raw shards aren't sold loose — reuse the Large pouch art for the per-shard line.
  "destiny-shard": "destiny-shard-pouch-l.png",
  // All non-1730 key tiers (II/III/IV/VI) share the corresponding V key art (user 2026-07-30).
  ...Object.fromEntries(
    ["ii", "iii", "iv", "vi"].flatMap((n) => [
      [`hell-key-of-destiny-${n}`, "splendid-hell-key-of-destiny-v.png"],
      [`hell-key-of-destiny-${n}-epic`, "splendid-hell-key-of-destiny-v-epic.png"],
      [`netherworld-flame-key-${n}`, "splendid-netherworld-flame-key.png"],
      [`netherworld-frost-key-${n}`, "splendid-netherworld-frost-key.png"],
    ]),
  ),
};

// Items whose icon file is named after the slug (`${slug}.png`): the original set + the 1:1 drops.
const ONE_TO_ONE: readonly string[] = [
  "artisans-metallurgy-level-1", "artisans-metallurgy-level-2", "artisans-metallurgy-level-3", "artisans-metallurgy-level-4",
  "artisans-tailoring-level-1", "artisans-tailoring-level-2", "artisans-tailoring-level-3", "artisans-tailoring-level-4",
  "ebony-cube-4th-unlock", "elysian-attempt-plus-1", "gold-bars",
  "prime-oreha-fusion-material", "relic-combat-engraving-recipe", "royal-crystal", "solar-grace",
  "splendid-hell-key-of-destiny-v", "splendid-hell-key-of-destiny-v-epic",
  "splendid-netherworld-flame-key", "splendid-netherworld-frost-key",
  "atropine-potion-bound", "stimulant-bound", "splendid-dark-grenade-bound",
  "splendid-elemental-hp-potion-bound", "splendid-sacred-bomb-bound", "splendid-sacred-charm-bound",
  "abidos-fusion-material", "aura-of-resonance-recov-brew-30d", "oreha-fusion-material",
  "stone-of-soaring-kit", "basic-life-energy-potion",
  "crystallized-destruction-stone", "crystallized-guardian-stone",
  "destiny-crystallized-destruction-stone", "destiny-crystallized-guardian-stone",
  "destiny-destruction-stone", "destiny-guardian-stone", "destiny-leapstone",
  "destiny-shard-pouch-l", "destiny-shard-pouch-m", "destiny-shard-pouch-s",
  "destruction-stone", "destruction-stone-fragment", "epic-astrogem-selected",
  "glaciers-breath", "great-destiny-leapstone", "great-honor-leapstone",
  "guardian-stone", "guardian-stone-fragment", "harmony-leapstone", "honor-leapstone",
  "honor-shard-pouch-l", "lavas-breath", "lv-3-gem", "marvelous-honor-leapstone",
  "radiant-honor-leapstone", "refined-obliteration-stone", "refined-protection-stone",
  "rest-bonus-recovery-brew-30d", "sidereal-energy", "solar-blessing", "solar-protection",
  "superior-abidos-fusion-material",
  // Ark Pass card-pack row — icon only, no gold value (see arkPass.ts iconSlug);
  // generic art shared across the legendary card packs.
  "legendary-card-pack",
  // Summer Astrogem Package (2026-07-15) utility tickets — art cropped from in-game tooltips.
  "astrogem-processing-reset-ticket", "astrogem-processing-option-refresh-ticket",
  // [Monthly] 1200 Crystal Pack: Blue Crystal currency + the Lv.1 T4 gem (Rest Bonus brew reward).
  // Art pending; until the 128x128 files land in static/icons, ItemIcon's onerror shows a chip.
  "blue-crystal", "lv-1-gem",
];

const ICON_FILES: Readonly<Record<string, string>> = {
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
  "rare-epic-astrogem": "Rare/Epic Astrogem",
  "metallurgy-hellfire-11-14": "Metallurgy Hellfire 11 - 14",
  "metallurgy-hellfire-15-18": "Metallurgy Hellfire 15 - 18",
  "metallurgy-hellfire-19-20": "Metallurgy Hellfire 19 - 20",
  "tailoring-hellfire-11-14": "Tailoring Hellfire 11 - 14",
  "tailoring-hellfire-15-18": "Tailoring Hellfire 15 - 18",
  "tailoring-hellfire-19-20": "Tailoring Hellfire 19 - 20",
  // Hell key display names use the datamine labels (no "Splendid", tier numeral appended);
  // rarity comes from the card pills, with an "(Epic)" disambiguator only where two cards
  // would otherwise share a name (user 2026-07-30).
  "splendid-hell-key-of-destiny-v": "Hell Key of Destiny V",
  "splendid-hell-key-of-destiny-v-epic": "Hell Key of Destiny V (Epic)",
  "splendid-netherworld-flame-key": "Netherworld Flame Key V",
  "splendid-netherworld-frost-key": "Netherworld Frost Key V",
  ...Object.fromEntries(
    (["ii", "iii", "iv", "vi"] as const).flatMap((n) => {
      const R = n.toUpperCase();
      return [
        [`hell-key-of-destiny-${n}`, `Hell Key of Destiny ${R}`],
        [`hell-key-of-destiny-${n}-epic`, `Hell Key of Destiny ${R} (Epic)`],
        [`netherworld-flame-key-${n}`, `Netherworld Flame Key ${R}`],
        [`netherworld-frost-key-${n}`, `Netherworld Frost Key ${R}`],
      ];
    }),
  ),
};

export function displayName(slug: string): string {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug];
  return slug.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

export function hasIcon(slug: string): boolean {
  return slug in ICON_FILES;
}

export function iconUrl(slug: string): string {
  return `${base}/icons/${ICON_FILES[slug] ?? `${slug}.png`}`;
}

// These icons use TJW's original art, which already bakes in the in-game grade frame. They must NOT
// receive the overlay frame (frame-icon-2.png, applied in ItemIcon.svelte) or they'd be double-framed;
// every other icon gets it so the whole set matches the framed look.
const PRE_FRAMED = new Set<string>([
  "atropine-potion-bound",
  "stimulant-bound",
  "splendid-dark-grenade-bound",
  "splendid-elemental-hp-potion-bound",
  "splendid-sacred-bomb-bound",
  "splendid-sacred-charm-bound",
]);

export function isPreframed(slug: string): boolean {
  return PRE_FRAMED.has(slug);
}
