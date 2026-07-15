<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { freshness } from "$lib/format";

  // The snapshot time refreshes when the 60s poll swaps in a newer payload (see +layout).
  const f = $derived(
    app.payload && app.snapshot
      ? freshness(app.payload.generated_at, app.snapshot.source_valid_at)
      : null,
  );
</script>

{#if f}
  <p class="fresh" class:stale={f.stale}>
    {#if f.stale}prices may be outdated - last updated {f.time}{:else}{f.label}{/if}
  </p>
{/if}

<style>
  .fresh { color: var(--muted); font-size: 12px; text-align: center; margin: 8px 0 0; }
  /* Discreet outage signal: silent in normal use, amber only past the 90-min stale threshold. */
  .fresh.stale { color: var(--gold-2); font-weight: 600; }
</style>
