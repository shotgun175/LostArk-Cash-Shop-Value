<script lang="ts">
  import { resolveChest } from "$lib/packs/packValue";
  import { RESOLVER } from "$lib/packs/data/resolver";
  import { ARK_PASS_LEVELS, ARK_PASS_PREMIUM_RC, ARK_PASS_TOTAL_RC } from "$lib/packs/data/arkPass";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { cashPerRc, currencySymbol } from "$lib/packs/exchange";
  import { app } from "$lib/app.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";
  import { base } from "$app/paths";

  const prices = $derived(effectivePrices());

  const rows = $derived(
    ARK_PASS_LEVELS.map((lvl) => {
      const chest = lvl.unresolved ? undefined : RESOLVER[lvl.chest];
      if (!chest) return { lvl, slug: null as string | null, icon: lvl.iconSlug ?? null, qty: 0, gold: 0, optionCount: 0 };
      const r = resolveChest(chest, prices, selection.get(lvl.chest));
      const line = r.lines[0];
      return { lvl, slug: line?.slug ?? null, icon: line?.slug ?? null, qty: (line?.qty ?? 0) * lvl.qty, gold: r.gold * lvl.qty, optionCount: chest.outputs.length };
    }),
  );

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
    levels 5/10/15/20/25/30 (skins/extras — not yet valued). Each reward is a selection chest valued
    at its best pick using current prices; your Packs-page edits apply here too.
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
      {#each rows as r (r.lvl.level)}
        <tr class:milestone={r.lvl.milestone}>
          <td class="right num">{r.lvl.level}{#if r.lvl.milestone}<span class="star" title="Super Premium milestone">★</span>{/if}</td>
          <td class="ic-col">{#if r.icon}<ItemIcon slug={r.icon} />{/if}</td>
          <td>
            {#if r.slug}<span class="rname">{displayName(r.slug)}</span>{:else}<span class="muted">{r.lvl.chest}</span>{/if}
            <span class="chestnote">{r.lvl.qty}× {r.lvl.chest}{#if r.optionCount > 1}{" "}(pick 1 of {r.optionCount}){/if}</span>
          </td>
          <td class="right num">{r.qty ? r.qty.toLocaleString("en-US") : "—"}</td>
          <td class="right num accent">{r.gold > 0 ? formatGold(r.gold) : "—"}</td>
        </tr>
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
</style>
