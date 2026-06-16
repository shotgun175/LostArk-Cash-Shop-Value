<script lang="ts">
  import { HELL_KEY_MAP } from "$lib/packs/data/hellRewards";
  import { hellKeyBreakdown, hellKeyColumnPrices, type HellKeyBreakdown, type ColumnPrice } from "$lib/packs/ev";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";

  const prices = $derived(effectivePrices());
  const keys = $derived(
    Object.keys(HELL_KEY_MAP)
      .map((slug) => ({ b: hellKeyBreakdown(slug, prices), cols: hellKeyColumnPrices(slug, prices) }))
      .filter((k): k is { b: HellKeyBreakdown; cols: ColumnPrice[] } => k.b !== null),
  );

  const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
</script>

<div class="math">
  <h2>Hell Key math</h2>
  <p class="note">
    Each key opens one chest per floor and you keep the best of 3 (with a small best-of-4 blend).
    Each card's value is the expected gold per key at current prices — the per-floor best pick plus
    base rewards, weighted by how likely you are to draw that floor, summed across floors. Prices
    and trade-ups you set on the <a href="/">Packs</a> page flow through here.
  </p>

  {#each keys as k (k.b.slug)}
    <div class="card">
      <div class="head">
        <ItemIcon slug={k.b.slug} />
        <span class="title">{displayName(k.b.slug)}</span>
        <span class="tag">{k.b.rarityTier}</span>
        <span class="tag">{k.b.tierLabel}</span>
        <span class="ev num accent">{formatGold(Math.round(k.b.ev))}<img class="ic" src="/icons/gold.png" alt="g" /></span>
      </div>
      <details>
        <summary>Draw per floor breakdown</summary>
        <div class="tscroll">
          <table>
            <thead>
              <tr><th>Floor</th><th class="right">P(floor)</th><th class="right">Best pick</th><th class="right">Base</th><th class="right">Floor total</th><th class="right">Contribution</th></tr>
            </thead>
            <tbody>
              {#each k.b.floors as f (f.range)}
                <tr class:zero={f.p === 0}>
                  <td>{f.range}</td>
                  <td class="right num">{pct(f.p)}</td>
                  <td class="right num">{formatGold(Math.round(f.bestPick))}</td>
                  <td class="right num">{formatGold(Math.round(f.base))}</td>
                  <td class="right num">{formatGold(Math.round(f.floorTotal))}</td>
                  <td class="right num accent">{formatGold(Math.round(f.contribution))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
      <details>
        <summary>Prices used</summary>
        <div class="tscroll">
          <table>
            <thead>
              <tr><th>Reward column</th><th>Slug</th><th class="right">Per-unit price</th><th>Source</th></tr>
            </thead>
            <tbody>
              {#each k.cols as c (c.column)}
                <tr>
                  <td>{c.column}</td>
                  <td class="muted">{c.slug ?? "—"}</td>
                  <td class="right num">{c.perUnit > 0 ? formatGold(c.perUnit) : "—"}</td>
                  <td><span class="src src-{c.source}">{c.source}</span></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  {/each}
</div>

<style>
  .math {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a;
    color: var(--text); font-family: "Sora", system-ui, sans-serif;
  }
  h2 { font-size: 20px; margin: 8px 0 6px; }
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 18px; }
  .note a { color: var(--accent); }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
  .head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .title { font-weight: 600; }
  .tag { padding: 1px 8px; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .ev { margin-left: auto; font-size: 15px; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin-left: 2px; }
  details { margin-top: 10px; }
  summary { cursor: pointer; color: var(--accent); font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 5px 8px; border-bottom: 1px solid var(--border); font-size: 13px; text-align: left; }
  th { color: var(--muted); font-weight: 500; }
  .right { text-align: right; }
  td.accent { color: var(--accent); }
  tr.zero td { opacity: .45; }
  .tscroll { overflow-x: auto; }
  .muted { color: var(--muted); }
  .src { font-size: 11px; padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); }
  .src-live { color: var(--good); border-color: var(--good); }
  .src-fallback, .src-flat { color: var(--accent); border-color: var(--accent); }
</style>
