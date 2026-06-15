<script lang="ts">
  import type { PackRow } from "$lib/packs/packRows";
  import { formatGold, formatSignedPct } from "$lib/format";
  let { row, sym }: { row: PackRow; sym: string } = $props();
  const goldPerDollar = $derived(row.goldPerDollar == null ? null : Math.round(row.goldPerDollar));
</script>

<article class="card" class:retired={row.retired}>
  <header>
    <h3>{row.name}</h3>
    {#if row.retired}<span class="badge">retired</span>{/if}
  </header>

  <div class="rc">
    <span class="rc-cost">{row.royalCrystalCost.toLocaleString("en-US")}</span>
    <img class="coin" src="/icons/royal-crystal.png" alt="RC" />
  </div>

  <dl>
    <div><dt>Total value</dt><dd class="gold">{formatGold(row.total)}<img class="coin" src="/icons/gold.png" alt="" /></dd></div>
    <div><dt>Gold / RC</dt><dd class="gold">{row.goldPerRc == null ? "—" : row.goldPerRc.toFixed(1)}</dd></div>
    <div><dt>% vs exchange</dt><dd class={row.vsExchange != null && row.vsExchange >= 0 ? "pos" : "neg"}>{formatSignedPct(row.vsExchange)}</dd></div>
    <div><dt>Gold / $</dt><dd class="gold">{goldPerDollar == null ? "—" : goldPerDollar.toLocaleString("en-US")}</dd></div>
    <div><dt><img class="mark" src="/icons/g2g.png" alt="" /> % vs G2G</dt><dd class={row.vsG2G != null && row.vsG2G >= 0 ? "pos" : "neg"}>{formatSignedPct(row.vsG2G)}</dd></div>
  </dl>
</article>

<style>
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 12px; }
  .card.retired { opacity: .5; }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  h3 { margin: 0; font: 600 14.5px "Sora", sans-serif; color: var(--txt); line-height: 1.3; }
  .badge { font: 600 9.5px "Sora", sans-serif; text-transform: uppercase; letter-spacing: .5px;
    color: var(--faint); border: 1px solid var(--line); border-radius: 999px; padding: 2px 7px; white-space: nowrap; }
  .rc { display: flex; align-items: center; gap: 5px; }
  .rc-cost { font: 700 20px "JetBrains Mono", monospace;
    background: linear-gradient(180deg, var(--gold), var(--gold-2)); -webkit-background-clip: text;
    background-clip: text; color: transparent; }
  dl { margin: 0; display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; }
  dl > div { display: contents; }
  dt { font-size: 11.5px; color: var(--muted); display: inline-flex; align-items: center; gap: 5px; }
  dt .mark { width: 12px; height: 12px; border-radius: 2px; opacity: .75; }
  dd { margin: 0; text-align: right; font: 600 13px "JetBrains Mono", monospace; }
  dd.gold { color: var(--gold); }
  dd.pos { color: var(--pos); }
  dd.neg { color: var(--bad); }
  .coin { width: 13px; height: 13px; vertical-align: -2px; margin-left: 4px; }
</style>
