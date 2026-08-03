<script lang="ts">
  import type { FloorBreakdown } from "$lib/packs/ev";
  import { WEALTH_BASE_MULT } from "$lib/packs/data/hellRewards";
  import { formatGold } from "$lib/format";

  // The in-game picker for one floor: every chest worth positive gold, best first. The card's
  // EV uses a best-of-3 average over all draws; this table answers the question you actually
  // face when the three chests are already on screen, which one do you take.
  // Palette vars (--panel-2/--border/--muted/--accent) are inherited from the Hell Key panel.
  let { floor, wealth }: { floor: FloorBreakdown; wealth: boolean } = $props();

  // Wealth +1 multiplies the base rewards only, and Netherworld tiers carry no base at all
  // (base 0), so the chip appears only where the buff actually moves a number.
  const showWealth = $derived(wealth && floor.baseWealth !== floor.base);
  const shownBase = $derived(showWealth ? floor.baseWealth : floor.base);
</script>

<div class="tscroll">
  <table>
    <thead>
      <tr>
        <th>Chest</th>
        <th class="right">Qty</th>
        <th class="right">Chest gold</th>
        <th class="right">+ Base</th>
        <th class="right">Effective</th>
      </tr>
    </thead>
    <tbody>
      {#each floor.candidates as c, i (c.column)}
        <tr class:best={i === 0}>
          <td>
            <span class="name">
              {#if i === 0}<span class="crown" title="Best pick">👑</span>{/if}{c.column}
            </span>
            {#if c.note}<span class="cnote">{c.note}</span>{/if}
          </td>
          <td class="right num">{c.qty.toLocaleString("en-US")}</td>
          <td class="right num">{formatGold(Math.round(c.gold))}</td>
          <td class="right num basecell">
            <span>{formatGold(Math.round(shownBase))}</span>
            {#if showWealth}<span class="chip">x{WEALTH_BASE_MULT} Wealth</span>{/if}
          </td>
          <td class="right num accent">{formatGold(Math.round(c.gold + shownBase))}</td>
        </tr>
      {:else}
        <tr><td class="muted" colspan="5">No tradable chest on this floor.</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; margin: 0; }
  th, td { padding: 5px 8px; border-bottom: 1px solid var(--border); font-size: 12.5px; text-align: left; }
  tbody tr:last-child td { border-bottom: none; }
  th { color: var(--muted); font-weight: 500; }
  .right { text-align: right; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .muted { color: var(--muted); }
  .name { display: block; }
  .crown { margin-right: 5px; }
  .cnote { display: block; color: var(--muted); font-size: 11px; margin-top: 1px; }
  tr.best td { background: rgba(255, 209, 102, .07); }
  tr.best td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
  .basecell { white-space: nowrap; }
  .chip {
    margin-left: 6px; padding: 1px 6px; border-radius: 999px; font-size: 10px;
    font-family: "Sora", system-ui, sans-serif; color: var(--accent);
    border: 1px solid var(--border); background: var(--panel-2);
  }
</style>
