<script lang="ts">
  import { arkPassRows } from "$lib/packs/arkPassRows";
  import { ARK_PASS_PREMIUM_RC, ARK_PASS_TOTAL_RC } from "$lib/packs/data/arkPass";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { arkSelection } from "$lib/packs/arkSelection.svelte";
  import { cashPerRc, currencySymbol } from "$lib/packs/exchange";
  import { app } from "$lib/app.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";
  import { base } from "$app/paths";

  const prices = $derived(effectivePrices());
  const rows = $derived(arkPassRows(prices, arkSelection.map));

  // Which level rows have their option list expanded (keyed by level number).
  let expanded = $state<Record<number, boolean>>({});
  function toggle(level: number): void {
    expanded = { ...expanded, [level]: !expanded[level] };
  }

  const premiumTotal = $derived(rows.reduce((s, r) => s + r.gold, 0));
  const premiumGpRc = $derived(premiumTotal / ARK_PASS_PREMIUM_RC);
  const combinedGpRc = $derived(premiumTotal / ARK_PASS_TOTAL_RC);
  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU — RC priced per region
  const premiumGpDollar = $derived(Math.round(premiumTotal / (ARK_PASS_PREMIUM_RC * cashPerRc(app.region))));
</script>

<div class="ark">
  <h2>Ark Pass</h2>
  <p class="note">
    Premium gives a reward at every level; Super Premium adds the same plus milestone rewards at
    levels 5/10/15/20/25/30 (skins/extras — not yet valued). Each selection reward defaults to its
    highest-value option — expand “pick 1 of N” on a level to value it as a different choice.
  </p>

  <div class="summary">
    <div class="card">
      <div class="tier">Premium</div>
      <div class="cost"><b class="num accent">{ARK_PASS_PREMIUM_RC.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /></div>
      <dl>
        <div><dt>Total value</dt><dd class="gold">{formatGold(premiumTotal)}</dd></div>
        <div><dt>Gold / RC</dt><dd class="gold">{premiumGpRc.toFixed(1)}</dd></div>
        <div><dt>Gold / {sym}</dt><dd class="gold">{premiumGpDollar.toLocaleString("en-US")}</dd></div>
      </dl>
    </div>
    <div class="card">
      <div class="tier">Super Premium</div>
      <div class="cost"><b class="num accent">{ARK_PASS_TOTAL_RC.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /> <span class="lbl">total</span></div>
      <dl>
        <div><dt>Milestone rewards</dt><dd class="muted">TBD (skins/extras)</dd></div>
        <div><dt>Combined gold / RC</dt><dd class="gold">{combinedGpRc.toFixed(1)}</dd></div>
      </dl>
    </div>
  </div>

  <div class="tscroll">
  <table>
    <thead>
      <tr><th class="right">Lv</th><th class="ic-col" aria-label="icon"></th><th>Premium reward (best pick)</th><th class="right">Qty</th><th class="right">Gold</th></tr>
    </thead>
    <tbody>
      {#each rows as r (r.level)}
        <tr class:milestone={r.milestone}>
          <td class="right num">{r.level}{#if r.milestone}<span class="star" title="Super Premium milestone">★</span>{/if}</td>
          <td class="ic-col">{#if r.icon}<ItemIcon slug={r.icon} />{/if}</td>
          <td>
            {#if r.chosenSlug}<span class="rname">{displayName(r.chosenSlug)}</span>{:else}<span class="muted">{r.chest}</span>{/if}
            {#if r.optionCount > 1}
              <button class="chestnote note-toggle" aria-expanded={!!expanded[r.level]} onclick={() => toggle(r.level)}>
                {r.chestQty}× {r.chest}{" "}{expanded[r.level] ? "[− hide options]" : `[+ pick 1 of ${r.optionCount}]`}
              </button>
            {:else}
              <span class="chestnote">{r.chestQty}× {r.chest}</span>
            {/if}
          </td>
          <td class="right num">{r.qty ? r.qty.toLocaleString("en-US") : "—"}</td>
          <td class="right num accent">{r.gold > 0 ? formatGold(r.gold) : "—"}</td>
        </tr>
        {#if expanded[r.level] && r.optionCount > 1}
          {#each r.options as o (o.slug)}
            <tr class="alt">
              <td></td>
              <td class="ic-col"><ItemIcon slug={o.slug} /></td>
              <td>
                <button class="pick-name" class:chosen={o.chosen} title="Value this level with this option" onclick={() => arkSelection.set(r.level, o.slug)}>↳ {displayName(o.slug)}</button>{#if o.isBound}<span class="bound"> (Bound)</span>{/if}{#if o.chosen}<span class="pick">✓ counts</span>{/if}
              </td>
              <td class="right num">{o.totalQty.toLocaleString("en-US")}</td>
              <td class="right num">{o.lineGold > 0 ? formatGold(o.lineGold) : "—"}</td>
            </tr>
          {/each}
          {#if arkSelection.has(r.level)}
            <tr class="alt">
              <td></td><td></td>
              <td colspan="3"><button class="chest-reset" onclick={() => arkSelection.clearOne(r.level)}>reset to best value</button></td>
            </tr>
          {/if}
        {/if}
      {/each}
    </tbody>
  </table>
  </div>
</div>

<style>
  .ark {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166;
    color: var(--text); font-family: "Sora", system-ui, sans-serif;
  }
  h2 { font-size: 20px; margin: 8px 0 6px; }
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 16px; }
  .summary { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
  @media (min-width: 700px) { .summary { grid-template-columns: 1fr 1fr; } }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }
  .tier { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .cost { display: flex; align-items: center; gap: 5px; margin-bottom: 10px; }
  .cost .num { font-size: 20px; }
  dl { margin: 0; display: grid; grid-template-columns: 1fr auto; gap: 5px 12px; }
  dl > div { display: contents; }
  dt { font-size: 12px; color: var(--muted); }
  dd { margin: 0; text-align: right; font: 600 13px "JetBrains Mono", monospace; }
  dd.gold { color: var(--accent); }
  dd.muted { color: var(--muted); font-weight: 400; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .lbl, .muted { color: var(--muted); }
  .ic { width: 15px; height: 15px; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 560px; border-collapse: collapse; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  th { color: var(--muted); font-weight: 500; }
  .right { text-align: right; }
  td.accent { color: var(--accent); }
  .ic-col { width: 30px; }
  .rname { color: var(--text); }
  .chestnote { display: block; color: var(--muted); font-size: 11.5px; margin-top: 1px; }
  tr.milestone td { background: rgba(255, 209, 102, .05); }
  .star { color: var(--accent); margin-left: 4px; font-size: 11px; }
  tr:hover td { background: var(--panel-2); }
  .note-toggle { display: block; margin-top: 1px; background: none; border: 0; padding: 0;
    cursor: pointer; color: var(--muted); font: inherit; font-size: 11.5px; text-align: left; }
  .note-toggle:hover { color: var(--accent); }
  tr.alt td { background: rgba(255, 255, 255, .02); padding-top: 4px; padding-bottom: 4px; }
  .pick-name { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted);
    font: inherit; font-size: 12.5px; }
  .pick-name:hover { color: var(--text); text-decoration: underline; text-underline-offset: 2px; }
  .pick-name.chosen { color: var(--accent); }
  .pick { color: var(--accent); font-size: 11px; margin-left: 6px; }
  .bound { color: var(--muted); font-size: 12px; }
  .chest-reset { background: none; border: 1px solid var(--border); color: var(--muted);
    border-radius: 999px; padding: 1px 8px; font-size: 11px; cursor: pointer; }
  .chest-reset:hover { color: var(--accent); border-color: var(--accent); }
</style>
