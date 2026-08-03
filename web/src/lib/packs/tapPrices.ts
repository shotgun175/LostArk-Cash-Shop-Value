// Turns the special-hone engine (specialHone.ts) into two pseudo-slugs the rest of the
// app can price like any other item:
//   special-hone-tap-transferred: a free tap on the T4.5 (Transferred) track (1730/1750)
//   special-hone-tap-circulated:  a free tap on the T4 (Circulated) track (1640-1700)
// The "Free taps" reward column reads those slugs (data/hellRewards.ts), so hell-key EVs
// and every pack that contains a key value taps at live mat prices instead of a flat
// constant. Kept out of BAKED on purpose: these are computed, not constants.

import { tapValue, type LeapKind, type TapPriceInputs, type TapValue } from "./specialHone";

export const TAP_SLUGS = {
  transferred: "special-hone-tap-transferred",
  circulated: "special-hone-tap-circulated",
} as const;

export interface TapOverrides {
  /** Replaces the computed Transferred tap price outright. */
  transferred?: number;
  /** Replaces the computed Circulated tap price outright. */
  circulated?: number;
  /** Hone level both computed kinds are valued at; "auto" takes each kind's argmax. */
  target?: number | "auto";
}

// Market slug behind each engine input, per leapstone kind: Transferred hones on the
// T4.5 track, Circulated on the raw T4 track. All five are required; a kind with any of
// them unpriced is not published at all (the reward column's fallback then applies).
const MAT_SLUGS: Record<LeapKind, Record<"fusions" | "redStones" | "blueStones" | "leapstones" | "shards", string>> = {
  transferred: {
    fusions: "superior-abidos-fusion-material",
    redStones: "destiny-crystallized-destruction-stone",
    blueStones: "destiny-crystallized-guardian-stone",
    leapstones: "great-destiny-leapstone",
    shards: "destiny-shard",
  },
  circulated: {
    fusions: "abidos-fusion-material",
    redStones: "destiny-destruction-stone",
    blueStones: "destiny-guardian-stone",
    leapstones: "destiny-leapstone",
    shards: "destiny-shard",
  },
};

/** Engine inputs for one kind, or null when any of its five required mats is unpriced. */
function tapInputs(map: Record<string, number>, kind: LeapKind): TapPriceInputs | null {
  const s = MAT_SLUGS[kind];
  const fusions = map[s.fusions];
  const redStones = map[s.redStones];
  const blueStones = map[s.blueStones];
  const leapstones = map[s.leapstones];
  const shards = map[s.shards];
  for (const v of [fusions, redStones, blueStones, leapstones, shards]) {
    if (typeof v !== "number") return null;
  }
  return {
    fusions,
    redStones,
    blueStones,
    leapstones,
    shards,
    // Both tracks hone with T4.5 juice (the extracted tables carry "Red juice (T4.5)" /
    // "Blue juice (T4.5)" as the additive on Transferred AND Circulated rows), so both
    // kinds read the same two slugs. Fallbacks match ev.ts juiceUnitPrice.
    redJuice: map["lavas-breath"] ?? 400,
    blueJuice: map["glaciers-breath"] ?? 200,
    // silver is left at the engine default of 0: our valuation does not price silver.
  };
}

// tapValue is pure but expensive (~100ms per kind: pricing juice opens up the attempt
// recursion), and the UI rebuilds the whole price map on every keystroke, so results are
// memoized on the exact input tuple. Bounded by a cheap clear: distinct price sets are
// few, and a cold key just costs one recompute.
const CACHE_LIMIT = 64;
const cache = new Map<string, TapValue>();

function cachedTapValue(inputs: TapPriceInputs, kind: LeapKind, target: number | "auto"): TapValue {
  const key = [
    kind,
    target,
    inputs.fusions,
    inputs.redStones,
    inputs.blueStones,
    inputs.leapstones,
    inputs.shards,
    inputs.redJuice,
    inputs.blueJuice,
  ].join("|");
  const hit = cache.get(key);
  if (hit) return hit;
  const value = tapValue(inputs, kind, target);
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, value);
  return value;
}

/**
 * A copy of `map` with the two tap pseudo-slugs priced. A numeric override replaces that
 * kind's value outright (skipping the computation and the required-mats rule); otherwise
 * the kind is computed at `overrides.target` and omitted when its mats are unpriced.
 * Never mutates the input map.
 */
export function withTapPrices(
  map: Record<string, number>,
  overrides: TapOverrides = {},
): Record<string, number> {
  const out = { ...map };
  const target = overrides.target ?? "auto";
  for (const kind of ["transferred", "circulated"] as const) {
    // Number.isFinite, not typeof: a cleared UI override field arrives as NaN and must
    // fall through to the computed value rather than poisoning every "Free taps" cell.
    const override = overrides[kind];
    if (typeof override === "number" && Number.isFinite(override)) {
      out[TAP_SLUGS[kind]] = override;
      continue;
    }
    const inputs = tapInputs(map, kind);
    if (!inputs) continue;
    out[TAP_SLUGS[kind]] = cachedTapValue(inputs, kind, target).goldPerTap;
  }
  return out;
}

/**
 * The full engine result (gold, hone level, slot) behind one kind's computed tap price,
 * for the UI's "how this was derived" line. Overrides are deliberately not applied here:
 * this reports what the mats say. Null when the kind's mats are unpriced.
 */
export function tapDerivation(
  map: Record<string, number>,
  kind: LeapKind,
  target: number | "auto",
): TapValue | null {
  const inputs = tapInputs(map, kind);
  return inputs ? cachedTapValue(inputs, kind, target) : null;
}
