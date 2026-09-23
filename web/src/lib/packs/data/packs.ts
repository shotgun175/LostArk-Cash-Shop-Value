import type { Pack } from "./types";

// The cash-shop pack registry, active and retired, first transcribed from TJW's compiled
// registry (source A: result.packs.packs[]); see git log for rotation history.
// `contents[].chest` is the chest display-name; resolve via RESOLVER in ./resolver.
export const PACKS: Pack[] = [
  {
    // Still sold in the live shop (user-verified 2026-09-09) even though TJW's dataset marks
    // it retired 2026-08-12 — his flag was not adopted.
    name: "[Limited] Adventurer's Path Package",
    slug: "adventurers-path-package",
    royalCrystalCost: 2000,
    maxPurchases: 1,
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
    maxPurchases: 10,
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
  // --- 2026-08-12 rotation (all sales periods ended 09/16/2026 03:00). The four non-weekly
  // tiles left the shop at that sales end (TJW's 2026-09-16 capture) and are retired below. Of
  // the three [Weekly] Summer tiles, Crystallized Stone and Shards & Support were re-listed with
  // 35d timers (through 10/21/2026) and stay live; Fusion & Leap was gone from the user's
  // 2026-09-16 shop capture and is retired. ---
  {
    // 5 per roster. The two processing tickets are BC-store items valued off the exchange
    // input (BC_COSTS); the live store names the pick-one chest "Selection" (verified in the
    // purchase window), though TJW's dataset calls it "Selector" — both resolve identically.
    // Retired 2026-09-16 at its sales end; replaced by the [3+1] Dimensionalist Welcome Package.
    name: "[Limited] Astrogem Package",
    slug: "limited-astrogem-package",
    // Region-independent: every line is baked (astrogems, lv-3 gems) or F4-derived (the two
    // tickets at the 30,000 default seed), so NA and EU captured identically.
    frozenTotal: 256539, // card value captured 2026-09-16 (NA and EU both)
    royalCrystalCost: 1100,
    maxPurchases: 5,
    limited: true,
    retired: true,
    retiredOn: "2026-09-16",
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
    // support-material selection chests dropped. 3 per roster. Retired 2026-09-16 at its sales
    // end; succeeded by the smaller Paradise Special Pack II (3,000 RC, slug -ii-2) below.
    name: "Paradise Special Pack",
    slug: "paradise-special-pack",
    frozenTotal: 2347610, // NA card value captured 2026-09-16 (EU card showed 2,252,503)
    royalCrystalCost: 5400,
    maxPurchases: 3,
    limited: true,
    retired: true,
    retiredOn: "2026-09-16",
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
    // limited: false because the in-game title carries no [Limited] banner. The 32d timer seen
    // on the purchase window 2026-08-14 turned out to be the sales end (the tile left the shop
    // at 09/16/2026 03:00), so it was a one-off sale after all: retired, no recurrence tag.
    name: "Summer Custom Pack I",
    slug: "summer-custom-pack-1",
    frozenTotal: 2249733, // NA card value captured 2026-09-16 (EU card showed 2,041,710)
    royalCrystalCost: 5200,
    maxPurchases: 5,
    limited: false,
    retired: true,
    retiredOn: "2026-09-16",
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
    // limited: false for the same reason as Summer Custom Pack I above; retired with it at the
    // 09/16/2026 sales end.
    name: "Summer Custom Pack II",
    slug: "summer-custom-pack-2",
    frozenTotal: 577749, // NA card value captured 2026-09-16 (EU card showed 572,100)
    royalCrystalCost: 2500,
    maxPurchases: 5,
    limited: false,
    retired: true,
    retiredOn: "2026-09-16",
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
    // 15/30/10 at 1,700). 5 per roster per week. Re-listed on 2026-09-16 with a 35d timer
    // (sales period now ends 10/21/2026).
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
    // Successor to the retired Fusion & Leap III (60/50 vs 45/40). 5 per roster per week. The
    // only weekly NOT re-listed after the 09/16/2026 sales end: absent from the user's
    // 2026-09-16 shop capture while its two siblings showed 35d timers.
    name: "[Weekly] Summer T4 Fusion & Leap Pack",
    slug: "weekly-summer-t4-fusion-leap",
    frozenTotal: 234400, // NA card value captured 2026-09-16 (EU card showed 215,600)
    royalCrystalCost: 1300,
    maxPurchases: 5,
    limited: true,
    recurrence: "weekly",
    retired: true,
    retiredOn: "2026-09-16",
    contents: [
      { chest: "Superior Abidos Fusion Material Chest", qty: 60 },
      { chest: "Great Destiny Leapstone Chest", qty: 50 },
    ],
  },
  {
    // Successor to the retired Shards & Support III (7 chests vs 5, 50 pouches vs 65).
    // 5 per roster per week. Re-listed on 2026-09-16 with a 35d timer (sales period now ends
    // 10/21/2026).
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
    // Unlike every other frozen total, this one is not AH-derived: the pack is pure Blue
    // Crystal, so its value is a function of the F4 exchange input alone. Captured at the
    // app's default 30,000 seed (3,000 BC x round(30000/95)); NA and EU are identical for
    // the same reason.
    frozenTotal: 948000,
    royalCrystalCost: 4200,
    maxPurchases: 1,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "Crystal", qty: 3000 }],
  },
  {
    // Priced in Blue Crystals (not RC) — valued against the gold cost of buying 400 BC at the
    // F4 exchange. 5 pouches (1,000 stones each) per purchase, bound to roster on pickup.
    name: "[Discount] Crystallized Destiny Destruction Stone Pouch",
    slug: "discount-crystallized-destiny-destruction-stone-pouch",
    frozenTotal: 149400, // NA card value captured 2026-09-10 (EU card showed 117,000)
    blueCrystalCost: 400,
    maxPurchases: 3,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "Crystallized Destiny Destruction Stone Pouch", qty: 5 }],
  },
  {
    // Priced in Blue Crystals. Chests are bound to roster on pickup.
    name: "[Discount] Superior Abidos Fusion Material Chest",
    slug: "discount-superior-abidos-fusion",
    frozenTotal: 62400, // NA card value captured 2026-09-10 (EU card showed 71,200)
    blueCrystalCost: 150,
    maxPurchases: 3,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "Superior Abidos Fusion Material Chest", qty: 20 }],
  },
  {
    // Priced in Blue Crystals. Selection chest (10 Lava's Breath or 20 Glacier's Breath)
    // defaults to the highest-gold option, as everywhere.
    name: "[Discount] T4 Breath Selection Chest",
    slug: "discount-t4-breath-selection-chest",
    frozenTotal: 158800, // NA card value captured 2026-09-10 (EU card showed 141,200)
    blueCrystalCost: 150,
    maxPurchases: 3,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "T4 Breath Selection Chest", qty: 20 }],
  },
  {
    // Priced in Blue Crystals. Each chest is a 50/50 Doomfire/Blazing Lv. 3 gem, collapsed to
    // the single lv-3-gem line. TJW has no screenshot on file for this tile (x120), so neither
    // do we — the drill-down shows the image placeholder.
    name: "[Discount] T4 Gem Chest (Lv 3) x120",
    slug: "discount-t4-gem-chest-lv3-x120",
    // Lv-3 gems are a BAKED constant, not an AH price, so NA and EU capture identically.
    frozenTotal: 222000, // card value captured 2026-09-10 (NA and EU both)
    blueCrystalCost: 600,
    maxPurchases: 1,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 120 }],
  },
  {
    // The RC-priced sibling of the x120 tile above (same 50/50 gem chest). TJW's tile showed a
    // 7d timer on 2026-08-19, in line with the sibling [Discount] tiles' 08/26 sales end.
    name: "[Discount] T4 Gem Chest (Lv 3) x180",
    slug: "discount-t4-gem-chest-lv3",
    frozenTotal: 333000, // card value captured 2026-09-10 (NA and EU both; baked lv-3 gem price)
    royalCrystalCost: 1600,
    maxPurchases: 2,
    limited: true,
    retired: true,
    retiredOn: "2026-08-26",
    contents: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 180 }],
  },
  // --- 2026-09-16 rotation (all sales periods end 10/21/2026 03:00) ---
  {
    // Modeled as the full 3+1 deal (TJW 2026-09-16, the same treatment as the 2+1 Crystal
    // Pack): the tile sells one package for 3,500 RC with a 3-per-roster limit, and buying all
    // three grants a fourth free, so the effective deal is 10,500 RC for 4x the contents, once
    // per roster. Per single package: 50 Pheon, 25 Rare - Epic Astrogem Chest, 1 Processed
    // Astrogem Box, 3 Epic Astrogem Selection Chest, 10 Astrogem Processing Reset Ticket, 30 T4
    // Gem Chest (Lv. 3), 5 Ebony Cube chests (read off the purchase-window icon strip).
    // Pheons are a BC-store item (8.5 BC each, BC_COSTS); the Processed Astrogem Box (one
    // 5/4/1/1 8-cost fully cut astrogem) has no market, so its line renders as "no price".
    // Replaces the retired [Limited] Astrogem Package.
    name: "[3+1] Dimensionalist Welcome Package",
    slug: "dimensionalist-welcome-package",
    royalCrystalCost: 10500,
    maxPurchases: 1,
    limited: true,
    retired: false,
    contents: [
      { chest: "Pheon", qty: 200 },
      { chest: "Rare - Epic Astrogem Chest", qty: 100 },
      { chest: "Processed Astrogem Box", qty: 4 },
      { chest: "Epic Astrogem Selection Chest", qty: 12 },
      { chest: "Astrogem Processing Reset Ticket", qty: 40 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 120 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 20 },
    ],
  },
  {
    // 5 per roster; sibling of the [3+1] pack (same 10/21 sales window). The first five lines
    // were matched by TJW against the Growth Support family art (the Horizon/Summer packs use
    // the same pouches and chests); the two x3 Collective Support Materials Selection Chests
    // are new Ancient-grade pick-1-of-5 chests read from their in-game tooltips (see resolver).
    name: "[Limited] Dimensionalist Welcome Growth Package",
    slug: "dimensionalist-welcome-growth-package",
    royalCrystalCost: 4100,
    maxPurchases: 5,
    limited: true,
    retired: false,
    contents: [
      { chest: "Crystallized Destiny Destruction Stone Pouch", qty: 20 },
      { chest: "Crystallized Destiny Guardian Stone Pouch", qty: 60 },
      { chest: "Great Destiny Leapstone Chest", qty: 20 },
      { chest: "Superior Abidos Fusion Material Chest", qty: 40 },
      { chest: "Destiny Shard Pouch (L)", qty: 50 },
      { chest: "Collective Support Materials Selection Chest: Armor", qty: 3 },
      { chest: "Collective Support Materials Selection Chest: Weapons", qty: 3 },
    ],
  },
  {
    // Second pack named Paradise Special Pack II: the June 2026 "[Limited] Paradise Special
    // Pack II" at 4,000 RC is retired under slug paradise-special-pack-ii, so this one takes a
    // -2 suffix (the in-game title of this one carries no [Limited] banner). Replaces the
    // retired Paradise Special Pack (5,400 RC) at a smaller size: no Netherworld key ticket,
    // Legendary hell key 2 -> 1, Elysian 3 -> 2, cube chests 10 -> 5, gem chests 120 -> 50,
    // Abidos chests (the Epic 100-pack) 50 -> 30. 5 per roster, purchase count resets
    // 09/30/2026. The Legendary ticket's season suffix is truncated on the in-game contents
    // list and assumed Season 4 like its siblings (TJW).
    name: "Paradise Special Pack II",
    slug: "paradise-special-pack-ii-2",
    royalCrystalCost: 3000,
    maxPurchases: 5,
    limited: true,
    retired: false,
    contents: [
      { chest: "Epic Hell Key of Destiny Exchange Ticket (Season 4)", qty: 2 },
      { chest: "Legendary Hell Key of Destiny Exchange Ticket (Season 4)", qty: 1 },
      { chest: "Elysian Attempt +1 Exchange Ticket (Season 4)", qty: 2 },
      { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 5 },
      { chest: "T4 Gem Chest (Lv. 3)", qty: 50 },
      { chest: "Abidos Fusion Material Chest", qty: 30 },
    ],
  },
];
