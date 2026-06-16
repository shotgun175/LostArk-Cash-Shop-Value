<script lang="ts">
  import { app } from "$lib/app.svelte";
  import type { Region } from "$lib/api";
  import { buildPackRows } from "$lib/packs/packRows";
  import { g2gReadout, currencySymbol, cashPerRc, RC_CASH_PER_12K } from "$lib/packs/exchange";
  import { f4 } from "$lib/packs/f4.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { TRADE_UP } from "$lib/packs/data/constants";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { packDetail, type DetailOption } from "$lib/packs/packDetail";
  import { PACKS } from "$lib/packs/data/packs";
  import PackCard from "./PackCard.svelte";

  // G2G real-money rate: auto-populated from the live feed for the selected region (USD for NA, EUR
  // for EU). A typed value overrides it per region and is remembered; clearing the box returns to the
  // live rate.
  const ovKey = (r: Region) => `csv.g2g.override.${r}`;
  function restoreOverride(r: Region): number | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(ovKey(r));
    if (raw == null || raw === "") return null;
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  if (typeof localStorage !== "undefined") {
    // Retire pre-region keys (the old UI auto-saved its default; both must not read back as overrides).
    localStorage.removeItem("csv.g2g");
    localStorage.removeItem("csv.g2g.override");
  }
  let g2gOverrides = $state<Record<Region, number | null>>({ nae: restoreOverride("nae"), euc: restoreOverride("euc") });
  const g2gOverride = $derived(g2gOverrides[app.region]);
  const g2gLive = $derived(
    app.region === "euc" ? (app.payload?.g2g?.eurPer1kGold ?? null) : (app.payload?.g2g?.usdPer1kGold ?? null),
  );
  const g2gValue = $derived(g2gOverride ?? g2gLive); // effective price/1k gold, null if none available
  function onG2gInput(e: Event & { currentTarget: HTMLInputElement }): void {
    const v = e.currentTarget.valueAsNumber;
    const r = app.region;
    if (Number.isFinite(v) && v > 0) {
      g2gOverrides = { ...g2gOverrides, [r]: v };
      if (typeof localStorage !== "undefined") localStorage.setItem(ovKey(r), String(v));
    } else {
      g2gOverrides = { ...g2gOverrides, [r]: null };
      if (typeof localStorage !== "undefined") localStorage.removeItem(ovKey(r));
    }
  }

  const sym = $derived(currencySymbol(app.region));
  const f4base = $derived(f4.perRc);
  const rcCash = $derived(RC_CASH_PER_12K[app.region]); // 100 (NA) / 94.99 (EU) per 12,000 RC
  const rcPerUnit = $derived(cashPerRc(app.region));
  const g2gOut = $derived(g2gValue ? g2gReadout(g2gValue, sym) : "—");
  // Discreet hover-only freshness signal for the live rate (no visible text).
  const g2gTooltip = $derived.by(() => {
    const at = app.payload?.g2g?.fetchedAt;
    const t = at ? new Date(at) : null;
    if (!t || Number.isNaN(t.getTime())) return "Live exchange rate";
    return `Rate updated ${t.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`;
  });

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

  const rows = $derived(buildPackRows(effectivePrices(), { f4Input: f4.value, g2gInput: g2gValue ?? 0, picks: selection.map, cashPerRc: cashPerRc(app.region) }));
  // Retired packs get their own "no longer in the shop" section (compact reference cards) below the
  // active grid, rather than being greyed out inline. buildPackRows already sorts active before retired.
  const activeRows = $derived(rows.filter((r) => !r.retired));
  const retiredRows = $derived(rows.filter((r) => r.retired));

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
      <img class="ic g2g" src="/icons/g2g.png" alt="" title={g2gTooltip} />
      <span class="lbl">exchange (optional):</span>
      <span class="lbl">{sym}</span><input class="g2g-in" type="number" min="0" step="0.0001" value={g2gValue ?? ""} oninput={onG2gInput} onfocus={focusExchange} aria-label="G2G price per 1,000 gold" />
      <span class="lbl">for 1k</span><img class="ic" src="/icons/gold.png" alt="gold" />
      <span class="lbl">=</span> <b class="num accent">{g2gOut}</b> <span class="lbl">/ 100k</span>
    </span>
  </div>

  <p class="note">
    Sorted by g/RC. Selection chests use their highest-value option. Drill into a pack for all options + screenshot. Conversion:
    <b class="num">12,000</b> <img class="ic" src="/icons/royal-crystal.png" alt="RC" /> = {sym}{rcCash.toLocaleString("en-US")} ({sym}{rcPerUnit.toFixed(4)}/RC).
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
      {#each activeRows as row (row.slug)}<PackCard {row} {tradeUpInfo} alts={altsByPack[row.slug] ?? {}} />{/each}
    </div>
    {#if retiredRows.length}
      <div class="retired-head">
        <h3>No longer in the shop</h3>
        <span class="retired-sub">— kept here for value reference</span>
      </div>
      <div class="pack-grid">
        {#each retiredRows as row (row.slug)}<PackCard {row} compact {tradeUpInfo} alts={altsByPack[row.slug] ?? {}} />{/each}
      </div>
    {/if}
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
    padding: 6px 10px; border-radius: 6px; font-size: 13px;
    font-family: "JetBrains Mono", monospace; font-variant-numeric: tabular-nums; }
  input:focus { outline: none; border-color: var(--accent); }
  input.f4 { width: 90px; } input.g2g-in { width: 104px; }
  /* Hide the number-input spinners so the value uses the full width and never clips. */
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
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
  .retired-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
    margin: 28px 0 12px; padding-top: 18px; border-top: 1px solid var(--border); }
  .retired-head h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--muted); }
  .retired-sub { color: var(--muted); font-size: 12.5px; opacity: .8; }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.bad { color: var(--bad); }
</style>
