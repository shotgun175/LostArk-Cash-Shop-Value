import { describe, it, expect } from "vitest";
import { buildPackRows } from "../src/lib/packs/packRows";
import { F4_DEFAULT_INPUT, G2G_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import fixture from "./fixtures/tjw-nae-prices.json";

const prices = fixture.prices as Record<string, number>;
const opts = { f4Input: F4_DEFAULT_INPUT, g2gInput: G2G_DEFAULT_INPUT };

describe("buildPackRows", () => {
  const rows = buildPackRows(prices, opts);

  it("returns one row per pack with all display columns", () => {
    expect(rows.length).toBe(15);
    const r = rows.find((x) => x.slug === "horizon-growth-support-pack-i")!;
    expect(r.total).toBe(1679000);
    expect(r.goldPerRc!).toBeCloseTo(289.5, 1);
    expect(r.vsExchange).not.toBeNull();
    expect(r.vsG2G).not.toBeNull();
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
    // Newest retirement leads the section (Paradise Special Pack II, 2026-06-24).
    expect(retired[0].slug).toBe("paradise-special-pack-ii");
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
