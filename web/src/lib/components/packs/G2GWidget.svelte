<script lang="ts">
  import { g2gReadout } from "$lib/packs/exchange";
  import type { Region } from "$lib/api";
  let { value = $bindable(), region }: { value: number; region: Region } = $props();
  const sym = $derived(region === "euc" ? "€" : "$");
  const readout = $derived(g2gReadout(value || 0, sym));
</script>

<label class="ex">
  <span class="cap">
    <img class="mark" src="/icons/g2g.png" alt="" /> exchange <span class="opt">(optional)</span>
  </span>
  <span class="row">
    <span class="sym">{sym}</span>
    <input
      type="number" min="0" step="0.0001" inputmode="decimal"
      bind:value aria-label="G2G price per 1,000 gold" />
    <span class="per">for 1k</span>
    <img class="coin" src="/icons/gold.png" alt="" />
    <span class="eq">= {readout} / 100k</span>
    <img class="coin" src="/icons/gold.png" alt="" />
  </span>
</label>

<style>
  .ex { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
  .cap { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--faint);
    display: inline-flex; align-items: center; gap: 5px; }
  .mark { width: 14px; height: 14px; border-radius: 3px; opacity: .8; }
  .opt { text-transform: none; letter-spacing: 0; }
  .row { display: flex; align-items: center; gap: 6px; font: 500 13px "Sora", sans-serif; color: var(--txt); }
  .sym { color: var(--muted); }
  input { width: 96px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 7px;
    color: var(--gold); font: 600 13px "JetBrains Mono", monospace; padding: 5px 8px; }
  input:focus { outline: none; border-color: var(--gold); }
  .coin { width: 14px; height: 14px; }
  .per { color: var(--muted); }
  .eq { color: var(--gold); font-family: "JetBrains Mono", monospace; }
</style>
