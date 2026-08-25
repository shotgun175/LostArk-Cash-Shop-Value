import { describe, it, expect } from "vitest";
import { resolveChest, packValue, customChosen, USD_PER_RC } from "../src/lib/packs/packValue";
import { packDetail } from "../src/lib/packs/packDetail";
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
// Two rows have since deliberately left the June capture (comments inline): the astrogem
// re-anchors and the Abidos (15) correction.
// ---------------------------------------------------------------------------
describe("packValue golden parity with TJW live pack cards", () => {
  const map = buildPriceMap(NAE);

  // [slug, total, goldPerRc] read directly off TJW's live cards.
  const golden: [string, number, number][] = [
    // TJW's June card showed 831,020 / 415.5 with the Abidos line read as the Epic 100-pack.
    // Corrected 2026-08-14: the pack drops the Rare 15-per-chest variant (same in-game name),
    // so the line is 40 x 15 x 137 = 82,200, not 548,000. TJW shipped the same fix 2026-08-12.
    ["adventurers-path-package", 365220, 182.6],
    ["horizon-growth-support-pack-i", 1679000, 289.5],
    ["horizon-growth-support-pack-ii", 864850, 227.6],
    // TJW's card showed 1,812,089 / 335.6 on his old astrogem constants (15k/30k); the
    // 2026-07-15 NPC re-anchor made it 1,851,089 (21.5k/43k), and the 2026-08-14 adoption of
    // the 33k random epic (user sign-off) adds 2 x 11,500 more. The 2026-08-19 lv-3-gem
    // re-anchor (1,543 -> 1,850, user sign-off) adds 30 x 307 = 9,210 on its 30 gem chests.
    ["limited-relic-engraving-growth", 1883299, 348.8],
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
    //   lv-3 gem:  1850 * 50
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
      1850 * 50 +
      100 * 137 * 10 +
      31900 * 5;
    expect(r.total).toBe(expected);
    // 783,815 on the TJW-vintage tables; the datamine 1730 tables + priced juice lifted
    // the Epic keys (129,295 -> 138,919 each) and the Frost key (50,440 -> 107,176), which
    // was most of the +75,984 to 859,799 (2026-07-30). Re-baselined 2026-08-02 (owner
    // sign-off) to the live special-hone tap engine (856,083). Re-baselined 2026-08-14
    // (user sign-off): the astrogem pipe-EV fix (epic 15k -> 43k) lifts the Epic keys to
    // 141,600 each and the Frost key to 113,539 (871,524). Re-baselined again 2026-08-19
    // (user sign-off): the lv-3-gem re-anchor (1,543 -> 1,850) adds 50 x 307 = 15,350.
    expect(r.total).toBe(886874);
    expect(evFrost).toBe(113539);
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

  it("honors a region cash-per-RC for goldPerDollar (EU €94.99 / 12k)", () => {
    const eurPerRc = 94.99 / 12000;
    const eu = packValue(pack("horizon-growth-support-pack-i"), map, {}, eurPerRc);
    expect(eu.goldPerDollar!).toBeCloseTo(eu.total / (5800 * eurPerRc), 6);
    // EU RC is cheaper than $100, so you get more gold per EUR than per USD.
    const usd = packValue(pack("horizon-growth-support-pack-i"), map);
    expect(eu.goldPerDollar!).toBeGreaterThan(usd.goldPerDollar!);
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

// ---------------------------------------------------------------------------
// The 2026-08-12 rotation packs — self-goldens on the pinned fixture (TJW cross-checked at
// transcription; his cards run on live prices, so exact parity is not asserted).
// ---------------------------------------------------------------------------
describe("2026-08-12 rotation packs (self-goldens at the pinned fixture)", () => {
  const map = buildPriceMap(NAE);

  const golden: [string, number][] = [
    // 6x3,750 + 33,000 + 43,000 + 25x1,850 (both processing tickets 0 without an exchange input)
    ["limited-astrogem-package", 144750],
    // 3xVI-epic(174,425) + 2xVI(253,842) + frost-VI(143,155) + 3x3,000 + 10x18,427 + 120x1,850 + 50x13,700
    ["paradise-special-pack", 2274384],
    // default top-5 picks: CD Destruction Pouch / Epic HK S4 / Glacier's / Superior Abidos / T4 Gems
    // (T4 Gems at 120x1,850 since the 2026-08-19 lv-3 re-anchor)
    ["summer-custom-pack-1", 2043175],
    // default top-4 picks: Artisan Armor / Abidos (100) / DD Bundle / Relic Recipe Pouch
    ["summer-custom-pack-2", 496849],
    // 15x1000x29 + 15x1000x0.92 + 15x20x171
    ["weekly-summer-t4-crystallized-stone", 500100],
    // 60x20x171 + 50x20x47
    ["weekly-summer-t4-fusion-leap", 252200],
    // 7x31,900 (T4 support -> glaciers) + 50x3000x0.224
    ["weekly-summer-t4-shards-support", 256900],
  ];
  for (const [slug, total] of golden) {
    it(`${slug}: total ${total} on the fixture`, () => {
      expect(packValue(pack(slug), map).total).toBe(total);
    });
  }

  it("the astrogem pack gains the BC-costed processing tickets when the exchange input is set", () => {
    // gold/BC 200: reset 3x20,000 + refresh 3x3,600 = +70,800.
    const mapBc = buildPriceMap(NAE, { blueCrystalGold: 200 });
    expect(packValue(pack("limited-astrogem-package"), mapBc).total).toBe(144750 + 70800);
  });

  it("a user click-to-edit override on a BC-costed ticket wins over the BC derivation", () => {
    // Overrides arrive merged into regionPrices (effectivePrices), so the injection must not
    // clobber them — the UI marks the line "edited" and the number has to actually move.
    const m = buildPriceMap(
      { ...NAE, "astrogem-processing-reset-ticket": 5000 },
      { blueCrystalGold: 200 },
    );
    expect(m["astrogem-processing-reset-ticket"]).toBe(5000);
    expect(m["astrogem-processing-option-refresh-ticket"]).toBe(3600); // untouched one still derived
  });
});

// ---------------------------------------------------------------------------
// Choose-N-of-M custom packs: the shared customChosen rule + packValue/packDetail wiring.
// ---------------------------------------------------------------------------
describe("custom_selection packs (choose N of M)", () => {
  const map = buildPriceMap(NAE);

  it("defaults to the N highest-gold options (summer-custom-pack-1)", () => {
    const set = customChosen(pack("summer-custom-pack-1"), map)!;
    expect(set.size).toBe(5);
    expect([...set].sort()).toEqual(
      [
        "Crystallized Destiny Destruction Stone Pouch",
        "Epic Hell Key of Destiny Exchange Ticket (Season 4)",
        "Glacier's Breath Chest",
        "Superior Abidos Fusion Material Chest",
        "T4 Gem Chest (Lv. 3)",
      ].sort(),
    );
  });

  it("returns null for an ordinary pack", () => {
    expect(customChosen(pack("monthly-t4-growth-support"), map)).toBeNull();
  });

  it("user picks override the default and can be fewer than N", () => {
    // Only the shard pouches: 200 x round(3000 x 0.224) = 134,400.
    const r = packValue(pack("summer-custom-pack-1"), map, {}, undefined, false, {
      "summer-custom-pack-1": ["Destiny Shard Pouch (L)"],
    });
    expect(r.total).toBe(134400);
    expect(r.lines.length).toBe(1);
    expect(r.lines[0].slug).toBe("destiny-shard");
    expect(r.lines[0].qty).toBe(200 * 3000);
  });

  it("worthless picks value to 0 without going unresolved (card packs)", () => {
    const r = packValue(pack("summer-custom-pack-2"), map, {}, undefined, false, {
      "summer-custom-pack-2": ["Joyful Legendary - Epic Card Pack"],
    });
    expect(r.total).toBe(0);
    const line = r.lines[0];
    expect(line.slug).toBe("joyful-legendary-epic-card-pack");
    expect(line.qty).toBe(10);
    expect(line.unresolved).toBeUndefined();
  });

  it("stored picks that no longer name real options fall back to the default", () => {
    const withBad = packValue(pack("summer-custom-pack-1"), map, {}, undefined, false, {
      "summer-custom-pack-1": ["Not A Chest Anymore"],
    });
    expect(withBad.total).toBe(packValue(pack("summer-custom-pack-1"), map).total);
  });

  it("caps an oversized stored set at pick (first N kept) and survives junk shapes", () => {
    // A stored set written under a larger pick count (or tampered storage) must not let the
    // pack count more than `pick` options.
    const six = [
      "Crystallized Destiny Destruction Stone Pouch",
      "Crystallized Destiny Guardian Stone Pouch",
      "Great Destiny Leapstone Chest",
      "Superior Abidos Fusion Material Chest",
      "Destiny Shard Pouch (L)",
      "Glacier's Breath Chest",
    ];
    const capped = customChosen(pack("summer-custom-pack-1"), map, {}, six)!;
    expect(capped.size).toBe(5);
    expect([...capped]).toEqual(six.slice(0, 5));
    // A non-array (corrupted storage) degrades to the default instead of throwing.
    const junk = customChosen(pack("summer-custom-pack-1"), map, {}, "x" as unknown as string[])!;
    expect(junk).toEqual(customChosen(pack("summer-custom-pack-1"), map)!);
  });

  it("packDetail lists every option with counted flags that sum to the pack total", () => {
    const chests = packDetail(pack("summer-custom-pack-1"), map);
    expect(chests.length).toBe(10);
    const counted = chests.filter((c) => c.counted);
    expect(counted.length).toBe(5);
    const sum = counted.reduce((acc, c) => acc + c.gold, 0);
    expect(sum).toBe(packValue(pack("summer-custom-pack-1"), map).total);
    // Ordinary packs: every chest counts.
    expect(packDetail(pack("monthly-t4-growth-support"), map).every((c) => c.counted)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Frozen value-at-retirement display path. The golden tests above pin the LIVE math; this pins the
// useFrozen=true display path the retired cards/drill-down use, so a typo in a frozenTotal is caught.
// ---------------------------------------------------------------------------
describe("frozen retirement values (display path)", () => {
  const map = buildPriceMap(NAE);

  it("every retired pack is value-frozen, and useFrozen surfaces it with a consistent g/RC", () => {
    const retired = PACKS.filter((p) => p.retired);
    expect(retired.length).toBeGreaterThan(0);
    for (const p of retired) {
      expect(p.frozenTotal).toBeDefined();
      const r = packValue(p, map, {}, undefined, true);
      expect(r.total).toBe(p.frozenTotal);
      expect(r.goldPerRc!).toBeCloseTo(p.frozenTotal! / p.royalCrystalCost!, 1);
    }
  });

  it("the default (live) path ignores frozenTotal", () => {
    // relic's live value (golden) is 1,883,299 — distinct from its retirement snapshot (1,769,665).
    const relic = pack("limited-relic-engraving-growth");
    expect(packValue(relic, map).total).toBe(1883299);
    expect(relic.frozenTotal).toBe(1769665);
  });
});

// ---------------------------------------------------------------------------
// [Monthly] 1200 Crystal Pack — the "value pack" whose worth is dominated by Blue Crystals (priced
// off the shared F4 input, NOT the AH) plus two run-reward brews. A live fixture golden can't apply
// here: TJW's crystal value tracks his own exchangeGold input, so we pin the deterministic
// composition (resolver wiring, the blue-crystal read, the multi-brew reward tables) instead.
// ---------------------------------------------------------------------------
describe("1200 Crystal Pack (blue-crystal + run-reward brews)", () => {
  // Hand-picked round prices, independent of any fixture.
  const prices: Record<string, number> = {
    "blue-crystal": 200, // = F4 input 19,000 / 95
    "lv-1-gem": 171,
    "destiny-crystallized-destruction-stone": 20,
    "destiny-crystallized-guardian-stone": 2,
    "great-destiny-leapstone": 36,
    "destiny-shard": 0.17,
    "ebony-cube-4th-unlock": 17000,
  };

  it("buildPriceMap injects blue-crystal at input/95, and leaves it unpriced without an input", () => {
    expect(buildPriceMap({}, { blueCrystalGold: 19000 / 95 })["blue-crystal"]).toBe(200);
    expect(buildPriceMap({})["blue-crystal"]).toBeUndefined();
    // A cleared field (NaN) or zero input must not poison the map.
    expect(buildPriceMap({}, { blueCrystalGold: NaN })["blue-crystal"]).toBeUndefined();
    expect(buildPriceMap({}, { blueCrystalGold: 0 })["blue-crystal"]).toBeUndefined();
  });

  it("prices the Arkgrid processing tickets at their BC store cost x gold/BC (2026-08-14)", () => {
    // gold/BC 200 -> reset (100 BC) = 20,000; refresh (18 BC) = 3,600.
    const m = buildPriceMap({}, { blueCrystalGold: 200 });
    expect(m["astrogem-processing-reset-ticket"]).toBe(20000);
    expect(m["astrogem-processing-option-refresh-ticket"]).toBe(3600);
    // No exchange input -> unpriced, so the pack lines fall back to 0-gold rows as before.
    expect(buildPriceMap({})["astrogem-processing-reset-ticket"]).toBeUndefined();
    expect(buildPriceMap({})["astrogem-processing-option-refresh-ticket"]).toBeUndefined();
  });

  it("resolves the Crystal currency chest and the two run-reward brews", () => {
    expect(resolveChest(RESOLVER["Crystal"], prices).gold).toBe(200); // 1x blue-crystal
    expect(resolveChest(RESOLVER["Rest Bonus Recovery Brew"], prices).gold).toBe(2052); // 12 * 171
    // Aura: 369*20 + 1229*2 + 20*36 + 52600*0.17 = 7380 + 2458 + 720 + 8942 = 19500
    expect(resolveChest(RESOLVER["Aura of Resonance Recovery Brew"], prices).gold).toBe(19500);
  });

  it("totals the pack from crystals + brews + ebony cubes", () => {
    // 1200*200 + 4*2052 + 4*19500 + 5*17000 = 240000 + 8208 + 78000 + 85000
    const expected = 1200 * 200 + 4 * 2052 + 4 * 19500 + 5 * 17000;
    expect(expected).toBe(411208);
    const r = packValue(pack("monthly-1200-crystal-pack"), prices);
    expect(r.total).toBe(expected);
    expect(r.goldPerRc!).toBeCloseTo(411208 / 2700, 4);
    // Bound tags on the brew mats must NOT zero their value (they are AH-tradable), and the
    // 1200 crystals aggregate into a single blue-crystal line.
    const byslug = Object.fromEntries(r.lines.map((l) => [l.slug, l]));
    expect(byslug["destiny-shard"].gold).toBeGreaterThan(0);
    expect(byslug["blue-crystal"].qty).toBe(1200);
  });
});

// ---------------------------------------------------------------------------
// The 2026-08-19 packs — self-goldens on the pinned fixture. Four are the first Blue-Crystal-
// priced packs (blueCrystalCost instead of royalCrystalCost): they carry gold-per-BC plus a
// shop-money gold-per-dollar via the 95 BC = 238 RC exchange equivalence, and no RC metric.
// The 2+1 Crystal Pack is RC-priced but pays out Blue Crystals, so its total tracks the F4
// input like the 1200 Crystal Pack.
// ---------------------------------------------------------------------------
describe("2026-08-19 packs (BC pricing + self-goldens at the pinned fixture)", () => {
  const map = buildPriceMap(NAE);

  // [slug, total, goldPerBc] — totals hand-computed from the fixture.
  const bcGolden: [string, number, number][] = [
    // 5 pouches x (1000 x 29) = 145,000; / 400 BC = 362.5
    ["discount-crystallized-destiny-destruction-stone-pouch", 145000, 362.5],
    // 20 chests x (20 x 171) = 68,400; / 150 BC = 456
    ["discount-superior-abidos-fusion", 68400, 456],
    // selection: glaciers 20x319 = 6,380 > lavas 10x330 = 3,300; 20 x 6,380 = 127,600; / 150 BC
    ["discount-t4-breath-selection-chest", 127600, 850.7],
    // 120 x 1,850 = 222,000; / 600 BC = 370
    ["discount-t4-gem-chest-lv3-x120", 222000, 370],
  ];
  for (const [slug, total, gpb] of bcGolden) {
    it(`${slug}: total ${total}, ${gpb} g/BC, no RC metric`, () => {
      const r = packValue(pack(slug), map);
      expect(r.total).toBe(total);
      expect(r.goldPerBc!).toBeCloseTo(gpb, 1);
      expect(r.goldPerRc).toBeNull();
      expect(r.goldPerDollar).not.toBeNull();
    });
  }

  it("BC packs get a shop-money goldPerDollar via 95 BC = 238 RC", () => {
    // 400 BC ≡ 400 x 238/95 = 1,002.1 RC; NA cash cost = rcEquiv x $100/12,000 = $8.35.
    const rcEquiv = (400 * 238) / 95;
    const r = packValue(pack("discount-crystallized-destiny-destruction-stone-pouch"), map);
    expect(r.goldPerDollar!).toBeCloseTo(145000 / (rcEquiv * USD_PER_RC), 6);
    expect(Math.round(r.goldPerDollar!)).toBe(17363);
    // Region-aware: EU RC is cheaper than $100/12k, so more gold per EUR than per USD.
    const eurPerRc = 94.99 / 12000;
    const eu = packValue(pack("discount-crystallized-destiny-destruction-stone-pouch"), map, {}, eurPerRc);
    expect(eu.goldPerDollar!).toBeCloseTo(145000 / (rcEquiv * eurPerRc), 6);
    expect(eu.goldPerDollar!).toBeGreaterThan(r.goldPerDollar!);
  });

  it("the x180 gem tile is RC-priced: 180 x 1,850 at 1,600 RC", () => {
    const r = packValue(pack("discount-t4-gem-chest-lv3"), map);
    expect(r.total).toBe(180 * 1850);
    expect(r.goldPerRc!).toBeCloseTo(333000 / 1600, 4);
    expect(r.goldPerBc).toBeNull();
    expect(r.goldPerDollar).not.toBeNull();
  });

  it("the 2+1 Crystal Pack values 3,000 crystals off the F4 input (unpriced without one)", () => {
    // No exchange input -> blue-crystal missing from the map -> honest 0, like the 1200 pack.
    expect(packValue(pack("2-plus-1-1000-crystal-pack"), map).total).toBe(0);
    // gold/BC 200 -> 600,000 total; RC metrics live (it IS an RC pack): 600,000 / 4,200.
    const r = packValue(pack("2-plus-1-1000-crystal-pack"), buildPriceMap(NAE, { blueCrystalGold: 200 }));
    expect(r.total).toBe(3000 * 200);
    expect(r.goldPerRc!).toBeCloseTo(600000 / 4200, 4);
    expect(r.lines[0]).toMatchObject({ slug: "blue-crystal", qty: 3000 });
  });

  it("carries maxPurchases through to the result for the card tag", () => {
    expect(packValue(pack("discount-t4-gem-chest-lv3"), map).maxPurchases).toBe(2);
    expect(packValue(pack("discount-t4-gem-chest-lv3-x120"), map).maxPurchases).toBe(1);
  });
});
