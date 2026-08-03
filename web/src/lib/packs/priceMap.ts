// Builds the slug -> gold price map the pack engine values against. Layers, in order:
//   1. baked constants (gems, currencies, default recipe value)
//   2. live region prices (override baked where present)
//   3. computed special-hone tap pseudo-slugs (the "Free taps" reward column)
//   4. computed EV overrides for the 4 hell/netherworld keys and 4 ebony cubes
//   5. relic-recipe override (max engraving), applied last
//   6. blue-crystal currency (optional), priced off the F4 gold input
// Order matters: EV is computed from the baked+region+taps map, so EV inputs see live
// prices and hell keys value their free taps at the live tap price.

import { BAKED } from "./data/constants";
import { HELL_KEY_MAP } from "./data/hellRewards";
import { CUBE_MAP } from "./data/cube";
import { hellKeyEv, cubeEv, relicRecipe } from "./ev";
import { withTapPrices, type TapOverrides } from "./tapPrices";

export function buildPriceMap(
  regionPrices: Record<string, number>,
  opts: { blueCrystalGold?: number; tapOverrides?: TapOverrides } = {},
): Record<string, number> {
  const m0: Record<string, number> = { ...BAKED, ...regionPrices };
  const m = withTapPrices(m0, opts.tapOverrides);
  for (const slug of Object.keys(HELL_KEY_MAP)) {
    m[slug] = hellKeyEv(slug, m);
  }
  for (const slug of Object.keys(CUBE_MAP)) {
    m[slug] = cubeEv(slug, m);
  }
  const recipe = relicRecipe(m);
  if (recipe > 0) m["relic-combat-engraving-recipe"] = recipe;
  // Blue Crystal ("Crystal" in the 1200 Crystal Pack) is not AH-traded: it's the F4 exchange
  // currency, valued at the shared gold input / 95 (one exchange listing = 238 RC = 95 BC).
  // Injected last so it always tracks the current input; callers with no input leave it unpriced.
  const bc = opts.blueCrystalGold;
  if (typeof bc === "number" && Number.isFinite(bc) && bc > 0) m["blue-crystal"] = bc;
  return m;
}
