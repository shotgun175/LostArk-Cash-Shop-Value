import { describe, it, expect } from "vitest";
import {
  f4Baseline, vsExchangePct, g2gGoldPerDollar, g2gReadout, vsG2GPct,
  currencySymbol, F4_DEFAULT_INPUT, G2G_DEFAULT_INPUT,
} from "../src/lib/packs/exchange";

describe("F4 exchange", () => {
  it("baseline = input / 238 (default 19200 -> 80.67)", () => {
    expect(f4Baseline(F4_DEFAULT_INPUT)).toBeCloseTo(19200 / 238, 6);
  });
  it("% vs exchange is the relative gap of gold/RC vs baseline", () => {
    const base = f4Baseline(19200); // 80.672...
    expect(vsExchangePct(289.5, base)!).toBeCloseTo((289.5 - base) / base * 100, 4);
    expect(vsExchangePct(45.5, base)!).toBeLessThan(0); // below exchange
  });
  it("returns null when baseline is unusable", () => {
    expect(vsExchangePct(100, 0)).toBeNull();
    expect(vsExchangePct(100, null as unknown as number)).toBeNull();
  });
});

describe("G2G basis", () => {
  it("gold-per-dollar = 1000 / pricePer1k", () => {
    expect(g2gGoldPerDollar(G2G_DEFAULT_INPUT)!).toBeCloseTo(1000 / 0.03268824, 4);
  });
  it("readout = sym + (price*100).toFixed(2) per 100k", () => {
    expect(g2gReadout(0.03268824, "$")).toBe("$3.27");
    expect(g2gReadout(0.03268824, "€")).toBe("€3.27");
  });
  it("% vs G2G is the relative gap of pack gold/$ vs G2G gold/$", () => {
    const gpd = g2gGoldPerDollar(0.03268824)!;
    expect(vsG2GPct(gpd, gpd)!).toBeCloseTo(0, 6);
    expect(vsG2GPct(5460, gpd)!).toBeLessThan(0); // pack worse than RMT gold
  });
  it("guards zero/negative input", () => {
    expect(g2gGoldPerDollar(0)).toBeNull();
    expect(vsG2GPct(5000, null)).toBeNull();
  });
  it("symbol is region-driven", () => {
    expect(currencySymbol("nae")).toBe("$");
    expect(currencySymbol("euc")).toBe("€");
  });
});
