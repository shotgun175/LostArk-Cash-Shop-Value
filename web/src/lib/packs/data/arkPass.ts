// Ark Pass — the current season's reward track (transcribed from TheJungleWalrus, 2026-06-16).
// Static data; refresh when a new Ark Pass season starts. Premium gives a reward at every level;
// Super Premium adds the same plus milestone rewards at 5/10/15/20/25/30 (currently unvalued, TBD).
// Each reward is a chest our RESOLVER already knows, so the gold value is computed from live prices.
export interface ArkLevel {
  level: number;
  chest: string; // RESOLVER key
  qty: number; // number of chests granted
  milestone?: boolean; // a Super-Premium milestone level
  unresolved?: boolean; // chest not in the resolver (astrogems / card packs) — no gold value
}

export const ARK_PASS_PREMIUM_RC = 1500; // Premium tier cost (royal crystals)
export const ARK_PASS_TOTAL_RC = 3000; // Premium + Super Premium

export const ARK_PASS_LEVELS: ArkLevel[] = [
  { level: 1, chest: "Wanderer's Shard Box", qty: 6 },
  { level: 2, chest: "Wanderer's Special Honing Material Selection Chest", qty: 7 },
  { level: 3, chest: "Wanderer's Special Auxiliary Material Selection Chest", qty: 8 },
  { level: 4, chest: "Wanderer's Special Breakthrough Stone Selection Chest", qty: 5 },
  { level: 5, chest: "Wanderer's Special Auxiliary Material Selection Chest", qty: 7, milestone: true },
  { level: 6, chest: "Wanderer's Special Breakthrough Stone Selection Chest", qty: 5 },
  { level: 7, chest: "Wanderer's Special Fusion Material Selection Chest", qty: 3 },
  { level: 8, chest: "Wanderer's Special Honing Material Selection Chest", qty: 7 },
  { level: 9, chest: "Wanderer's Shard Box", qty: 6 },
  { level: 10, chest: "Wanderer's Special Fusion Material Selection Chest", qty: 1, milestone: true },
  { level: 11, chest: "Wanderer's Special Honing Material Selection Chest", qty: 7 },
  { level: 12, chest: "Wanderer's Shard Box", qty: 6 },
  { level: 13, chest: "Wanderer's Special Auxiliary Material Selection Chest", qty: 8 },
  { level: 14, chest: "Wanderer's Special Fusion Material Selection Chest", qty: 3 },
  { level: 15, chest: "Wanderer's Shard Box", qty: 6, milestone: true },
  { level: 16, chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 2 },
  { level: 17, chest: "(NEW) Ebony Cube Entrance Ticket Selection Chest II", qty: 2 },
  { level: 18, chest: "Rare - Epic Astrogem Chest", qty: 5, unresolved: true },
  { level: 19, chest: "Rare - Epic Astrogem Chest", qty: 5, unresolved: true },
  { level: 20, chest: "Rare - Epic Astrogem Chest", qty: 2, milestone: true, unresolved: true },
  { level: 21, chest: "Wanderer's Special Fusion Material Selection Chest", qty: 3 },
  { level: 22, chest: "Wanderer's Special Breakthrough Stone Selection Chest", qty: 10 },
  { level: 23, chest: "Wanderer's Shard Box", qty: 6 },
  { level: 24, chest: "Wanderer's Special Auxiliary Material Selection Chest", qty: 8 },
  { level: 25, chest: "Wanderer's Special Honing Material Selection Chest", qty: 10, milestone: true },
  { level: 26, chest: "Wanderer's Special Honing Material Selection Chest", qty: 7 },
  { level: 27, chest: "Wanderer's Special Fusion Material Selection Chest", qty: 8 },
  { level: 28, chest: "Wanderer's Special Breakthrough Stone Selection Chest", qty: 3 },
  { level: 29, chest: "Wanderer's Special Auxiliary Material Selection Chest", qty: 5 },
  { level: 30, chest: "Joyful Legendary Card Pack", qty: 1, milestone: true, unresolved: true },
];
