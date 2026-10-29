<script lang="ts">
  import { tick } from "svelte";
  import { app } from "$lib/app.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { F4_DERIVED_SLUGS, COMPUTED_PRICE_NOTES } from "$lib/packs/priceMap";
  import { draftFor, commitDraft } from "$lib/packs/priceDraft";
  import { displayName } from "$lib/catalog";
  import { formatGold } from "$lib/format";

  // One unit-price cell with click-to-edit: a per-unit override for the slug, saved per region and
  // applied everywhere the slug appears. Shared by PackLinesTable (Packs, Bonus Room), the pack
  // drill-down and the Jump-Up tab. F4-derived and computed prices render read-only (buildPriceMap
  // would out-layer an override), as does anything the caller passes readOnly.
  let {
    slug,
    value,
    readOnly = false,
    readOnlyTitle = "",
    emptyText = "—",
    title = "Click to enter your own AH price",
    editLabel = "Edit market price for",
  }: {
    slug: string;
    value: number | null; // the unit price shown; null = unpriced
    readOnly?: boolean;
    readOnlyTitle?: string;
    emptyText?: string; // what an unpriced, editable cell reads
    title?: string;
    editLabel?: string; // the input's aria-label, before the item name
  } = $props();

  const shown = $derived(value == null ? "—" : formatGold(value));
  // The button's accessible name starts with its visible text and adds the item, since a column of
  // bare numbers or repeated "set price" buttons is otherwise indistinguishable to a screen reader.
  const name = $derived(`${value == null ? (emptyText === "—" ? "unpriced" : emptyText) : shown}, ${displayName(slug)}`);

  let editing = $state(false);
  let original = $state("");
  let btn = $state<HTMLButtonElement>();
  let input = $state<HTMLInputElement>();

  function start(): void {
    original = draftFor(value);
    editing = true;
  }
  // Enter and blur commit, Escape cancels. Committing reads the box's own text (commitDraft): an
  // emptied box removes the user's price, back to the market or default value. Enter and Escape
  // hand focus back to the price while its row is still there (a save that changes which option a
  // selection chest counts replaces the row, and focus then falls back to the page). The editing
  // guard turns a second call into a no-op: Chromium fires blur when the input is removed, which
  // used to make Escape save.
  function finish(save: boolean, refocus: boolean): void {
    if (!editing) return;
    editing = false;
    if (save && input) {
      const a = commitDraft(input.value, original, input.validity.badInput);
      if (a.kind === "clear") overrides.clear(app.region, slug);
      else if (a.kind === "set") overrides.set(app.region, slug, a.value);
    }
    if (refocus) void tick().then(() => btn?.focus());
  }
  function focusSelect(el: HTMLInputElement): void {
    el.focus();
    el.select();
  }
</script>

{#if F4_DERIVED_SLUGS.has(slug)}
  <span class="num price-ro" title="Priced from the F4 exchange input (gold / 95). Change the exchange input to change it.">{shown}</span>
{:else if COMPUTED_PRICE_NOTES.has(slug)}
  <span class="num price-ro" title={COMPUTED_PRICE_NOTES.get(slug)}>{shown}</span>
{:else if readOnly}
  <span class="num price-ro" title={readOnlyTitle || undefined}>{shown}</span>
{:else if editing}
  <input
    class="edit num" type="number" min="0" step="0.01" value={original} bind:this={input}
    use:focusSelect
    onblur={() => finish(true, false)}
    onkeydown={(e) => {
      // preventDefault keeps the key's keypress off the price button that takes focus back, which
      // would otherwise reopen the editor.
      if (e.key === "Enter") { e.preventDefault(); finish(true, true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false, true); }
    }}
    aria-label="{editLabel} {displayName(slug)}" />
{:else}
  <button bind:this={btn} class="price-btn num" class:edited={overrides.has(app.region, slug)} {title} aria-label={name} onclick={start}>{value == null ? emptyText : shown}</button>
{/if}

<style>
  /* Content palette (--muted/--text/--accent/--panel-2) comes from the parent tab. Sizes inherit the
     table cell's font size, so each table keeps its own. */
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .price-ro { color: var(--muted); font-size: inherit; cursor: help; }
  /* The vertical padding makes the row's full height the tap target and the negative margin keeps
     the layout exactly as it was. The side padding stays within the narrowest cell padding (3 px),
     so the button and its focus ring stay inside the cell. */
  .price-btn { background: none; border: 0; padding: 6px 3px; margin: -6px -3px; cursor: pointer;
    color: var(--muted); font-size: inherit; }
  .price-btn:focus-visible { outline-offset: 0; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
  /* Hide the number-input spinners so the value uses the full width and never clips (as in the
     Your values bar). */
  .edit[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  .edit[type="number"]::-webkit-outer-spin-button,
  .edit[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
</style>
