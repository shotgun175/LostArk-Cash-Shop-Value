import { describe, it, expect } from "vitest";
import { resolveChest, packValue, USD_PER_RC } from "../src/lib/packs/packValue";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import { RESOLVER } from "../src/lib/packs/data/resolver";
import { PACKS } from "../src/lib/packs/data/packs";
import fixture from "./fixtures/tjw-nae-prices.json";

const NAE = fixture.prices as Record<string, number>;
const pack = (slug: string) => PACKS.find((p) => p.slug === slug)!;

// ---------------------------------------------------------------------------
// resolveChest — deterministic, hand-computed unit tests
// ---------------------------------------------------------------------------
describe("resolveChest", () => {
  it("values a fixed chest as sum of its outputs (Glacier's Breath Chest)", () => {
    // glaciers-breath x10 @ 319 = 3190
    const r = resolveChest(RESOLVER["Glacier's Breath Chest"], {
      "glaciers-breath": 319,
    });
    expect(r.gold).toBe(3190);
    expect(r.lines).toEqual([{ slug: "glaciers-breath", qty: 10, gold: 3190, isBound: undefined }]);
  });

  it("picks the higher-lineGold option in a selection (T4 Stone Selection Chest)", () => {
    // destiny-destruction-stone x2500 @5.75 = 14375 vs guardian x5000 @0.09 = 450
    // -> picks destruction (higher).
    const r = resolveChest(RESOLVER["T4 Stone Selection Chest"], {
      "destiny-destruction-stone": 5.75,
      "destiny-guardian-stone": 0.09,
    });
    expect(r.gold).toBe(14375);
    expect(r.lines.length).toBe(1);
    expect(r.lines[0].slug).toBe("destiny-destruction-stone");

    // Flip the prices so guardian wins, to prove the rule is value-driven not positional.
    const r2 = resolveChest(RESOLVER["T4 Stone Selection Chest"], {
      "destiny-destruction-stone": 0.01,
      "destiny-guardian-stone": 10,
    });
    // guardian x5000 @10 = 50000 vs destruction x2500 @0.01 = 25
    expect(r2.gold).toBe(50000);
    expect(r2.lines[0].slug).toBe("destiny-guardian-stone");
  });

  it("honors a user pickSlug over the highest-value rule (T4 Stone Selection Chest)", () => {
    // Destruction wins on value, but the user picks guardian -> guardian is taken instead.
    const prices = { "destiny-destruction-stone": 5.75, "destiny-guardian-stone": 0.09 };
    const r = resolveChest(RESOLVER["T4 Stone Selection Chest"], prices, "destiny-guardian-stone");
    expect(r.lines[0].slug).toBe("destiny-guardian-stone");
    expect(r.gold).toBe(450); // 5000 * 0.09

    // An unknown pickSlug falls back to the default highest-value pick (destruction).
    const r2 = resolveChest(RESOLVER["T4 Stone Selection Chest"], prices, "not-an-option");
    expect(r2.lines[0].slug).toBe("destiny-destruction-stone");
  });

  it("honors defaultPickSlug regardless of lineGold (Wanderer's Shard Box)", () => {
    // honor-shard-pouch-l x20 @500 = 10000 would win on value, but defaultPickSlug forces
    // destiny-shard-pouch-l x10 @658 = 6580.
    const r = resolveChest(RESOLVER["Wanderer's Shard Box"], {
      "honor-shard-pouch-l": 500,
      "destiny-shard-pouch-l": 658,
    });
    expect(r.lines.length).toBe(1);
    expect(r.lines[0].slug).toBe("destiny-shard-pouch-l");
    expect(r.gold).toBe(6580);
  });

  it("prices AH-tradable bound consumables; zeroes only no-price brews (Adventurer's Path Chest I)", () => {
    // The 6 AH-tradable "bound" consumables ARE in the price map and get priced (TJW prices
    // them); only the 2 brews (no price-map slug) resolve to 0. isBound is kept on every line.
    const map = buildPriceMap(NAE);
    const r = resolveChest(RESOLVER["Adventurer's Path Chest I — Bound Bundle"], map);
    // 432*100 + 106*50 + 155*50 + 290*50 + 330*50 + 289*50 = 101700; brews contribute 0.
    const expected =
      432 * 100 + 106 * 50 + 155 * 50 + 290 * 50 + 330 * 50 + 289 * 50;
    expect(expected).toBe(101700);
    expect(r.gold).toBe(expected);
    expect(r.lines.length).toBe(8);
    // Every line keeps its isBound flag (load-bearing for the UI's "no price" display).
    for (const l of r.lines) {
      expect(l.isBound).toBe(true);
    }
    // The 2 brews have no price-map slug -> gold 0, but still carry isBound.
    const byslug = Object.fromEntries(r.lines.map((l) => [l.slug, l]));
    for (const brew of ["aura-of-resonance-recov-brew-30d", "rest-bonus-recovery-brew-30d"]) {
      expect(byslug[brew].gold).toBe(0);
      expect(byslug[brew].isBound).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// packValue — golden parity vs TheJungleWalrus's LIVE pack cards
//
// Captured 2026-06-15 by rendering https://thejunglewalrus.github.io/lostark-cash-shop-value/
// in a browser. His site renders off prices.json generated_at 2026-06-15T06:15:02Z, region nae,
// source_valid_at 2026-06-14T15:44:57Z — byte-for-byte the snapshot saved in this fixture
// (every sampled per-unit price matched). His displayed card values (total gold / gold-per-RC):
//   adventurers-path-package          831,020 / 415.5
//   horizon-growth-support-pack-i   1,679,000 / 289.5
//   horizon-growth-support-pack-ii    864,850 / 227.6
//   limited-relic-engraving-growth  1,812,089 / 335.6
//   monthly-t4-growth-support         172,875 /  45.5
//   shadow-growth-support-pack-1    1,459,800 / 260.7
//   shadow-growth-support-pack-2      626,550 / 174.0
//   weekly-t4-crystallized-stone      368,900 / 263.5
// All of these reproduce EXACTLY from this fixture (mats + relic-recipe + Frost-key EV).
// adventurers-path-package also requires pricing the 6 AH-tradable bound consumables in its
// "Adventurer's Path Chest I — Bound Bundle" (101,700 gold); only its 2 brews zero out.
// ---------------------------------------------------------------------------
describe("packValue golden parity with TJW live pack cards", () => {
  const map = buildPriceMap(NAE);

  // [slug, total, goldPerRc] read directly off TJW's live cards.
  const golden: [string, number, number][] = [
    ["adventurers-path-package", 831020, 415.5],
    ["horizon-growth-support-pack-i", 1679000, 289.5],
    ["horizon-growth-support-pack-ii", 864850, 227.6],
    ["limited-relic-engraving-growth", 1812089, 335.6],
    ["monthly-t4-growth-support", 172875, 45.5],
    ["shadow-growth-support-pack-1", 1459800, 260.7],
    ["shadow-growth-support-pack-2", 626550, 174.0],
    ["weekly-t4-crystallized-stone", 368900, 263.5],
  ];

  for (const [slug, total, gpr] of golden) {
    it(`${slug}: total ${total} (±1) & g/RC ${gpr} matches TJW`, () => {
      const r = packValue(pack(slug), map);
      expect(Math.abs(r.total - total)).toBeLessThanOrEqual(1);
      // TJW displays g/RC to 1 decimal; allow that rounding window.
      expect(r.goldPerRc!).toBeCloseTo(gpr, 1);
    });
  }

  it("horizon-i is exact (pure mat chests, no EV items)", () => {
    // Hand-computed from the fixture, matching TJW's card line-for-line:
    //   25*1000*29 + 50*1000*0.92 + 60*20*47 + 60*20*171
    //   + 150*3000*0.224 + 140*10*319 + 100*3*330
    const expected =
      25 * 1000 * 29 +
      50 * 1000 * 0.92 +
      60 * 20 * 47 +
      60 * 20 * 171 +
      150 * 3000 * 0.224 +
      140 * 10 * 319 +
      100 * 3 * 330;
    expect(packValue(pack("horizon-growth-support-pack-i"), map).total).toBe(expected);
    expect(expected).toBe(1679000);
  });
});

// ---------------------------------------------------------------------------
// paradise-special-pack-ii — exercises the hell-key + cube + Frost-key EV wiring.
//
// KNOWN, ACCEPTED DIVERGENCE from TJW's live card. TJW's card shows total 815,973 (204.0 g/RC),
// but prices the Epic hell key at 140,204 and the 4th-unlock cube at 20,495 — both ABOVE the
// values his own /math page (and this engine) compute from the published prices.json
// (Epic = 129,295; cube = 18,427). TJW's card derives those two from a live gem AH price
// (lv-2-gem ~= 608) that is NOT in the published prices.json snapshot, so it cannot be
// reproduced from the fixture. Our engine uses the principled baked lv-2-gem (514) and matches
// TJW's authoritative /math EVs exactly. The Frost key (50,440) — which does not depend on the
// gem price — matches his card exactly, proving the EV ALGORITHM and the resolveChest/packValue
// wiring are correct; only that one missing live input differs. The net effect is a ~4% lower
// total on these EV-heavy packs: a DATA-AVAILABILITY difference (the public feed lacks a live
// lv-2-gem price), not an algorithm bug. We therefore pin the engine's deterministic value
// (hand-verified below) rather than TJW's un-reproducible card. The retired
// `monthly-paradise-special-pack` (also EV-heavy, same hell-key/cube wiring) carries the
// identical accepted divergence for the same reason.
// ---------------------------------------------------------------------------
describe("paradise-special-pack-ii (EV pack: deterministic engine value)", () => {
  const map = buildPriceMap(NAE);

  it("totals from hell-key + cube + Frost-key + mats", () => {
    const r = packValue(pack("paradise-special-pack-ii"), map);
    // Hand-verified contributions (each resolveChest.gold * qty):
    //   epic key:  round(EV_epic) * 2
    //   elysian:   3000 * 3
    //   frost key (selection, higher of flame 48636 / frost 50440): round(50440) * 1
    //   cube 4th:  round(EV_cube) * 5
    //   lv-3 gem:  1543 * 50
    //   abidos:    100*137 * 10
    //   T4 support (selection, glaciers 100@319=31900 > lavas 25@330=8250): 31900 * 5
    const evEpic = Math.round(map["splendid-hell-key-of-destiny-v-epic"]);
    const evFrost = Math.round(map["splendid-netherworld-frost-key"]);
    const evCube = Math.round(map["ebony-cube-4th-unlock"]);
    const expected =
      evEpic * 2 +
      3000 * 3 +
      evFrost * 1 +
      evCube * 5 +
      1543 * 50 +
      100 * 137 * 10 +
      31900 * 5;
    expect(r.total).toBe(expected);
    expect(r.total).toBe(783815);
    // Frost key matches TJW's card exactly (proves the EV wiring is faithful).
    expect(evFrost).toBe(50440);
  });

  it("a user pick re-routes a selection chest and changes the pack total", () => {
    // Default takes glaciers (100@319=31900 > lavas 25@330=8250) from the T4 Support selection,
    // qty 5 in this pack. Picking lavas instead drops the total by (31900 - 8250) * 5 = 118250.
    const base = packValue(pack("paradise-special-pack-ii"), map).total;
    const picked = packValue(pack("paradise-special-pack-ii"), map, {
      "T4 Support Materials Selection Chest": "lavas-breath",
    });
    const lavasLine = picked.lines.find((l) => l.slug === "lavas-breath");
    expect(lavasLine?.qty).toBe(25 * 5);
    expect(picked.lines.some((l) => l.slug === "glaciers-breath")).toBe(false);
    expect(base - picked.total).toBe((31900 - 8250) * 5);
  });

  it("aggregates per-slug lines with scaled quantities", () => {
    const r = packValue(pack("paradise-special-pack-ii"), map);
    const byslug = Object.fromEntries(r.lines.map((l) => [l.slug, l]));
    // Epic key x2, glaciers from the T4 support selection (100/chest * 5 = 500), gems x50.
    expect(byslug["splendid-hell-key-of-destiny-v-epic"].qty).toBe(2);
    expect(byslug["glaciers-breath"].qty).toBe(500);
    expect(byslug["lv-3-gem"].qty).toBe(50);
    expect(byslug["splendid-netherworld-frost-key"].qty).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Misc: USD conversion + sanity bounds.
// ---------------------------------------------------------------------------
describe("packValue conversions & sanity", () => {
  const map = buildPriceMap(NAE);

  it("USD_PER_RC is 100/12000", () => {
    expect(USD_PER_RC).toBe(100 / 12000);
  });

  it("goldPerDollar = total / (RC * USD_PER_RC)", () => {
    const r = packValue(pack("horizon-growth-support-pack-i"), map);
    expect(r.goldPerDollar!).toBeCloseTo(r.total / (5800 * USD_PER_RC), 6);
    // TJW's card shows ~34,738 g/$ for horizon-i.
    expect(Math.round(r.goldPerDollar!)).toBe(34738);
  });

  it("horizon-i goldPerRc is in a sane range and matches TJW's 289.5", () => {
    const r = packValue(pack("horizon-growth-support-pack-i"), map);
    expect(r.goldPerRc!).toBeGreaterThan(50);
    expect(r.goldPerRc!).toBeLessThan(500);
    expect(r.goldPerRc!).toBeCloseTo(289.5, 1);
  });

  it("returns null per-RC metrics when royalCrystalCost is 0", () => {
    const zero = { ...pack("horizon-growth-support-pack-i"), royalCrystalCost: 0 };
    const r = packValue(zero, map);
    expect(r.goldPerRc).toBeNull();
    expect(r.goldPerDollar).toBeNull();
  });
});
