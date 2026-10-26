import { app } from "./app.svelte";
import type { Region } from "./api";
import { overrides } from "./packs/overrides.svelte";
import { f4 } from "./packs/f4.svelte";
import { readValueInput, type ValueKey } from "./valuesBar";

// The "Your values" bar's own state: which chip's popover is open (one at a time, never
// remembered across page loads), and the write paths its boxes use. The values themselves live in
// their own stores (f4, g2g, overrides, hellSettings), unchanged, so nothing here needs a
// migration. A popover belongs to the page and region it was opened on: `openFor` reads null once
// either changes, and `sync` (called by +layout.svelte on every route or region change) clears it
// for good, so coming back never reopens it.

/** Where a popover was opened: its value, the route path and the region. */
interface OpenAt {
  key: ValueKey;
  path: string;
  region: Region;
}

class ValuesBarState {
  at = $state<OpenAt | null>(null);

  /** The open popover's value on `path` in the current region, or null when none is open there. */
  openFor(path: string): ValueKey | null {
    const a = this.at;
    return a !== null && a.path === path && a.region === app.region ? a.key : null;
  }

  /** Opens `key`'s popover on `path`, closing any other. */
  open(key: ValueKey, path: string): void {
    this.at = { key, path, region: app.region };
  }

  /** Closes the open popover, if any. */
  close(): void {
    this.at = null;
  }

  /** A chip click: closes `key`'s popover when it is the one open on `path`, else opens it. */
  toggle(key: ValueKey, path: string): void {
    if (this.openFor(path) === key) this.close();
    else this.open(key, path);
  }

  /** Closes the popover when the route path or the region is no longer the one it opened on. */
  sync(path: string, region: Region): void {
    const a = this.at;
    if (a !== null && (a.path !== path || a.region !== region)) this.at = null;
  }

  /**
   * Applies a typed price box to this region's override for `slug`: an empty box clears it, a
   * number of 0 or more sets it, and a half-typed or negative entry leaves it as it was. Called
   * only from an input event, so loading a page never writes an override.
   */
  writeOverride(slug: string, raw: string, badInput = false): void {
    const a = readValueInput(raw, badInput);
    if (a.kind === "clear") overrides.clear(app.region, slug);
    else if (a.kind === "set") overrides.set(app.region, slug, a.value);
  }

  /**
   * Applies the typed F4 exchange box to this region: an empty box returns it to the seed and
   * removes the saved value, a number of 0 or more saves it (0 means no exchange rate), and a
   * half-typed or negative entry leaves it as it was. Called only from an input event.
   */
  writeF4(raw: string, badInput = false): void {
    const a = readValueInput(raw, badInput);
    if (a.kind === "clear") f4.reset(app.region);
    else if (a.kind === "set") f4.value = a.value;
  }
}

export const valuesBar = new ValuesBarState();
