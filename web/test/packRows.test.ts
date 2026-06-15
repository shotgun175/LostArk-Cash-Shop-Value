import { describe, it, expect } from "vitest";
import { buildPackRows } from "../src/lib/packs/packRows";
import { F4_DEFAULT_INPUT, G2G_DEFAULT_INPUT } from "../src/lib/packs/exchange";
import fixture from "./fixtures/tjw-nae-prices.json";

const prices = fixture.prices as Record<string, number>;
const opts = { f4Input: F4_DEFAULT_INPUT, g2gInput: G2G_DEFAULT_INPUT };

describe("buildPackRows", () => {
  const rows = buildPackRows(prices, opts);

  it("returns one row per pack with all display columns", () => {
    expect(rows.length).toBe(12);
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

  it("vsExchange sign tracks gold/RC vs the 80.67 baseline", () => {
    const horizon = rows.find((r) => r.slug === "horizon-growth-support-pack-i")!;
    const t4 = rows.find((r) => r.slug === "monthly-t4-growth-support")!;
    expect(horizon.vsExchange!).toBeGreaterThan(0); // 289.5 >> 80.67
    expect(t4.vsExchange!).toBeLessThan(0);          // 45.5 < 80.67
  });
});
