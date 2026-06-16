<script lang="ts">
  import { app } from "$lib/app.svelte";
  import { buildPackRows } from "$lib/packs/packRows";
  import { g2gReadout, currencySymbol } from "$lib/packs/exchange";
  import { f4 } from "$lib/packs/f4.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { TRADE_UP } from "$lib/packs/data/constants";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { packDetail, type DetailOption } from "$lib/packs/packDetail";
  import { PACKS } from "$lib/packs/data/packs";
  import PackCard from "./PackCard.svelte";

  // G2G real-money rate: live from the feed by default; a typed value overrides it and is remembered
  // (clearing the box drops the override and follows the live rate again).
  function restoreG2g(): number | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem("csv.g2g");
    if (raw == null || raw === "") return null;
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  let g2gOverride = $state<number | null>(restoreG2g());
  const g2gLive = $derived(app.payload?.g2g?.usdPer1kGold ?? null);
  const g2gValue = $derived(g2gOverride ?? g2gLive); // effective $/1k gold, null if neither available
  function onG2gInput(e: Event & { currentTarget: HTMLInputElement }): void {
    const v = e.currentTarget.valueAsNumber;
    if (Number.isFinite(v) && v > 0) {
      g2gOverride = v;
      if (typeof localStorage !== "undefined") localStorage.setItem("csv.g2g", String(v));
    } else {
      g2gOverride = null;
      if (typeof localStorage !== "undefined") localStorage.removeItem("csv.g2g");
    }
  }

  const sym = $derived(currencySymbol(app.region));
  const f4base = $derived(f4.perRc);
  const g2gOut = $derived(g2gValue ? g2gReadout(g2gValue, sym) : "—");

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

  const rows = $derived(buildPackRows(effectivePrices(), { f4Input: f4.value, g2gInput: g2gValue ?? 0, picks: selection.map }));

  // Per pack: chosen-slug -> the selection chest's full option list, for the inline "Show alts".
  const altsByPack = $derived.by(() => {
    const prices = effectivePrices();
    const out: Record<string, Record<string, DetailOption[]>> = {};
    for (const pack of PACKS) {
      const map: Record<string, DetailOption[]> = {};
      for (const chest of packDetail(pack, prices, selection.map)) {
        if (chest.isSelection && chest.options.length > 1) {
          const chosen = chest.options.find((o) => o.chosen);
          if (chosen) map[chosen.slug] = chest.options;
        }
      }
      out[pack.slug] = map;
    }
    return out;
  });

  // Highlight the whole value for quick re-entry, and on mobile nudge the field above the
  // on-screen keyboard once it settles (the keyboard otherwise covers the exchange inputs).
  function focusExchange(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    el.select();
    if (typeof window !== "undefined" && window.innerWidth < 700) {
      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    }
  }

  const customCount = $derived(overrides.count(app.region));
  const tuCount = $derived(tradeUp.count());
  const pickCount = $derived(selection.count());
  function resetAll(): void {
    overrides.clearAll(app.region);
    tradeUp.clear();
    selection.clearAll();
  }
</script>

<div class="packs">
  <div class="exch">
    <span class="ex">
      <span class="lbl">Currency exchange (F4, optional):</span>
      <input class="f4" type="number" min="0" value={f4.value} oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)} onfocus={focusExchange} aria-label="F4 exchange gold" />
      <img class="ic" src="/icons/gold.png" alt="gold" />
      <span class="lbl">for 238</span><img class="ic" src="/icons/royal-crystal.png" alt="RC" />
      <span class="lbl">=</span> <b class="num accent">{f4base.toFixed(2)}</b><img class="ic" src="/icons/gold.png" alt="gold" /><span class="lbl">/</span><img class="ic" src="/icons/royal-crystal.png" alt="RC" />
    </span>
    <span class="ex">
      <img class="ic g2g" src="/icons/g2g.png" alt="" />
      <span class="lbl">exchange (optional):</span>
      <span class="lbl">{sym}</span><input class="g2g-in" type="number" min="0" step="0.0001" value={g2gValue ?? ""} oninput={onG2gInput} onfocus={focusExchange} aria-label="G2G price per 1,000 gold" />
      <span class="lbl">for 1k</span><img class="ic" src="/icons/gold.png" alt="gold" />
      <span class="lbl">=</span> <b class="num accent">{g2gOut}</b> <span class="lbl">/ 100k</span>
    </span>
  </div>

  <p class="note">
    Sorted by g/RC. Selection chests use their highest-value option. Drill into a pack for all options + screenshot. Conversion:
    <b class="num">12,000</b> <img class="ic" src="/icons/royal-crystal.png" alt="RC" /> = $100 ($0.0083/RC).
    Click any market price to enter your own AH price.{#if customCount > 0 || tuCount > 0 || pickCount > 0} <span class="custom"><span>{#if customCount > 0}<b class="num">{customCount}</b> custom price{customCount === 1 ? "" : "s"}{/if}{#if customCount > 0 && (tuCount > 0 || pickCount > 0)} · {/if}{#if pickCount > 0}<b class="num">{pickCount}</b> pick{pickCount === 1 ? "" : "s"}{/if}{#if pickCount > 0 && tuCount > 0} · {/if}{#if tuCount > 0}<b class="num">{tuCount}</b> trade-up{tuCount === 1 ? "" : "s"}{/if}</span> <button class="reset-all" onclick={resetAll}>reset all</button></span>{/if}
  </p>

  {#if app.status === "loading"}
    <p class="state">Loading prices…</p>
  {:else if app.status === "error"}
    <p class="state bad">Failed to load prices.</p>
  {:else if app.snapshot?.prices && Object.keys(app.snapshot.prices).length === 0}
    <p class="state">No prices yet — the feed may be refreshing.</p>
  {:else}
    <div class="pack-grid">
      {#each rows as row (row.slug)}<PackCard {row} {tradeUpInfo} alts={altsByPack[row.slug] ?? {}} />{/each}
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
