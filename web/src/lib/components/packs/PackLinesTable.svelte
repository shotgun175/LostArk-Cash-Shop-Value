<script lang="ts">
  import type { PackLine } from "$lib/packs/packValue";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import { app } from "$lib/app.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { F4_DERIVED_SLUGS, COMPUTED_PRICE_NOTES } from "$lib/packs/priceMap";
  import type { DetailOption } from "$lib/packs/packDetail";
  import ItemIcon from "../ItemIcon.svelte";

  // A pack's material table (moved out of PackCard unchanged so the Bonus Room can show the same
  // table for its products and bonus packs): click-to-edit market prices, trade-up toggles,
  // selection alts, and read-only F4-derived and computed prices.
  let { lines, tradeUpInfo = {}, alts = {} }: {
    lines: PackLine[];
    tradeUpInfo?: Record<string, { ratio: number; deltaPct: number }>;
    alts?: Record<string, DetailOption[]>;
  } = $props();

  let expanded = $state<string | null>(null); // material slug whose selection alts are shown

  function perUnit(gold: number, qty: number): string {
    return gold > 0 && qty > 0 ? formatGold(gold / qty) : "—";
  }

  // Click-to-edit market price → a per-unit override for that slug (applies everywhere it appears).
  let editing = $state<string | null>(null);
  let draft = $state("");
  let original = $state(""); // value shown when the editor opened; used to ignore no-op edits

  function startEdit(line: PackLine): void {
    editing = line.slug;
    draft = line.gold > 0 && line.qty > 0 ? String(Number((line.gold / line.qty).toFixed(4))) : "";
    original = draft;
  }
  function commit(slug: string): void {
    const v = parseFloat(draft);
    editing = null;
    if (!Number.isFinite(v) || v < 0) return;
    // Opening a price and clicking away without changing it must not create a "custom" override.
    if (v === parseFloat(original)) return;
    overrides.set(app.region, slug, v);
  }
  function focusSelect(el: HTMLInputElement): void {
    el.focus();
    el.select();
  }
</script>

<div class="tscroll">
<table>
  <thead>
    <tr><th class="ic-col" aria-label="icon"></th><th>Material</th><th class="right">Total qty</th><th class="right">Market price</th><th class="right">Gold</th></tr>
  </thead>
  <tbody>
    {#each lines as line (line.slug)}
      <tr>
        <td class="ic-col"><ItemIcon slug={line.slug} /></td>
        <td>{displayName(line.slug)}{#if line.isBound}<span class="bound"> (Bound)</span>{/if}{#if tradeUpInfo[line.slug]} <button class="tradeup" class:on={tradeUp.has(line.slug)} title="Value as a {tradeUpInfo[line.slug].ratio}:1 trade-up to the next tier" onclick={() => tradeUp.toggle(line.slug)}>{tradeUpInfo[line.slug].ratio}:1 → <span class:good={tradeUpInfo[line.slug].deltaPct >= 0} class:bad={tradeUpInfo[line.slug].deltaPct < 0}>{formatSignedPct(tradeUpInfo[line.slug].deltaPct)}</span></button>{/if}{#if alts[line.slug]} <button class="alts-btn" onclick={() => (expanded = expanded === line.slug ? null : line.slug)}>{expanded === line.slug ? "hide alts" : "show alts"}</button>{/if}</td>
        <td class="right num">{line.qty.toLocaleString("en-US")}</td>
        <td class="right price">
          {#if F4_DERIVED_SLUGS.has(line.slug)}
            <!-- F4-derived currency: the exchange input is the single source of truth, so no
                 edit affordance (an override would be silently out-layered anyway). -->
            <span class="num price-ro" title="Priced from the F4 exchange input (gold / 95). Change the exchange input to change it.">{perUnit(line.gold, line.qty)}</span>
          {:else if COMPUTED_PRICE_NOTES.has(line.slug)}
            <!-- Computed by buildPriceMap (key / cube EV, relic recipe): read-only for the same reason. -->
            <span class="num price-ro" title={COMPUTED_PRICE_NOTES.get(line.slug)}>{perUnit(line.gold, line.qty)}</span>
          {:else if editing === line.slug}
            <input
              class="edit num" type="number" min="0" step="0.01" bind:value={draft}
              use:focusSelect
              onblur={() => commit(line.slug)}
              onkeydown={(e) => { if (e.key === "Enter") commit(line.slug); else if (e.key === "Escape") editing = null; }}
              aria-label="Edit market price for {displayName(line.slug)}" />
          {:else}
            <button class="price-btn num" class:edited={overrides.has(app.region, line.slug)}
              title="Click to enter your own AH price" onclick={() => startEdit(line)}>
              {perUnit(line.gold, line.qty)}
            </button>
          {/if}
        </td>
        <td class="right num accent">{line.gold > 0 ? formatGold(line.gold) : "—"}</td>
      </tr>
      {#if expanded === line.slug && alts[line.slug]}
        {#each alts[line.slug].filter((o) => !o.chosen) as alt (alt.slug)}
          <tr class="alt">
            <td class="ic-col"><ItemIcon slug={alt.slug} /></td>
            <td class="altname">↳ {displayName(alt.slug)}{#if alt.isBound}<span class="bound"> (Bound)</span>{/if}</td>
            <td class="right num">{alt.totalQty.toLocaleString("en-US")}</td>
            <td class="right num muted">{alt.perUnit > 0 ? formatGold(alt.perUnit) : "—"}</td>
            <td class="right num">{alt.lineGold > 0 ? formatGold(alt.lineGold) : "—"}</td>
          </tr>
        {/each}
      {/if}
    {/each}
  </tbody>
</table>
</div>

<style>
  /* Content palette (--panel/--border/--accent/...) is provided by the parent tab (PacksPanel, BonusRoom). */
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: 0; }
  table { width: 100%; min-width: 360px; border-collapse: collapse; }
  th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
  th { color: var(--muted); font-weight: 600; }
  th.right, td.right { text-align: right; }
  td.accent { color: var(--accent); }
  tr:hover td { background: var(--panel-2); }
  .ic-col { width: 30px; }
  .bound { color: var(--muted); font-size: 12px; }
  .tradeup { display: inline-flex; align-items: center; background: var(--panel-2); border: 1px solid var(--border);
    color: var(--muted); border-radius: 999px; padding: 1px 7px; font-size: 11px; cursor: pointer;
    margin-left: 5px; vertical-align: middle; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .tradeup:hover { color: var(--text); border-color: var(--muted); }
  .tradeup.on { background: rgba(255, 209, 102, 0.15); border-color: var(--accent); color: var(--accent); }
  /* Flex collapses the literal space, so the arrow and the % touch: add explicit room. */
  .tradeup span { margin-left: 4px; }
  .alts-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 999px;
    padding: 1px 8px; font-size: 11px; cursor: pointer; margin-left: 5px; vertical-align: middle; white-space: nowrap; }
  .alts-btn:hover { color: var(--accent); border-color: var(--accent); }
  tr.alt td { background: rgba(255, 255, 255, .02); padding-top: 4px; padding-bottom: 4px; }
  .altname { color: var(--muted); font-size: 12.5px; }
  td.price { white-space: nowrap; }
  .price-ro { color: var(--muted); font-size: 14px; cursor: help; }
  .price-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted); font-size: 14px; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
</style>
