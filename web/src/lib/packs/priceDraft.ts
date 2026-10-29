// The click-to-edit price rule shared by every unit-price cell (PriceEdit.svelte): what the editor
// opens with, and what committing it does to the slug's override.

import { readValueInput, type InputAction } from "../valuesBar";

/**
 * The editor's starting text: the unit price as the cell shows it from 100 up (whole gold, like
 * formatGold), with at most 4 decimals below that, or empty when unpriced. Whole numbers keep a
 * BC-costed price such as 87,684.2105 readable in a narrow editor.
 */
export function draftFor(value: number | null): string {
  if (value == null) return "";
  return value >= 100 ? String(Math.round(value)) : String(Number(value.toFixed(4)));
}

/**
 * What committing the editor does, by the Your values boxes' rule (readValueInput): an emptied box
 * clears the override, so the price goes back to its market or default value; a number of 0 or more
 * sets it (a typed -0 as 0); a half-typed or negative entry keeps it. The value the editor opened
 * with also keeps it, so opening a price and clicking away never creates a "custom" override.
 * `raw` is the input's text and `badInput` its validity flag ("1e" reads as empty text).
 */
export function commitDraft(raw: string, original: string, badInput = false): InputAction {
  const a = readValueInput(raw, badInput);
  if (a.kind !== "set") return a;
  if (a.value === parseFloat(original)) return { kind: "keep" };
  return { kind: "set", value: a.value === 0 ? 0 : a.value };
}
