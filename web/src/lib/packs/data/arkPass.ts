// Ark Pass: the current season's Premium reward track. Tenebrous Judge season (2026-09-16 to
// 2026-11-11), transcribed from the in-game Ark Pass window on 2026-09-19 and cross-checked
// against Lost Ark Codex's datamined pass 1316. Static data; refresh when a new season starts.
// Premium gives a reward at every level; Super Premium adds cosmetic milestone rewards at
// 5/10/15/20/25/30 (unvalued). Each reward is a RESOLVER chest, valued against the full layered
// price map (baked constants and cube EV included), the same map the Packs tab uses.
interface ArkLevel {
  level: number;
  chest: string; // RESOLVER key
  qty: number; // number of chests granted
  milestone?: boolean; // a Super-Premium milestone level
  unresolved?: boolean; // chest not in the resolver (card packs), so no gold value
  iconSlug?: string; // display-only icon for an unresolved row; never assigns a gold value
}

export const ARK_PASS_SEASON = "Tenebrous Judge season: Sep 16 to Nov 11, 2026 (Premium on sale until Oct 28)";
// Stamped on saved per-level picks; changing it with a new season discards the old season's picks.
export const ARK_PASS_SEASON_ID = "tenebrous-judge";
export const ARK_PASS_PREMIUM_RC = 1500; // Premium tier cost (royal crystals)
export const ARK_PASS_TOTAL_RC = 3000; // Premium + Super Premium

const SHARD = "Tenebrous Shard Chest";
const HONING = "Tenebrous Special Honing Material Selection Chest";
const SUPPORT = "Tenebrous Special Support Materials Selection Chest";
const LEAPSTONE = "Tenebrous Special Leapstone Selection Chest";
const FUSION = "Tenebrous Special Fusion Material Selection Chest";
const EBONY = "(NEW) Ebony Cube Entrance Ticket Selection Chest II";

export const ARK_PASS_LEVELS: ArkLevel[] = [
  { level: 1, chest: SHARD, qty: 3 },
  { level: 2, chest: HONING, qty: 3 },
  { level: 3, chest: SUPPORT, qty: 3 },
  { level: 4, chest: LEAPSTONE, qty: 5 },
  { level: 5, chest: HONING, qty: 7, milestone: true },
  { level: 6, chest: LEAPSTONE, qty: 5 },
  { level: 7, chest: FUSION, qty: 3 },
  { level: 8, chest: HONING, qty: 3 },
  { level: 9, chest: SHARD, qty: 3 },
  { level: 10, chest: FUSION, qty: 7, milestone: true },
  { level: 11, chest: HONING, qty: 3 },
  { level: 12, chest: SHARD, qty: 3 },
  { level: 13, chest: SUPPORT, qty: 3 },
  { level: 14, chest: FUSION, qty: 3 },
  { level: 15, chest: SHARD, qty: 7, milestone: true },
  { level: 16, chest: EBONY, qty: 2 },
  { level: 17, chest: EBONY, qty: 2 },
  { level: 18, chest: "Epic Astrogem Chest", qty: 3 },
  { level: 19, chest: "Epic Astrogem Chest", qty: 3 },
  { level: 20, chest: "Fixed Epic Astrogem Selection Chest", qty: 1, milestone: true },
  { level: 21, chest: FUSION, qty: 3 },
  { level: 22, chest: LEAPSTONE, qty: 7 },
  { level: 23, chest: SHARD, qty: 5 },
  { level: 24, chest: SUPPORT, qty: 5 },
  { level: 25, chest: SHARD, qty: 7, milestone: true },
  { level: 26, chest: HONING, qty: 5 },
  { level: 27, chest: FUSION, qty: 5 },
  { level: 28, chest: LEAPSTONE, qty: 7 },
  { level: 29, chest: SUPPORT, qty: 5 },
  { level: 30, chest: "Leap Legendary Card Selection Pack III", qty: 1, milestone: true, unresolved: true, iconSlug: "legendary-card-pack" },
];
