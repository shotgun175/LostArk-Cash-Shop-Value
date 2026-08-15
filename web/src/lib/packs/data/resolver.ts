import type { Chest } from "./types";

// Chest -> terminal-slug resolver, keyed by chest display-name. 49 chests total
// (34 fixed, 12 selection, 3 multi): the original registry transcribed verbatim from source B
// (resolverFull), plus manual additions noted inline (gold bars; the 2026-07-15 summer-rotation
// Season 4 tickets and astrogem chests; the 2026-08-12 rotation chests).
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
  // Rare-grade 15-per-chest variant; the IN-GAME display name is identical to the Epic
  // 100-pack above, so the dataset disambiguates with a "(15)" suffix. Tooltip: "grants 15
  // Abidos Fusion Material (Bound)". Used by the Adventurer's Path Package (correction
  // 2026-08-14 — its 40 chests are this variant, 600 mats total, not 4,000).
  "Abidos Fusion Material Chest (15)": {
    name: "Abidos Fusion Material Chest (15)",
    type: "fixed",
    outputs: [{ slug: "abidos-fusion-material", qtyPerChest: 15 }],
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
  // Season 4 exchange tickets (2026-07-15 Paradise re-release). Corrected 2026-08-14 (user
  // sign-off): S4 tickets exchange for the Season 4 "VI" (ilvl 1750) keys, not the Season 3
  // splendid V keys the 2026-07-15 transcription approximated with — so they now point at our
  // datamine-backed 1750 EV slugs. (TJW shipped the same correction on 2026-08-12.)
  "Legendary Netherworld Key Exchange Ticket (Season 4)": {
    name: "Legendary Netherworld Key Exchange Ticket (Season 4)",
    type: "selection",
    outputs: [
      { slug: "netherworld-flame-key-vi", qtyPerChest: 1 },
      { slug: "netherworld-frost-key-vi", qtyPerChest: 1 },
    ],
  },
  "Legendary Hell Key of Destiny Exchange Ticket (Season 4)": {
    name: "Legendary Hell Key of Destiny Exchange Ticket (Season 4)",
    type: "fixed",
    outputs: [{ slug: "hell-key-of-destiny-vi", qtyPerChest: 1 }],
  },
  "Epic Hell Key of Destiny Exchange Ticket (Season 4)": {
    name: "Epic Hell Key of Destiny Exchange Ticket (Season 4)",
    type: "fixed",
    outputs: [{ slug: "hell-key-of-destiny-vi-epic", qtyPerChest: 1 }],
  },
  // Season 4 reissue of the S3 barter ticket; same output (1 roster-bound Elysian Attempt).
  "Elysian Attempt +1 Exchange Ticket (Season 4)": {
    name: "Elysian Attempt +1 Exchange Ticket (Season 4)",
    type: "fixed",
    outputs: [{ slug: "elysian-attempt-plus-1", qtyPerChest: 1 }],
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
  // 2026-07-15 Summer Astrogem Package. The live store names its pick-one chest "Selection"
  // (the relic-pack era transcription above says "Selector"); both grant one chosen epic
  // astrogem. The two processing tickets are untradable utility items with no market value.
  "Epic Astrogem Selection Chest": {
    name: "Epic Astrogem Selection Chest",
    type: "fixed",
    outputs: [{ slug: "epic-astrogem-selected", qtyPerChest: 1 }],
  },
  "Rare - Epic Astrogem Chest": {
    name: "Rare - Epic Astrogem Chest",
    type: "fixed",
    outputs: [{ slug: "rare-epic-astrogem", qtyPerChest: 1 }],
  },
  "Astrogem Processing Reset Ticket": {
    name: "Astrogem Processing Reset Ticket",
    type: "fixed",
    outputs: [{ slug: "astrogem-processing-reset-ticket", qtyPerChest: 1, isBound: true }],
  },
  "Astrogem Processing Option Refresh Ticket": {
    name: "Astrogem Processing Option Refresh Ticket",
    type: "fixed",
    outputs: [{ slug: "astrogem-processing-option-refresh-ticket", qtyPerChest: 1, isBound: true }],
  },
  // Summer Custom Pack II option (2026-08-12 rotation). Random Legendary/Epic card; cards are
  // untradable with no market gold value, so the line renders as a "no price" row.
  "Joyful Legendary - Epic Card Pack": {
    name: "Joyful Legendary - Epic Card Pack",
    type: "fixed",
    outputs: [{ slug: "joyful-legendary-epic-card-pack", qtyPerChest: 1, isBound: true }],
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
  // [Monthly] 1200 Crystal Pack (2026-07 rotation). "Crystal" is Blue Crystal currency, priced
  // dynamically at the F4 gold input / 95 (buildPriceMap.blueCrystalGold). The two brews are each
  // valued as one extra ilvl-1750 run (TJW): Rest Bonus = a Guardian Raid entry (12x Lv.1 T4 gem),
  // Aura = a Chaos/Frontline run (its per-run mat table). Bound tags are display-only, not zeroing.
  "Crystal": {
    name: "Crystal",
    type: "fixed",
    outputs: [{ slug: "blue-crystal", qtyPerChest: 1, isCurrency: true }],
  },
  "Rest Bonus Recovery Brew": {
    name: "Rest Bonus Recovery Brew",
    type: "multi",
    outputs: [{ slug: "lv-1-gem", qtyPerChest: 12 }],
  },
  "Aura of Resonance Recovery Brew": {
    name: "Aura of Resonance Recovery Brew",
    type: "multi",
    outputs: [
      { slug: "destiny-crystallized-destruction-stone", qtyPerChest: 369, isBound: true },
      { slug: "destiny-crystallized-guardian-stone", qtyPerChest: 1229, isBound: true },
      { slug: "great-destiny-leapstone", qtyPerChest: 20, isBound: true },
      { slug: "destiny-shard", qtyPerChest: 52600, isCurrency: true, isBound: true },
    ],
  },
};
