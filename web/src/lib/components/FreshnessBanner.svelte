<script lang="ts">
  import { onMount } from "svelte";
  import { app } from "$lib/app.svelte";
  import { freshness } from "$lib/format";

  // Ticking clock so the "may be stale" threshold is crossed on a page left open,
  // not only when the data/region changes.
  let now = $state(Date.now());
  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(id);
  });

  const f = $derived(
    app.payload && app.snapshot
      ? freshness(app.payload.generated_at, app.snapshot.source_valid_at, now)
      : null,
  );
</script>

{#if f}
  <p class="fresh" class:stale={f.stale}>
    {f.label}{#if f.stale}&nbsp;· may be stale{/if}
  </p>
{/if}

<style>
  .fresh { color: var(--muted); font-size: 12px; text-align: center; margin: 8px 0 0; }
  .stale { color: var(--bad); }
</style>
