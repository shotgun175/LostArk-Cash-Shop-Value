<script lang="ts">
  import type { PackLine } from "$lib/packs/packValue";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import type { DetailOption } from "$lib/packs/packDetail";
  import ItemIcon from "../ItemIcon.svelte";
  import PriceEdit from "./PriceEdit.svelte";

  // A pack's material table (moved out of PackCard unchanged so the Bonus Room can show the same
  // table for its products and bonus packs): click-to-edit market prices (PriceEdit, which keeps
  // F4-derived and computed prices read-only), trade-up toggles and selection alts.
  let { lines, tradeUpInfo = {}, alts = {} }: {
    lines: PackLine[];
    tradeUpInfo?: Record<string, { ratio: number; deltaPct: number }>;
    alts?: Record<string, DetailOption[]>;
  } = $props();

  let expanded = $state<string | null>(null); // material slug whose selection alts are shown
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
        <td class="right price"><PriceEdit slug={line.slug} value={line.gold > 0 && line.qty > 0 ? line.gold / line.qty : null} /></td>
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
</style>
