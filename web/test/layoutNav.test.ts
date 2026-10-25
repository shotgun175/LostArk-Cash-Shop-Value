import { describe, it, expect, vi, afterAll } from "vitest";
import { render } from "svelte/server";
import { createRawSnippet } from "svelte";
import Layout from "../src/routes/+layout.svelte";
import { app } from "../src/lib/app.svelte";

// The tab bar is server-rendered here with the page store stubbed (outside a SvelteKit request
// there is no current page; the nav only reads its pathname to highlight the active tab).
vi.mock("$app/state", () => ({ page: { url: new URL("http://localhost/") } }));

const children = createRawSnippet(() => ({ render: () => "<p>page</p>" }));
const savedNow = app.now;

function navLabels(): string[] {
  const nav = render(Layout, { props: { children } }).body.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  return [...nav.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
}

afterAll(() => {
  app.now = savedNow;
});

describe("layout nav", () => {
  it("shows the Bonus Room tab after Mari's Shop while the room runs", () => {
    app.now = Date.parse("2026-10-25T12:00:00Z");
    expect(navLabels()).toEqual([
      "Packs",
      "Mari's Shop",
      "Bonus Room",
      "Ark Pass",
      "Jump-Up Boost",
      "Hell Key math",
      "Prices",
    ]);
  });

  it("hides the Bonus Room tab once the room has ended", () => {
    app.now = Date.parse("2026-11-19T00:00:00Z");
    expect(navLabels()).toEqual(["Packs", "Mari's Shop", "Ark Pass", "Jump-Up Boost", "Hell Key math", "Prices"]);
  });
});
