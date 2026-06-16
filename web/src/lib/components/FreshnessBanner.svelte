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
  <p class="fresh">{f.label}</p>
{/if}

<style>
  .fresh { color: var(--muted); font-size: 12px; text-align: center; margin: 8px 0 0; }
</style>
