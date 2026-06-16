<script lang="ts">
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { f4 } from "$lib/packs/f4.svelte";
  import { MARIS_WARES, BC_PER_BUNDLE } from "$lib/packs/data/marisShop";
  import { formatGold, formatSignedPct } from "$lib/format";
  import ItemIcon from "../ItemIcon.svelte";

  const prices = $derived(effectivePrices());
  const goldPerBc = $derived(f4.perBc);

  const rows = $derived(
    MARIS_WARES.map((w) => {
      const goldCost = Math.round(w.bc * goldPerBc);
      const unit = w.slug ? (prices[w.slug] ?? 0) : 0;
      const ahValue = w.slug && unit > 0 ? Math.round(unit * w.qty) : null;
      const savings = ahValue == null ? null : ahValue - goldCost;
      const savingsPct = ahValue == null || goldCost <= 0 ? null : (ahValue / goldCost - 1) * 100;
      return { w, goldCost, ahValue, savings, savingsPct };
    }),
  );
</script>

<div class="maris">
  <h2>Mari's Shop</h2>
  <p class="note">
    Wares cost blue crystals (BC), which you buy with gold at the F4 exchange rate — so the gold
    cost is <b>BC × (F4 gold ÷ {BC_PER_BUNDLE})</b>. "Savings vs AH" compares that to buying the same
    items outright on the Auction House at current prices (your Packs-page price edits apply here too).
  </p>

  <div class="exch">
    <span class="lbl">Currency exchange (F4):</span>
    <input class="f4 num" type="number" min="0" value={f4.value} oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)} aria-label="F4 exchange gold" />
    <img class="ic" src="/icons/gold.png" alt="gold" />
    <span class="lbl">→ <b class="num accent">{formatGold(Math.round(goldPerBc))}</b> gold / BC</span>
  </div>

  <div class="tscroll">
  <table>
    <thead>
      <tr>
        <th class="ic-col" aria-label="icon"></th><th>Material</th>
        <th class="right">Qty</th><th class="right">BC cost</th>
        <th class="right">Cost in gold</th><th class="right">AH value</th><th class="right">Savings vs AH</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.w.name)}
        <tr>
          <td class="ic-col">{#if r.w.icon ?? r.w.slug}<ItemIcon slug={(r.w.icon ?? r.w.slug)!} />{/if}</td>
          <td>{r.w.name} <span class="bound">(Bound)</span></td>
          <td class="right num">{r.w.qty.toLocaleString("en-US")}</td>
          <td class="right num bc">{#if r.w.wasBc}<span class="was">{r.w.wasBc}</span> {/if}{r.w.bc} BC</td>
          <td class="right num">{formatGold(r.goldCost)}</td>
          <td class="right num muted">{r.ahValue == null ? "no price" : formatGold(r.ahValue)}</td>
          <td class="right num" class:good={(r.savings ?? 0) > 0} class:bad={(r.savings ?? 0) < 0}>
            {#if r.savings == null || r.savingsPct == null}—{:else}{formatSignedPct(r.savingsPct)} <span class="delta">({r.savings >= 0 ? "+" : "−"}{formatGold(Math.abs(r.savings))} g)</span>{/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
</div>

<style>
  .maris {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c;
    color: var(--text); font-family: "Sora", system-ui, sans-serif;
  }
  h2 { font-size: 20px; margin: 8px 0 6px; }
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 14px; }
  .exch { display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
  .lbl { color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; }
  input.f4 { width: 84px; background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
    padding: 6px 10px; border-radius: 6px; font-size: 13px; }
  input.f4:focus { outline: none; border-color: var(--accent); }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 620px; border-collapse: collapse; }
  th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  th { color: var(--muted); font-weight: 500; }
  .right { text-align: right; }
  .ic-col { width: 30px; }
  td.muted { color: var(--muted); }
  .bound { color: var(--muted); font-size: 11.5px; }
  .bc .was { color: var(--muted); text-decoration: line-through; opacity: .7; margin-right: 2px; }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .delta { font-size: 11.5px; color: var(--muted); }
  tr:hover td { background: var(--panel-2); }
</style>
