<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { freshness } from "$lib/format";
  const f = $derived(
    app.payload && app.snapshot
      ? freshness(app.payload.generated_at, app.snapshot.source_valid_at)
      : null,
  );
</script>

{#if f}
  <p class="fresh" class:stale={f.stale}>
    {f.label}{#if f.stale} · may be stale (patch in progress?){/if}
  </p>
{/if}

<style>
  .fresh { color: var(--faint); font-size: 12px; text-align: center; margin: 8px 0 0; }
  .stale { color: var(--bad); }
</style>
