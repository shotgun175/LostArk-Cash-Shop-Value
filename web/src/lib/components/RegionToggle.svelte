<script lang="ts">
  import { app } from "$lib/app.svelte";
  const regions: { id: "nae" | "euc"; label: string }[] = [
    { id: "nae", label: "NA" },
    { id: "euc", label: "EU" },
  ];
</script>

<div class="toggle" role="group" aria-label="Region">
  {#each regions as r (r.id)}
    <button
      class:active={app.region === r.id}
      onclick={() => (app.region = r.id)}
      aria-pressed={app.region === r.id}>{r.label}</button>
  {/each}
</div>

<style>
  .toggle { display: inline-flex; gap: 2px; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 2px; }
  button { background: none; border: 0; color: var(--muted); font: 500 12.5px "Sora", sans-serif; padding: 5px 12px; border-radius: 7px; cursor: pointer; }
  button:hover { color: var(--txt); }
  button.active { color: var(--bg); background: linear-gradient(180deg, var(--gold), var(--gold-2)); font-weight: 600; }
</style>
