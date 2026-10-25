// The Bonus Room: a limited-time Mari's Shop rotation of product groups. Each product can be
// bought once per roster; buying all products in a group also grants that group's free bonus
// pack. Transcribed from TheJungleWalrus's 2026-10-21 build (his Bonus Room page data), with his
// icon slugs mapped onto our catalog. Every content line is a RESOLVER chest, so gold comes from
// the shared price map, like a Pack. The tab is shown only while the room runs (startsAt, when
// set, up to endsAt; see bonusRoomActive in ../bonusRoom.ts), so an ended room needs no release;
// set BONUS_ROOM to null to hide the tab entirely.
//
// Verified against the user's in-game screenshots of the Autumn Bonus Room (2026-10-25): every
// BC price (600, 300, 300, 250, 350, 250), the 1/1 per-roster limits, all three bonus packs, the
// end text "By scheduled maintenance on 11/18/2026", the Autumn Astrogem Pack contents
// (identical for I, II and III), the two Ancient chests' choices (Attack or Support Astrogem
// Selection Chest; Ancient Order or Chaos Sun/Moon/Star Core Random Chest; both Required Item
// Lv. 1700, bound to roster, untradable) and 20 Superior Abidos Fusion Material (Bound) per
// chest. Not visible in those screenshots, so kept at TJW's values: the Autumn Astrogem Packs'
// 4,000 RC price and the 35-chest count of the Superior Abidos product.
import type { Pack } from "./types";

/** One purchasable product: a Pack (exactly one of royalCrystalCost / blueCrystalCost) plus its tile icon. */
export interface BonusProduct extends Pack {
  icon: string; // catalog slug for the product tile
  calculator?: "gem-fuse" | "life-energy"; // TJW's input hint: the Lv. 7 gem price or the potion value
}

/** The free pack granted for buying every product in a group. */
export interface BonusReward {
  slug: string;
  name: string;
  icon: string; // catalog slug
  contents: { chest: string; qty: number }[]; // RESOLVER keys
}

export interface BonusGroup {
  slug: string;
  name: string;
  products: BonusProduct[];
  bonus: BonusReward;
}

export interface BonusRoom {
  name: string; // rotation name, e.g. "Autumn"
  startsAt?: string; // ISO instant the room opens; omitted means already open
  endsAt: string; // ISO instant the room closes (the tab hides from then on)
  endsLabel: string; // the game's own end text, shown verbatim (a local-time instant would differ)
  groups: BonusGroup[];
}

/** The three Autumn Astrogem Packs share one contents list (identical in game for I, II and III). */
const ASTROGEM_PACK_CONTENTS: { chest: string; qty: number }[] = [
  { chest: "Crystal", qty: 600 },
  { chest: "Rare - Epic Astrogem Chest", qty: 25 },
  { chest: "Fixed Epic Astrogem Selection Chest", qty: 2 },
  { chest: "Astrogem Processing Reset Ticket", qty: 10 },
  { chest: "T4 Gem Chest (Lv. 3)", qty: 30 },
  { chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 5 },
];

/** An Autumn Astrogem Pack (4,000 RC, one per roster). */
function astrogemPack(numeral: string): BonusProduct {
  return {
    slug: `autumn-astrogem-${numeral.toLowerCase()}`,
    name: `Autumn Astrogem Pack ${numeral}`,
    royalCrystalCost: 4000,
    maxPurchases: 1,
    limited: false,
    retired: false,
    icon: "epic-astrogem",
    contents: ASTROGEM_PACK_CONTENTS.map((c) => ({ ...c })),
  };
}

export const BONUS_ROOM: BonusRoom | null = {
  name: "Autumn",
  endsAt: "2026-11-18T04:00:00Z",
  endsLabel: "Scheduled maintenance on 11/18/2026",
  groups: [
    {
      slug: "autumn-ark-grid",
      name: "Autumn Ark Grid",
      products: [astrogemPack("I"), astrogemPack("II"), astrogemPack("III")],
      bonus: {
        slug: "autumn-ark-grid-support",
        name: "[Bonus] Autumn Ark Grid Support Pack",
        icon: "ancient-bracelet-chest",
        contents: [
          { chest: "Ancient Astrogem Selection Chest", qty: 1 },
          { chest: "Ancient Core Random Selection Chest", qty: 1 },
        ],
      },
    },
    {
      slug: "gems-and-cards",
      name: "Gems & Cards",
      products: [
        {
          slug: "t4-gem-chest-125",
          name: "T4 Gem Chest (Lv. 3) X 125",
          blueCrystalCost: 600,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "lv-3-gem",
          calculator: "gem-fuse",
          contents: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 125 }],
        },
        {
          slug: "soaring-engraving-kit",
          name: "Stone of Soaring Engraving Setting Kit Chest",
          blueCrystalCost: 300,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "stone-of-soaring-engraving-setting-kit",
          contents: [{ chest: "Stone of Soaring Engraving Setting Kit Chest", qty: 1 }],
        },
        {
          slug: "joyful-card-pack-10",
          name: "Joyful Legendary - Epic Card Pack X10",
          blueCrystalCost: 300,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "joyful-legendary-epic-card-pack",
          contents: [{ chest: "Joyful Legendary - Epic Card Pack", qty: 10 }],
        },
      ],
      bonus: {
        slug: "joyful-legendary-card-pack-3",
        name: "[Bonus] Joyful Legendary Card Pack X 3",
        icon: "joyful-legendary-card-pack",
        contents: [{ chest: "Joyful Legendary Card Pack", qty: 3 }],
      },
    },
    {
      slug: "growth-and-life-skills",
      name: "Growth & Life Skills",
      products: [
        {
          slug: "ebony-cube-selection",
          name: "(NEW) Ebony Cube Entrance Ticket Selection Chest II",
          blueCrystalCost: 250,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "ebony-cube-4th-unlock",
          contents: [{ chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 1 }],
        },
        {
          slug: "basic-life-energy-potion-20",
          name: "Basic Life Energy Potion X20",
          blueCrystalCost: 350,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "basic-life-energy-potion",
          calculator: "life-energy",
          contents: [{ chest: "Basic Life Energy Potion", qty: 20 }],
        },
        {
          slug: "superior-abidos-chest",
          name: "Superior Abidos Fusion Material Chest",
          blueCrystalCost: 250,
          maxPurchases: 1,
          limited: false,
          retired: false,
          icon: "superior-abidos-fusion-material",
          contents: [{ chest: "Superior Abidos Fusion Material Chest", qty: 35 }],
        },
      ],
      bonus: {
        slug: "elysian-attempt-3",
        name: "[Bonus] Elysian Attempt +1 Exchange Ticket (Season 4) X3",
        icon: "elysian-attempt-plus-1",
        contents: [{ chest: "Elysian Attempt +1 Exchange Ticket (Season 4)", qty: 3 }],
      },
    },
  ],
};
