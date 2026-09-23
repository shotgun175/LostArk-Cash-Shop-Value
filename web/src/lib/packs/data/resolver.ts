import type { Chest } from "./types";

// Chest -> terminal-slug resolver, keyed by chest display-name: the original registry
// transcribed verbatim from source B (resolverFull), plus manual additions noted inline (gold
// bars; the 2026-07-15 summer-rotation Season 4 tickets and astrogem chests; the 2026-08-12
// rotation chests; the 2026-09-16 rotation chests and Jump-Up Boost rewards; the Tenebrous
// Judge Ark Pass chests).
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
  // Astrogem chests added 2026-07-15 (now used by the [Limited] Astrogem Package). The live
  // store names its pick-one chest "Selection" (the relic-pack era transcription above says
  // "Selector"); both grant one chosen epic astrogem. The two processing tickets are
  // untradable BC-store items, priced via BC_COSTS x gold/BC when the exchange input is set.
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
  // Tenebrous Judge Ark Pass (2026-09-16) premium chests, which replaced the retired Wanderer's
  // chests on the track. Contents from Lost Ark Codex's datamined box tables (items 61206011-18),
  // matching the Fandom wiki. Every option is bound; the Shard Chest is fixed, not a pick.
  "Tenebrous Shard Chest": {
    name: "Tenebrous Shard Chest",
    type: "fixed",
    outputs: [{ slug: "destiny-shard-pouch-l", qtyPerChest: 20, isBound: true }],
  },
  "Tenebrous Special Honing Material Selection Chest": {
    name: "Tenebrous Special Honing Material Selection Chest",
    type: "selection",
    outputs: [
      { slug: "destiny-destruction-stone", qtyPerChest: 6000, isBound: true },
      { slug: "destiny-crystallized-destruction-stone", qtyPerChest: 2000, isBound: true },
      { slug: "destiny-guardian-stone", qtyPerChest: 18000, isBound: true },
      { slug: "destiny-crystallized-guardian-stone", qtyPerChest: 6000, isBound: true },
    ],
  },
  "Tenebrous Special Support Materials Selection Chest": {
    name: "Tenebrous Special Support Materials Selection Chest",
    type: "selection",
    outputs: [
      { slug: "glaciers-breath", qtyPerChest: 100, isBound: true },
      { slug: "lavas-breath", qtyPerChest: 100, isBound: true },
    ],
  },
  "Tenebrous Special Leapstone Selection Chest": {
    name: "Tenebrous Special Leapstone Selection Chest",
    type: "selection",
    outputs: [
      { slug: "destiny-leapstone", qtyPerChest: 200, isBound: true },
      { slug: "great-destiny-leapstone", qtyPerChest: 100, isBound: true },
    ],
  },
  "Tenebrous Special Fusion Material Selection Chest": {
    name: "Tenebrous Special Fusion Material Selection Chest",
    type: "selection",
    outputs: [
      { slug: "abidos-fusion-material", qtyPerChest: 270, isBound: true },
      { slug: "superior-abidos-fusion-material", qtyPerChest: 225, isBound: true },
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
  // 2026-09-16 rotation chests. Pheon is bound currency with no market: valued at its BC-store
  // cost (8.5 BC each, BC_COSTS) x gold/BC when the exchange input is set, like the processing
  // tickets. The Processed Astrogem Box grants one 5/4/1/1 8-cost fully cut astrogem, which has
  // no market or synthetic value, so its line renders as a "no price" row (TJW leaves it
  // unpriced too). The two Collective chests are Ancient-grade pick-1-of-5 selection chests
  // (options transcribed by TJW from the in-game tooltips 2026-09-16); the "Enhanced" Hellfire
  // scrolls are not on our price feed, so they carry BAKED values.
  "Pheon": {
    name: "Pheon",
    type: "fixed",
    outputs: [{ slug: "pheon", qtyPerChest: 1, isCurrency: true, isBound: true }],
  },
  "Processed Astrogem Box": {
    name: "Processed Astrogem Box",
    type: "fixed",
    outputs: [{ slug: "processed-astrogem-box", qtyPerChest: 1, isBound: true }],
  },
  "Collective Support Materials Selection Chest: Weapons": {
    name: "Collective Support Materials Selection Chest: Weapons",
    type: "selection",
    outputs: [
      { slug: "lavas-breath", qtyPerChest: 30 },
      { slug: "metallurgy-hellfire-19-20", qtyPerChest: 3 },
      { slug: "enhanced-metallurgy-hellfire-19-20", qtyPerChest: 1 },
      { slug: "artisans-metallurgy-level-3", qtyPerChest: 12 },
      { slug: "artisans-metallurgy-level-4", qtyPerChest: 6 },
    ],
  },
  "Collective Support Materials Selection Chest: Armor": {
    name: "Collective Support Materials Selection Chest: Armor",
    type: "selection",
    outputs: [
      { slug: "glaciers-breath", qtyPerChest: 30 },
      { slug: "tailoring-hellfire-19-20", qtyPerChest: 3 },
      { slug: "enhanced-tailoring-hellfire-19-20", qtyPerChest: 1 },
      { slug: "artisans-tailoring-level-3", qtyPerChest: 12 },
      { slug: "artisans-tailoring-level-4", qtyPerChest: 6 },
    ],
  },
  // Jump-Up Boost Powerpass Premium rewards (2026-09-16, see data/jumpUp.ts). Gold bars are
  // literal character-bound gold at 1; the aura is a BC-store item (238 BC for 14 days, BC_COSTS);
  // the Lv. 8 gem and the fixed-epic astrogem chest are BAKED seeds; Azena's Blessing and the two
  // Ancient chests have no market and render as "no price" rows. All bound on pickup.
  "50,000 Gold Bars": {
    name: "50,000 Gold Bars",
    type: "fixed",
    outputs: [{ slug: "gold", qtyPerChest: 50000, isCurrency: true, isBound: true }],
  },
  "Crystalline Aura Plus (14 days)": {
    name: "Crystalline Aura Plus (14 days)",
    type: "fixed",
    outputs: [{ slug: "crystalline-aura-plus-14d", qtyPerChest: 1, isBound: true }],
  },
  "Azena's Blessing (28 days)": {
    name: "Azena's Blessing (28 days)",
    type: "fixed",
    outputs: [{ slug: "azenas-blessing-28d", qtyPerChest: 1, isBound: true }],
  },
  "Ancient Bracelet Chest": {
    name: "Ancient Bracelet Chest",
    type: "fixed",
    outputs: [{ slug: "ancient-bracelet-chest", qtyPerChest: 1, isBound: true }],
  },
  "Ancient Accessory Set Chest": {
    name: "Ancient Accessory Set Chest",
    type: "fixed",
    outputs: [{ slug: "ancient-accessory-set-chest", qtyPerChest: 1, isBound: true }],
  },
  "Lv. 8 Brilliant Gem (Bound)": {
    name: "Lv. 8 Brilliant Gem (Bound)",
    type: "fixed",
    outputs: [{ slug: "lv-8-gem", qtyPerChest: 1, isBound: true }],
  },
  "Fixed Epic Astrogem Selection Chest": {
    name: "Fixed Epic Astrogem Selection Chest",
    type: "fixed",
    outputs: [{ slug: "fixed-epic-astrogem-selection", qtyPerChest: 1, isBound: true }],
  },
};
