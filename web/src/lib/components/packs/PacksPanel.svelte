<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { buildPackRows } from "$lib/packs/packRows";
  import { G2G_DEFAULT_INPUT, currencySymbol } from "$lib/packs/exchange";
  import type { Region } from "$lib/api";
  import F4Widget from "./F4Widget.svelte";
  import G2GWidget from "./G2GWidget.svelte";
  import PackCard from "./PackCard.svelte";

  // F4 crystal rate is region-specific (NA != EU). NA seeded to the live in-game rate
  // (~250 gold/crystal -> 250 * 238 = 59500 gold for 238 crystals); EU is a placeholder
  // until confirmed or a live source lands. Persisted per region. G2G is one field.
  const F4_DEFAULTS: Record<Region, number> = { nae: 59500, euc: 59500 };

  function restore(key: string, fallback: number): number {
    if (typeof localStorage === "undefined") return fallback;
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  let f4 = $state<Record<Region, number>>({
    nae: restore("csv.f4.nae", F4_DEFAULTS.nae),
    euc: restore("csv.f4.euc", F4_DEFAULTS.euc),
  });
  let g2gInput = $state(restore("csv.g2g", G2G_DEFAULT_INPUT));

  $effect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(`csv.f4.${app.region}`, String(f4[app.region]));
  });
  $effect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem("csv.g2g", String(g2gInput));
  });

  const sym = $derived(currencySymbol(app.region));
  const rows = $derived(
    buildPackRows(app.snapshot?.prices ?? {}, { f4Input: f4[app.region], g2gInput }),
  );
</script>

<div class="bar">
  <F4Widget bind:value={f4[app.region]} />
  <G2GWidget bind:value={g2gInput} region={app.region} />
</div>

{#if app.status === "loading"}
  <p class="state">Loading prices…</p>
{:else if app.status === "error"}
  <p class="state err">Failed to load prices.</p>
{:else if app.snapshot?.prices && Object.keys(app.snapshot.prices).length === 0}
  <p class="state">No prices yet — the feed may be refreshing.</p>
{:else}
  <section class="grid">
    {#each rows as row (row.slug)}
      <PackCard {row} {sym} />
    {/each}
  </section>
{/if}

<style>
  .bar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    flex-wrap: wrap; padding: 12px 4px 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.err { color: var(--bad); }
</style>
