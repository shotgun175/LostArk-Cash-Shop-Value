<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { displayName } from "$lib/catalog";
  import { formatGold } from "$lib/format";
  import ItemIcon from "./ItemIcon.svelte";
  import { base } from "$app/paths";
  import { save } from "$lib/storage";
  import { loadPriceSort, sortPriceRows, PRICE_SORT_KEY, type PriceSort } from "$lib/priceSort";

  const sorts: { id: PriceSort; label: string }[] = [
    { id: "name", label: "A-Z" },
    { id: "gold", label: "Highest gold" },
  ];
  let sort = $state<PriceSort>(loadPriceSort());

  // Sorted [slug, gold] for the active region.
  const rows = $derived(sortPriceRows(app.snapshot?.prices ?? {}, sort));
</script>

{#if app.status === "loading"}
  <p class="state">Loading prices…</p>
{:else if app.status === "error"}
  <p class="state err">Failed to load prices.</p>
{:else if rows.length === 0}
  <p class="state">No prices yet. The feed may be refreshing.</p>
{:else}
  <div class="bar">
    <span>Sort</span>
    <div class="toggle" role="group" aria-label="Sort prices">
      {#each sorts as s (s.id)}
        <button
          class:active={sort === s.id}
          onclick={() => { sort = s.id; save(PRICE_SORT_KEY, s.id); }}
          aria-pressed={sort === s.id}>{s.label}</button>
      {/each}
    </div>
  </div>
  <table>
    <thead><tr><th>Item</th><th class="r">Gold</th></tr></thead>
    <tbody>
      {#each rows as [slug, gold] (slug)}
        <tr>
          <td><div class="mat"><ItemIcon {slug} /><span>{displayName(slug)}</span></div></td>
          <td class="r">{formatGold(gold)}<img class="coin" src="{base}/icons/gold.png" alt="" /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 16px; text-align: left; }
  thead th { font-size: 13.5px; font-weight: 600; color: var(--muted); }
  th.r, td.r { text-align: right; }
  td.r { font-family: "JetBrains Mono", monospace; color: var(--gold); white-space: nowrap; }
  tbody tr { border-top: 1px solid #1c2030; }
  tbody tr:hover { background: var(--panel-2); }
  .mat { display: flex; align-items: center; gap: 10px; }
  .mat span { font-size: 13.5px; color: var(--txt); }
  .coin { width: 14px; height: 14px; vertical-align: -2px; margin-left: 5px; }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.err { color: var(--bad); }
  /* Same segmented look as the NA/EU RegionToggle. */
  .bar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 16px 4px; }
  .bar > span { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); }
  .toggle { display: inline-flex; gap: 2px; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 2px; }
  .toggle button { background: none; border: 0; color: var(--muted); font: 500 12.5px "Sora", sans-serif; padding: 5px 12px; border-radius: 7px; cursor: pointer; }
  .toggle button:hover { color: var(--txt); }
  .toggle button.active { color: var(--bg); background: linear-gradient(180deg, var(--gold), var(--gold-2)); font-weight: 600; }
</style>
