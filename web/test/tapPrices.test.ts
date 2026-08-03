import { describe, it, expect } from "vitest";
import { TAP_SLUGS, withTapPrices, tapDerivation } from "../src/lib/packs/tapPrices";
import { tapValue, type TapPriceInputs } from "../src/lib/packs/specialHone";
import { buildPriceMap } from "../src/lib/packs/priceMap";
import fixture from "./fixtures/tjw-nae-prices.json";

const NAE = fixture.prices as Record<string, number>;

// The inputs withTapPrices is specified to build, restated here independently so the pins
// below are checkable against the engine without reading the implementation: Transferred
// reads the T4.5 mat slugs, Circulated the T4 ones, and both read the same T4.5 juice.
function inputsFrom(map: Record<string, number>, kind: "transferred" | "circulated"): TapPriceInputs {
  const mats =
    kind === "transferred"
      ? {
          fusions: map["superior-abidos-fusion-material"], // 171
          redStones: map["destiny-crystallized-destruction-stone"], // 29
          blueStones: map["destiny-crystallized-guardian-stone"], // 0.92
          leapstones: map["great-destiny-leapstone"], // 47
        }
      : {
          fusions: map["abidos-fusion-material"], // 137
          redStones: map["destiny-destruction-stone"], // 5.75
          blueStones: map["destiny-guardian-stone"], // 0.09
          leapstones: map["destiny-leapstone"], // 14
        };
  return {
    ...mats,
    shards: map["destiny-shard"], // 0.224
    redJuice: map["lavas-breath"] ?? 400, // 330
    blueJuice: map["glaciers-breath"] ?? 200, // 319
  };
}

const transferredInputs = inputsFrom(NAE, "transferred");
const circulatedInputs = inputsFrom(NAE, "circulated");

// Self-goldens for the INTEGRATED construction (five mats + T4.5 juice on both kinds),
// computed 2026-08-02 from the pinned fixture. These deliberately differ from
// specialHone.test.ts's juice-free pins and from the old flat 1000/100 valuations.
const TRANSFERRED_GOLD = 974.4945352896351;
const CIRCULATED_GOLD = 258.3332892054301;

describe("withTapPrices", () => {
  it("sets both tap slugs from the fixture's mat + juice prices", () => {
    const out = withTapPrices(NAE);
    expect(out[TAP_SLUGS.transferred]).toBeCloseTo(TRANSFERRED_GOLD, 6);
    expect(out[TAP_SLUGS.circulated]).toBeCloseTo(CIRCULATED_GOLD, 6);
    // Same numbers the engine produces from the independently built inputs above.
    expect(out[TAP_SLUGS.transferred]).toBeCloseTo(
      tapValue(transferredInputs, "transferred", "auto").goldPerTap,
      9,
    );
    expect(out[TAP_SLUGS.circulated]).toBeCloseTo(
      tapValue(circulatedInputs, "circulated", "auto").goldPerTap,
      9,
    );
  });

  it("moves both taps off the old flat valuations (1000 / 100)", () => {
    const out = withTapPrices(NAE);
    expect(out[TAP_SLUGS.transferred]).not.toBeCloseTo(1000, 6);
    expect(out[TAP_SLUGS.circulated]).not.toBeCloseTo(100, 6);
  });

  it("falls back to the 400/200 juice constants when juice is unpriced", () => {
    const noJuice = { ...NAE };
    delete noJuice["lavas-breath"];
    delete noJuice["glaciers-breath"];
    const out = withTapPrices(noJuice);
    expect(out[TAP_SLUGS.transferred]).toBeCloseTo(
      tapValue({ ...transferredInputs, redJuice: 400, blueJuice: 200 }, "transferred", "auto").goldPerTap,
      9,
    );
  });

  it("leaves a kind unset when one of its five required mats is missing", () => {
    const noFusions = { ...NAE };
    delete noFusions["abidos-fusion-material"];
    const out = withTapPrices(noFusions);
    expect(out[TAP_SLUGS.circulated]).toBeUndefined();
    expect(out[TAP_SLUGS.transferred]).toBeCloseTo(TRANSFERRED_GOLD, 6);

    // Symmetric: dropping a transferred-only mat unsets only the transferred slug.
    const noLeaps = { ...NAE };
    delete noLeaps["great-destiny-leapstone"];
    const out2 = withTapPrices(noLeaps);
    expect(out2[TAP_SLUGS.transferred]).toBeUndefined();
    expect(out2[TAP_SLUGS.circulated]).toBeCloseTo(CIRCULATED_GOLD, 6);

    // The shared shard price gates both kinds.
    const noShards = { ...NAE };
    delete noShards["destiny-shard"];
    const out3 = withTapPrices(noShards);
    expect(out3[TAP_SLUGS.transferred]).toBeUndefined();
    expect(out3[TAP_SLUGS.circulated]).toBeUndefined();
  });

  it("takes a numeric override verbatim, per kind", () => {
    const out = withTapPrices(NAE, { transferred: 1234.5 });
    expect(out[TAP_SLUGS.transferred]).toBe(1234.5);
    expect(out[TAP_SLUGS.circulated]).toBeCloseTo(CIRCULATED_GOLD, 6);

    const both = withTapPrices(NAE, { transferred: 1, circulated: 2 });
    expect(both[TAP_SLUGS.transferred]).toBe(1);
    expect(both[TAP_SLUGS.circulated]).toBe(2);
  });

  it("applies an override even when the kind's inputs are missing", () => {
    const noFusions = { ...NAE };
    delete noFusions["abidos-fusion-material"];
    expect(withTapPrices(noFusions, { circulated: 500 })[TAP_SLUGS.circulated]).toBe(500);
  });

  it("applies a fixed target level to both computed kinds", () => {
    const out = withTapPrices(NAE, { target: 15 });
    expect(out[TAP_SLUGS.transferred]).toBeCloseTo(
      tapValue(transferredInputs, "transferred", 15).goldPerTap,
      9,
    );
    expect(out[TAP_SLUGS.circulated]).toBeCloseTo(
      tapValue(circulatedInputs, "circulated", 15).goldPerTap,
      9,
    );
    // A fixed target is a real constraint: +15 is not the auto argmax for either kind.
    expect(out[TAP_SLUGS.transferred]).not.toBeCloseTo(TRANSFERRED_GOLD, 6);
  });

  // Explicit timeout: this test deliberately runs the unmemoized DP as its oracle for all
  // 11 slugs (about 22 cold solves at ~200ms each), which sits right at vitest's 5s default
  // on a loaded machine and would flake on slower CI runners.
  it("tracks every input slug (a memo must never serve a stale price)", { timeout: 30_000 }, () => {
    // Results are memoized on the input tuple, so every slug that feeds the engine has to be
    // part of the key. Oracle: the raw, unmemoized engine at the same bumped inputs.
    for (const slug of [
      "superior-abidos-fusion-material",
      "destiny-crystallized-destruction-stone",
      "destiny-crystallized-guardian-stone",
      "great-destiny-leapstone",
      "abidos-fusion-material",
      "destiny-destruction-stone",
      "destiny-guardian-stone",
      "destiny-leapstone",
      "destiny-shard",
      "lavas-breath",
      "glaciers-breath",
    ]) {
      const bumpedMap = { ...NAE, [slug]: NAE[slug] * 3 };
      const out = withTapPrices(bumpedMap);
      for (const kind of ["transferred", "circulated"] as const) {
        expect(out[TAP_SLUGS[kind]], `${slug} / ${kind}`).toBeCloseTo(
          tapValue(inputsFrom(bumpedMap, kind), kind, "auto").goldPerTap,
          9,
        );
      }
    }
  });

  it("does not mutate the input map", () => {
    const input = { ...NAE };
    const before = JSON.stringify(input);
    withTapPrices(input, { transferred: 7 });
    expect(JSON.stringify(input)).toBe(before);
    expect(input[TAP_SLUGS.transferred]).toBeUndefined();
    expect(input[TAP_SLUGS.circulated]).toBeUndefined();
  });
});

describe("tapDerivation", () => {
  it("returns the level and slot behind each kind's computed value", () => {
    const t = tapDerivation(NAE, "transferred", "auto")!;
    expect(t.goldPerTap).toBeCloseTo(TRANSFERRED_GOLD, 6);
    expect(t.level).toBe(19);
    expect(t.slot).toBe("weapon");

    const c = tapDerivation(NAE, "circulated", "auto")!;
    expect(c.goldPerTap).toBeCloseTo(CIRCULATED_GOLD, 6);
    expect(c.level).toBe(23);
    expect(c.slot).toBe("weapon");
  });

  it("honors a fixed target level", () => {
    const t = tapDerivation(NAE, "transferred", 17)!;
    expect(t.level).toBe(17);
    expect(t.goldPerTap).toBeCloseTo(tapValue(transferredInputs, "transferred", 17).goldPerTap, 9);
  });

  it("returns null when the kind's required inputs are missing", () => {
    const noFusions = { ...NAE };
    delete noFusions["abidos-fusion-material"];
    expect(tapDerivation(noFusions, "circulated", "auto")).toBeNull();
    expect(tapDerivation(noFusions, "transferred", "auto")).not.toBeNull();
  });
});

describe("buildPriceMap tap wiring", () => {
  it("carries both tap slugs at the computed values", () => {
    const map = buildPriceMap(NAE);
    expect(map[TAP_SLUGS.transferred]).toBeCloseTo(TRANSFERRED_GOLD, 6);
    expect(map[TAP_SLUGS.circulated]).toBeCloseTo(CIRCULATED_GOLD, 6);
  });

  it("passes tapOverrides through", () => {
    const map = buildPriceMap(NAE, { tapOverrides: { transferred: 2000 } });
    expect(map[TAP_SLUGS.transferred]).toBe(2000);
    expect(map[TAP_SLUGS.circulated]).toBeCloseTo(CIRCULATED_GOLD, 6);
  });

  it("feeds the hell-key EVs: a higher transferred tap price lifts a 1730 key's EV", () => {
    // Taps are layered BEFORE the EV loop, so the key EVs must see the override.
    const base = buildPriceMap(NAE)["splendid-hell-key-of-destiny-v"];
    const rich = buildPriceMap(NAE, { tapOverrides: { transferred: 5000 } })[
      "splendid-hell-key-of-destiny-v"
    ];
    expect(rich).toBeGreaterThan(base);
  });
});
