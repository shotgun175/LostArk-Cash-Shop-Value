import { describe, it, expect } from "vitest";
import { barUse, pageUse, readValueInput, valuesForPath, type PageUse } from "../src/lib/valuesBar";
import { PACKS } from "../src/lib/packs/data/packs";
import { BONUS_ROOM } from "../src/lib/packs/data/bonusRoom";
import { SOARING_KIT } from "../src/lib/packs/priceMap";
import type { Pack } from "../src/lib/packs/data/types";

// The relevance rules of the "Your values" bar (valuesBar.ts): which shared values each page uses,
// read from the datasets the page lists. The clock sits inside the Autumn Bonus Room (it ends
// 2026-11-18T04:00Z) unless a case says otherwise.
const INSIDE = Date.parse("2026-10-25T12:00:00Z");
const AFTER = Date.parse("2026-11-19T00:00:00Z");
const keys = (path: string, data: Parameters<typeof valuesForPath>[1] = { now: INSIDE }) => valuesForPath(path, data).keys;
const use = (slugs: string[], over: Partial<PageUse> = {}): PageUse => ({ slugs: new Set(slugs), vsExchange: false, vsG2G: false, ...over });

/** A minimal active RC pack holding the given resolver chests. */
function pack(slug: string, chests: string[], extra: Partial<Pack> = {}): Pack {
  return { name: slug, slug, royalCrystalCost: 1000, limited: false, retired: false, contents: chests.map((chest) => ({ chest, qty: 1 })), ...extra };
}

describe("valuesForPath, from the live datasets", () => {
  it("Packs: the exchange, G2G, the gem (active gem packs) and pheons (a key pack)", () => {
    expect(valuesForPath("/", { now: INSIDE })).toEqual({ keys: ["exchange", "g2g", "gem", "pheons"], stones: true, kit: false });
  });

  it("Mari's Shop: the exchange, the potion rows and the Soaring kit row", () => {
    expect(valuesForPath("/maris", { now: INSIDE })).toEqual({ keys: ["exchange", "potion", "pheons"], stones: false, kit: true });
    expect(keys("/maris/")).toEqual(["exchange", "potion", "pheons"]); // a trailing slash is the same page
  });

  it("Bonus Room: every value while the room runs, none once it has ended or with no room", () => {
    expect(valuesForPath("/bonus-room", { now: INSIDE })).toEqual({ keys: ["exchange", "g2g", "gem", "potion", "pheons"], stones: false, kit: true });
    expect(keys("/bonus-room", { now: AFTER })).toEqual([]);
    expect(keys("/bonus-room", { now: INSIDE, room: null })).toEqual([]);
  });

  it("Ark Pass: only the gem, through the Ebony Cube tickets (their EV holds Lv. 2 gems)", () => {
    expect(keys("/ark-pass")).toEqual(["gem"]);
  });

  it("Jump-Up Boost: the exchange (vs F4 and the aura) and the gem (Lv. 8 gems)", () => {
    expect(keys("/jump-up")).toEqual(["exchange", "gem"]);
  });

  it("Hell Key math: pheons and the exchange the pheon price comes from", () => {
    expect(valuesForPath("/hell-key", { now: INSIDE })).toEqual({ keys: ["exchange", "pheons"], stones: true, kit: false });
  });

  it("Prices and unknown pages use none", () => {
    for (const p of ["/prices", "/nope", "/pack/no-such-pack", "/pack/"]) expect(keys(p), p).toEqual([]);
  });

  it("a pack drill-down shows what that one pack uses, and never G2G (it shows no G2G figure)", () => {
    // Lv. 3 gem chests, cube tickets and a hell key, all RC-priced.
    expect(keys("/pack/autumn-paradise-pack")).toEqual(["exchange", "gem", "pheons"]);
    // A BC-priced pack compares its BC cost with the F4 exchange.
    expect(keys("/pack/discount-superior-abidos-fusion")).toEqual(["exchange"]);
    // Plain mats on an RC pack: nothing on that page moves with a shared value.
    expect(keys("/pack/adventurers-path-package")).toEqual([]);
    for (const p of PACKS) expect(keys(`/pack/${p.slug}`), p.slug).not.toContain("g2g");
  });
});

describe("valuesForPath with other pack lists", () => {
  const PLAIN = pack("plain", ["Destiny Leapstone Chest"]);

  it("drops the gem chip when no listed pack holds a gem or an Ebony Cube", () => {
    // Sanity: the plain chest resolves, so the empty result is about gems, not a typo.
    expect(pageUse("/", { now: INSIDE, packs: [PLAIN] })!.slugs.size).toBeGreaterThan(0);
    expect(keys("/", { now: INSIDE, packs: [PLAIN] })).toEqual(["exchange", "g2g"]);
    expect(keys("/", { now: INSIDE, packs: [] })).toEqual(["exchange", "g2g"]);
  });

  it("brings it back for a gem chest or a cube ticket", () => {
    expect(keys("/", { now: INSIDE, packs: [PLAIN, pack("gems", ["T4 Gem Chest (Lv. 3)"])] })).toContain("gem");
    expect(keys("/", { now: INSIDE, packs: [PLAIN, pack("cubes", ["(NEW) Ebony Cube Entrance Ticket Selection Chest II"])] })).toContain("gem");
  });

  it("counts only active packs on the Packs tab, but any pack on its own drill-down", () => {
    const retired = pack("old-gems", ["T4 Gem Chest (Lv. 3)"], { retired: true });
    expect(keys("/", { now: INSIDE, packs: [PLAIN, retired] })).toEqual(["exchange", "g2g"]);
    expect(keys("/pack/old-gems", { now: INSIDE, packs: [PLAIN, retired] })).toEqual(["gem"]);
  });

  it("drops pheons when the active packs hold no key", () => {
    const active = PACKS.filter((p) => !p.retired);
    expect(keys("/", { now: INSIDE, packs: active })).toContain("pheons");
    const noKeys = active.filter((p) => !keys(`/pack/${p.slug}`).includes("pheons"));
    expect(noKeys.length).toBeLessThan(active.length);
    expect(keys("/", { now: INSIDE, packs: noKeys })).not.toContain("pheons");
  });

  it("counts a choose-N pack's options", () => {
    const choose: Pack = { ...pack("choose", []), customSelection: { pick: 1, options: [{ chest: "T4 Gem Chest (Lv. 3)", qty: 1 }] } };
    expect(keys("/", { now: INSIDE, packs: [choose] })).toContain("gem");
  });

  it("reads the Bonus Room's products and bonus packs from the room it is given", () => {
    const room = { ...BONUS_ROOM!, groups: BONUS_ROOM!.groups.map((g) => ({ ...g, products: [], bonus: { ...g.bonus, contents: [] } })) };
    expect(keys("/bonus-room", { now: INSIDE, room })).toEqual(["exchange", "g2g"]);
  });
});

describe("barUse rules", () => {
  it("gem: any T4 gem level, or an Ebony Cube whose EV holds Lv. 2 gems", () => {
    for (const s of ["lv-1-gem", "lv-2-gem", "lv-3-gem", "lv-8-gem", "ebony-cube-1st-unlock", "ebony-cube-4th-unlock"]) {
      expect(barUse(use([s])).keys, s).toEqual(["gem"]);
    }
    expect(barUse(use(["destiny-leapstone"])).keys).toEqual([]);
  });

  it("potion: the Life Energy Potion, whose default also reads gold per BC", () => {
    expect(barUse(use(["basic-life-energy-potion"])).keys).toEqual(["exchange", "potion"]);
  });

  it("pheons: a key with Ability stones or the Soaring kit, each naming itself for the hint", () => {
    expect(barUse(use(["hell-key-of-destiny-vi"]))).toEqual({ keys: ["exchange", "pheons"], stones: true, kit: false });
    expect(barUse(use([SOARING_KIT]))).toEqual({ keys: ["exchange", "pheons"], stones: false, kit: true });
    // A pheon line itself is priced off the exchange, but the Include pheons setting does not move it.
    expect(barUse(use(["pheon"])).keys).toEqual(["exchange"]);
  });

  it("exchange: a cost compared with the exchange, blue crystal or a BC-store item", () => {
    expect(barUse(use([], { vsExchange: true })).keys).toEqual(["exchange"]);
    expect(barUse(use(["blue-crystal"])).keys).toEqual(["exchange"]);
    expect(barUse(use(["crystalline-aura-plus-14d"])).keys).toEqual(["exchange"]);
    expect(barUse(use(["astrogem-processing-reset-ticket"])).keys).toEqual(["exchange"]);
  });

  it("g2g: only where a % vs G2G figure shows", () => {
    expect(barUse(use([], { vsG2G: true })).keys).toEqual(["g2g"]);
    expect(barUse(use([])).keys).toEqual([]);
  });
});

describe("readValueInput", () => {
  it("clears on an empty box, sets a number of 0 or more, and keeps the value otherwise", () => {
    expect(readValueInput("")).toEqual({ kind: "clear" });
    expect(readValueInput("   ")).toEqual({ kind: "clear" });
    expect(readValueInput("400000")).toEqual({ kind: "set", value: 400000 });
    expect(readValueInput(" 1e5 ")).toEqual({ kind: "set", value: 100000 });
    expect(readValueInput("0")).toEqual({ kind: "set", value: 0 });
    expect(readValueInput("-5")).toEqual({ kind: "keep" });
    expect(readValueInput("abc")).toEqual({ kind: "keep" });
    expect(readValueInput("", true)).toEqual({ kind: "keep" }); // half-typed "1e": the browser reports badInput
  });
});
