<script lang="ts">
  import { packValue } from "$lib/packs/packValue";
  import { packDetail } from "$lib/packs/packDetail";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "$lib/components/ItemIcon.svelte";

  let { data } = $props();
  const pack = $derived(data.pack);

  const prices = $derived(effectivePrices());
  const value = $derived(packValue(pack, prices));
  const chests = $derived(packDetail(pack, prices));
  const gpd = $derived(value.goldPerDollar == null ? null : Math.round(value.goldPerDollar));
</script>

<section class="detail">
  <a class="back" href="/">← All packs</a>
  <h2>{pack.name}</h2>

  <div class="stats">
    <span><b class="num accent">{pack.royalCrystalCost.toLocaleString("en-US")}</b><img class="ic" src="/icons/royal-crystal.png" alt="RC" /></span>
    <span class="sep">·</span>
    <span><b class="num">{formatGold(value.total)}</b><img class="ic" src="/icons/gold.png" alt="g" /></span>
    <span class="sep">·</span>
    <span><b class="num accent">{value.goldPerRc == null ? "—" : value.goldPerRc.toFixed(1)}</b> <span class="lbl">g/RC</span></span>
    <span class="sep">·</span>
    <span><b class="num">{gpd == null ? "—" : gpd.toLocaleString("en-US")}</b> <span class="lbl">g/$</span></span>
  </div>
  <p class="hint">Edit prices and toggle trade-ups on the <a href="/">Packs</a> page; this view reflects those. Selection chests list every option — the highest-value pick (✓) is what counts toward the total.</p>

  {#each chests as c (c.chest)}
    <div class="chest">
      <div class="chest-head">
        <span class="chest-name">{c.qty}× {c.chest}</span>
        {#if c.isSelection}<span class="tag">choose 1</span>{:else if c.options.length > 1}<span class="tag">all included</span>{/if}
        <span class="chest-gold num accent">{formatGold(c.gold)}<img class="ic" src="/icons/gold.png" alt="g" /></span>
      </div>
      {#if c.unresolved}
        <p class="unresolved">Unmapped chest — not valued.</p>
      {:else}
        <table>
          <tbody>
            {#each c.options as o (o.slug)}
              <tr class:dim={c.isSelection && !o.chosen}>
                <td class="ic-col"><ItemIcon slug={o.slug} /></td>
                <td>{displayName(o.slug)}{#if o.isBound}<span class="bound"> (Bound)</span>{/if}{#if c.isSelection && o.chosen}<span class="pick">✓ picked</span>{/if}</td>
                <td class="right num">{o.totalQty.toLocaleString("en-US")}</td>
                <td class="right num muted">{o.perUnit > 0 ? formatGold(o.perUnit) : "—"}</td>
                <td class="right num accent">{o.lineGold > 0 ? formatGold(o.lineGold) : "—"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/each}
</section>

<style>
  .detail {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c;
    color: var(--text); font-family: "Sora", system-ui, sans-serif; max-width: 760px;
  }
  .back { color: var(--accent); text-decoration: none; font-size: 13px; }
  .back:hover { text-decoration: underline; }
  h2 { margin: 10px 0 8px; font-size: 22px; }
  .stats { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 14px; margin-bottom: 6px; }
  .sep { color: var(--muted); opacity: .5; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .lbl, .muted { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin-left: 2px; }
  .hint { color: var(--muted); font-size: 12.5px; line-height: 1.5; margin: 0 0 18px; }
  .hint a { color: var(--accent); }
  .chest { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  .chest-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .chest-name { font-weight: 600; }
  .tag { padding: 1px 8px; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .chest-gold { margin-left: auto; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  tr:last-child td { border-bottom: 0; }
  .right { text-align: right; }
  td.accent { color: var(--accent); }
  td.muted { color: var(--muted); }
  .ic-col { width: 30px; }
  tr.dim td { opacity: .5; }
  .bound { color: var(--muted); font-size: 12px; }
  .pick { color: var(--good); font-size: 11px; margin-left: 8px; }
  .unresolved { color: var(--muted); font-size: 13px; margin: 4px 0 0; }
</style>
