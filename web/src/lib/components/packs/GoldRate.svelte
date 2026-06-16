<script lang="ts">
  // Gold-per-unit readout shared by the cards and the drill-down: "<value> [gold]/[RC]" in accent
  // gold for the per-Royal-Crystal figure, "<value> [gold]/$" in green for the per-currency figure.
  // Palette vars (--accent/--good/--muted) are inherited from the panel/detail ancestor.
  let { value, unit, sym = "$" }: {
    value: number | null;
    unit: "rc" | "cash";
    sym?: string; // currency symbol for the cash variant ($ NA, € EU)
  } = $props();
</script>

{#if value == null}
  <span class="num muted">—</span>
{:else if unit === "rc"}
  <b class="num accent">{value.toFixed(1)}</b><img class="ic" src="/icons/gold.png" alt="gold" /><span class="slash">/</span><img class="ic rc" src="/icons/royal-crystal.png" alt="per RC" />
{:else}
  <b class="num good">{Math.round(value).toLocaleString("en-US")}</b><img class="ic" src="/icons/gold.png" alt="gold" /><span class="slash">/{sym}</span>
{/if}

<style>
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .good { color: var(--good); }
  .muted { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin-left: 3px; }
  .ic.rc { margin-left: 1px; }
  .slash { color: var(--muted); margin: 0 1px; }
</style>
