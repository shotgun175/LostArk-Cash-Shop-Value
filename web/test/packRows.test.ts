import { describe, it, expect } from "vitest";
import { buildPackRows } from "../src/lib/packs/packRows";
import { F4_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import fixture from "./fixtures/tjw-nae-prices.json";

const prices = fixture.prices as Record<string, number>;
const opts = { f4Input: F4_DEFAULT_INPUT, g2gInput: 0.03268824 }; // arbitrary g2g input (the old spec seed)

describe("buildPackRows", () => {
  const rows = buildPackRows(prices, opts);

  it("returns one row per pack with all display columns", () => {
    expect(rows.length).toBe(32);
    // Sample a still-active pack (the 2026-08-12 rotation retired most of the old actives);
    // 172,875 / 45.5 is monthly-t4's TJW golden value on this fixture.
    const r = rows.find((x) => x.slug === "monthly-t4-growth-support")!;
    expect(r.total).toBe(172875);
    expect(r.goldPerRc!).toBeCloseTo(45.5, 1);
    expect(r.vsExchange).not.toBeNull();
    expect(r.vsG2G).not.toBeNull();
  });

  it("shows the frozen total (not fixture math) for a retired pack", () => {
    const r = rows.find((x) => x.slug === "horizon-growth-support-pack-i")!;
    expect(r.total).toBe(1537150);
    expect(r.goldPerRc!).toBeCloseTo(265.0, 1);
  });

  it("orders active packs before retired, each by gold/RC (equivalent) desc", () => {
    const firstRetiredIdx = rows.findIndex((r) => r.retired);
    const lastActiveIdx = rows.map((r) => r.retired).lastIndexOf(false);
    expect(lastActiveIdx).toBeLessThan(firstRetiredIdx);
    // BC-priced packs slot in at their RC equivalent (95 BC = 238 RC on the F4 exchange).
    const key = (r: (typeof rows)[number]) =>
      r.goldPerRc ?? (r.goldPerBc != null ? (r.goldPerBc * 95) / 238 : 0);
    const active = rows.filter((r) => !r.retired).map(key);
    expect(active).toEqual([...active].sort((a, b) => b - a));
  });

  it("prices BC packs against the BC exchange baseline and G2G via the shop-money equivalent", () => {
    // The whole BC cohort retired on 2026-08-26, so this now exercises the BC columns off a
    // frozen total (buildPackRows always passes useFrozen). 62,400 frozen gold for 150 BC
    // = 416 g/BC vs the 30,000/95 = 315.8 baseline -> +31.7%.
    const r = rows.find((x) => x.slug === "discount-superior-abidos-fusion")!;
    expect(r.goldPerBc!).toBeCloseTo(416, 1);
    expect(r.goldPerRc).toBeNull();
    expect(r.vsExchange!).toBeCloseTo(((416 - 30000 / 95) / (30000 / 95)) * 100, 1);
    // vs G2G off the shop-money equivalent: 150 BC = 375.8 RC = $3.13 -> 19,926 g/$,
    // vs G2G's 1000/0.03268824 = 30,592 g/$ -> -34.9%.
    const goldPerDollar = 62400 / (((150 * 238) / 95) * (100 / 12000));
    expect(r.vsG2G!).toBeCloseTo((goldPerDollar / (1000 / 0.03268824) - 1) * 100, 6);
    expect(r.vsG2G!).toBeCloseTo(-34.9, 1);
  });

  it("orders retired packs most-recently-retired first, then gold/RC desc", () => {
    const retired = rows.filter((r) => r.retired);
    // Newest retirement leads the section (the 2026-08-26 cohort); within that shared date the
    // higher frozen gold/RC-equivalent wins, and BC packs convert at x(95/238) to share the
    // scale (Breath 1058.7 g/BC = 422.6 RC-equivalent over the 2+1 pack's 225.7 g/RC).
    expect(retired[0].slug).toBe("discount-t4-breath-selection-chest");
    expect(retired[1].slug).toBe("2-plus-1-1000-crystal-pack");
    // retiredOn is non-increasing across the whole retired group.
    const dates = retired.map((r) => r.retiredOn ?? "");
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    // Within a shared retirement date, higher gold/RC wins (the 2026-06-10 cohort).
    const sameDay = retired.filter((r) => r.retiredOn === "2026-06-10").map((r) => r.goldPerRc ?? 0);
    expect(sameDay).toEqual([...sameDay].sort((a, b) => b - a));
  });

  it("keeps a choose-N pack's rank pinned to its default picks while custom picks change its value", () => {
    const custom = buildPackRows(prices, {
      ...opts,
      customPicks: { "summer-custom-pack-1": ["Destiny Shard Pouch (L)"] },
    });
    // The displayed value drops to the single picked line...
    const base = rows.find((r) => r.slug === "summer-custom-pack-1")!;
    const picked = custom.find((r) => r.slug === "summer-custom-pack-1")!;
    expect(picked.total).toBeLessThan(base.total);
    // ...but the grid order is identical to the no-picks order: toggling never reshuffles.
    expect(custom.map((r) => r.slug)).toEqual(rows.map((r) => r.slug));
  });

  it("vsExchange sign tracks gold/RC vs the 126.05 baseline", () => {
    const horizon = rows.find((r) => r.slug === "horizon-growth-support-pack-i")!;
    const t4 = rows.find((r) => r.slug === "monthly-t4-growth-support")!;
    expect(horizon.vsExchange!).toBeGreaterThan(0); // frozen 265.0 >> 126.05
    expect(t4.vsExchange!).toBeLessThan(0);          // 45.5 < 126.05
  });
});
