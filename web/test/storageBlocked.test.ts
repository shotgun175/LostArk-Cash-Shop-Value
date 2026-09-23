import { describe, it, expect, beforeAll, vi } from "vitest";

// Blocked site storage (Chrome/Edge "sites can't save data", Firefox or Brave "block all
// cookies"): reading window.localStorage itself throws a SecurityError. Every tab must still
// load; only the saved inputs are lost. Kept in its own file so the throwing getter cannot leak
// into other suites (Vitest isolates per file). Each case resets modules and imports fresh, so
// every store constructor runs under the blocked getter; svelte/server is re-imported with them
// so the renderer and the component share one Svelte runtime.
function blockStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  });
}

async function seededApp() {
  const { app } = await import("../src/lib/app.svelte");
  const fixture = (await import("./fixtures/tjw-nae-prices.json")).default;
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
  return app;
}

describe("every route renders with site storage blocked", () => {
  beforeAll(blockStorage);

  it.each([
    ["Home", () => import("../src/routes/+page.svelte")],
    ["Ark Pass", () => import("../src/routes/ark-pass/+page.svelte")],
    ["Hell Key", () => import("../src/routes/hell-key/+page.svelte")],
    ["Jump-Up", () => import("../src/routes/jump-up/+page.svelte")],
    ["Mari's Shop", () => import("../src/routes/maris/+page.svelte")],
    ["Prices", () => import("../src/routes/prices/+page.svelte")],
  ])("%s", async (_name, loadPage) => {
    vi.resetModules();
    await seededApp();
    const Page = (await loadPage()).default;
    const { render } = await import("svelte/server");
    expect(render(Page).body.trim()).not.toBe("");
  });

  it("pack drill-down", async () => {
    vi.resetModules();
    await seededApp();
    const { PACKS } = await import("../src/lib/packs/data/packs");
    const PackPage = (await import("../src/routes/pack/[slug]/+page.svelte")).default;
    const { render } = await import("svelte/server");
    expect(render(PackPage, { props: { data: { pack: PACKS[0] } } }).body).toContain("Total gold");
  });
});

describe("stores with site storage unavailable", () => {
  it("f4 falls back to the default input when storage is blocked", async () => {
    blockStorage();
    vi.resetModules();
    const { f4 } = await import("../src/lib/packs/f4.svelte");
    expect(f4.value).toBe(30000);
  });

  it("a throwing setItem (quota full) still updates overrides in memory", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        },
        removeItem: () => {},
      },
    });
    vi.resetModules();
    const { overrides } = await import("../src/lib/packs/overrides.svelte");
    overrides.set("nae", "abidos-fusion-material", 123);
    expect(overrides.forRegion("nae")).toEqual({ "abidos-fusion-material": 123 });
  });
});
