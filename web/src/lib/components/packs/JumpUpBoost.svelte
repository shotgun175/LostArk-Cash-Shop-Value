<script lang="ts">
  import { jumpUpRows, JUMP_UP_EDITABLE_SLUGS } from "$lib/packs/jumpUpRows";
  import { JUMP_UP_RC, JUMP_UP_LEVELS } from "$lib/packs/data/jumpUp";
  import { layeredPrices } from "$lib/packs/prices.svelte";
  import { f4 } from "$lib/packs/f4.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { cashPerRc, currencySymbol, vsExchangePct } from "$lib/packs/exchange";
  import { BAR_OVERRIDES } from "$lib/valuesBar";
  import { app } from "$lib/app.svelte";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";
  import PriceEdit from "./PriceEdit.svelte";
  import { base } from "$app/paths";

  // The same fully layered map the Packs tab values against (layeredPrices(): baked seeds + live +
  // tap prices + BC items off the F4 input). Nothing on this track is a raw feed slug, so the raw
  // effectivePrices() map would value every reward at 0.
  const prices = $derived(layeredPrices());
  const result = $derived(jumpUpRows(prices));
  const f4base = $derived(f4.perRc);
  const vsF4 = $derived(vsExchangePct(result.goldPerRc, f4base));
  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU
  const goldPerDollar = $derived(Math.round(result.total / (JUMP_UP_RC * cashPerRc(app.region))));
  const levels = JUMP_UP_LEVELS.length;
  const rc = JUMP_UP_RC.toLocaleString("en-US");

  // The prices entered for this track's rewards, here or on another tab showing the same item. The
  // Lv. 8 gem price is a Your values setting, so it is neither counted nor reset here (as on Packs).
  const customSlugs = $derived(
    [...JUMP_UP_EDITABLE_SLUGS].filter((s) => !BAR_OVERRIDES.has(s) && overrides.has(app.region, s)),
  );
  function resetPrices(): void {
    for (const s of customSlugs) overrides.clear(app.region, s);
  }
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
  </div>

  <p class="note">
    Bound Lv. 8 Brilliant Gems are valued at the region's Lv. 8 gem price. Fixed Epic Astrogem
    Selection Chests default to 75,000 gold each. Crystalline Aura Plus is valued at its store cost (510 BC
    per 30 days, so 238 BC for 14 days) x the exchange rate. Azena's Blessing and the Ancient bracelet /
    accessory chests have no market value and count as 0 until you enter a value for them.
  </p>

  <p class="note edit-note">
    Click a unit price to enter your own value, including the items with no market value. Your prices
    are saved per region and used on every tab that shows the same item.{#if customSlugs.length > 0}{" "}<span class="custom"><span><b class="num">{customSlugs.length}</b> custom price{customSlugs.length === 1 ? "" : "s"}</span> <button class="reset" title="Clear the prices entered for this tab's rewards" onclick={resetPrices}>reset</button></span>{/if}
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
                <!-- {" "}: Svelte drops a tag's leading space, which glued "(Bound)" to the name and
                     made "Bracelet(Bound)" one word too wide for a phone. -->
                <span class="rname">{displayName(l.slug)}</span>{#if l.isBound}<span class="bound">{" "}(Bound)</span>{/if}
                {#if l.chest.replace(/ \(Bound\)$/, "") !== displayName(l.slug)}<span class="chestnote">{l.chestQty}× {l.chest}</span>{/if}
              {/if}
            </td>
            <td class="right num">{l.qty ? l.qty.toLocaleString("en-US") : "—"}</td>
            <td class="right price">{#if l.unresolved}<span class="num muted">—</span>{:else}<PriceEdit
                slug={l.slug} value={l.priced ? l.perUnit : null} readOnly={!!l.isCurrency}
                readOnlyTitle="Gold counts at face value." emptyText="set price"
                title="Click to enter your own value" editLabel="Edit unit price for" />{/if}</td>
            <td class="right num accent">{#if l.priced}{formatGold(l.gold)}{:else}<span class="warn">no price</span>{/if}</td>
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
    Two values from Your values move this tab: the F4 exchange prices the Crystalline Aura Plus and
    sets the vs-F4 baseline, and the Lv. 8 gem price values the gems (a gem's unit price here is that
    same setting). A price you enter for the aura replaces its exchange-based value. The cumulative
    figure on each level row is what you'd have banked if that is the last milestone you reach.
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
  .muted { color: var(--muted); }
  .warn { color: var(--warn); font-size: 12.5px; }
  .bad { color: var(--bad); }
  .ic { width: 15px; height: 15px; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 560px; border-collapse: collapse; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  th { color: var(--muted); font-weight: 600; }
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
  td.price { white-space: nowrap; }
  /* The click-to-edit line and its "N custom prices · reset" chip (the Packs tab's chip style). */
  .edit-note { line-height: 1.9; }
  .custom { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; white-space: nowrap;
    vertical-align: middle; color: var(--accent); background: rgba(255, 209, 102, 0.1);
    border: 1px solid rgba(255, 209, 102, 0.4); border-radius: 6px; padding: 3px 10px; }
  .custom .num { color: var(--accent); }
  /* The ::after widens the tap target past the small pill without changing how it looks. */
  .reset { position: relative; background: rgba(255, 209, 102, 0.12); color: var(--accent);
    border: 1px solid rgba(255, 209, 102, 0.5); padding: 3px 10px; border-radius: 6px; font-size: 12px;
    font-weight: 600; cursor: pointer; font-family: inherit; }
  .reset::after { content: ""; position: absolute; inset: -10px -6px; }
  .reset:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  /* Phones: drop the table's min-width, tighten the cells and step the text down so every column,
     the clickable Unit prices included, fits the screen with no sideways swipe (as on the pack
     drill-down), with an editor open too. Reward names and the level rows wrap; the running total
     moves under the level's gold. */
  @media (max-width: 640px) {
    .tscroll table { min-width: 0; }
    .tscroll th, .tscroll td { padding-left: 4px; padding-right: 4px; font-size: 12.5px; }
    .tscroll td.total { font-size: 14px; }
    .cum { display: block; margin-left: 0; white-space: normal; }
  }
</style>
