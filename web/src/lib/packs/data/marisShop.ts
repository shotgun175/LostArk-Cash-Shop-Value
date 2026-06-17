// Mari's Shop — the current rotating wares (transcribed from TheJungleWalrus, 2026-06-16).
// Static data; refresh when the in-game rotation changes. Each ware costs blue crystals (BC);
// gold cost = bc * (F4 gold input / BC_PER_BUNDLE). Value shown = savings vs the AH price.
interface MariWare {
  slug: string | null; // unbound AH slug for valuation; null = no market price (bound-only)
  name: string;
  qty: number; // units per purchase
  bc: number; // current blue-crystal cost (sale price if on sale)
  wasBc?: number; // pre-sale BC cost, when on sale
  icon?: string; // icon slug when the item has no valuation slug (bound-only) but does have art
}

// Blue crystals per F4-exchange unit: gold-per-BC = F4 gold input / 95.
export const BC_PER_BUNDLE = 95;

export const MARIS_WARES: MariWare[] = [
  { slug: "great-destiny-leapstone", name: "Great Destiny Leapstone", qty: 200, bc: 15 },
  { slug: "destiny-crystallized-destruction-stone", name: "Destiny Crystallized Destruction Stone", qty: 1000, bc: 65 },
  { slug: "destiny-leapstone", name: "Destiny Leapstone", qty: 200, bc: 12 },
  { slug: "abidos-fusion-material", name: "Abidos Fusion Material", qty: 100, bc: 60 },
  { slug: "superior-abidos-fusion-material", name: "Superior Abidos Fusion Material", qty: 100, bc: 80 },
  { slug: "glaciers-breath", name: "Glacier's Breath", qty: 30, bc: 52, wasBc: 60 },
  { slug: "lavas-breath", name: "Lava's Breath ×15", qty: 15, bc: 63, wasBc: 65 },
  { slug: "destiny-shard-pouch-s", name: "Destiny Shard Pouch (S) ×20", qty: 20, bc: 60, wasBc: 70 },
  { slug: "lavas-breath", name: "Lava's Breath ×10", qty: 10, bc: 45 },
  { slug: "destiny-shard-pouch-s", name: "Destiny Shard Pouch (S) ×15", qty: 15, bc: 47, wasBc: 52 },
  { slug: "destiny-shard-pouch-s", name: "Destiny Shard Pouch (S) ×10", qty: 10, bc: 35 },
  { slug: "artisans-metallurgy-level-1", name: "Artisan's Metallurgy: Level 1", qty: 2, bc: 9 },
  { slug: "prime-oreha-fusion-material", name: "Prime Oreha Fusion Material", qty: 120, bc: 36 },
  { slug: "artisans-tailoring-level-1", name: "Artisan's Tailoring: Level 1", qty: 2, bc: 18 },
  { slug: "solar-grace", name: "Solar Grace", qty: 120, bc: 24 },
  { slug: null, name: "Stone of Soaring Engraving Setting Kit Chest", qty: 10, bc: 460, icon: "stone-of-soaring-kit" },
  { slug: null, name: "Basic Life Energy Potion ×10", qty: 10, bc: 230, icon: "basic-life-energy-potion" },
  { slug: null, name: "Basic Life Energy Potion ×15", qty: 15, bc: 330, wasBc: 345, icon: "basic-life-energy-potion" },
];
