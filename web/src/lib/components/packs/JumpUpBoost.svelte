<script lang="ts">
  import { jumpUpRows } from "$lib/packs/jumpUpRows";
  import { JUMP_UP_RC, JUMP_UP_LEVELS } from "$lib/packs/data/jumpUp";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { buildPriceMap } from "$lib/packs/priceMap";
  import { f4 } from "$lib/packs/f4.svelte";
  import { BC_PER_BUNDLE } from "$lib/packs/data/marisShop";
  import { cashPerRc, currencySymbol, vsExchangePct } from "$lib/packs/exchange";
  import { app } from "$lib/app.svelte";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";
  import { base } from "$app/paths";

  // The same fully layered map the Packs tab values against (baked seeds + live + BC items off
  // the F4 input). Nothing on this track is a raw feed slug, so the raw effectivePrices() map the
  // Ark Pass reads would value every reward at 0.
  const prices = $derived(buildPriceMap(effectivePrices(), { blueCrystalGold: f4.value / BC_PER_BUNDLE }));
  const result = $derived(jumpUpRows(prices));
  const f4base = $derived(f4.perRc);
  const vsF4 = $derived(vsExchangePct(result.goldPerRc, f4base));
  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU
  const goldPerDollar = $derived(Math.round(result.total / (JUMP_UP_RC * cashPerRc(app.region))));
  const levels = JUMP_UP_LEVELS.length;
  const rc = JUMP_UP_RC.toLocaleString("en-US");
</script>

<div class="ju">
  <h2>Jump-Up Boost</h2>
  <p class="note">
    Mokoko Base Camp <strong>Jump-Up Boost</strong>. Buying <strong>Powerpass Premium</strong> ({rc} RC)
    unlocks the locked right-hand chest at each of the {levels} Main Mission milestones (Reach Equipped
    Item Lv. 1,700 to 1,720). Only those paid chests are valued here; the free left-hand chests and the
    Sub Mission point shop are not included.
  </p>

  <div class="summary">
    <div class="card">
      <div class="tier">Powerpass Premium</div>
      <div class="cost"><b class="num accent">{rc}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /></div>
      <dl>
        <div><dt>Total value, all {levels} milestones</dt><dd class="gold">{formatGold(result.total)}</dd></div>
        <div><dt>Gold / RC</dt><dd class="gold">{result.goldPerRc.toFixed(1)}</dd></div>
        <div><dt>vs F4 exchange</dt><dd class:good={vsF4 != null && vsF4 >= 0} class:bad={vsF4 != null && vsF4 < 0}>{formatSignedPct(vsF4)}</dd></div>
        <div><dt>Gold / {sym}</dt><dd class="gold">{goldPerDollar.toLocaleString("en-US")}</dd></div>
      </dl>
    </div>
    <div class="card">
      <div class="tier">F4 currency exchange</div>
      <div class="exch">
        <input class="f4" type="number" min="0" value={f4.value} oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)} aria-label="F4 exchange gold" />
        <img class="ic" src="{base}/icons/gold.png" alt="gold" />
        <span class="lbl">for 238</span><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />
        <span class="lbl">=</span> <b class="num accent">{f4base.toFixed(2)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" /><span class="lbl">/</span><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />
        <span class="lbl">baseline</span>
      </div>
      <p class="fine">Shared with the Packs tab (per region). It prices the Crystalline Aura Plus reward and sets the vs-F4 baseline.</p>
    </div>
  </div>

  <p class="note">
    Bound Lv. 8 Brilliant Gems are valued at 3x the Lv. 7 gem seed (3:1 fuse chain). Fixed Epic Astrogem
    Selection Chests are a flat 75,000 gold each. Crystalline Aura Plus is valued at its store cost (510 BC
    per 30 days, so 238 BC for 14 days) x the exchange rate. Azena's Blessing and the Ancient bracelet /
    accessory chests have no market value and count as 0.
  </p>

  <div class="tscroll">
  <table>
    <thead>
      <tr><th class="ic-col" aria-label="icon"></th><th>Reward</th><th class="right">Qty</th><th class="right">Unit</th><th class="right">Gold</th></tr>
    </thead>
    <tbody>
      {#each result.rows as r (r.level)}
        <tr class="lvl">
          <td colspan="2"><span class="lv">Lv {r.level}</span> <span class="req">Reach Item Lv. {r.ilvl.toLocaleString("en-US")}</span> <span class="chest">{r.chest}</span></td>
          <td colspan="3" class="right">
            <b class="num accent">{formatGold(r.gold)}</b>
            <span class="cum">cumulative <b class="num">{formatGold(r.cumulativeGold)}</b> · {r.cumulativeGoldPerRc.toFixed(1)} g/RC</span>
          </td>
        </tr>
        {#each r.lines as l (l.chest + l.slug)}
          <tr>
            <td class="ic-col">{#if !l.unresolved}<ItemIcon slug={l.slug} />{/if}</td>
            <td>
              {#if l.unresolved}
                <span class="bad">Unresolved: {l.chestQty}× {l.chest}</span>
              {:else}
                <span class="rname">{displayName(l.slug)}</span>{#if l.isBound}<span class="bound"> (Bound)</span>{/if}
                {#if l.chest.replace(/ \(Bound\)$/, "") !== displayName(l.slug)}<span class="chestnote">{l.chestQty}× {l.chest}</span>{/if}
              {/if}
            </td>
            <td class="right num">{l.qty ? l.qty.toLocaleString("en-US") : "—"}</td>
            <td class="right num muted">{l.perUnit > 0 ? formatGold(l.perUnit) : "—"}</td>
            <td class="right num accent">{#if l.gold > 0}{formatGold(l.gold)}{:else}<span class="warn">no price</span>{/if}</td>
          </tr>
        {/each}
      {/each}
    </tbody>
    <tfoot>
      <tr><td colspan="4" class="right total-lbl">Total ({rc} RC)</td><td class="right num accent total">{formatGold(result.total)}</td></tr>
    </tfoot>
  </table>
  </div>

  <p class="note">
    The F4 exchange input above is the only lever on this tab: it prices the Crystalline Aura Plus and
    sets the vs-F4 baseline, while the gem and astrogem values are fixed seeds. The cumulative figure on
    each level row is what you'd have banked if that is the last milestone you reach.
  </p>
</div>

<style>
  .ju {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c; --warn: #f0b341;
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
  dd.good { color: var(--good); }
  dd.bad { color: var(--bad); }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .lbl, .muted { color: var(--muted); }
  .warn { color: var(--warn); font-size: 12.5px; }
  .bad { color: var(--bad); }
  .ic { width: 15px; height: 15px; }
  /* The shared F4 input, laid out like the Packs tab's exchange row but on its own card. */
  .exch { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 13px; }
  input.f4 { width: 90px; background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
    border-radius: 6px; padding: 4px 6px; font: 600 13px "JetBrains Mono", monospace; }
  .fine { color: var(--muted); font-size: 11.5px; line-height: 1.45; margin: 10px 0 0; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 560px; border-collapse: collapse; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  th { color: var(--muted); font-weight: 500; }
  .right { text-align: right; }
  td.accent { color: var(--accent); }
  .ic-col { width: 30px; }
  .rname { color: var(--text); }
  .bound { color: var(--muted); font-size: 12px; }
  .chestnote { display: block; color: var(--muted); font-size: 11.5px; margin-top: 1px; }
  tr:hover td { background: var(--panel-2); }
  /* Milestone header rows: a gold badge, the ilvl requirement, and the level's own + running gold. */
  tr.lvl td { background: rgba(255, 209, 102, .06); padding-top: 9px; padding-bottom: 7px; }
  tr.lvl:hover td { background: rgba(255, 209, 102, .09); }
  .lv { display: inline-block; color: var(--accent); font-weight: 700; font-size: 12px; letter-spacing: .4px;
    border: 1px solid rgba(255, 209, 102, .5); border-radius: 999px; padding: 1px 8px; margin-right: 6px; }
  .req { font-weight: 600; }
  .chest { color: var(--muted); font-size: 11.5px; margin-left: 6px; }
  .cum { color: var(--muted); font-size: 11.5px; margin-left: 8px; white-space: nowrap; }
  .cum .num { color: var(--text); }
  tfoot td { border-bottom: 0; padding-top: 10px; }
  .total-lbl { font-weight: 700; }
  .total { font-weight: 700; font-size: 15px; }
</style>
