<script lang="ts">
  import { packValue } from "$lib/packs/packValue";
  import { packDetail, type DetailOption } from "$lib/packs/packDetail";
  import { buildPriceMap } from "$lib/packs/priceMap";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { tradeUp } from "$lib/packs/tradeup.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { app } from "$lib/app.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "$lib/components/ItemIcon.svelte";

  let { data } = $props();
  const pack = $derived(data.pack);

  // Mirror the card path: live feed + overrides + trade-ups, then buildPriceMap layers the
  // hell-key / ebony-cube / relic-recipe EVs so the drill-down total matches the all-packs card.
  const prices = $derived(buildPriceMap(effectivePrices()));
  const value = $derived(packValue(pack, prices, selection.map));
  const chests = $derived(packDetail(pack, prices, selection.map));
  const gpd = $derived(value.goldPerDollar == null ? null : Math.round(value.goldPerDollar));

  const customCount = $derived(overrides.count(app.region));
  const tuCount = $derived(tradeUp.count());
  const pickCount = $derived(selection.count());

  // Pack image (reset the load flag when navigating between packs).
  let imgOk = $state(true);
  $effect(() => { void pack.slug; imgOk = true; });

  // Click-to-edit market prices — writes the shared, site-wide override store.
  let editing = $state<string | null>(null);
  let draft = $state("");
  function startEdit(o: DetailOption): void {
    editing = o.slug;
    draft = o.perUnit > 0 ? String(Number(o.perUnit.toFixed(4))) : "";
  }
  function commit(slug: string): void {
    const v = parseFloat(draft);
    if (Number.isFinite(v) && v >= 0) overrides.set(app.region, slug, v);
    editing = null;
  }
  function focusSelect(el: HTMLInputElement): void { el.focus(); el.select(); }

  const tagFor = (t: string) => (t === "selection" ? "select" : t === "multi" ? "everything" : "fixed");
</script>

<section class="detail">
  <a class="back" href="/">← All packs</a>

  <div class="top">
    <div class="info">
      <h2>{pack.name}</h2>
      <div class="stats">
        <span><b class="num accent">{pack.royalCrystalCost.toLocaleString("en-US")}</b><img class="ic" src="/icons/royal-crystal.png" alt="RC" /></span>
        <span class="sep">·</span>
        <span><b class="num">{formatGold(value.total)}</b><img class="ic" src="/icons/gold.png" alt="g" /></span>
        <span class="sep">·</span>
        <span><b class="num accent">{value.goldPerRc == null ? "—" : value.goldPerRc.toFixed(1)}</b> <span class="lbl">g/RC</span></span>
        <span class="sep">·</span>
        <span><b class="num">{gpd == null ? "—" : gpd.toLocaleString("en-US")}</b> <span class="lbl">g/$</span></span>
      </div>
      <p class="hint">
        Click any market price to enter your own AH value, or click a selection-chest option to value
        the pack with your pick — changes apply site-wide until reset. The highest-value option (✓)
        counts by default.
      </p>
      {#if customCount > 0 || tuCount > 0 || pickCount > 0}
        <div class="custom">
          <span>{#if customCount > 0}<b class="num">{customCount}</b> custom price{customCount === 1 ? "" : "s"}{/if}{#if customCount > 0 && (tuCount > 0 || pickCount > 0)} · {/if}{#if pickCount > 0}<b class="num">{pickCount}</b> pick{pickCount === 1 ? "" : "s"}{/if}{#if pickCount > 0 && tuCount > 0} · {/if}{#if tuCount > 0}<b class="num">{tuCount}</b> trade-up{tuCount === 1 ? "" : "s"}{/if}</span>
          <button class="reset-all" onclick={() => { overrides.clearAll(app.region); tradeUp.clear(); selection.clearAll(); }}>reset all</button>
        </div>
      {/if}
    </div>

    <div class="img">
      {#if imgOk}
        <img src="/packs/{pack.slug}.png" alt={pack.name} onerror={() => (imgOk = false)} />
      {:else}
        <div class="img-ph">pack image</div>
      {/if}
    </div>
  </div>

  {#each chests as c (c.chest)}
    <div class="chest">
      <div class="chest-head">
        <span class="chest-name">{c.qty}× {c.chest}</span>
        <span class="tag">{tagFor(c.type)}</span>
        {#if c.isSelection && selection.has(c.chest)}
          <button class="chest-reset" title="Restore the highest-value pick" onclick={() => selection.clearOne(c.chest)}>reset pick</button>
        {/if}
        <span class="chest-gold num accent">{formatGold(c.gold)}<img class="ic" src="/icons/gold.png" alt="g" /></span>
      </div>
      {#if c.unresolved}
        <p class="unresolved">Unmapped chest — not valued.</p>
      {:else}
        <div class="tscroll">
        <table>
          <tbody>
            {#each c.options as o (o.slug)}
              <tr class:dim={c.isSelection && !o.chosen}>
                <td class="ic-col"><ItemIcon slug={o.slug} /></td>
                <td>
                  {#if c.isSelection}
                    <button class="pick-name" class:chosen={o.chosen} title="Value this pack with this option" onclick={() => selection.set(c.chest, o.slug)}>{displayName(o.slug)}</button>{#if o.isBound}<span class="bound"> (Bound)</span>{/if}{#if o.chosen}<span class="pick">✓ picked</span>{/if}
                  {:else}
                    {displayName(o.slug)}{#if o.isBound}<span class="bound"> (Bound)</span>{/if}
                  {/if}
                </td>
                <td class="right num">{o.totalQty.toLocaleString("en-US")}</td>
                <td class="right price">
                  {#if editing === o.slug}
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
            {/each}
          </tbody>
        </table>
        </div>
      {/if}
    </div>
  {/each}
</section>

<style>
  .detail {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c;
    color: var(--text); font-family: "Sora", system-ui, sans-serif; max-width: 860px;
  }
  .back { color: var(--accent); text-decoration: none; font-size: 13px; }
  .back:hover { text-decoration: underline; }
  .top { display: flex; gap: 20px; align-items: flex-start; margin: 8px 0 16px; }
  .info { flex: 1; min-width: 0; }
  .img { flex: none; width: 240px; }
  .img img { width: 100%; border-radius: 10px; border: 1px solid var(--border); display: block; }
  .img-ph { width: 100%; aspect-ratio: 4 / 3; border: 1px dashed var(--border); border-radius: 10px;
    display: grid; place-items: center; color: var(--muted); font-size: 12px; background: var(--panel); }
  @media (max-width: 640px) {
    .top { flex-direction: column; }
    .img { width: 100%; max-width: 320px; }
  }
  h2 { margin: 8px 0 8px; font-size: 22px; }
  .stats { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 14px; margin-bottom: 6px; }
  .sep { color: var(--muted); opacity: .5; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .lbl, .muted { color: var(--muted); }
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
  .chest-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 4px; }
  .chest-name { font-weight: 600; }
  .tag { padding: 1px 8px; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .chest-gold { margin-left: auto; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 420px; border-collapse: collapse; }
  td { padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  tr:last-child td { border-bottom: 0; }
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
  .unresolved { color: var(--muted); font-size: 13px; margin: 4px 0 0; }
  .price-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted); font-size: 13.5px; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
</style>
