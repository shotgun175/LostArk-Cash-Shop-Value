<script lang="ts">
  import { packValue } from "$lib/packs/packValue";
  import { packDetail, type DetailOption } from "$lib/packs/packDetail";
  import { buildPriceMap, F4_DERIVED_SLUGS } from "$lib/packs/priceMap";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { f4 } from "$lib/packs/f4.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { customSel } from "$lib/packs/customSel.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { cashPerRc, currencySymbol, RC_CASH_PER_12K, F4_DIVISOR } from "$lib/packs/exchange";
  import { BC_PER_BUNDLE } from "$lib/packs/data/marisShop";
  import { app } from "$lib/app.svelte";
  import { formatGold, formatMoney } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "$lib/components/ItemIcon.svelte";
  import GoldRate from "$lib/components/packs/GoldRate.svelte";
  import { base } from "$app/paths";

  let { data } = $props();
  const pack = $derived(data.pack);

  // Mirror the card path: live feed + overrides + trade-ups, then buildPriceMap layers the
  // hell-key / ebony-cube / relic-recipe EVs so the drill-down total matches the all-packs card.
  // tapOverrides keeps this in step with the card path: a manual tap price set on the Hell Key
  // tab applies to every key-bearing pack, here too.
  const prices = $derived(
    buildPriceMap(effectivePrices(), {
      blueCrystalGold: f4.perBc,
      tapOverrides: hellSettings.tapOverride[app.region],
    }),
  );
  // Retired packs are a read-only reference: no price edits / picks, and the header shows the frozen
  // value-at-retirement (the breakdown below stays at current prices for reference).
  const readOnly = $derived(pack.retired);
  const picksForView = $derived(pack.retired ? {} : selection.map);
  const customPicksForView = $derived(pack.retired ? {} : customSel.map);
  const value = $derived(packValue(pack, prices, picksForView, cashPerRc(app.region), pack.retired, customPicksForView));
  const chests = $derived(packDetail(pack, prices, picksForView, customPicksForView));
  // Choose-N-of-M packs: the currently counted option chests (drives the checkboxes).
  const countedChests = $derived(pack.customSelection ? chests.filter((c) => c.counted).map((c) => c.chest) : []);
  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU — RC priced per region
  // Summary-box real-money row: "per US dollar (12,000 RC = $100)" / "per Euro (12,000 RC = €94.99)".
  const cashName = $derived(app.region === "euc" ? "Euro" : "US dollar");
  const cashRate = $derived(`12,000 RC = ${sym}${RC_CASH_PER_12K[app.region]}`);
  // BC packs' money row prices the BC cost in shop money via the 95 BC = 238 RC equivalence
  // (matches packValue's goldPerDollar); the rate note spells the chain out.
  const bcRcEquiv = $derived(pack.blueCrystalCost != null ? (pack.blueCrystalCost * F4_DIVISOR) / BC_PER_BUNDLE : null);
  const bcCashRate = $derived(
    bcRcEquiv == null
      ? ""
      : `${pack.blueCrystalCost!.toLocaleString("en-US")} BC = ${Math.round(bcRcEquiv).toLocaleString("en-US")} RC = ${formatMoney(bcRcEquiv * cashPerRc(app.region), sym)}`,
  );

  const customCount = $derived(overrides.count(app.region));
  const tuCount = $derived(tradeUp.count());
  // Selection-chest picks and choose-N-of-M pack picks share the "picks" chip.
  const pickCount = $derived(selection.count() + customSel.count());

  // Pack image (reset the load flag when navigating between packs).
  let imgOk = $state(true);
  // Also clear expanded selection chests so an expand on one pack doesn't bleed onto the next
  // (SvelteKit reuses this component across /pack/[slug] navigations, and chest names can repeat).
  $effect(() => { void pack.slug; imgOk = true; expandedChests = {}; });

  // Click-to-edit market prices — writes the shared, site-wide override store.
  let editing = $state<string | null>(null);
  let draft = $state("");
  let original = $state(""); // value shown when the editor opened; used to ignore no-op edits
  function startEdit(o: DetailOption): void {
    editing = o.slug;
    draft = o.perUnit > 0 ? String(Number(o.perUnit.toFixed(4))) : "";
    original = draft;
  }
  function commit(slug: string): void {
    const v = parseFloat(draft);
    editing = null;
    if (!Number.isFinite(v) || v < 0) return;
    // Opening a price and clicking away without changing it must not create a "custom" override.
    if (v === parseFloat(original)) return;
    overrides.set(app.region, slug, v);
  }
  function focusSelect(el: HTMLInputElement): void { el.focus(); el.select(); }

  const tagFor = (t: string) => (t === "selection" ? "select" : t === "multi" ? "everything" : "fixed");

  // Selection chests show only the chosen option by default; this toggles the rest into view.
  let expandedChests = $state<Record<string, boolean>>({});
  function toggleChest(name: string): void {
    expandedChests = { ...expandedChests, [name]: !expandedChests[name] };
  }
</script>

<section class="detail">
  <a class="back" href="{base}/">← All packs</a>

  <div class="info">
      <h2>{pack.name}</h2>
      <!-- Store-listing meta line (user 2026-08-19, mirrors TJW's drill-down): what it costs,
           how it recurs, and how many the game lets one roster buy. -->
      <div class="meta">
        {#if pack.blueCrystalCost != null}
          <span class="cost"><img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" /><b class="num">{pack.blueCrystalCost.toLocaleString("en-US")}</b> Blue Crystals</span>
        {:else if pack.royalCrystalCost != null}
          <span class="cost"><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /><b class="num">{pack.royalCrystalCost.toLocaleString("en-US")}</b> Royal Crystals</span>
        {/if}
        {#if pack.limited}<span class="tag">limited</span>{/if}
        {#if pack.recurrence}<span class="tag">{pack.recurrence}</span>{/if}
        {#if pack.maxPurchases}<span class="tag limit">max {pack.maxPurchases} per roster{pack.recurrence ? ` / ${pack.recurrence === "weekly" ? "week" : "month"}` : ""}</span>{/if}
      </div>
      {#if readOnly}
        <div class="retired-banner">
          <span class="rb-pill">retired</span>
          <span>This pack is no longer offered in-game{pack.retiredOn ? ` (removed ${pack.retiredOn})` : ""}. The totals are its value at retirement; material prices below are current, kept for historical reference.</span>
        </div>
      {:else}
        <p class="hint">
          Click any market price to enter your own AH value, or click a selection-chest option to value
          the pack with your pick; changes apply site-wide until reset. The highest-value option (✓)
          counts by default.
        </p>
        {#if pack.customSelection}
          <div class="cs-bar">
            <span class="cs-title">Choose {pack.customSelection.pick} of {pack.customSelection.options.length}</span>
            <span class="cs-count num">{countedChests.length}/{pack.customSelection.pick} picked</span>
            <span class="cs-note">— tick the option chests below; the {pack.customSelection.pick} highest-gold ones count by default</span>
            {#if customSel.has(pack.slug)}
              <button class="chest-reset" title="Restore the highest-value picks" onclick={() => customSel.clearOne(pack.slug)}>reset picks</button>
            {/if}
          </div>
        {/if}
        {#if customCount > 0 || tuCount > 0 || pickCount > 0}
          <div class="custom">
            <span>{#if customCount > 0}<b class="num">{customCount}</b> custom price{customCount === 1 ? "" : "s"}{/if}{#if customCount > 0 && (tuCount > 0 || pickCount > 0)} · {/if}{#if pickCount > 0}<b class="num">{pickCount}</b> pick{pickCount === 1 ? "" : "s"}{/if}{#if pickCount > 0 && tuCount > 0} · {/if}{#if tuCount > 0}<b class="num">{tuCount}</b> trade-up{tuCount === 1 ? "" : "s"}{/if}</span>
            <button class="reset-all" onclick={() => { overrides.clearAll(app.region); tradeUp.clear(); selection.clearAll(); customSel.clearAll(); }}>reset all</button>
          </div>
        {/if}
      {/if}
    </div>

  <div class="body">
    <div class="img">
      {#if imgOk}
        <img src="{base}/packs/{pack.slug}.png" alt={pack.name} onerror={() => (imgOk = false)} />
      {:else}
        <div class="img-ph">pack image</div>
      {/if}
    </div>
    <div class="chests">

      <div class="summary">
        <div class="srow total">
          <span class="slabel">Total gold</span>
          <span class="sval"><b class="num accent">{formatGold(value.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" /></span>
        </div>
        {#if pack.blueCrystalCost != null}
          <!-- BC-priced pack: the gold comparison is against buying that BC at the F4 exchange
               (input / 95); the money row prices the BC in shop money via 95 BC = 238 RC, so
               the g/$ figure shares the RC packs' scale. -->
          <div class="srow">
            <span class="slabel">per Blue Crystal <img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" /></span>
            <span class="sval"><GoldRate value={value.goldPerBc} unit="bc" /></span>
          </div>
          <div class="srow">
            <span class="slabel">gold to buy {pack.blueCrystalCost.toLocaleString("en-US")} <img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" /> <span class="rate">(F4 exchange)</span></span>
            <span class="sval">{#if f4.perBc > 0}<b class="num">{formatGold(pack.blueCrystalCost * f4.perBc)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" />{:else}<span class="num muted" title="Set the exchange input on the Packs tab">—</span>{/if}</span>
          </div>
          <div class="srow">
            <span class="slabel">per {cashName} <span class="rate">({bcCashRate})</span></span>
            <span class="sval"><GoldRate value={value.goldPerDollar} unit="cash" {sym} /></span>
          </div>
        {:else}
          <div class="srow">
            <span class="slabel">per Royal Crystal <img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /></span>
            <span class="sval"><GoldRate value={value.goldPerRc} unit="rc" /></span>
          </div>
          <div class="srow">
            <span class="slabel">per {cashName} <span class="rate">({cashRate})</span></span>
            <span class="sval"><GoldRate value={value.goldPerDollar} unit="cash" {sym} /></span>
          </div>
        {/if}
      </div>

  {#each chests as c (c.chest)}
    <div class="chest" class:uncounted={!c.counted}>
      <div class="chest-head">
        {#if pack.customSelection && !readOnly}
          <label class="cs-check" title={c.counted ? "Counts toward the pack total" : "Not picked"}>
            <!-- No preventDefault: a canceled click reverts the box AFTER Svelte's flush and
                 leaves it visually stuck. clickToggle (customSel.svelte.ts) reconciles the DOM. -->
            <input type="checkbox" checked={c.counted}
              disabled={!c.counted && countedChests.length >= pack.customSelection.pick}
              onclick={(e) => customSel.clickToggle(e, pack.slug, c.chest, pack.customSelection!.pick, () => countedChests)} />
          </label>
        {/if}
        <span class="chest-name">{c.qty}× {c.chest}</span>
        <span class="tag">{tagFor(c.type)}</span>
        {#if pack.customSelection && !c.counted}<span class="tag">not picked</span>{/if}
        <!-- The per-chest total only adds information for "everything" chests, where several
             differently-valued lines sum up, and on choose-N-of-M packs, where it is the
             number the checkbox decision weighs. For fixed/selection it equals the single
             counted line, so it would just repeat the Gold column. -->
        {#if c.type === "multi" || pack.customSelection}
          <span class="chest-gold num accent">{formatGold(c.gold)}<img class="ic" src="{base}/icons/gold.png" alt="g" /></span>
        {/if}
      </div>
      {#if c.isSelection && c.options.length > 1}
        {@const chosen = c.options.find((o) => o.chosen) ?? c.options[0]}
        <div class="chest-default">
          <span class="default-label">{!readOnly && selection.has(c.chest) ? "Picked" : "Default"}:</span>
          <span class="default-item">{displayName(chosen.slug)}{#if chosen.isBound}<span class="bound"> (Bound)</span>{/if}</span>
          <span class="sep">·</span>
          <button class="opts-toggle" onclick={() => toggleChest(c.chest)}>{expandedChests[c.chest] ? "Hide options" : `Show all ${c.options.length} options`}</button>
          {#if !readOnly && selection.has(c.chest)}
            <button class="chest-reset" title="Restore the highest-value pick" onclick={() => selection.clearOne(c.chest)}>reset pick</button>
          {/if}
        </div>
      {/if}
      {#if c.unresolved}
        <p class="unresolved">Unmapped chest (not valued).</p>
      {:else}
        <div class="tscroll">
        <table>
          <thead>
            <tr><th class="ic-col" aria-label="icon"></th><th>Item</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Gold</th></tr>
          </thead>
          <tbody>
            {#each c.options as o (o.slug)}
              {#if !c.isSelection || o.chosen || expandedChests[c.chest]}
              <tr class:dim={c.isSelection && !o.chosen}>
                <td class="ic-col"><ItemIcon slug={o.slug} /></td>
                <td>
                  {#if c.isSelection && !readOnly}
                    <button class="pick-name" class:chosen={o.chosen} title="Value this pack with this option" onclick={() => selection.set(c.chest, o.slug)}>{displayName(o.slug)}</button>{#if o.isBound}<span class="bound"> (Bound)</span>{/if}{#if o.chosen}<span class="pick">✓ counts</span>{/if}
                  {:else}
                    {displayName(o.slug)}{#if o.isBound}<span class="bound"> (Bound)</span>{/if}{#if c.isSelection && o.chosen}<span class="pick">✓ counts</span>{/if}
                  {/if}
                </td>
                <td class="right num">{o.totalQty.toLocaleString("en-US")}</td>
                <td class="right price">
                  {#if readOnly}
                    <span class="num">{o.perUnit > 0 ? formatGold(o.perUnit) : "—"}</span>
                  {:else if F4_DERIVED_SLUGS.has(o.slug)}
                    <!-- F4-derived currency (blue crystal): the exchange input is the single
                         source of truth, so no edit affordance here. -->
                    <span class="num price-ro" title="Priced from the F4 exchange input (gold / 95). Change the exchange input to change it.">{o.perUnit > 0 ? formatGold(o.perUnit) : "—"}</span>
                  {:else if editing === o.slug}
                    <input class="edit num" type="number" min="0" step="0.01" bind:value={draft} use:focusSelect
                      onblur={() => commit(o.slug)}
                      onkeydown={(e) => { if (e.key === "Enter") commit(o.slug); else if (e.key === "Escape") editing = null; }}
                      aria-label="Edit market price for {displayName(o.slug)}" />
                  {:else}
                    <button class="price-btn num" class:edited={overrides.has(app.region, o.slug)}
                      title="Click to enter your own AH price" onclick={() => startEdit(o)}>{o.perUnit > 0 ? formatGold(o.perUnit) : "—"}</button>
                  {/if}
                </td>
                <td class="right num accent">{o.lineGold > 0 ? formatGold(o.lineGold) : "—"}</td>
              </tr>
              {/if}
            {/each}
          </tbody>
        </table>
        </div>
      {/if}
    </div>
  {/each}
    </div>
  </div>
</section>

<style>
  .detail {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c;
    color: var(--text); font-family: "Sora", system-ui, sans-serif; max-width: 980px;
  }
  .back { color: var(--accent); text-decoration: none; font-size: 13px; }
  .back:hover { text-decoration: underline; }
  .info { margin: 8px 0 14px; }
  /* Desktop: items on the left, pack image on the right (row-reverse puts the image — first in the
     DOM — on the right). Mobile: column keeps DOM order, so the image sits above the contents. */
  .body { display: flex; flex-direction: row-reverse; gap: 20px; align-items: flex-start; }
  .chests { flex: 1; min-width: 0; }
  .img { flex: none; width: 300px; }
  .img img { width: 100%; border-radius: 10px; border: 1px solid var(--border); display: block; }
  .img-ph { width: 100%; aspect-ratio: 4 / 3; border: 1px dashed var(--border); border-radius: 10px;
    display: grid; place-items: center; color: var(--muted); font-size: 12px; background: var(--panel); }
  @media (max-width: 640px) {
    .body { flex-direction: column; }
    .img { width: 100%; max-width: 320px; }
    /* Column + flex-start would size the items column to the table's min-width and overflow the
       page; pin it to the viewport so the wide table scrolls inside its own container instead. */
    .chests { width: 100%; }
  }
  h2 { margin: 8px 0 8px; font-size: 22px; }
  /* Store-listing meta chips under the title: cost readout + limited/recurrence/limit pills. */
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13px; }
  .cost { display: inline-flex; align-items: center; gap: 5px; color: var(--text); font-weight: 600; }
  .cost .ic { width: 15px; height: 15px; margin: 0; }
  .tag.limit { color: var(--accent); border-color: rgba(255, 209, 102, .5); background: rgba(255, 209, 102, .08); font-weight: 600; }
  .sep { color: var(--muted); opacity: .5; }
  /* Value summary box at the top of the breakdown (replaces the old under-title stats line). */
  .summary { background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 14px; margin-bottom: 12px; }
  .srow { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 3px 0; }
  .srow.total { font-size: 17px; border-bottom: 1px solid var(--border); padding-bottom: 7px; margin-bottom: 3px; }
  .srow.total .slabel { color: var(--text); font-weight: 600; font-size: 15px; }
  .slabel { color: var(--muted); font-size: 13px; }
  .rate { font-size: 11.5px; opacity: .8; }
  .sval { white-space: nowrap; }
  /* Retired-pack disclaimer banner shown above the breakdown. */
  .retired-banner { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
    background: rgba(239, 111, 108, .1); border: 1px solid rgba(239, 111, 108, .4); border-radius: 6px;
    padding: 8px 12px; margin: 8px 0 12px; font-size: 12.5px; color: var(--muted); line-height: 1.5; }
  .rb-pill { flex: none; text-transform: uppercase; letter-spacing: .3px; font-size: 10px; font-weight: 700;
    color: var(--bad); background: rgba(239, 111, 108, .16); border: 1px solid rgba(239, 111, 108, .55);
    border-radius: 999px; padding: 2px 8px; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .muted { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin-left: 2px; }
  .hint { color: var(--muted); font-size: 12.5px; line-height: 1.5; margin: 0 0 10px; }
  .custom { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600;
    color: var(--accent); background: rgba(255, 209, 102, 0.1); border: 1px solid rgba(255, 209, 102, 0.4);
    border-radius: 6px; padding: 5px 11px; }
  .custom .num { color: var(--accent); }
  .reset-all { background: rgba(255, 209, 102, 0.12); color: var(--accent); border: 1px solid rgba(255, 209, 102, 0.5);
    padding: 2px 9px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .reset-all:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  .chest { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  /* Choose-N-of-M: unpicked option chests stay visible for comparison but read as inactive. */
  .chest.uncounted { opacity: .55; }
  .cs-check { display: inline-flex; align-items: center; cursor: pointer; }
  .cs-check input { accent-color: var(--accent); cursor: pointer; }
  .cs-check input:disabled { cursor: not-allowed; }
  .cs-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 10px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 12px; font-size: 12.5px; }
  .cs-title { font-weight: 700; letter-spacing: .6px; text-transform: uppercase; font-size: 11px; color: var(--muted); }
  .cs-count { color: var(--accent); font-weight: 600; }
  .cs-note { color: var(--muted); }
  .chest-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 4px; }
  .chest-name { font-weight: 600; }
  .tag { padding: 1px 8px; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .chest-gold { margin-left: auto; }
  /* Selection-chest second line: "Default: <item> · show all N options". */
  .chest-default { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 2px 0 8px; font-size: 12.5px; }
  .default-label { color: var(--muted); }
  .default-item { color: var(--text); font-weight: 600; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 420px; border-collapse: collapse; }
  th { padding: 5px 8px; text-align: left; font-size: 11px; font-weight: 500; color: var(--muted);
    border-bottom: 1px solid var(--border); }
  td { padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  tbody tr:last-child td { border-bottom: 0; }
  .right { text-align: right; }
  td.accent { color: var(--accent); }
  .ic-col { width: 30px; }
  tr.dim td { opacity: .5; }
  .bound { color: var(--muted); font-size: 12px; }
  .pick { color: var(--good); font-size: 11px; margin-left: 8px; }
  .pick-name { background: none; border: 0; padding: 0; cursor: pointer; color: var(--text);
    font-size: 13.5px; font-family: inherit; text-align: left; }
  .pick-name:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .pick-name.chosen { cursor: default; }
  .pick-name.chosen:hover { color: var(--text); text-decoration: none; }
  .chest-reset { background: rgba(255, 209, 102, 0.12); color: var(--accent);
    border: 1px solid rgba(255, 209, 102, 0.5); padding: 1px 9px; border-radius: 999px;
    font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .chest-reset:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  .opts-toggle { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 999px;
    padding: 1px 9px; font-size: 11px; cursor: pointer; font-family: inherit; }
  .opts-toggle:hover { color: var(--accent); border-color: var(--accent); }
  .unresolved { color: var(--muted); font-size: 13px; margin: 4px 0 0; }
  .price-ro { color: var(--muted); font-size: 13.5px; cursor: help; }
  .price-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted); font-size: 13.5px; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
</style>
