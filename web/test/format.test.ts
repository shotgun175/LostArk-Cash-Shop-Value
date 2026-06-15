import { describe, it, expect } from "vitest";
import { formatGold, freshness } from "../src/lib/format";

describe("formatGold", () => {
  it("groups thousands", () => {
    expect(formatGold(106999)).toBe("106,999");
    expect(formatGold(12)).toBe("12");
  });
});

describe("freshness", () => {
  const now = new Date("2026-06-15T06:30:00.000Z").getTime();
  it("reports fresh within the normal-lag window (40 min old)", () => {
    const f = freshness("2026-06-15T06:25:00.000Z", "2026-06-15T05:50:00.000Z", now);
    expect(f.stale).toBe(false);
    expect(f.label).toContain("05:50");
  });
  it("flags stale only when far behind (past 90 min)", () => {
    const f = freshness("2026-06-15T06:25:00.000Z", "2026-06-15T04:00:00.000Z", now);
    expect(f.stale).toBe(true);
  });
});
