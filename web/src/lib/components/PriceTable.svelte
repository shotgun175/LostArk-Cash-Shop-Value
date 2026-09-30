<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { displayName } from "$lib/catalog";
  import { formatGold } from "$lib/format";
  import ItemIcon from "./ItemIcon.svelte";
  import { base } from "$app/paths";
  import { save } from "$lib/storage";
  import {
    loadPriceSort, nextPriceSort, sortPriceRows, PRICE_SORT_KEY, type PriceSort, type PriceSortKey,
  } from "$lib/priceSort";

  const cols: { key: PriceSortKey; label: string; right: boolean }[] = [
    { key: "name", label: "Item", right: false },
    { key: "gold", label: "Gold", right: true },
  ];
  let sort = $state<PriceSort>(loadPriceSort());

  function sortBy(key: PriceSortKey): void {
    sort = nextPriceSort(sort, key);
    save(PRICE_SORT_KEY, `${sort.key}:${sort.dir}`);
  }

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
  <table>
    <thead>
      <tr>
        {#each cols as c (c.key)}
          {@const active = sort.key === c.key}
          <th class:r={c.right} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
            <button class="sort" class:active onclick={() => sortBy(c.key)}>{c.label}<span class="arrow" aria-hidden="true">{active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span></button>
          </th>
        {/each}
      </tr>
    </thead>
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
  /* Clickable headers: the active column is brighter with a solid arrow; the other shows a faint
     up-down hint so it reads as sortable too. */
  .sort { background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer;
    display: inline-flex; align-items: center; gap: 5px; }
  .sort:hover, .sort.active { color: var(--txt); }
  .arrow { font-size: 10px; color: var(--faint); }
  .sort.active .arrow { color: var(--gold); }
</style>
