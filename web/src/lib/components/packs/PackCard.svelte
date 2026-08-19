<script lang="ts">
  import type { PackRow } from "$lib/packs/packRows";
  import type { PackLine } from "$lib/packs/packValue";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import { currencySymbol } from "$lib/packs/exchange";
  import { app } from "$lib/app.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { customSel } from "$lib/packs/customSel.svelte";
  import { F4_DERIVED_SLUGS } from "$lib/packs/priceMap";
  import type { DetailOption } from "$lib/packs/packDetail";
  import ItemIcon from "../ItemIcon.svelte";
  import GoldRate from "./GoldRate.svelte";
  import { base } from "$app/paths";

  interface CustomBlock {
    pick: number;
    options: { chest: string; qty: number; gold: number; counted: boolean }[];
  }

  let { row, tradeUpInfo = {}, alts = {}, custom = null, compact = false }: {
    row: PackRow;
    tradeUpInfo?: Record<string, { ratio: number; deltaPct: number }>;
    alts?: Record<string, DetailOption[]>;
    custom?: CustomBlock | null; // choose-N-of-M packs: the checkbox option rows
    compact?: boolean; // retired cards: stats + drill-down link only, no material table
  } = $props();

  let expanded = $state<string | null>(null); // material slug whose selection alts are shown
  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU — RC priced per region
  const countedChests = $derived(custom ? custom.options.filter((o) => o.counted).map((o) => o.chest) : []);

  // "2026-06-24" -> "6/24/26" for the RETIRED pill. Parsed by parts (not new Date) to avoid the
  // UTC-midnight-shifts-a-day timezone trap. Falls back to a bare "retired" if the date is absent.
  function retiredLabel(iso?: string): string {
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "retired";
    return `retired ${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}`;
  }
  function perUnit(gold: number, qty: number): string {
    return gold > 0 && qty > 0 ? formatGold(gold / qty) : "—";
  }

  // Click-to-edit market price → a per-unit override for that slug (applies everywhere it appears).
  let editing = $state<string | null>(null);
  let draft = $state("");
  let original = $state(""); // value shown when the editor opened; used to ignore no-op edits

  function startEdit(line: PackLine): void {
    editing = line.slug;
    draft = line.gold > 0 && line.qty > 0 ? String(Number((line.gold / line.qty).toFixed(4))) : "";
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
  function focusSelect(el: HTMLInputElement): void {
    el.focus();
    el.select();
  }
</script>

<div class="card" class:retired={row.retired}>
  <div class="head">
    <a class="title" href="{base}/pack/{row.slug}">{row.name}</a>
    {#if row.retired}<span class="tag retired-tag">{retiredLabel(row.retiredOn)}</span>{/if}
    {#if row.recurrence}<span class="tag">{row.recurrence}</span>{/if}
    {#if row.limited}<span class="tag">limited</span>{/if}
    {#if row.maxPurchases}<span class="tag" title="In-game purchase limit{row.recurrence ? ` per ${row.recurrence === 'weekly' ? 'week' : 'month'}` : ''}">{row.maxPurchases}/roster</span>{/if}
  </div>

  <div class="stats">
    {#if row.blueCrystalCost != null}
      <!-- BC-priced pack: cost in Blue Crystals, rate as gold/BC; no cash figure (BC isn't
           bought with real money — it's valued against the F4 exchange input / 95). -->
      <span><b class="num accent">{row.blueCrystalCost.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" /></span>
      <span class="sep">·</span>
      <span><b class="num">{formatGold(row.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" /></span>
      <span class="sep">·</span>
      <span><GoldRate value={row.goldPerBc} unit="bc" /></span>
    {:else}
      <span><b class="num accent">{(row.royalCrystalCost ?? 0).toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /></span>
      <span class="sep">·</span>
      <span><b class="num">{formatGold(row.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" /></span>
      <span class="sep">·</span>
      <span><GoldRate value={row.goldPerRc} unit="rc" /></span>
      <span class="sep">·</span>
      <span><GoldRate value={row.goldPerDollar} unit="cash" {sym} /></span>
    {/if}
  </div>

  {#if compact}
    <p class="ref-note">Open the <a class="ref-link" href="{base}/pack/{row.slug}">drill-down</a> for the full mat breakdown.</p>
  {:else}
  <div class="cmp">
    <span class="pct" class:good={row.vsExchange != null && row.vsExchange >= 0} class:bad={row.vsExchange != null && row.vsExchange < 0}>
      <b class="num">{formatSignedPct(row.vsExchange)}</b> <span class="lbl">vs exchange</span>
    </span>
    {#if row.blueCrystalCost == null}
      <span class="pct" class:good={row.vsG2G != null && row.vsG2G >= 0} class:bad={row.vsG2G != null && row.vsG2G < 0}>
        <b class="num">{formatSignedPct(row.vsG2G)}</b> <span class="lbl">vs</span><img class="ic g2g" src="{base}/icons/g2g.png" alt="G2G" />
      </span>
    {/if}
  </div>

  {#if custom}
    <div class="cs">
      <div class="cs-head">
        <span class="cs-title">Choose {custom.pick} of {custom.options.length}</span>
        <span class="cs-count num">{countedChests.length}/{custom.pick} picked</span>
        {#if customSel.has(row.slug)}
          <button class="cs-reset" title="Restore the highest-value picks" onclick={() => customSel.clearOne(row.slug)}>reset picks</button>
        {/if}
      </div>
      {#each custom.options as o (o.chest)}
        <label class="cs-opt" class:off={!o.counted}>
          <!-- Fully state-driven checkbox: preventDefault stops the native flip, so the DOM can
               never diverge from checked={o.counted}. Without it, unchecking the last stored
               pick snaps the store back to the default set (which may re-include this chest);
               Svelte's memoized checked-write then skips the element and the box stays visually
               unchecked while its gold counts. Space-key toggles dispatch click, so keyboard
               use is covered. -->
          <input type="checkbox" checked={o.counted}
            disabled={!o.counted && countedChests.length >= custom.pick}
            onclick={(e) => { e.preventDefault(); customSel.toggle(row.slug, o.chest, custom.pick, countedChests); }} />
          <span class="cs-name">{o.qty}× {o.chest}</span>
          <span class="cs-gold num">{o.gold > 0 ? formatGold(o.gold) : "—"}</span>
        </label>
      {/each}
    </div>
  {/if}

  <div class="tscroll">
  <table>
    <thead>
      <tr><th class="ic-col" aria-label="icon"></th><th>Material</th><th class="right">Total qty</th><th class="right">Market price</th><th class="right">Gold</th></tr>
    </thead>
    <tbody>
      {#each row.lines as line (line.slug)}
        <tr>
          <td class="ic-col"><ItemIcon slug={line.slug} /></td>
          <td>{displayName(line.slug)}{#if line.isBound}<span class="bound"> (Bound)</span>{/if}{#if tradeUpInfo[line.slug]} <button class="tradeup" class:on={tradeUp.has(line.slug)} title="Value as a {tradeUpInfo[line.slug].ratio}:1 trade-up to the next tier" onclick={() => tradeUp.toggle(line.slug)}>{tradeUpInfo[line.slug].ratio}:1 → <span class:good={tradeUpInfo[line.slug].deltaPct >= 0} class:bad={tradeUpInfo[line.slug].deltaPct < 0}>{formatSignedPct(tradeUpInfo[line.slug].deltaPct)}</span></button>{/if}{#if alts[line.slug]} <button class="alts-btn" onclick={() => (expanded = expanded === line.slug ? null : line.slug)}>{expanded === line.slug ? "hide alts" : "show alts"}</button>{/if}</td>
          <td class="right num">{line.qty.toLocaleString("en-US")}</td>
          <td class="right price">
            {#if F4_DERIVED_SLUGS.has(line.slug)}
              <!-- F4-derived currency: the exchange input is the single source of truth, so no
                   edit affordance (an override would be silently out-layered anyway). -->
              <span class="num price-ro" title="Priced from the F4 exchange input (gold / 95). Change the exchange input to change it.">{perUnit(line.gold, line.qty)}</span>
            {:else if editing === line.slug}
              <input
                class="edit num" type="number" min="0" step="0.01" bind:value={draft}
                use:focusSelect
                onblur={() => commit(line.slug)}
                onkeydown={(e) => { if (e.key === "Enter") commit(line.slug); else if (e.key === "Escape") editing = null; }}
                aria-label="Edit market price for {displayName(line.slug)}" />
            {:else}
              <button class="price-btn num" class:edited={overrides.has(app.region, line.slug)}
                title="Click to enter your own AH price" onclick={() => startEdit(line)}>
                {perUnit(line.gold, line.qty)}
              </button>
            {/if}
          </td>
          <td class="right num accent">{line.gold > 0 ? formatGold(line.gold) : "—"}</td>
        </tr>
        {#if expanded === line.slug && alts[line.slug]}
          {#each alts[line.slug].filter((o) => !o.chosen) as alt (alt.slug)}
            <tr class="alt">
              <td class="ic-col"><ItemIcon slug={alt.slug} /></td>
              <td class="altname">↳ {displayName(alt.slug)}{#if alt.isBound}<span class="bound"> (Bound)</span>{/if}</td>
              <td class="right num">{alt.totalQty.toLocaleString("en-US")}</td>
              <td class="right num muted">{alt.perUnit > 0 ? formatGold(alt.perUnit) : "—"}</td>
              <td class="right num">{alt.lineGold > 0 ? formatGold(alt.lineGold) : "—"}</td>
            </tr>
          {/each}
        {/if}
      {/each}
    </tbody>
  </table>
  </div>
  {/if}
</div>

<style>
  /* Content palette (--panel/--border/--accent/...) is provided by PacksPanel, matching TJW. */
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; min-width: 0; }
  .card.retired { opacity: .72;
    transition: opacity .15s ease, border-color .15s ease, box-shadow .2s ease, transform .15s ease; }
  .card.retired:hover { opacity: 1; border-color: var(--accent);
    box-shadow: 0 0 0 1px rgba(255, 209, 102, .35), 0 10px 26px rgba(0, 0, 0, .45);
    transform: translateY(-2px); }
  .card.retired:hover .title { color: var(--accent); }
  /* RETIRED pill is grey at rest (inherits the base .tag colours) and turns red only while the card
     is hovered, in step with the card's hover highlight. .tag.retired-tag keeps the compact shape. */
  .tag.retired-tag { text-transform: uppercase; letter-spacing: .3px; font-size: 10px; font-weight: 600;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease; }
  .card.retired:hover .retired-tag { color: var(--bad);
    background: rgba(239, 111, 108, .16); border-color: rgba(239, 111, 108, .55); }
  /* Slightly smaller title on the reference cards so it + the RETIRED pill fit on the first line
     like TJW (any extra tags wrap below). */
  .card.retired .title { font-size: 14px; }
  .ref-note { color: var(--muted); font-size: 12.5px; margin: 2px 0 0; }
  .ref-link { color: var(--accent); text-decoration: none; }
  .ref-link:hover { text-decoration: underline; text-underline-offset: 3px; }
  .head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
  .title { font-weight: 600; color: var(--text); text-decoration: none; }
  .title:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .tag { padding: 2px 8px; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--border);
    font-size: 12px; color: var(--muted); }
  .stats { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 7px; font-size: 13px; color: var(--text); margin-bottom: 8px; }
  .sep { color: var(--muted); opacity: .5; }
  .cmp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; margin-bottom: 12px; }
  .pct { display: inline-flex; align-items: center; gap: 5px; font-size: 15px; font-weight: 600; }
  .pct .num { font-size: 15px; }
  .pct .lbl { font-size: 12px; font-weight: 400; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .lbl { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin-left: 2px; }
  .ic.g2g { border-radius: 3px; opacity: .9; margin: 0 0 0 1px; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: 0; }
  table { width: 100%; min-width: 360px; border-collapse: collapse; }
  th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
  th { color: var(--muted); font-weight: 500; }
  th.right, td.right { text-align: right; }
  td.accent { color: var(--accent); }
  tr:hover td { background: var(--panel-2); }
  .ic-col { width: 30px; }
  .bound { color: var(--muted); font-size: 12px; }
  .tradeup { display: inline-flex; align-items: center; background: var(--panel-2); border: 1px solid var(--border);
    color: var(--muted); border-radius: 999px; padding: 1px 7px; font-size: 11px; cursor: pointer;
    margin-left: 5px; vertical-align: middle; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .tradeup:hover { color: var(--text); border-color: var(--muted); }
  .tradeup.on { background: rgba(255, 209, 102, 0.15); border-color: var(--accent); color: var(--accent); }
  /* Flex collapses the literal space, so the arrow and the % touch — add explicit room. */
  .tradeup span { margin-left: 4px; }
  /* Choose-N-of-M option block (custom packs): checkbox rows above the material table. */
  .cs { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; background: var(--panel-2); }
  .cs-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .cs-title { font-size: 12px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--muted); }
  .cs-count { font-size: 12px; color: var(--accent); }
  .cs-reset { margin-left: auto; background: rgba(255, 209, 102, 0.12); color: var(--accent);
    border: 1px solid rgba(255, 209, 102, 0.5); padding: 1px 9px; border-radius: 999px;
    font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .cs-reset:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  .cs-opt { display: flex; align-items: center; gap: 8px; padding: 3px 2px; font-size: 13px; cursor: pointer; }
  .cs-opt.off { color: var(--muted); }
  .cs-opt input { accent-color: var(--accent); cursor: pointer; }
  .cs-opt input:disabled { cursor: not-allowed; }
  .cs-name { min-width: 0; }
  .cs-gold { margin-left: auto; white-space: nowrap; }
  .cs-opt:not(.off) .cs-gold { color: var(--accent); }
  .alts-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 999px;
    padding: 1px 8px; font-size: 11px; cursor: pointer; margin-left: 5px; vertical-align: middle; white-space: nowrap; }
  .alts-btn:hover { color: var(--accent); border-color: var(--accent); }
  tr.alt td { background: rgba(255, 255, 255, .02); padding-top: 4px; padding-bottom: 4px; }
  .altname { color: var(--muted); font-size: 12.5px; }
  td.price { white-space: nowrap; }
  .price-ro { color: var(--muted); font-size: 14px; cursor: help; }
  .price-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted); font-size: 14px; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
</style>
