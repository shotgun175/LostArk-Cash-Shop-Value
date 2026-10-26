import { app } from "./app.svelte";
import { overrides } from "./packs/overrides.svelte";
import { load, save } from "./storage";
import { readValueInput } from "./valuesBar";

// The "Your values" bar's own state: whether it is expanded, remembered per viewer
// (csv.valuesBar.open, "1" open / "0" closed, default closed), and the one write path its price
// boxes use. The values themselves live in their own stores (f4, g2g, overrides, hellSettings),
// unchanged, so nothing here needs a migration.
const OPEN_KEY = "csv.valuesBar.open";

class ValuesBarState {
  open = $state<boolean>(load(OPEN_KEY) === "1");

  /** Expands (true) or collapses (false) the bar and remembers the choice. */
  setOpen(on: boolean): void {
    this.open = on;
    save(OPEN_KEY, on ? "1" : "0");
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
}

export const valuesBar = new ValuesBarState();
