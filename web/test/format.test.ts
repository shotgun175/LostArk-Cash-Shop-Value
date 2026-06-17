import { describe, it, expect } from "vitest";
import { formatGold, freshness, formatSignedPct, formatMoney } from "../src/lib/format";

describe("formatGold", () => {
  it("groups thousands", () => {
    expect(formatGold(106999)).toBe("106,999");
    expect(formatGold(12)).toBe("12");
  });
  it("keeps precision for small per-unit prices", () => {
    expect(formatGold(1.45)).toBe("1.5");
    expect(formatGold(0.265)).toBe("0.27");
    expect(formatGold(2)).toBe("2");
    expect(formatGold(0.001)).toBe("<0.01");
  });
});

describe("freshness", () => {
  const now = new Date("2026-06-15T06:30:00.000Z").getTime();
  it("reports fresh within the normal-lag window (40 min old), in local time", () => {
    const f = freshness("2026-06-15T06:25:00.000Z", "2026-06-15T05:50:00.000Z", now);
    expect(f.stale).toBe(false);
    const localTime = new Date("2026-06-15T05:50:00.000Z").toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
    expect(f.label).toBe(`prices as of ${localTime}`);
  });
  it("flags stale only when far behind (past 90 min)", () => {
    const f = freshness("2026-06-15T06:25:00.000Z", "2026-06-15T04:00:00.000Z", now);
    expect(f.stale).toBe(true);
  });
});

describe("formatSignedPct / formatMoney", () => {
  it("formatSignedPct adds an explicit + for non-negative", () => {
    expect(formatSignedPct(258.4)).toBe("+258%");
    expect(formatSignedPct(-43.6)).toBe("-44%");
    expect(formatSignedPct(0)).toBe("+0%");
    expect(formatSignedPct(null)).toBe("—");
  });
  it("formatMoney prefixes symbol with 2dp", () => {
    expect(formatMoney(3.27, "$")).toBe("$3.27");
    expect(formatMoney(1234.5, "€")).toBe("€1,234.50");
  });
});
