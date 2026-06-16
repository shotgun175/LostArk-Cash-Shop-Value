<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { buildPackRows } from "$lib/packs/packRows";
  import { f4Baseline, g2gReadout, G2G_DEFAULT_INPUT, currencySymbol } from "$lib/packs/exchange";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { TRADE_UP } from "$lib/packs/data/constants";
  import type { Region } from "$lib/api";
  import PackCard from "./PackCard.svelte";

  const TRADE_UP_BY_FROM: Record<string, { fromSlug: string; toSlug: string; ratio: number }> =
    Object.fromEntries(TRADE_UP.map((t) => [t.fromSlug, t]));

  // F4 crystal/RC rate is region-specific; NA seeded to the live in-game rate. Persisted per region.
  const F4_DEFAULTS: Record<Region, number> = { nae: 59500, euc: 59500 };

  function restore(key: string, fallback: number): number {
    if (typeof localStorage === "undefined") return fallback;
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  let f4 = $state<Record<Region, number>>({
    nae: restore("csv.f4.nae", F4_DEFAULTS.nae),
    euc: restore("csv.f4.euc", F4_DEFAULTS.euc),
  });
  let g2gInput = $state(restore("csv.g2g", G2G_DEFAULT_INPUT));

  $effect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(`csv.f4.${app.region}`, String(f4[app.region]));
  });
  $effect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem("csv.g2g", String(g2gInput));
  });

  const sym = $derived(currencySymbol(app.region));
  const f4base = $derived(f4Baseline(f4[app.region] || 0));
  const g2gOut = $derived(g2gReadout(g2gInput || 0, sym));

  const basePrices = $derived({ ...(app.snapshot?.prices ?? {}), ...overrides.forRegion(app.region) });

  // Per-from-slug trade-up delta vs market price (drives the badge), from base prices.
  const tradeUpInfo = $derived.by(() => {
    const info: Record<string, { ratio: number; deltaPct: number }> = {};
    for (const t of TRADE_UP) {
      const from = basePrices[t.fromSlug];
      const to = basePrices[t.toSlug];
      if (from > 0 && to > 0) info[t.fromSlug] = { ratio: t.ratio, deltaPct: ((to / t.ratio - from) / from) * 100 };
    }
    return info;
  });

  // Prices used for pack values: base, with active trade-ups re-routing the from-slug value.
  const effectivePrices = $derived.by(() => {
    const p = { ...basePrices };
    for (const slug of Object.keys(tradeUp.active)) {
      const t = TRADE_UP_BY_FROM[slug];
      if (t && p[t.toSlug] > 0) p[slug] = p[t.toSlug] / t.ratio;
    }
    return p;
  });

  const rows = $derived(buildPackRows(effectivePrices, { f4Input: f4[app.region], g2gInput }));
</script>

<div class="packs">
  <div class="exch">
    <span class="ex">
      <span class="lbl">Currency exchange (F4, optional):</span>
      <input class="f4" type="number" min="0" bind:value={f4[app.region]} aria-label="F4 exchange gold" />
      <img class="ic" src="/icons/gold.png" alt="gold" />
      <span class="lbl">for 238</span><img class="ic" src="/icons/royal-crystal.png" alt="RC" />
      <span class="lbl">=</span> <b class="num accent">{f4base.toFixed(2)}</b><img class="ic" src="/icons/gold.png" alt="gold" /><span class="lbl">/</span><img class="ic" src="/icons/royal-crystal.png" alt="RC" />
    </span>
    <span class="ex">
      <img class="ic g2g" src="/icons/g2g.png" alt="" />
      <span class="lbl">exchange (optional):</span>
      <span class="lbl">{sym}</span><input class="g2g-in" type="number" min="0" step="0.0001" bind:value={g2gInput} aria-label="G2G price per 1,000 gold" />
      <span class="lbl">for 1k</span><img class="ic" src="/icons/gold.png" alt="gold" />
      <span class="lbl">=</span> <b class="num accent">{g2gOut}</b> <span class="lbl">/ 100k</span>
    </span>
  </div>

  <p class="note">
    Sorted by g/RC. Selection chests use their highest-value option. Conversion:
    <b class="num">12,000</b> <img class="ic" src="/icons/royal-crystal.png" alt="RC" /> = $100 ($0.0083/RC).
    Bound items are valued at their unbound market price.{#if overrides.count(app.region) > 0} <span class="custom"><span><b class="num">{overrides.count(app.region)}</b> custom price{overrides.count(app.region) === 1 ? "" : "s"}</span> <button class="reset-all" onclick={() => overrides.clearAll(app.region)}>reset all</button></span>{/if}
  </p>

  {#if app.status === "loading"}
    <p class="state">Loading prices…</p>
  {:else if app.status === "error"}
    <p class="state bad">Failed to load prices.</p>
  {:else if app.snapshot?.prices && Object.keys(app.snapshot.prices).length === 0}
    <p class="state">No prices yet — the feed may be refreshing.</p>
  {:else}
    <div class="pack-grid">
      {#each rows as row (row.slug)}<PackCard {row} {tradeUpInfo} />{/each}
    </div>
  {/if}
</div>

<style>
  /* TJW's content design tokens, scoped to the packs view so the header keeps our palette. */
  .packs {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c; --warn: #f0b341;
    color: var(--text);
    font-family: "Sora", system-ui, sans-serif;
  }
  .exch { display: flex; flex-wrap: wrap; gap: 12px 28px; align-items: center; font-size: 13px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px 16px; margin-bottom: 12px; }
  .ex { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .lbl { color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  input { background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
    padding: 6px 10px; border-radius: 6px; font-size: 13px; font-family: inherit; }
  input:focus { outline: none; border-color: var(--accent); }
  input.f4 { width: 82px; } input.g2g-in { width: 100px; }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin: 0 1px; }
  .ic.g2g { border-radius: 3px; opacity: .85; }
  .note { color: var(--muted); font-size: 13px; margin: 2px 0 16px; line-height: 1.9; }
  .custom { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; white-space: nowrap;
    vertical-align: middle; color: var(--accent); background: rgba(255, 209, 102, 0.1);
    border: 1px solid rgba(255, 209, 102, 0.4); border-radius: 6px; padding: 3px 10px; }
  .custom .num { color: var(--accent); }
  .reset-all { background: rgba(255, 209, 102, 0.12); color: var(--accent); border: 1px solid rgba(255, 209, 102, 0.5);
    padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .reset-all:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  .pack-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 900px) { .pack-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.bad { color: var(--bad); }
</style>
