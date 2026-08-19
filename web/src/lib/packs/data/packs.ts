import type { Pack } from "./types";

// The cash-shop pack registry: the original 12 transcribed verbatim from TJW's compiled
// registry (source A: result.packs.packs[]), plus the three [Weekly] T4 "III" packs added
// from the live store on 2026-06-24, the four 2026-07-15 summer-rotation packs (Paradise
// re-release, Summer Growth I/II, Summer Astrogem), the seven 2026-08-12 rotation packs
// (Astrogem Package, Paradise Special, Summer Custom I/II, three Weekly Summer T4 packs; all
// sales-end 09/16/2026), and the six 2026-08-19 packs (the 2+1 Crystal Pack, four BC-priced
// [Discount] tiles, and the x180 gem tile; all sales-end 08/26/2026). `contents[].chest` is
// the chest display-name; resolve via RESOLVER in ./resolver. monthly-t4-growth-support RC
// (3800) is flagged by the source itself as possibly a placeholder ("RC price was cut off in
// the screenshot").
export const PACKS: Pack[] = [
  {
    // Still sold in the live shop (user-verified 2026-08-15) even though TJW's dataset marks
    // it retired 2026-08-12 — his flag was not adopted.
    name: "[Limited] Adventurer's Path Package",
    slug: "adventurers-path-package",
    royalCrystalCost: 2000,
    limited: true,
    retired: false,
    contents: [
      { chest: "Artisan's Support Materials Selection Chest: Weapon", qty: 4 },
      { chest: "Artisan's Support Materials Selection Chest: Armor", qty: 4 },
      { chest: "Destiny Shard Pouch (L)", qty: 40 },
      // Corrected 2026-08-14: the pack's tier chests drop the Rare 15-per-chest Abidos variant
      // (same in-game display name as the Epic 100-pack), so 40 chests = 600 mats, not 4,000.
      { chest: "Abidos Fusion Material Chest (15)", qty: 40 },
      { chest: "Adventurer's Path Chest I — Bound Bundle", qty: 1 },
    ],
  },
  {
    name: "[Limited] Horizon Growth Support Pack I",
    slug: "horizon-growth-support-pack-i",
    frozenTotal: 1537150, // NA card value captured at retirement 2026-07-15 (EU card showed 1,590,600)
    royalCrystalCost: 5800,
    limited: true,
    retired: true,
    retiredOn: "2026-07-15",
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 25 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 50 },
      { chest: "Great Destiny Leapstone Chest", qty: 60 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 60 },
      { chest: "Destiny Shard Pouch (L)", qty: 150 },
      { chest: "Glacier's Breath Chest", qty: 140 },
      { chest: "Lava's Breath Chest", qty: 100 },
    ],
  },
  {
    name: "[Limited] Horizon Growth Support Pack II",
    slug: "horizon-growth-support-pack-ii",
    frozenTotal: 738450, // NA card value captured at retirement 2026-07-15 (EU card showed 780,350)
    royalCrystalCost: 3800,
    limited: true,
    retired: true,
    retiredOn: "2026-07-15",
    contents: [
      { chest: "Destiny Destruction Stone Bundle", qty: 60 },
      { chest: "Destiny Guardian Stone Bundle", qty: 120 },
      { chest: "Destiny Leapstone Chest", qty: 30 },
      { chest: "Abidos Fusion Material Chest", qty: 20 },
      { chest: "Artisan's Support Materials Selection Chest: Weapon", qty: 5 },
      { chest: "Artisan's Support Materials Selection Chest: Armor", qty: 5 },
    ],
  },
  {
    name: "[Limited] Relic Engraving Growth Support Pack",
    slug: "limited-relic-engraving-growth",
    frozenTotal: 1769665,
    royalCrystalCost: 5400,
    limited: true,
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Superior Abidos Fusion Material Chest", qty: 50 },
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 30 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 30 },
      { chest: "Glacier's Breath Chest", qty: 120 },
      { chest: "Lava's Breath Chest", qty: 60 },
      { chest: "Epic Astrogem Chest", qty: 2 },
      { chest: "Epic Astrogem Selector Chest", qty: 2 },
      { chest: "10k Character-Bound Gold Bars", qty: 5 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 30 },
      { chest: "Relic Combat Engraving Recipe Selection Pouch", qty: 1 },
    ],
  },
  {
    name: "[Monthly] Paradise Special Pack",
    slug: "monthly-paradise-special-pack",
    frozenTotal: 1779188,
    royalCrystalCost: 7000,
    limited: true,
    recurrence: "monthly",
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Elysian Attempt +1 Exchange Ticket (Season 3)", qty: 3 },
      { chest: "Legendary Netherworld Key Exchange Ticket (Season 3)", qty: 1 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 8 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 120 },
      { chest: "Abidos Fusion Material Chest", qty: 30 },
      { chest: "T4 Support Materials Selection Chest", qty: 10 },
      { chest: "Legendary Hell Key of Destiny Exchange Ticket II (Season 3)", qty: 2 },
      { chest: "Epic Hell Key of Destiny Exchange Ticket II (Season 3)", qty: 2 },
    ],
  },
  {
    // 2026-07-15 re-release of the monthly Paradise pack (same display name; the retired
    // 2026-06-10 entry above keeps its frozen history) with Season 4 tickets and a lower RC.
    name: "[Monthly] Paradise Special Pack",
    slug: "monthly-paradise-special-pack-2",
    frozenTotal: 2271242, // NA card value captured 2026-08-14 on the VI-key EVs (EU card showed 2,115,292)
    royalCrystalCost: 6300,
    limited: true,
    recurrence: "monthly",
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "Epic Hell Key of Destiny Exchange Ticket (Season 4)", qty: 3 },
      { chest: "Legendary Hell Key of Destiny Exchange Ticket (Season 4)", qty: 1 },
      { chest: "Legendary Netherworld Key Exchange Ticket (Season 4)", qty: 1 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 10 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 120 },
      { chest: "Abidos Fusion Material Chest", qty: 30 },
      { chest: "T4 Support Materials Selection Chest", qty: 10 },
    ],
  },
  {
    name: "[Monthly] T4 Growth Support Pack",
    slug: "monthly-t4-growth-support",
    royalCrystalCost: 3800,
    limited: true,
    recurrence: "monthly",
    retired: false,
    contents: [
      { chest: "Destiny Leapstone Chest (100)", qty: 4 },
      { chest: "Abidos Fusion Material Chest (100)", qty: 3 },
      { chest: "Destiny Shard Pouch (1k)", qty: 100 },
      { chest: "T4 Stone Selection Chest", qty: 5 },
      { chest: "T4 Breath Selection Chest", qty: 5 },
    ],
  },
  {
    name: "[Limited] Paradise Special Pack II",
    slug: "paradise-special-pack-ii",
    frozenTotal: 711286, // NA card value captured at retirement 2026-06-24 (EU card showed 738,351)
    royalCrystalCost: 4000,
    limited: true,
    retired: true,
    retiredOn: "2026-06-24",
    contents: [
      { chest: "Epic Hell Key of Destiny Exchange Ticket (Season 3)", qty: 2 },
      { chest: "Elysian Attempt +1 Exchange Ticket (Season 3)", qty: 3 },
      { chest: "Legendary Netherworld Key Exchange Ticket (Season 3)", qty: 1 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 5 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 50 },
      { chest: "Abidos Fusion Material Chest", qty: 10 },
      { chest: "T4 Support Materials Selection Chest", qty: 5 },
    ],
  },
  {
    name: "[Limited] Shadow Growth Support Pack 1",
    slug: "shadow-growth-support-pack-1",
    frozenTotal: 1413600,
    royalCrystalCost: 5600,
    limited: true,
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 20 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 40 },
      { chest: "Great Destiny Leapstone Chest", qty: 60 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 50 },
      { chest: "Destiny Shard Pouch (L)", qty: 150 },
      { chest: "Glacier's Breath Chest", qty: 135 },
      { chest: "Lava's Breath Chest", qty: 85 },
    ],
  },
  {
    name: "[Limited] Shadow Growth Support Pack II",
    slug: "shadow-growth-support-pack-2",
    frozenTotal: 595050,
    royalCrystalCost: 3600,
    limited: true,
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Destiny Destruction Stone Bundle", qty: 30 },
      { chest: "Destiny Guardian Stone Bundle", qty: 150 },
      { chest: "Destiny Leapstone Chest", qty: 30 },
      { chest: "Abidos Fusion Material Chest", qty: 15 },
      { chest: "Artisan's Support Materials Selection Chest: Weapon", qty: 5 },
      { chest: "Artisan's Support Materials Selection Chest: Armor", qty: 5 },
    ],
  },
  {
    name: "[Limited] Summer Growth Support Pack I",
    slug: "summer-growth-support-pack-i",
    frozenTotal: 2763600, // NA card value captured 2026-08-14 (EU card showed 2,416,000)
    royalCrystalCost: 7900,
    limited: true,
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 40 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 60 },
      { chest: "Great Destiny Leapstone Chest", qty: 65 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 100 },
      { chest: "Destiny Shard Pouch (L)", qty: 200 },
      { chest: "Glacier's Breath Chest", qty: 150 },
      { chest: "Lava's Breath Chest", qty: 100 },
    ],
  },
  {
    name: "[Limited] Summer Growth Support Pack II",
    slug: "summer-growth-support-pack-ii",
    frozenTotal: 1165500, // NA card value captured 2026-08-14 (EU card showed 1,143,750)
    royalCrystalCost: 4900,
    limited: true,
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "Destiny Destruction Stone Bundle", qty: 50 },
      { chest: "Destiny Guardian Stone Bundle", qty: 100 },
      { chest: "Destiny Leapstone Chest", qty: 40 },
      { chest: "Abidos Fusion Material Chest", qty: 45 },
      { chest: "Artisan's Support Materials Selection Chest: Weapon", qty: 5 },
      { chest: "Artisan's Support Materials Selection Chest: Armor", qty: 5 },
    ],
  },
  // The 2026-07-15 "[Weekly] Summer Astrogem Package" entry was removed outright 2026-08-15:
  // the user confirmed no such product exists in the shop (the 2026-07-15 transcription
  // mis-modeled what is actually the [Limited] Astrogem Package, added below).
  {
    name: "[Weekly] T4 Crystallized Stone & Fusion Pack II",
    slug: "weekly-t4-crystallized-stone",
    frozenTotal: 370300,
    royalCrystalCost: 1400,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 10 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 30 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 15 },
    ],
  },
  {
    name: "[Weekly] T4 Crystallized Stone & Fusion Pack III",
    slug: "weekly-t4-crystallized-stone-3",
    frozenTotal: 574700, // NA card value captured 2026-08-14 (EU card showed 505,200)
    royalCrystalCost: 1700,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 30 },
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 15 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 10 },
    ],
  },
  {
    name: "[Weekly] T4 Fusion & Leap Pack II",
    slug: "weekly-t4-fusion-leap-pack-2",
    frozenTotal: 164800,
    royalCrystalCost: 1300,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "Superior Abidos Fusion Material Chest", qty: 40 },
      { chest: "Great Destiny Leapstone Chest", qty: 30 },
    ],
  },
  {
    name: "[Weekly] T4 Fusion & Leap Pack III",
    slug: "weekly-t4-fusion-leap-pack-3",
    frozenTotal: 194700, // NA card value captured 2026-08-14 (EU card showed 184,700)
    royalCrystalCost: 1300,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "Superior Abidos Fusion Material Chest", qty: 45 },
      { chest: "Great Destiny Leapstone Chest", qty: 40 },
    ],
  },
  {
    name: "[Weekly] T4 Shards & Support Materials Pack",
    slug: "weekly-t4-shards-support",
    frozenTotal: 185320,
    royalCrystalCost: 1400,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-06-10",
    contents: [
      { chest: "T4 Support Materials Selection Chest", qty: 5 },
      { chest: "Destiny Shard Pouch (L)", qty: 60 },
    ],
  },
  {
    name: "[Weekly] T4 Shards & Support Material Pack III",
    slug: "weekly-t4-shards-support-3",
    frozenTotal: 286200, // NA card value captured 2026-08-14 (EU card showed 232,170)
    royalCrystalCost: 1400,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-08-12",
    contents: [
      { chest: "T4 Support Materials Selection Chest", qty: 5 },
      { chest: "Destiny Shard Pouch (L)", qty: 65 },
    ],
  },
  {
    // 2026-07 rotation. Value is dominated by 1200 Blue Crystals ("Crystal"), priced at the F4
    // gold input / 95 (one exchange listing = 238 RC = 95 BC). The two brews are one extra
    // ilvl-1750 run each (see resolver). Recurring monthly, capped at 3 buys; not "limited".
    name: "[Monthly] 1200 Crystal Pack",
    slug: "monthly-1200-crystal-pack",
    royalCrystalCost: 2700,
    maxPurchases: 3,
    limited: false,
    recurrence: "monthly",
    retired: false,
    contents: [
      { chest: "Crystal", qty: 1200 },
      { chest: "Rest Bonus Recovery Brew", qty: 4 },
      { chest: "Aura of Resonance Recovery Brew", qty: 4 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 5 },
    ],
  },
  // --- 2026-08-12 rotation (all sales periods end 09/16/2026) ---
  {
    // 5 per roster. The two processing tickets are BC-store items valued off the exchange
    // input (BC_COSTS); the live store names the pick-one chest "Selection" (verified in the
    // purchase window), though TJW's dataset calls it "Selector" — both resolve identically.
    name: "[Limited] Astrogem Package",
    slug: "limited-astrogem-package",
    royalCrystalCost: 1100,
    maxPurchases: 5,
    limited: true,
    retired: false,
    contents: [
      { chest: "Rare - Epic Astrogem Chest", qty: 6 },
      { chest: "Epic Astrogem Chest", qty: 1 },
      { chest: "Epic Astrogem Selection Chest", qty: 1 },
      { chest: "Astrogem Processing Reset Ticket", qty: 3 },
      { chest: "Astrogem Processing Option Refresh Ticket", qty: 3 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 25 },
    ],
  },
  {
    // Successor to the retired [Monthly] Paradise Special Pack (5,400 RC vs 6,300): Legendary
    // hell keys 1 -> 2, Elysian tickets return, Abidos chests (the Epic 100-pack) 30 -> 50,
    // support-material selection chests dropped. 3 per roster.
    name: "Paradise Special Pack",
    slug: "paradise-special-pack",
    royalCrystalCost: 5400,
    maxPurchases: 3,
    limited: true,
    retired: false,
    contents: [
      { chest: "Epic Hell Key of Destiny Exchange Ticket (Season 4)", qty: 3 },
      { chest: "Legendary Hell Key of Destiny Exchange Ticket (Season 4)", qty: 2 },
      { chest: "Legendary Netherworld Key Exchange Ticket (Season 4)", qty: 1 },
      { chest: "Elysian Attempt +1 Exchange Ticket (Season 4)", qty: 3 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 10 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 120 },
      { chest: "Abidos Fusion Material Chest", qty: 50 },
    ],
  },
  {
    // Choose-5-of-10 custom pack, 5 per roster. Contents stays empty; the buyer's five picks
    // come from customSelection (the engine defaults to the five highest-gold options).
    // limited: false — the in-game title carries no [Limited] banner, and the 32d timer on
    // the purchase window (seen 2026-08-14) could be a sales end OR a reset; user will
    // re-check around 09/16/2026 and we retire or tag a recurrence then.
    name: "Summer Custom Pack I",
    slug: "summer-custom-pack-1",
    royalCrystalCost: 5200,
    maxPurchases: 5,
    limited: false,
    retired: false,
    contents: [],
    customSelection: {
      pick: 5,
      options: [
        { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 20 },
        { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 80 },
        { chest: "Great Destiny Leapstone Chest", qty: 100 },
        { chest: "Superior Abidos Fusion Material Chest", qty: 70 },
        { chest: "Destiny Shard Pouch (L)", qty: 200 },
        { chest: "Glacier's Breath Chest", qty: 150 },
        { chest: "Lava's Breath Chest", qty: 150 },
        { chest: "T4 Gem Chest (Lv. 3)", qty: 120 },
        { chest: "Legendary Netherworld Key Exchange Ticket (Season 4)", qty: 1 },
        { chest: "Epic Hell Key of Destiny Exchange Ticket (Season 4)", qty: 3 },
      ],
    },
  },
  {
    // Choose-4-of-8 custom pack, 5 per roster. The Abidos option is the Epic 100-pack (same
    // in-game display name as the Rare 15-pack; TJW user-confirmed which variant this is).
    // limited: false for the same reason as Summer Custom Pack I above.
    name: "Summer Custom Pack II",
    slug: "summer-custom-pack-2",
    royalCrystalCost: 2500,
    maxPurchases: 5,
    limited: false,
    retired: false,
    contents: [],
    customSelection: {
      pick: 4,
      options: [
        { chest: "Destiny Destruction Stone Bundle", qty: 20 },
        { chest: "Destiny Guardian Stone Bundle", qty: 160 },
        { chest: "Destiny Leapstone Chest", qty: 60 },
        { chest: "Abidos Fusion Material Chest", qty: 9 },
        { chest: "Artisan's Support Materials Selection Chest: Weapon", qty: 5 },
        { chest: "Artisan's Support Materials Selection Chest: Armor", qty: 5 },
        { chest: "Relic Combat Engraving Recipe Selection Pouch", qty: 1 },
        { chest: "Joyful Legendary - Epic Card Pack", qty: 10 },
      ],
    },
  },
  {
    // Successor to the retired Crystallized Stone & Fusion III (15/15/15 at 2,100 RC vs
    // 15/30/10 at 1,700). 5 per roster per week.
    name: "[Weekly] Summer T4 Crystallized Stone & Fusion Pack",
    slug: "weekly-summer-t4-crystallized-stone",
    royalCrystalCost: 2100,
    maxPurchases: 5,
    limited: true,
    recurrence: "weekly",
    retired: false,
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 15 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 15 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 15 },
    ],
  },
  {
    // Successor to the retired Fusion & Leap III (60/50 vs 45/40). 5 per roster per week.
    name: "[Weekly] Summer T4 Fusion & Leap Pack",
    slug: "weekly-summer-t4-fusion-leap",
    royalCrystalCost: 1300,
    maxPurchases: 5,
    limited: true,
    recurrence: "weekly",
    retired: false,
    contents: [
      { chest: "Superior Abidos Fusion Material Chest", qty: 60 },
      { chest: "Great Destiny Leapstone Chest", qty: 50 },
    ],
  },
  {
    // Successor to the retired Shards & Support III (7 chests vs 5, 50 pouches vs 65).
    // 5 per roster per week.
    name: "[Weekly] Summer T4 Shards & Support Material Pack",
    slug: "weekly-summer-t4-shards-support",
    royalCrystalCost: 1400,
    maxPurchases: 5,
    limited: true,
    recurrence: "weekly",
    retired: false,
    contents: [
      { chest: "T4 Support Materials Selection Chest", qty: 7 },
      { chest: "Destiny Shard Pouch (L)", qty: 50 },
    ],
  },
  // --- 2026-08-19 packs (all sales periods end 08/26/2026 03:00) ---
  {
    // Modeled as the full 2+1 deal (TJW 2026-08-19): the tile sells 1,000 Blue Crystals for
    // 2,100 RC with a 2-per-roster limit, and buying both grants a third 1,000-Crystal pack
    // free — so the effective deal is 4,200 RC for 3,000 Crystal, once per roster. "Crystal"
    // is Blue Crystal currency, priced at the F4 gold input / 95.
    name: "[2+1] 1000 Crystal Pack",
    slug: "2-plus-1-1000-crystal-pack",
    royalCrystalCost: 4200,
    maxPurchases: 1,
    limited: true,
    retired: false,
    contents: [{ chest: "Crystal", qty: 3000 }],
  },
  {
    // Priced in Blue Crystals (not RC) — valued against the gold cost of buying 400 BC at the
    // F4 exchange. 5 pouches (1,000 stones each) per purchase, bound to roster on pickup.
    name: "[Discount] Crystallized Destiny Destruction Stone Pouch",
    slug: "discount-crystallized-destiny-destruction-stone-pouch",
    blueCrystalCost: 400,
    maxPurchases: 3,
    limited: true,
    retired: false,
    contents: [{ chest: "Crystallized Destiny Destruction Stone Pouch", qty: 5 }],
  },
  {
    // Priced in Blue Crystals. Chests are bound to roster on pickup.
    name: "[Discount] Superior Abidos Fusion Material Chest",
    slug: "discount-superior-abidos-fusion",
    blueCrystalCost: 150,
    maxPurchases: 3,
    limited: true,
    retired: false,
    contents: [{ chest: "Superior Abidos Fusion Material Chest", qty: 20 }],
  },
  {
    // Priced in Blue Crystals. Selection chest (10 Lava's Breath or 20 Glacier's Breath)
    // defaults to the highest-gold option, as everywhere.
    name: "[Discount] T4 Breath Selection Chest",
    slug: "discount-t4-breath-selection-chest",
    blueCrystalCost: 150,
    maxPurchases: 3,
    limited: true,
    retired: false,
    contents: [{ chest: "T4 Breath Selection Chest", qty: 20 }],
  },
  {
    // Priced in Blue Crystals. Each chest is a 50/50 Doomfire/Blazing Lv. 3 gem, collapsed to
    // the single lv-3-gem line. TJW has no screenshot on file for this tile (x120), so neither
    // do we — the drill-down shows the image placeholder.
    name: "[Discount] T4 Gem Chest (Lv 3) x120",
    slug: "discount-t4-gem-chest-lv3-x120",
    blueCrystalCost: 600,
    maxPurchases: 1,
    limited: true,
    retired: false,
    contents: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 120 }],
  },
  {
    // The RC-priced sibling of the x120 tile above (same 50/50 gem chest). TJW's tile showed a
    // 7d timer on 2026-08-19, in line with the sibling [Discount] tiles' 08/26 sales end.
    name: "[Discount] T4 Gem Chest (Lv 3) x180",
    slug: "discount-t4-gem-chest-lv3",
    royalCrystalCost: 1600,
    maxPurchases: 2,
    limited: true,
    retired: false,
    contents: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 180 }],
  },
];
