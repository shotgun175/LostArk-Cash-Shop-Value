<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { displayName } from "$lib/catalog";
  import { formatGold } from "$lib/format";
  import ItemIcon from "./ItemIcon.svelte";

  // Sorted [slug, gold] for the active region.
  const rows = $derived(
    Object.entries(app.snapshot?.prices ?? {}).sort((a, b) =>
      displayName(a[0]).localeCompare(displayName(b[0]))),
  );
</script>

{#if app.status === "loading"}
  <p class="state">Loading prices…</p>
{:else if app.status === "error"}
  <p class="state err">Failed to load prices.</p>
{:else if rows.length === 0}
  <p class="state">No prices yet — the feed may be refreshing.</p>
{:else}
  <table>
    <thead><tr><th>Item</th><th class="r">Gold</th></tr></thead>
    <tbody>
      {#each rows as [slug, gold] (slug)}
        <tr>
          <td><div class="mat"><ItemIcon {slug} /><span>{displayName(slug)}</span></div></td>
          <td class="r">{formatGold(gold)}<img class="coin" src="/icons/gold.png" alt="" /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 16px; text-align: left; }
  thead th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); }
  th.r, td.r { text-align: right; font-family: "JetBrains Mono", monospace; color: var(--gold); }
  tbody tr { border-top: 1px solid #1c2030; }
  tbody tr:hover { background: var(--panel-2); }
  .mat { display: flex; align-items: center; gap: 10px; }
  .mat span { font-size: 13.5px; color: var(--txt); }
  .coin { width: 14px; height: 14px; vertical-align: -2px; margin-left: 5px; }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.err { color: var(--bad); }
</style>
