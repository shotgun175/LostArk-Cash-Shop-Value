// The click-to-edit price rule shared by every unit-price cell (PriceEdit.svelte): what the editor
// opens with, and which committed entries become an override.

/** The editor's starting text: the shown unit price (at most 4 decimals), or empty when unpriced. */
export function draftFor(value: number | null): string {
  return value == null ? "" : String(Number(value.toFixed(4)));
}

/**
 * The override a committed entry sets, or null when nothing should change: an empty, unreadable or
 * negative entry, or the value the editor opened with (opening a price and clicking away must not
 * create a "custom" override). `draft` is whatever the number input's binding holds, which is a
 * number once the user types.
 */
export function parseDraft(draft: unknown, original: string): number | null {
  const v = typeof draft === "number" ? draft : parseFloat(String(draft ?? ""));
  if (!Number.isFinite(v) || v < 0) return null;
  if (v === parseFloat(original)) return null;
  return v;
}
