import type { Chest } from "./types";

// Chest -> terminal-slug resolver, keyed by chest display-name. 38 chests total
// (25 fixed, 12 selection, 1 multi), transcribed verbatim from source B (resolverFull).
// Selection chests: use defaultPickSlug if set, else auto-pick the highest line-gold option.
export const RESOLVER: Record<string, Chest> = {
  "Crystallized Destiny Destruction Stone Pouch": {
    name: "Crystallized Destiny Destruction Stone Pouch",
    type: "fixed",
    outputs: [{ slug: "destiny-crystallized-destruction-stone", qtyPerChest: 1000 }],
  },
  "Crystallized Destiny Guardian Stone Pouch": {
    name: "Crystallized Destiny Guardian Stone Pouch",
    type: "fixed",
    outputs: [{ slug: "destiny-crystallized-guardian-stone", qtyPerChest: 1000 }],
  },
  "Great Destiny Leapstone Chest": {
    name: "Great Destiny Leapstone Chest",
    type: "fixed",
    outputs: [{ slug: "great-destiny-leapstone", qtyPerChest: 20 }],
  },
  "Superior Abidos Fusion Material Chest": {
    name: "Superior Abidos Fusion Material Chest",
    type: "fixed",
    outputs: [{ slug: "superior-abidos-fusion-material", qtyPerChest: 20 }],
  },
  "Destiny Shard Pouch (L)": {
    name: "Destiny Shard Pouch (L)",
    type: "fixed",
    outputs: [{ slug: "destiny-shard", qtyPerChest: 3000, isCurrency: true }],
  },
  "Glacier's Breath Chest": {
    name: "Glacier's Breath Chest",
    type: "fixed",
    outputs: [{ slug: "glaciers-breath", qtyPerChest: 10 }],
  },
  "Lava's Breath Chest": {
    name: "Lava's Breath Chest",
    type: "fixed",
    outputs: [{ slug: "lavas-breath", qtyPerChest: 3 }],
  },
  "Destiny Destruction Stone Bundle": {
    name: "Destiny Destruction Stone Bundle",
    type: "fixed",
    outputs: [{ slug: "destiny-destruction-stone", qtyPerChest: 1000 }],
  },
  "Destiny Guardian Stone Bundle": {
    name: "Destiny Guardian Stone Bundle",
    type: "fixed",
    outputs: [{ slug: "destiny-guardian-stone", qtyPerChest: 1000 }],
  },
  "Destiny Leapstone Chest": {
    name: "Destiny Leapstone Chest",
    type: "fixed",
    outputs: [{ slug: "destiny-leapstone", qtyPerChest: 100 }],
  },
  "Abidos Fusion Material Chest": {
    name: "Abidos Fusion Material Chest",
    type: "fixed",
    outputs: [{ slug: "abidos-fusion-material", qtyPerChest: 100 }],
  },
  "Artisan's Support Materials Selection Chest: Weapon": {
    name: "Artisan's Support Materials Selection Chest: Weapon",
    type: "selection",
    outputs: [
      { slug: "artisans-metallurgy-level-1", qtyPerChest: 20 },
      { slug: "artisans-metallurgy-level-2", qtyPerChest: 10 },
      { slug: "artisans-metallurgy-level-3", qtyPerChest: 4 },
      { slug: "artisans-metallurgy-level-4", qtyPerChest: 2 },
      { slug: "lavas-breath", qtyPerChest: 30 },
    ],
  },
  "Artisan's Support Materials Selection Chest: Armor": {
    name: "Artisan's Support Materials Selection Chest: Armor",
    type: "selection",
    outputs: [
      { slug: "artisans-tailoring-level-1", qtyPerChest: 60 },
      { slug: "artisans-tailoring-level-2", qtyPerChest: 30 },
      { slug: "artisans-tailoring-level-3", qtyPerChest: 12 },
      { slug: "artisans-tailoring-level-4", qtyPerChest: 6 },
      { slug: "glaciers-breath", qtyPerChest: 90 },
    ],
  },
  "(NEW) Ebony Cube Entrance Ticket Selection Chest II": {
    name: "(NEW) Ebony Cube Entrance Ticket Selection Chest II",
    type: "fixed",
    outputs: [{ slug: "ebony-cube-4th-unlock", qtyPerChest: 1 }],
  },
  "T4 Gem Chest (Lv. 3)": {
    name: "T4 Gem Chest (Lv. 3)",
    type: "fixed",
    outputs: [{ slug: "lv-3-gem", qtyPerChest: 1 }],
  },
  "Elysian Attempt +1 Exchange Ticket (Season 3)": {
    name: "Elysian Attempt +1 Exchange Ticket (Season 3)",
    type: "fixed",
    outputs: [{ slug: "elysian-attempt-plus-1", qtyPerChest: 1 }],
  },
  "Legendary Netherworld Key Exchange Ticket (Season 3)": {
    name: "Legendary Netherworld Key Exchange Ticket (Season 3)",
    type: "selection",
    outputs: [
      { slug: "splendid-netherworld-flame-key", qtyPerChest: 1 },
      { slug: "splendid-netherworld-frost-key", qtyPerChest: 1 },
    ],
  },
  "Legendary Hell Key of Destiny Exchange Ticket II (Season 3)": {
    name: "Legendary Hell Key of Destiny Exchange Ticket II (Season 3)",
    type: "fixed",
    outputs: [{ slug: "splendid-hell-key-of-destiny-v", qtyPerChest: 1 }],
  },
  "Epic Hell Key of Destiny Exchange Ticket II (Season 3)": {
    name: "Epic Hell Key of Destiny Exchange Ticket II (Season 3)",
    type: "fixed",
    outputs: [{ slug: "splendid-hell-key-of-destiny-v-epic", qtyPerChest: 1 }],
  },
  "Epic Hell Key of Destiny Exchange Ticket (Season 3)": {
    name: "Epic Hell Key of Destiny Exchange Ticket (Season 3)",
    type: "fixed",
    outputs: [{ slug: "splendid-hell-key-of-destiny-v-epic", qtyPerChest: 1 }],
  },
  "Epic Astrogem Chest": {
    name: "Epic Astrogem Chest",
    type: "fixed",
    outputs: [{ slug: "epic-astrogem", qtyPerChest: 1 }],
  },
  "Epic Astrogem Selector Chest": {
    name: "Epic Astrogem Selector Chest",
    type: "fixed",
    outputs: [{ slug: "epic-astrogem-selected", qtyPerChest: 1 }],
  },
  "Relic Combat Engraving Recipe Selection Pouch": {
    name: "Relic Combat Engraving Recipe Selection Pouch",
    type: "fixed",
    outputs: [{ slug: "relic-combat-engraving-recipe", qtyPerChest: 1 }],
  },
  // Not serialized in source B's resolverFull array, but referenced by the
  // limited-relic-engraving-growth pack and valued in grounding doc §5: "gold = 1
  // (e.g. '10k Character-Bound Gold Bars' -> gold x10000)".
  "10k Character-Bound Gold Bars": {
    name: "10k Character-Bound Gold Bars",
    type: "fixed",
    outputs: [{ slug: "gold", qtyPerChest: 10000, isCurrency: true }],
  },
  "Destiny Leapstone Chest (100)": {
    name: "Destiny Leapstone Chest (100)",
    type: "fixed",
    outputs: [{ slug: "destiny-leapstone", qtyPerChest: 100 }],
  },
  "Abidos Fusion Material Chest (100)": {
    name: "Abidos Fusion Material Chest (100)",
    type: "fixed",
    outputs: [{ slug: "abidos-fusion-material", qtyPerChest: 100 }],
  },
  "Destiny Shard Pouch (1k)": {
    name: "Destiny Shard Pouch (1k)",
    type: "fixed",
    outputs: [{ slug: "destiny-shard", qtyPerChest: 1000, isCurrency: true }],
  },
  "T4 Stone Selection Chest": {
    name: "T4 Stone Selection Chest",
    type: "selection",
    outputs: [
      { slug: "destiny-destruction-stone", qtyPerChest: 2500 },
      { slug: "destiny-guardian-stone", qtyPerChest: 5000 },
    ],
  },
  "T4 Breath Selection Chest": {
    name: "T4 Breath Selection Chest",
    type: "selection",
    outputs: [
      { slug: "lavas-breath", qtyPerChest: 10 },
      { slug: "glaciers-breath", qtyPerChest: 20 },
    ],
  },
  "T4 Support Materials Selection Chest": {
    name: "T4 Support Materials Selection Chest",
    type: "selection",
    outputs: [
      { slug: "lavas-breath", qtyPerChest: 25 },
      { slug: "glaciers-breath", qtyPerChest: 100 },
    ],
  },
  "Wanderer's Shard Box": {
    name: "Wanderer's Shard Box",
    type: "selection",
    defaultPickSlug: "destiny-shard-pouch-l",
    outputs: [
      { slug: "honor-shard-pouch-l", qtyPerChest: 20 },
      { slug: "destiny-shard-pouch-l", qtyPerChest: 10 },
    ],
  },
  "Wanderer's Special Honing Material Selection Chest": {
    name: "Wanderer's Special Honing Material Selection Chest",
    type: "selection",
    outputs: [
      { slug: "refined-obliteration-stone", qtyPerChest: 9000 },
      { slug: "destiny-destruction-stone", qtyPerChest: 3000 },
      { slug: "destiny-crystallized-destruction-stone", qtyPerChest: 1000 },
      { slug: "refined-protection-stone", qtyPerChest: 45000 },
      { slug: "destiny-guardian-stone", qtyPerChest: 15000 },
      { slug: "destiny-crystallized-guardian-stone", qtyPerChest: 5000 },
    ],
  },
  "Wanderer's Special Auxiliary Material Selection Chest": {
    name: "Wanderer's Special Auxiliary Material Selection Chest",
    type: "selection",
    outputs: [
      { slug: "solar-grace", qtyPerChest: 240 },
      { slug: "solar-blessing", qtyPerChest: 120 },
      { slug: "solar-protection", qtyPerChest: 60 },
      { slug: "glaciers-breath", qtyPerChest: 60 },
      { slug: "lavas-breath", qtyPerChest: 60 },
    ],
  },
  "Wanderer's Special Breakthrough Stone Selection Chest": {
    name: "Wanderer's Special Breakthrough Stone Selection Chest",
    type: "selection",
    defaultPickSlug: "great-destiny-leapstone",
    outputs: [
      { slug: "radiant-honor-leapstone", qtyPerChest: 450 },
      { slug: "destiny-leapstone", qtyPerChest: 150 },
      { slug: "great-destiny-leapstone", qtyPerChest: 50 },
    ],
  },
  "Wanderer's Special Fusion Material Selection Chest": {
    name: "Wanderer's Special Fusion Material Selection Chest",
    type: "selection",
    outputs: [
      { slug: "prime-oreha-fusion-material", qtyPerChest: 360 },
      { slug: "abidos-fusion-material", qtyPerChest: 180 },
      { slug: "superior-abidos-fusion-material", qtyPerChest: 150 },
    ],
  },
  "Adventurer's Path Chest I — Bound Bundle": {
    name: "Adventurer's Path Chest I — Bound Bundle",
    type: "multi",
    outputs: [
      { slug: "splendid-elemental-hp-potion-bound", qtyPerChest: 100, isBound: true },
      { slug: "stimulant-bound", qtyPerChest: 50, isBound: true },
      { slug: "atropine-potion-bound", qtyPerChest: 50, isBound: true },
      { slug: "splendid-dark-grenade-bound", qtyPerChest: 50, isBound: true },
      { slug: "splendid-sacred-bomb-bound", qtyPerChest: 50, isBound: true },
      { slug: "splendid-sacred-charm-bound", qtyPerChest: 50, isBound: true },
      { slug: "aura-of-resonance-recov-brew-30d", qtyPerChest: 3, isBound: true },
      { slug: "rest-bonus-recovery-brew-30d", qtyPerChest: 3, isBound: true },
    ],
  },
};
