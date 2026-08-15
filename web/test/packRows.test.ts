import { describe, it, expect } from "vitest";
import { buildPackRows } from "../src/lib/packs/packRows";
import { F4_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import fixture from "./fixtures/tjw-nae-prices.json";

const prices = fixture.prices as Record<string, number>;
const opts = { f4Input: F4_DEFAULT_INPUT, g2gInput: 0.03268824 }; // arbitrary g2g input (the old spec seed)

describe("buildPackRows", () => {
  const rows = buildPackRows(prices, opts);

  it("returns one row per pack with all display columns", () => {
    expect(rows.length).toBe(20);
    // Sample a still-active pack (horizon-i is retired since 2026-07-15 and displays its
    // frozen total, covered below); 365,220 / 182.6 is its golden value on this fixture
    // after the 2026-08-14 Abidos (15) correction (see packValue.test.ts).
    const r = rows.find((x) => x.slug === "adventurers-path-package")!;
    expect(r.total).toBe(365220);
    expect(r.goldPerRc!).toBeCloseTo(182.6, 1);
    expect(r.vsExchange).not.toBeNull();
    expect(r.vsG2G).not.toBeNull();
  });

  it("shows the frozen total (not fixture math) for a retired pack", () => {
    const r = rows.find((x) => x.slug === "horizon-growth-support-pack-i")!;
    expect(r.total).toBe(1537150);
    expect(r.goldPerRc!).toBeCloseTo(265.0, 1);
  });

  it("orders active packs before retired, each by gold/RC desc", () => {
    const firstRetiredIdx = rows.findIndex((r) => r.retired);
    const lastActiveIdx = rows.map((r) => r.retired).lastIndexOf(false);
    expect(lastActiveIdx).toBeLessThan(firstRetiredIdx);
    const active = rows.filter((r) => !r.retired).map((r) => r.goldPerRc ?? 0);
    expect(active).toEqual([...active].sort((a, b) => b - a));
  });

  it("orders retired packs most-recently-retired first, then gold/RC desc", () => {
    const retired = rows.filter((r) => r.retired);
    // Newest retirement leads the section (the 2026-07-15 Horizon pair); within that shared
    // date the higher frozen gold/RC wins (Horizon I 265.0 over Horizon II 194.3).
    expect(retired[0].slug).toBe("horizon-growth-support-pack-i");
    expect(retired[1].slug).toBe("horizon-growth-support-pack-ii");
    // retiredOn is non-increasing across the whole retired group.
    const dates = retired.map((r) => r.retiredOn ?? "");
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    // Within a shared retirement date, higher gold/RC wins (the 2026-06-10 cohort).
    const sameDay = retired.filter((r) => r.retiredOn === "2026-06-10").map((r) => r.goldPerRc ?? 0);
    expect(sameDay).toEqual([...sameDay].sort((a, b) => b - a));
  });

  it("vsExchange sign tracks gold/RC vs the 84.03 baseline", () => {
    const horizon = rows.find((r) => r.slug === "horizon-growth-support-pack-i")!;
    const t4 = rows.find((r) => r.slug === "monthly-t4-growth-support")!;
    expect(horizon.vsExchange!).toBeGreaterThan(0); // 289.5 >> 84.03
    expect(t4.vsExchange!).toBeLessThan(0);          // 45.5 < 84.03
  });
});
