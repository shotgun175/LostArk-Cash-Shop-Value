import { describe, it, expect } from "vitest";
import { render } from "svelte/server";
import PacksPanel from "../src/lib/components/packs/PacksPanel.svelte";
import { app } from "../src/lib/app.svelte";

// The cold-start guard: a fresh visitor whose payload has no regions yet (worker KV still cold, or
// a T8-style degraded fetch) must see the honest empty state, not a grid of 0-gold packs read off
// baked constants with status "ok".
describe("PacksPanel cold start", () => {
  it("shows the empty state when the payload has no region snapshot yet", () => {
    app.region = "nae";
    app.status = "ok";
    app.payload = { schema_version: 1, generated_at: new Date().toISOString(), regions: {}, bundles: {} };
    const { body } = render(PacksPanel);
    expect(body).toContain("No prices yet");
    expect(body).not.toContain("pack-grid"); // and no pack cards rendered alongside it
  });
});
