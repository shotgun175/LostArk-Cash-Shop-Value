<script lang="ts">
  import type { PackRow } from "$lib/packs/packRows";
  import type { PackLine } from "$lib/packs/packValue";
  import { formatGold, formatSignedPct } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import { app } from "$lib/app.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import ItemIcon from "../ItemIcon.svelte";

  let { row }: { row: PackRow } = $props();
  // TJW shows a small recurrence tag ("limited"/"monthly"/"weekly"); we add "retired".
  const tag = $derived(
    row.retired ? "retired" : (row.name.match(/^\[(\w+)\]/)?.[1]?.toLowerCase() ?? ""),
  );
  const gpd = $derived(row.goldPerDollar == null ? null : Math.round(row.goldPerDollar));
  function perUnit(gold: number, qty: number): string {
    return gold > 0 && qty > 0 ? formatGold(gold / qty) : "—";
  }

  // Click-to-edit market price → a per-unit override for that slug (applies everywhere it appears).
  let editing = $state<string | null>(null);
  let draft = $state("");

  function startEdit(line: PackLine): void {
    editing = line.slug;
    draft = line.gold > 0 && line.qty > 0 ? String(Number((line.gold / line.qty).toFixed(4))) : "";
  }
  function commit(slug: string): void {
    const v = parseFloat(draft);
    if (Number.isFinite(v) && v >= 0) overrides.set(app.region, slug, v);
    editing = null;
  }
  function focusSelect(el: HTMLInputElement): void {
    el.focus();
    el.select();
  }
</script>

<div class="card" class:retired={row.retired}>
  <div class="head">
    <span class="title">{row.name}</span>
    {#if tag}<span class="tag">{tag}</span>{/if}
  </div>

  <div class="stats">
    <span><b class="num accent">{row.royalCrystalCost.toLocaleString("en-US")}</b><img class="ic" src="/icons/royal-crystal.png" alt="RC" /></span>
    <span class="sep">·</span>
    <span><b class="num">{formatGold(row.total)}</b><img class="ic" src="/icons/gold.png" alt="g" /></span>
    <span class="sep">·</span>
    <span><b class="num accent">{row.goldPerRc == null ? "—" : row.goldPerRc.toFixed(1)}</b> <span class="lbl">g/RC</span></span>
    <span class="sep">·</span>
    <span><b class="num">{gpd == null ? "—" : gpd.toLocaleString("en-US")}</b> <span class="lbl">g/$</span></span>
  </div>

  <div class="cmp">
    <span class="pct" class:good={(row.vsExchange ?? 0) >= 0} class:bad={(row.vsExchange ?? 0) < 0}>
      <b class="num">{formatSignedPct(row.vsExchange)}</b> <span class="lbl">vs exchange</span>
    </span>
    <span class="pct" class:good={(row.vsG2G ?? 0) >= 0} class:bad={(row.vsG2G ?? 0) < 0}>
      <b class="num">{formatSignedPct(row.vsG2G)}</b> <span class="lbl">vs</span><img class="ic g2g" src="/icons/g2g.png" alt="G2G" />
    </span>
  </div>

  <table>
    <thead>
      <tr><th class="ic-col" aria-label="icon"></th><th>Material</th><th class="right">Total qty</th><th class="right">Market price</th><th class="right">Gold</th></tr>
    </thead>
    <tbody>
      {#each row.lines as line (line.slug)}
        <tr>
          <td class="ic-col"><ItemIcon slug={line.slug} /></td>
          <td>{displayName(line.slug)}{#if line.isBound}<span class="bound"> (Bound)</span>{/if}</td>
          <td class="right num">{line.qty.toLocaleString("en-US")}</td>
          <td class="right price">
            {#if editing === line.slug}
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
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* Content palette (--panel/--border/--accent/...) is provided by PacksPanel, matching TJW. */
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
  .card.retired { opacity: .55; }
  .head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .title { font-weight: 600; color: var(--text); }
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
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
  th { color: var(--muted); font-weight: 500; }
  th.right, td.right { text-align: right; }
  td.accent { color: var(--accent); }
  tr:hover td { background: var(--panel-2); }
  .ic-col { width: 30px; }
  .bound { color: var(--muted); font-size: 12px; }
  td.price { white-space: nowrap; }
  .price-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--muted); font-size: 14px; }
  .price-btn:hover { color: var(--text); text-decoration: underline dotted; text-underline-offset: 3px; }
  .price-btn.edited { color: var(--accent); }
  .edit { width: 78px; padding: 2px 6px; text-align: right; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; }
</style>
