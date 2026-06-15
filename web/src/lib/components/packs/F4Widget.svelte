<script lang="ts">
  import { f4Baseline } from "$lib/packs/exchange";
  // Two-way bound to the panel's per-region f4 input.
  let { value = $bindable() }: { value: number } = $props();
  const baseline = $derived(f4Baseline(value || 0));
</script>

<label class="ex">
  <span class="cap">Currency exchange <span class="opt">(optional)</span></span>
  <span class="row">
    <input
      type="number" min="0" step="1" inputmode="numeric"
      bind:value aria-label="F4 exchange gold input" />
    <img class="coin" src="/icons/gold.png" alt="" />
    <span class="div">/ 238</span>
    <span class="eq">= {baseline.toFixed(2)}</span>
    <img class="coin" src="/icons/gold.png" alt="" />
    <span class="per">/ crystal</span>
  </span>
</label>

<style>
  .ex { display: flex; flex-direction: column; gap: 4px; }
  .cap { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); }
  .opt { text-transform: none; letter-spacing: 0; }
  .row { display: flex; align-items: center; gap: 6px; font: 500 13px "Sora", sans-serif; color: var(--txt); }
  input { width: 84px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 7px;
    color: var(--gold); font: 600 13px "JetBrains Mono", monospace; padding: 5px 8px; }
  input:focus { outline: none; border-color: var(--gold); }
  .coin { width: 14px; height: 14px; }
  .div, .per { color: var(--muted); }
  .eq { color: var(--gold); font-family: "JetBrains Mono", monospace; }
</style>
