<script lang="ts">
  import { flip } from "svelte/animate";
  import { app } from "$lib/app.svelte";
  import { buildPackRows } from "$lib/packs/packRows";
  import { currencySymbol, cashPerRc, RC_CASH_PER_12K } from "$lib/packs/exchange";
  import { f4 } from "$lib/packs/f4.svelte";
  import { g2g } from "$lib/packs/g2g.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { customSel } from "$lib/packs/customSel.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { TRADE_UP } from "$lib/packs/data/constants";
  import { layeredPrices } from "$lib/packs/prices.svelte";
  import { packDetail, type DetailOption } from "$lib/packs/packDetail";
  import { PACKS } from "$lib/packs/data/packs";
  import PackCard from "./PackCard.svelte";
  import { base } from "$app/paths";

  // The F4 + G2G exchange inputs live in the shared "Your values" bar (ValuesBar.svelte, under
  // the header), over the same f4 and g2g stores this panel values against.
  const sym = $derived(currencySymbol(app.region));
  const rcCash = $derived(RC_CASH_PER_12K[app.region]); // 100 (NA) / 94.99 (EU) per 12,000 RC
  const rcPerUnit = $derived(cashPerRc(app.region));

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

  // One fully layered map feeds the rows and the per-pack detail below. It carries the Hell Key
  // tab's manual tap price for this region, so overriding it there also moves every pack card that
  // contains a hell/netherworld key.
  const prices = $derived(layeredPrices());
  const rows = $derived(buildPackRows(prices, { f4Input: f4.value, g2gInput: g2g.value ?? 0, picks: selection.map, customPicks: customSel.map, cashPerRc: cashPerRc(app.region) }));
  // Retired packs get their own "no longer in the shop" section (compact reference cards) below the
  // active grid, rather than being greyed out inline. buildPackRows already sorts active before retired.
  const activeRows = $derived(rows.filter((r) => !r.retired));
  const retiredRows = $derived(rows.filter((r) => r.retired));

  // Per pack: chosen-slug -> the selection chest's full option list, for the inline "Show alts";
  // plus the choose-N-of-M option rows (chest name / qty / gold / counted) for the checkbox block.
  // Both are valued against the SAME fully-layered map as the rows (baked + live + taps +
  // key/cube EVs + BC items) — the raw feed alone would zero every EV/baked option and make the
  // checkbox defaults disagree with the engine's chosen set.
  const altsByPack = $derived.by(() => {
    const out: Record<string, Record<string, DetailOption[]>> = {};
    for (const pack of PACKS) {
      const map: Record<string, DetailOption[]> = {};
      for (const chest of packDetail(pack, prices, selection.map, customSel.map)) {
        if (chest.isSelection && chest.options.length > 1) {
          const chosen = chest.options.find((o) => o.chosen);
          if (chosen) map[chosen.slug] = chest.options;
        }
      }
      out[pack.slug] = map;
    }
    return out;
  });
  const customByPack = $derived.by(() => {
    const out: Record<string, { pick: number; options: { chest: string; qty: number; gold: number; counted: boolean }[] }> = {};
    for (const pack of PACKS) {
      if (!pack.customSelection) continue;
      const options = packDetail(pack, prices, selection.map, customSel.map).map((c) => ({
        chest: c.chest, qty: c.qty, gold: c.gold, counted: c.counted,
      }));
      out[pack.slug] = { pick: pack.customSelection.pick, options };
    }
    return out;
  });

  const customCount = $derived(overrides.count(app.region));
  const tuCount = $derived(tradeUp.count());
  // Selection-chest picks and choose-N-of-M pack picks share the "picks" chip.
  const pickCount = $derived(selection.count() + customSel.count());
  function resetAll(): void {
    overrides.clearAll(app.region);
    tradeUp.clear();
    selection.clearAll();
    customSel.clearAll();
  }
</script>

<div class="packs">
  <p class="note">
    Sorted by g/RC (Blue-Crystal-priced packs slot in at their exchange equivalent, 95 BC = 238 RC). Selection chests use their highest-value option. Choose-N packs rank by their default picks, so toggling options won't move the card. Drill into a pack for all options + screenshot. Conversion:
    <b class="num">12,000</b> <img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" /> = {sym}{rcCash.toLocaleString("en-US")} ({sym}{rcPerUnit.toFixed(4)}/RC).
    Click any market price to enter your own AH price.{#if hellSettings.includePheons}{" "}Key values include ability stones at 9 pheons each (set in Your values).{/if}{#if customCount > 0 || tuCount > 0 || pickCount > 0} <span class="custom"><span>{#if customCount > 0}<b class="num">{customCount}</b> custom price{customCount === 1 ? "" : "s"}{/if}{#if customCount > 0 && (tuCount > 0 || pickCount > 0)} · {/if}{#if pickCount > 0}<b class="num">{pickCount}</b> pick{pickCount === 1 ? "" : "s"}{/if}{#if pickCount > 0 && tuCount > 0} · {/if}{#if tuCount > 0}<b class="num">{tuCount}</b> trade-up{tuCount === 1 ? "" : "s"}{/if}</span> <button class="reset-all" onclick={resetAll}>reset all</button></span>{/if}
  </p>

  {#if app.status === "loading"}
    <p class="state">Loading prices…</p>
  {:else if app.status === "error"}
    <p class="state bad">Failed to load prices.</p>
  {:else if !app.snapshot || Object.keys(app.snapshot.prices).length === 0}
    <p class="state">No prices yet. The feed may be refreshing.</p>
  {:else}
    <div class="pack-grid">
      <!-- The wrapper div exists because animate: needs an element (not a component) as the
           each's child; display:grid on it keeps the card stretching to the row height the way
           a bare grid item would. flip glides cards to their new spot when a price refresh or
           override re-sorts the grid, instead of teleporting them. -->
      {#each activeRows as row (row.slug)}
        <div class="cell" animate:flip={{ duration: 300 }}>
          <PackCard {row} {tradeUpInfo} alts={altsByPack[row.slug] ?? {}} custom={customByPack[row.slug] ?? null} />
        </div>
      {/each}
    </div>
    {#if retiredRows.length}
      <div class="retired-head">
        <h3>No longer in the shop</h3>
        <span class="retired-sub">· kept for value reference</span>
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
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin: 0 1px; }
  .note { color: var(--muted); font-size: 13px; margin: 2px 0 16px; line-height: 1.9; }
  .custom { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; white-space: nowrap;
    vertical-align: middle; color: var(--accent); background: rgba(255, 209, 102, 0.1);
    border: 1px solid rgba(255, 209, 102, 0.4); border-radius: 6px; padding: 3px 10px; }
  .custom .num { color: var(--accent); }
  .reset-all { background: rgba(255, 209, 102, 0.12); color: var(--accent); border: 1px solid rgba(255, 209, 102, 0.5);
    padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .reset-all:hover { background: var(--bad); border-color: var(--bad); color: var(--bg); }
  /* Fluid grid: 1 column on mobile, 2 on desktop, 3 on wide screens, flowing with the viewport.
     min(460px, 100%) lets a single column shrink below 460px on narrow phones instead of forcing
     an overflow / horizontal scroll. */
  .pack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(460px, 100%), 1fr)); gap: 12px; }
  /* Single-child grid: the card fills the cell exactly like it filled the track before. */
  .cell { display: grid; }
  .retired-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
    margin: 28px 0 12px; padding-top: 18px; border-top: 1px solid var(--border); }
  .retired-head h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--muted); }
  .retired-sub { color: var(--muted); font-size: 12.5px; opacity: .8; }
  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.bad { color: var(--bad); }
</style>
