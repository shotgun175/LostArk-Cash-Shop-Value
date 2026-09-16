// Jump-Up Boost: the Mokoko Base Camp Powerpass Premium reward track (transcribed from
// TheJungleWalrus's 2026-09-16 build). Buying Powerpass Premium (3,000 RC) unlocks the locked
// right-hand chest at each of the five Main Mission milestones (Reach Equipped Item Lv. 1,700
// through 1,720). Only those paid chests are valued; the free left-hand chests and the Sub
// Mission point shop are not. Every reward is a RESOLVER chest, so gold comes from the shared
// price map: nothing here is AH-priced (bound gold at 1, baked gem and astrogem seeds, the aura
// at its BC store cost off the F4 input, and three no-market items that stay unpriced).
export interface JumpUpLevel {
  level: number;
  ilvl: number; // the "Reach Equipped Item Lv." milestone requirement
  chest: string; // the paid milestone chest's in-game name (display label only)
  rewards: { chest: string; qty: number }[]; // RESOLVER keys
}

export const JUMP_UP_RC = 3000; // Powerpass Premium cost (royal crystals)

export const JUMP_UP_LEVELS: JumpUpLevel[] = [
  {
    level: 1,
    ilvl: 1700,
    chest: "Premium 1,700 Achievement Chest",
    rewards: [
      { chest: "50,000 Gold Bars", qty: 4 },
      { chest: "Crystalline Aura Plus (14 days)", qty: 1 },
      { chest: "Azena's Blessing (28 days)", qty: 1 },
      { chest: "Ancient Bracelet Chest", qty: 1 },
      { chest: "Ancient Accessory Set Chest", qty: 1 },
    ],
  },
  {
    level: 2,
    ilvl: 1705,
    chest: "Premium 1,705 Achievement Chest",
    rewards: [{ chest: "Lv. 8 Brilliant Gem (Bound)", qty: 2 }],
  },
  {
    level: 3,
    ilvl: 1710,
    chest: "Premium 1,710 Achievement Chest",
    rewards: [{ chest: "Fixed Epic Astrogem Selection Chest", qty: 3 }],
  },
  {
    level: 4,
    ilvl: 1715,
    chest: "Premium 1,715 Achievement Chest",
    rewards: [{ chest: "Fixed Epic Astrogem Selection Chest", qty: 3 }],
  },
  {
    level: 5,
    ilvl: 1720,
    chest: "Premium 1,720 Achievement Chest",
    rewards: [{ chest: "Lv. 8 Brilliant Gem (Bound)", qty: 2 }],
  },
];
