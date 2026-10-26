// Which shared values ("Your values", ValuesBar.svelte) a page actually uses. Pure: the answer
// comes from the datasets each page lists and from what the price engine reads, never from a
// hand-written per-tab list, so a pack or rotation change moves the bar with no code change.
//
// Each route lists some items (pack contents walked through the chest resolver, Mari's wares, a
// track's rewards, the hell keys) and may show a cost-vs-exchange figure. From those:
//   exchange  the page compares a crystal cost with the F4 exchange, or lists something priced
//             off the F4 rate: blue crystal, a BC_COSTS item, the Life Energy Potion default
//             (its durability cost reads gold per BC) or a pheon-valued item (pheons are 8.5 BC)
//   g2g       the page shows a "% vs G2G" figure (the pack cards: Packs and the Bonus Room)
//   gem       a listed item is a T4 gem (T4_GEM_LEVELS) or an Ebony Cube whose EV holds Lv. 2 gems
//   potion    the Basic Life Energy Potion is listed
//   pheons    a hell or netherworld key with an Ability stones column, or the Stone of Soaring kit,
//             is listed (the Include pheons setting moves exactly those values)

import type { Pack } from "./packs/data/types";
import type { BonusRoom } from "./packs/data/bonusRoom";
import { PACKS } from "./packs/data/packs";
import { RESOLVER } from "./packs/data/resolver";
import { BONUS_ROOM } from "./packs/data/bonusRoom";
import { MARIS_WARES } from "./packs/data/marisShop";
import { ARK_PASS_LEVELS } from "./packs/data/arkPass";
import { JUMP_UP_LEVELS } from "./packs/data/jumpUp";
import { HELL_KEY_MAP, HELL_TIERS, COLUMN_VALUATION } from "./packs/data/hellRewards";
import { CUBE_MAP, CUBE_REWARDS } from "./packs/data/cube";
import { BC_COSTS } from "./packs/data/constants";
import { T4_GEM_LEVELS, GEM_LV8_SLUG } from "./packs/gems";
import { LIFE_ENERGY_POTION, SOARING_KIT } from "./packs/priceMap";
import { bonusRoomActive } from "./packs/bonusRoom";

/** A shared value the bar can show, in display order. */
export type ValueKey = "exchange" | "g2g" | "gem" | "potion" | "pheons";
export const VALUE_KEYS: readonly ValueKey[] = ["exchange", "g2g", "gem", "potion", "pheons"];

/**
 * Price overrides that hold a bar value (the Lv. 8 gem baseline and the potion value). They are
 * settings, not price edits: the Packs custom-price count leaves them out and its "reset all"
 * keeps them; clearing the bar's box returns each to its baseline.
 */
export const BAR_OVERRIDES: ReadonlySet<string> = new Set([GEM_LV8_SLUG, LIFE_ENERGY_POTION]);

/** What a page lists and compares, the input to the relevance rules. */
export interface PageUse {
  slugs: ReadonlySet<string>; // every item slug the page values (all options of a selection chest)
  vsExchange: boolean; // the page compares a crystal cost with the F4 exchange
  vsG2G: boolean; // the page shows a "% vs G2G" figure
}

/** The bar's content for a page: the relevant values plus what the pheons hint should name. */
export interface BarUse {
  keys: ValueKey[];
  stones: boolean; // a listed key has Ability stones (valued at 9 pheons each when included)
  kit: boolean; // the Stone of Soaring kit is listed
}

/** Datasets the route rules read; tests pass their own. */
export interface Datasets {
  now: number; // the Bonus Room tab lists nothing outside its window
  packs?: readonly Pack[];
  room?: BonusRoom | null;
}

const NONE: BarUse = { keys: [], stones: false, kit: false };

// Slugs priced off the F4 input in buildPriceMap: blue crystal and the BC-store items.
const F4_PRICED: ReadonlySet<string> = new Set(["blue-crystal", ...Object.keys(BC_COSTS)]);

/** True when a key's tier has a column valued in pheons (Ability stones). */
function keyHasPheons(slug: string): boolean {
  const tier = HELL_TIERS[HELL_KEY_MAP[slug]?.tierLabel];
  if (!tier) return false;
  return tier.columns.some((c) => (tier.valuation?.[c] ?? COLUMN_VALUATION[c])?.pheons !== undefined);
}

/** True when an Ebony Cube's reward row includes Lv. 2 gems. */
function cubeHasGems(slug: string): boolean {
  const row = CUBE_REWARDS[CUBE_MAP[slug]];
  return row !== undefined && row.lv2Gems > 0;
}

/** Every output slug of the named resolver chests (unknown names add nothing). */
export function chestSlugs(chests: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const name of chests) for (const o of RESOLVER[name]?.outputs ?? []) out.add(o.slug);
  return out;
}

/** The chest names a pack lists: its contents plus every choose-N option. */
function packChests(p: Pick<Pack, "contents" | "customSelection">): string[] {
  return [...p.contents.map((c) => c.chest), ...(p.customSelection?.options.map((o) => o.chest) ?? [])];
}

/**
 * The relevance rules (see the header comment) applied to one page's items.
 *
 * Args:
 *   use: the page's listed slugs and which comparisons it shows.
 *
 * Returns:
 *   The relevant value keys in display order, and whether Ability stones or the Soaring kit
 *   are listed (the pheons hint names them).
 */
export function barUse(use: PageUse): BarUse {
  const slugs = [...use.slugs];
  const stones = slugs.some((s) => s in HELL_KEY_MAP && keyHasPheons(s));
  const kit = use.slugs.has(SOARING_KIT);
  const pheons = stones || kit;
  const potion = use.slugs.has(LIFE_ENERGY_POTION);
  const on: Record<ValueKey, boolean> = {
    exchange: use.vsExchange || pheons || potion || slugs.some((s) => F4_PRICED.has(s)),
    g2g: use.vsG2G,
    gem: slugs.some((s) => s in T4_GEM_LEVELS || cubeHasGems(s)),
    potion,
    pheons,
  };
  return { keys: VALUE_KEYS.filter((k) => on[k]), stones, kit };
}

/**
 * What a route's page lists, or null for a page that values nothing (Prices, unknown paths,
 * the Bonus Room outside its window, an unknown pack).
 *
 * Args:
 *   path: the route path without the base path, e.g. "/", "/maris" or "/pack/<slug>".
 *   data: the clock and any dataset overrides.
 */
export function pageUse(path: string, data: Datasets): PageUse | null {
  const packs = data.packs ?? PACKS;
  const room = data.room === undefined ? BONUS_ROOM : data.room;
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;

  if (p === "/" || p === "") {
    // Retired packs show their frozen value, so only the active ones count.
    const chests = packs.filter((x) => !x.retired).flatMap(packChests);
    return { slugs: chestSlugs(chests), vsExchange: true, vsG2G: true };
  }
  const drill = /^\/pack\/([^/]+)$/.exec(p);
  if (drill) {
    const pack = packs.find((x) => x.slug === decodeURIComponent(drill[1]));
    if (!pack) return null;
    // The drill-down's only cost comparison is the BC pack's "gold to buy N BC (F4 exchange)" row.
    return { slugs: chestSlugs(packChests(pack)), vsExchange: pack.blueCrystalCost != null, vsG2G: false };
  }
  switch (p) {
    case "/maris":
      return {
        slugs: new Set(MARIS_WARES.flatMap((w) => (w.slug === null ? [] : [w.slug]))),
        vsExchange: true, // every ware's BC cost is shown in gold at the exchange rate
        vsG2G: false,
      };
    case "/bonus-room": {
      if (!room || !bonusRoomActive(room, data.now)) return null;
      const chests = room.groups.flatMap((g) => [...g.products.flatMap(packChests), ...g.bonus.contents.map((c) => c.chest)]);
      return { slugs: chestSlugs(chests), vsExchange: true, vsG2G: true };
    }
    case "/ark-pass":
      return { slugs: chestSlugs(ARK_PASS_LEVELS.filter((l) => !l.unresolved).map((l) => l.chest)), vsExchange: false, vsG2G: false };
    case "/jump-up":
      // The track total is compared with the F4 exchange ("vs F4 exchange").
      return { slugs: chestSlugs(JUMP_UP_LEVELS.flatMap((l) => l.rewards.map((r) => r.chest))), vsExchange: true, vsG2G: false };
    case "/hell-key":
      return { slugs: new Set(Object.keys(HELL_KEY_MAP)), vsExchange: false, vsG2G: false };
    default:
      return null;
  }
}

/** The bar's content for a route: `barUse` of its page, or no values for a page that has none. */
export function valuesForPath(path: string, data: Datasets): BarUse {
  const use = pageUse(path, data);
  return use ? barUse(use) : NONE;
}

/** How a typed value box should change its stored override. */
export type InputAction = { kind: "keep" } | { kind: "clear" } | { kind: "set"; value: number };

/**
 * Reads a number box for a price override: a half-typed entry the browser cannot parse ("1e")
 * keeps the last value, an empty box clears the override, a finite number of 0 or more sets it
 * (0 counts), and anything else (a negative number) keeps the last value.
 */
export function readValueInput(raw: string, badInput = false): InputAction {
  if (badInput) return { kind: "keep" };
  const t = raw.trim();
  if (t === "") return { kind: "clear" };
  const v = Number(t);
  return Number.isFinite(v) && v >= 0 ? { kind: "set", value: v } : { kind: "keep" };
}
