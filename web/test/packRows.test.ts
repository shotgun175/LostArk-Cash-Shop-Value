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

  it("prices BC packs against the BC exchange baseline, with no cash comparison", () => {
    // 68,400 gold for 150 BC = 456 g/BC vs the 30,000/95 = 315.8 baseline -> +44%.
    const r = rows.find((x) => x.slug === "discount-superior-abidos-fusion")!;
    expect(r.goldPerBc!).toBeCloseTo(456, 1);
    expect(r.goldPerRc).toBeNull();
    expect(r.vsExchange!).toBeCloseTo(((456 - 30000 / 95) / (30000 / 95)) * 100, 1);
    expect(r.vsG2G).toBeNull();
  });

  it("orders retired packs most-recently-retired first, then gold/RC desc", () => {
    const retired = rows.filter((r) => r.retired);
    // Newest retirement leads the section (the 2026-08-12 cohort); within that shared date
    // the higher frozen gold/RC wins (Paradise-2 360.5 over Summer Growth I 349.8).
    expect(retired[0].slug).toBe("monthly-paradise-special-pack-2");
    expect(retired[1].slug).toBe("summer-growth-support-pack-i");
    // retiredOn is non-increasing across the whole retired group.
    const dates = retired.map((r) => r.retiredOn ?? "");
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    // Within a shared retirement date, higher gold/RC wins (the 2026-06-10 cohort).
    const sameDay = retired.filter((r) => r.retiredOn === "2026-06-10").map((r) => r.goldPerRc ?? 0);
    expect(sameDay).toEqual([...sameDay].sort((a, b) => b - a));
  });

  it("vsExchange sign tracks gold/RC vs the 126.05 baseline", () => {
    const horizon = rows.find((r) => r.slug === "horizon-growth-support-pack-i")!;
    const t4 = rows.find((r) => r.slug === "monthly-t4-growth-support")!;
    expect(horizon.vsExchange!).toBeGreaterThan(0); // frozen 265.0 >> 126.05
    expect(t4.vsExchange!).toBeLessThan(0);          // 45.5 < 126.05
  });
});
