// Builds the slug -> gold price map the pack engine values against. Layers, in order:
//   1. baked constants (gems, currencies, default recipe value)
//   2. live region prices (override baked where present)
//   3. computed EV overrides for the 4 hell/netherworld keys and 4 ebony cubes
//   4. relic-recipe override (max engraving), applied last
//   5. blue-crystal currency (optional), priced off the F4 gold input
// Order matters: EV is computed from the baked+region map, so EV inputs see live prices.

import { BAKED } from "./data/constants";
import { HELL_KEY_MAP } from "./data/hellRewards";
import { CUBE_MAP } from "./data/cube";
import { hellKeyEv, cubeEv, relicRecipe } from "./ev";

export function buildPriceMap(
  regionPrices: Record<string, number>,
  opts: { blueCrystalGold?: number } = {},
): Record<string, number> {
  const m: Record<string, number> = { ...BAKED, ...regionPrices };
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
