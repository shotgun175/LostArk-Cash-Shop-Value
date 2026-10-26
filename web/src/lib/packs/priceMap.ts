// Builds the slug -> gold price map the pack engine values against. Layers, in order:
//   1. baked constants (currencies, seeds, default recipe value)
//   2. live region prices (override baked where present)
//   3. T4 gems (gems.ts): every level the user did not price is Lv. 8 / 3^(8 - N), off the
//      user's lv-8-gem value or the region's default baseline (2026-10-25)
//   4. computed special-hone tap pseudo-slugs (the "Free taps" reward column)
//   5. blue-crystal currency + BC-store-costed items (optional), priced off the F4 gold input
//   6. the Basic Life Energy Potion default (lifeEnergy.ts: 3,000 LE x logging gold per LE at
//      live timber prices) unless the user set a value (2026-10-25)
//   7. computed EV overrides for the hell/netherworld keys and the ebony cubes
//   8. relic-recipe override (max engraving)
//   9. the Stone of Soaring Engraving Setting Kit (Bonus Room): 9 pheons with Include pheons on,
//      else 0 (TJW 2026-10-21, adopted 2026-10-25)
// Order matters: EV is computed from the baked+region+taps+BC map, so EV inputs see live
// prices, hell keys value their free taps at the live tap price, and with Include pheons on
// the keys' Ability stones read the pheon price (a user override or the BC-store derivation),
// matching TJW's layering (BC items before key EVs).

import { BAKED, BC_COSTS } from "./data/constants";

// Slugs whose price IS the F4 exchange derivation (user 2026-08-15): the exchange input is
// the single source of truth, so the pack UIs render these unit prices read-only instead of
// offering the click-to-edit override (which the injection below would out-layer anyway).
// The BC_COSTS items (see data/constants.ts) are NOT here on purpose: their BC store costs are
// assumptions, so a user override on those is honored.
export const F4_DERIVED_SLUGS: ReadonlySet<string> = new Set(["blue-crystal"]);
import { HELL_KEY_MAP, PHEONS_PER_ABILITY_STONE } from "./data/hellRewards";
import { CUBE_MAP } from "./data/cube";
import { hellKeyEv, cubeEv, relicRecipe, pheonGold } from "./ev";
import { withTapPrices, type TapOverrides } from "./tapPrices";
import { potionDefault } from "./lifeEnergy";
import { T4_GEM_LEVELS, gemBaseline, gemPriceAt } from "./gems";
import type { Region } from "../api";

// The Bonus Room's Stone of Soaring Engraving Setting Kit: untradable, so like the hell keys'
// Ability stones it is worth PHEONS_PER_ABILITY_STONE pheons only while Include pheons is on.
export const SOARING_KIT = "stone-of-soaring-engraving-setting-kit";

// The Bonus Room's Basic Life Energy Potion: untradable, so with no user value it defaults to the
// gold 3,000 LE earns logging (layer 6 below).
export const LIFE_ENERGY_POTION = "basic-life-energy-potion";

// Slugs whose price buildPriceMap computes (layers 7 to 9 below), mapped to the read-only
// tooltip the pack UIs show. Like F4_DERIVED_SLUGS, a click-to-edit override here would be
// out-layered by the computation, so no edit is offered and stored overrides are dropped on load.
const KEY_NOTE = "Expected value of the key's rewards at current prices. See the Hell Key tab.";
const CUBE_NOTE = "Expected value of the cube's rewards at current mat prices. Edit those mat prices to change it.";
export const COMPUTED_PRICE_NOTES: ReadonlyMap<string, string> = new Map([
  ...Object.keys(HELL_KEY_MAP).map((s) => [s, KEY_NOTE] as const),
  ...Object.keys(CUBE_MAP).map((s) => [s, CUBE_NOTE] as const),
  ["relic-combat-engraving-recipe", "Priced as the most expensive relic combat engraving at current prices."],
  [SOARING_KIT, "9 pheons while pheons are included (Your values), else 0. Read-only."],
]);

export function buildPriceMap(
  regionPrices: Record<string, number>,
  opts: { blueCrystalGold?: number; tapOverrides?: TapOverrides; includePheons?: boolean; region?: Region } = {},
): Record<string, number> {
  const m0: Record<string, number> = { ...BAKED, ...regionPrices };
  // T4 gems (gems.ts, DECISIONS 2026-10-25): every level follows the region's Lv. 8 baseline (the
  // user's lv-8-gem value, else the regional default) at 3:1 per level. The feed never prices
  // gems, so a value in regionPrices is the user's and replaces only that level, as with
  // BC_COSTS. Not in COMPUTED_PRICE_NOTES: every level stays editable.
  const { lv8 } = gemBaseline(regionPrices, opts.region ?? "nae");
  for (const [slug, level] of Object.entries(T4_GEM_LEVELS)) {
    if (!(slug in regionPrices)) m0[slug] = gemPriceAt(level, lv8);
  }
  const m = withTapPrices(m0, opts.tapOverrides);
  // Blue Crystal ("Crystal" in the 1200 Crystal Pack) is not AH-traded: it's the F4 exchange
  // currency, valued at the shared gold input / 95 (one exchange listing = 238 RC = 95 BC).
  // Injected before the key EVs (TJW's order) so Include pheons can read the pheon price; it
  // tracks the current input, and callers with no input leave it unpriced. Nothing below
  // reads or overwrites these slugs while pheons are off, so the move is value-neutral then.
  const bc = opts.blueCrystalGold;
  if (typeof bc === "number" && Number.isFinite(bc) && bc > 0) {
    m["blue-crystal"] = bc;
    // BC-store-costed items (BC_COSTS in data/constants.ts): gold = BC cost x gold/BC.
    // Priced only when the exchange input is set, like blue-crystal itself. A slug already in
    // regionPrices means the user click-to-edited that line (these items are never in the live
    // feed), and the override must win: the UI marks it "edited", so it has to take effect.
    for (const [slug, cost] of Object.entries(BC_COSTS)) {
      if (!(slug in regionPrices)) m[slug] = cost * bc;
    }
  }
  // Basic Life Energy Potion default: 3,000 LE x logging gold per LE at live timber prices (and
  // the blue-crystal price above, when set). The potion is never in the live feed, so a value in
  // regionPrices is the user's and wins, as with BC_COSTS. Not in COMPUTED_PRICE_NOTES: it stays
  // editable. Without all four timber prices the potion stays unpriced.
  if (!(LIFE_ENERGY_POTION in regionPrices)) {
    const potion = potionDefault(m);
    if (potion !== null) m[LIFE_ENERGY_POTION] = potion;
  }
  for (const slug of Object.keys(HELL_KEY_MAP)) {
    m[slug] = hellKeyEv(slug, m, { includePheons: opts.includePheons });
  }
  for (const slug of Object.keys(CUBE_MAP)) {
    m[slug] = cubeEv(slug, m);
  }
  const recipe = relicRecipe(m);
  if (recipe > 0) m["relic-combat-engraving-recipe"] = recipe;
  // Always present (0 when off), so the kit reads as priced at 0, not unpriced, as in TJW's
  // Bonus Room. Set last: it reads the pheon price from the BC layer above and ignores any
  // user value on the kit itself (a user pheon price still moves it).
  m[SOARING_KIT] = opts.includePheons ? PHEONS_PER_ABILITY_STONE * pheonGold(m) : 0;
  return m;
}
