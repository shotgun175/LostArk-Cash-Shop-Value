import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { app } from "../src/lib/app.svelte";
import { valuesBar } from "../src/lib/valuesBarState.svelte";

// The "Your values" popover state (valuesBarState.svelte.ts): one popover at a time, opened by a
// chip on one page in one region. The component renders from `openFor(path)`; +layout.svelte
// calls `sync` on every route or region change.

beforeEach(() => {
  app.region = "nae";
  valuesBar.close();
});

afterEach(() => {
  app.region = "nae";
  valuesBar.close();
});

describe("valuesBar popover state", () => {
  it("starts closed", () => {
    expect(valuesBar.openFor("/")).toBeNull();
  });

  it("opens one popover at a time, and another chip switches to it", () => {
    valuesBar.open("exchange", "/");
    expect(valuesBar.openFor("/")).toBe("exchange");
    valuesBar.open("gem", "/");
    expect(valuesBar.openFor("/")).toBe("gem");
    valuesBar.close();
    expect(valuesBar.openFor("/")).toBeNull();
  });

  it("toggle opens a closed chip, switches from another, and closes the open one", () => {
    valuesBar.toggle("gem", "/");
    expect(valuesBar.openFor("/")).toBe("gem");
    valuesBar.toggle("pheons", "/");
    expect(valuesBar.openFor("/")).toBe("pheons");
    valuesBar.toggle("pheons", "/");
    expect(valuesBar.openFor("/")).toBeNull();
  });

  it("belongs to the page it was opened on", () => {
    valuesBar.open("exchange", "/");
    expect(valuesBar.openFor("/maris")).toBeNull();
    // A chip on the new page opens rather than closes, even for the same value.
    valuesBar.toggle("exchange", "/maris");
    expect(valuesBar.openFor("/maris")).toBe("exchange");
    expect(valuesBar.openFor("/")).toBeNull();
  });

  it("closes on a route change for good, so going back does not reopen it", () => {
    valuesBar.open("gem", "/");
    valuesBar.sync("/", "nae"); // same page and region: stays open
    expect(valuesBar.openFor("/")).toBe("gem");
    valuesBar.sync("/maris", "nae");
    expect(valuesBar.at).toBeNull();
    valuesBar.sync("/", "nae");
    expect(valuesBar.openFor("/")).toBeNull();
  });

  it("closes on a region change for good", () => {
    valuesBar.open("exchange", "/maris");
    app.region = "euc";
    expect(valuesBar.openFor("/maris")).toBeNull(); // hidden at once
    valuesBar.sync("/maris", "euc");
    expect(valuesBar.at).toBeNull();
    app.region = "nae";
    valuesBar.sync("/maris", "nae");
    expect(valuesBar.openFor("/maris")).toBeNull();
  });
});
