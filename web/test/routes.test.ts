import { describe, it, expect, beforeAll } from "vitest";
import { render } from "svelte/server";
import Home from "../src/routes/+page.svelte";
import ArkPassPage from "../src/routes/ark-pass/+page.svelte";
import HellKeyPage from "../src/routes/hell-key/+page.svelte";
import JumpUpPage from "../src/routes/jump-up/+page.svelte";
import MarisPage from "../src/routes/maris/+page.svelte";
import PricesPage from "../src/routes/prices/+page.svelte";
import PackPage from "../src/routes/pack/[slug]/+page.svelte";
import { app } from "../src/lib/app.svelte";
import { PACKS } from "../src/lib/packs/data/packs";
import fixture from "./fixtures/tjw-nae-prices.json";

// Route smoke: every tab page and every pack drill-down renders against the fixture without
// throwing. The Pages build never renders (ssr = false), so a data edit that breaks a route would
// otherwise ship green. Scope: first render only; no $effect/onMount, CSS layout, image bytes or
// base path.
beforeAll(() => {
  app.region = "nae";
  app.status = "ok";
  app.payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    regions: { nae: { prices: fixture.prices, source_valid_at: new Date().toISOString() } },
    bundles: {},
  } as unknown as typeof app.payload;
});

describe("tab routes render", () => {
  it.each([
    ["Home", Home],
    ["Ark Pass", ArkPassPage],
    ["Hell Key", HellKeyPage],
    ["Jump-Up", JumpUpPage],
    ["Mari's Shop", MarisPage],
    ["Prices", PricesPage],
  ])("%s", (_name, Page) => {
    expect(render(Page).body.trim()).not.toBe("");
  });
});

describe("pack drill-downs render", () => {
  it.each(PACKS.map((pack) => [pack.slug, pack] as const))("%s", (_slug, pack) => {
    expect(render(PackPage, { props: { data: { pack } } }).body).toContain("Total gold");
  });
});
