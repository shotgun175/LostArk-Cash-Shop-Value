import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import FreshnessBanner from "../src/lib/components/FreshnessBanner.svelte";
import { app } from "../src/lib/app.svelte";
import type { PricePayload } from "../src/lib/api";

// Seed the app singleton with a snapshot whose source_valid_at is `ageMinutes` behind wall-clock
// now, so the banner's freshness() lands deterministically on the fresh or stale side of the
// 90-min line. Kept relative to Date.now() so the fixture never rots as time passes.
function seed(ageMinutes: number): void {
  const src = new Date(Date.now() - ageMinutes * 60_000).toISOString();
  const payload: PricePayload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { source_valid_at: src, prices: { grudge: 100 } } },
    bundles: {},
  };
  app.region = "nae";
  app.payload = payload;
}

const staleClass = /class="[^"]*\bstale\b[^"]*"/;

describe("FreshnessBanner", () => {
  it("shows only the plain label within the 90-min window (no warning)", () => {
    seed(10); // 10 min old -> comfortably fresh
    const { body } = render(FreshnessBanner);
    expect(body).toContain("prices as of");
    expect(body).not.toContain("may be outdated");
    expect(body).not.toMatch(staleClass);
  });

  it("renders the amber stale warning past the 90-min threshold", () => {
    seed(120); // 2h old -> past STALE_MS
    const { body } = render(FreshnessBanner);
    expect(body).toMatch(staleClass); // class:stale -> the amber styling hook
    expect(body).toContain("prices may be outdated");
    expect(body).not.toContain("prices as of"); // the stale branch replaces the plain label
  });
});
