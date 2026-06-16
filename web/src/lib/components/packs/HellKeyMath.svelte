<script lang="ts">
  import { HELL_KEY_MAP } from "$lib/packs/data/hellRewards";
  import { hellKeyBreakdown, type HellKeyBreakdown } from "$lib/packs/ev";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";

  const prices = $derived(effectivePrices());
  const keys = $derived(
    Object.keys(HELL_KEY_MAP)
      .map((slug) => hellKeyBreakdown(slug, prices))
      .filter((b): b is HellKeyBreakdown => b !== null),
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

  {#each keys as k (k.slug)}
    <div class="card">
      <div class="head">
        <ItemIcon slug={k.slug} />
        <span class="title">{displayName(k.slug)}</span>
        <span class="tag">{k.rarityTier}</span>
        <span class="tag">{k.tierLabel}</span>
        <span class="ev num accent">{formatGold(Math.round(k.ev))}<img class="ic" src="/icons/gold.png" alt="g" /></span>
      </div>
      <details>
        <summary>Draw per floor breakdown</summary>
        <table>
          <thead>
            <tr><th>Floor</th><th class="right">P(floor)</th><th class="right">Best pick</th><th class="right">Base</th><th class="right">Contribution</th></tr>
          </thead>
          <tbody>
            {#each k.floors as f (f.range)}
              <tr class:zero={f.p === 0}>
                <td>{f.range}</td>
                <td class="right num">{pct(f.p)}</td>
                <td class="right num">{formatGold(Math.round(f.bestPick))}</td>
                <td class="right num">{formatGold(Math.round(f.base))}</td>
                <td class="right num accent">{formatGold(Math.round(f.contribution))}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </details>
    </div>
  {/each}
</div>

<style>
  .math {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166;
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
</style>
