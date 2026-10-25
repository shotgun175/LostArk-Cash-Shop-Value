<script lang="ts">
  import type { PackRow } from "$lib/packs/packRows";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { currencySymbol } from "$lib/packs/exchange";
  import { app } from "$lib/app.svelte";
  import { customSel } from "$lib/packs/customSel.svelte";
  import type { DetailOption } from "$lib/packs/packDetail";
  import GoldRate from "./GoldRate.svelte";
  import PackLinesTable from "./PackLinesTable.svelte";
  import { base } from "$app/paths";

  interface CustomBlock {
    pick: number;
    options: { chest: string; qty: number; gold: number; counted: boolean }[];
  }

  // The optional link / collapsible / unpriced / notice props serve the Bonus Room's product cards;
  // their defaults render the Packs tab's card unchanged.
  let {
    row, tradeUpInfo = {}, alts = {}, custom = null, compact = false,
    link = true, collapsible = false, unpriced = false, notice = null,
  }: {
    row: PackRow;
    tradeUpInfo?: Record<string, { ratio: number; deltaPct: number }>;
    alts?: Record<string, DetailOption[]>;
    custom?: CustomBlock | null; // choose-N-of-M packs: the checkbox option rows
    compact?: boolean; // retired cards: stats + drill-down link only, no material table
    link?: boolean; // false: the title is plain text (no /pack/<slug> drill-down exists)
    collapsible?: boolean; // true: the material table sits in a closed-by-default <details>
    unpriced?: boolean; // true: no content line has a price, so the gold total reads "no price"
    notice?: string | null; // a small warning line under the comparison chips
  } = $props();

  const sym = $derived(currencySymbol(app.region)); // $ for NA, € for EU — RC priced per region
  const countedChests = $derived(custom ? custom.options.filter((o) => o.counted).map((o) => o.chest) : []);

  // "2026-06-24" -> "6/24/26" for the RETIRED pill. Parsed by parts (not new Date) to avoid the
  // UTC-midnight-shifts-a-day timezone trap. Falls back to a bare "retired" if the date is absent.
  function retiredLabel(iso?: string): string {
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "retired";
    return `retired ${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}`;
  }
</script>

<div class="card" class:retired={row.retired}>
  <div class="head">
    {#if link}<a class="title" href="{base}/pack/{row.slug}">{row.name}</a>{:else}<span class="title">{row.name}</span>{/if}
    {#if row.retired}<span class="tag retired-tag">{retiredLabel(row.retiredOn)}</span>{/if}
    {#if row.recurrence}<span class="tag">{row.recurrence}</span>{/if}
    {#if row.limited}<span class="tag">limited</span>{/if}
    {#if row.maxPurchases}<span class="tag" title="In-game purchase limit{row.recurrence ? ` per ${row.recurrence === 'weekly' ? 'week' : 'month'}` : ''}">{row.maxPurchases}/roster</span>{/if}
  </div>

  <div class="stats">
    {#if row.blueCrystalCost != null}
      <!-- BC-priced pack: cost in Blue Crystals, rate as gold/BC. The cash rate prices the BC
           in shop money via the 95 BC = 238 RC exchange equivalence, so the g/$ and "% vs G2G"
           figures share the RC cards' scale. -->
      <span><b class="num accent">{row.blueCrystalCost.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" /></span>
      <span class="sep">·</span>
      <span>{#if unpriced}<span class="noprice">no price</span>{:else}<b class="num">{formatGold(row.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" />{/if}</span>
      <span class="sep">·</span>
      <span><GoldRate value={unpriced ? null : row.goldPerBc} unit="bc" /></span>
      <span class="sep">·</span>
      <span title="Shop-money equivalent: 95 BC = 238 RC"><GoldRate value={unpriced ? null : row.goldPerDollar} unit="cash" {sym} /></span>
    {:else}
      <span><b class="num accent">{(row.royalCrystalCost ?? 0).toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /></span>
      <span class="sep">·</span>
      <span>{#if unpriced}<span class="noprice">no price</span>{:else}<b class="num">{formatGold(row.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="g" />{/if}</span>
      <span class="sep">·</span>
      <span><GoldRate value={unpriced ? null : row.goldPerRc} unit="rc" /></span>
      <span class="sep">·</span>
      <span><GoldRate value={unpriced ? null : row.goldPerDollar} unit="cash" {sym} /></span>
    {/if}
  </div>

  {#if compact}
    <p class="ref-note">Open the <a class="ref-link" href="{base}/pack/{row.slug}">drill-down</a> for the full mat breakdown.</p>
  {:else}
  <div class="cmp">
    <span class="pct" class:good={row.vsExchange != null && row.vsExchange >= 0} class:bad={row.vsExchange != null && row.vsExchange < 0}>
      <b class="num">{formatSignedPct(row.vsExchange)}</b> <span class="lbl">vs exchange</span>
    </span>
    <span class="pct" class:good={row.vsG2G != null && row.vsG2G >= 0} class:bad={row.vsG2G != null && row.vsG2G < 0}>
      <b class="num">{formatSignedPct(row.vsG2G)}</b> <span class="lbl">vs</span><img class="ic g2g" src="{base}/icons/g2g.png" alt="G2G" />
    </span>
  </div>
  {#if notice}<p class="notice">{notice}</p>{/if}

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
          <!-- No preventDefault: a canceled click reverts the box AFTER Svelte's flush and
               leaves it visually stuck checked. clickToggle (customSel.svelte.ts) lets the
               native flip stand and reconciles the DOM property from the settled state.
               Space-key toggles dispatch click, so keyboard use is covered. -->
          <input type="checkbox" checked={o.counted}
            disabled={!o.counted && countedChests.length >= custom.pick}
            onclick={(e) => customSel.clickToggle(e, row.slug, o.chest, custom.pick, () => countedChests)} />
          <span class="cs-name">{o.qty}× {o.chest}</span>
          <span class="cs-gold num">{o.gold > 0 ? formatGold(o.gold) : "—"}</span>
        </label>
      {/each}
    </div>
  {/if}

  {#if collapsible}
    <details class="contents">
      <summary>Contents · {row.lines.length} material{row.lines.length === 1 ? "" : "s"}</summary>
      <PackLinesTable lines={row.lines} {tradeUpInfo} {alts} />
    </details>
  {:else}
    <PackLinesTable lines={row.lines} {tradeUpInfo} {alts} />
  {/if}
  {/if}
</div>

<style>
  /* Content palette (--panel/--border/--accent/...) is provided by PacksPanel (and BonusRoom), matching TJW. */
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
  a.title:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
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
  .noprice { color: var(--muted); font-style: italic; }
  .notice { color: var(--warn); font-size: 12px; margin: -4px 0 12px; }
  /* Bonus Room cards: the material table folds away under a "Contents" summary. */
  /* A phone-sized tap target (about 44 px tall); the negative margin keeps the visual spacing. */
  .contents summary { color: var(--muted); font-size: 12.5px; cursor: pointer; padding: 12px 0; margin: -10px 0; }
  .contents summary:hover { color: var(--text); }
  .contents[open] summary { margin-bottom: -4px; }
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
</style>
