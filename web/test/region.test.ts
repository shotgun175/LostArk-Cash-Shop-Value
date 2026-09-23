import { describe, it, expect, afterEach, vi } from "vitest";

// The NA/EU choice is remembered as csv.region. Each case installs a storage stub, then imports
// the app singleton fresh so its initializer reads that stub.
async function appWith(stored: string | null) {
  vi.stubGlobal("localStorage", { getItem: (k: string) => (k === "csv.region" ? stored : null) });
  vi.resetModules();
  return (await import("../src/lib/app.svelte")).app;
}

describe("remembered region", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens in EU when EU was the last pick", async () => {
    expect((await appWith("euc")).region).toBe("euc");
  });

  it("opens in NA when NA was the last pick", async () => {
    expect((await appWith("nae")).region).toBe("nae");
  });

  it("falls back to NA for a garbage or missing value", async () => {
    expect((await appWith("EU")).region).toBe("nae");
    expect((await appWith(null)).region).toBe("nae");
  });
});
