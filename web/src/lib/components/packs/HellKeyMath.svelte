<script lang="ts">
  import { HELL_KEY_MAP, HELL_TIERS } from "$lib/packs/data/hellRewards";
  import { hellKeyBreakdown, hellKeyColumnPrices, type HellKeyBreakdown, type ColumnPrice } from "$lib/packs/ev";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { withTapPrices, TAP_SLUGS } from "$lib/packs/tapPrices";
  import { hellSettings, RARITY_OPTIONS, REWARD_DATA_VINTAGE } from "$lib/packs/hellSettings.svelte";
  import { app } from "$lib/app.svelte";
  import { formatGold } from "$lib/format";
  import { displayName } from "$lib/catalog";
  import ItemIcon from "../ItemIcon.svelte";
  import HellFloorChests from "./HellFloorChests.svelte";
  import TapValuePanel from "./TapValuePanel.svelte";
  import { base } from "$app/paths";

  // Tier picker: one dropdown, newest first; the choice is remembered across visits.
  const ILVLS = [...new Set(Object.values(HELL_KEY_MAP).map((m) => HELL_TIERS[m.tierLabel].ilvl))].sort((a, b) => b - a);
  const stored = typeof localStorage !== "undefined" ? Number(localStorage.getItem("csv.hellTier")) : NaN;
  let ilvl = $state(ILVLS.includes(stored) ? stored : ILVLS[0]);
  $effect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem("csv.hellTier", String(ilvl));
  });

  // Same map the pack engine values keys against (priceMap.ts layers withTapPrices too), so a
  // card's EV here and the same key's line on the Packs page price their free taps identically.
  const prices = $derived(withTapPrices(effectivePrices(), hellSettings.tapOverride[app.region]));
  // "Actual" passes no opts at all, so the default view is byte-identical to the key's own rarity.
  const rarityOpts = $derived(hellSettings.rarity === "Actual" ? undefined : { rarity: hellSettings.rarity });
  const keys = $derived(
    Object.keys(HELL_KEY_MAP)
      .filter((slug) => HELL_TIERS[HELL_KEY_MAP[slug].tierLabel].ilvl === ilvl)
      .map((slug) => ({ b: hellKeyBreakdown(slug, prices, rarityOpts), cols: hellKeyColumnPrices(slug, prices) }))
      .filter((k): k is { b: HellKeyBreakdown; cols: ColumnPrice[] } => k.b !== null),
  );

  // Flags a card's EV as a what-if, but only where the pick actually changed the weighting:
  // Netherworld tiers have no Common/Relic/Ancient column, so those cards stay on their own rarity.
  const rarityTag = (b: HellKeyBreakdown): string | null => {
    if (hellSettings.rarity === "Actual") return null;
    if (b.rarityClamped) return "actual (n/a at this rarity)";
    return b.effectiveRarity !== b.rarityTier ? "what-if" : null;
  };

  const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

  // One open floor per card: key slug -> the expanded floor range (or null).
  let openFloor = $state<Record<string, string | null>>({});
  const toggleFloor = (slug: string, range: string): void => {
    openFloor = { ...openFloor, [slug]: openFloor[slug] === range ? null : range };
  };

  // The two special-hone tap pseudo-slugs are computed, not market items, so the raw slug
  // reads as a mystery in the prices table; everything else shows its real slug.
  const SLUG_LABEL: Record<string, string> = {
    [TAP_SLUGS.transferred]: "special hone tap (transferred)",
    [TAP_SLUGS.circulated]: "special hone tap (circulated)",
  };
</script>

<div class="math">
  <h2>Hell Key math</h2>
  <p class="note">
    Each key opens one chest per floor and you keep the best of 3 (with a small best-of-4 blend).
    Each card's value is the expected gold per key at current prices — the per-floor best pick plus
    base rewards, weighted by how likely you are to draw that floor, summed across floors. Prices
    and trade-ups you set on the <a href="{base}/">Packs</a> page flow through here.
  </p>
  <p class="vintage">Reward tables: {REWARD_DATA_VINTAGE} · prices live</p>

  <div class="controls">
    <label class="tierpick">
      Item level
      <select bind:value={ilvl}>
        {#each ILVLS as v (v)}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </label>

    <label class="tierpick">
      Rarity
      <select value={hellSettings.rarity} onchange={(e) => hellSettings.setRarity(e.currentTarget.value)}>
        {#each RARITY_OPTIONS as r (r)}
          <option value={r}>{r}</option>
        {/each}
      </select>
    </label>

    <label class="tierpick check">
      <input
        type="checkbox"
        checked={hellSettings.wealth}
        onchange={(e) => hellSettings.setWealth(e.currentTarget.checked)}
      />
      Wealth +1 active
    </label>
  </div>

  <TapValuePanel {ilvl} />

  {#each keys as k (k.b.slug)}
    {@const whatIf = rarityTag(k.b)}
    <div class="card">
      <div class="head">
        <ItemIcon slug={k.b.slug} />
        <span class="title">{displayName(k.b.slug)}</span>
        <span class="tag">{k.b.rarityTier}</span>
        <span class="tag">{k.b.tierLabel}</span>
        <span class="ev num accent">{formatGold(Math.round(k.b.ev))}<img class="ic" src="{base}/icons/gold.png" alt="g" /></span>
        {#if whatIf}
          <span class="tag">{whatIf}</span>
        {/if}
      </div>
      <details>
        <summary>Draw per floor breakdown</summary>
        <p class="hint">Pick a floor to see every chest on it, ranked.</p>
        <div class="tscroll">
          <table>
            <thead>
              <tr><th class="chev"><span class="sr">Expand</span></th><th>Floor</th><th class="right">P(floor)</th><th class="right">Best pick</th><th class="right">Base</th><th class="right">Floor total</th><th class="right">Contribution</th></tr>
            </thead>
            <tbody>
              {#each k.b.floors as f (f.range)}
                {@const open = openFloor[k.b.slug] === f.range}
                <tr
                  class:zero={f.p === 0}
                  class:open
                  role="button"
                  tabindex="0"
                  aria-expanded={open}
                  aria-label="Floor {f.range} chests"
                  onclick={() => toggleFloor(k.b.slug, f.range)}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleFloor(k.b.slug, f.range);
                    }
                  }}
                >
                  <td class="chev" aria-hidden="true">{open ? "▾" : "▸"}</td>
                  <td>{f.range}</td>
                  <!-- The bar under P(floor) makes the weighting readable at a glance: how much
                       of the key's EV this floor can possibly carry. -->
                  <td class="right num pcell" style="--w: {(f.p / k.b.sump) * 100}%">{pct(f.p / k.b.sump)}</td>
                  <td class="right num">{formatGold(Math.round(f.bestPick))}</td>
                  <td class="right num">{formatGold(Math.round(f.base))}</td>
                  <td class="right num">{formatGold(Math.round(f.floorTotal))}</td>
                  <!-- Renormalized like P(floor), so P x Floor total matches what is shown here
                       and the column sums to the headline EV. -->
                  <td class="right num accent">{formatGold(Math.round(f.contribution / k.b.sump))}</td>
                </tr>
                {#if open}
                  <tr class="expand">
                    <td colspan={7}><HellFloorChests floor={f} wealth={hellSettings.wealth} /></td>
                  </tr>
                {/if}
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
                  <td class="muted">{c.slug ? (SLUG_LABEL[c.slug] ?? c.slug) : "—"}</td>
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
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 6px; }
  .note a { color: var(--accent); }
  .vintage { color: var(--muted); font-size: 12px; margin: 0 0 16px; }
  .controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; margin: 0 0 14px; }
  .tierpick { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
  .tierpick select {
    background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
    border-radius: 6px; padding: 5px 10px; font: inherit; cursor: pointer;
  }
  .tierpick.check { cursor: pointer; }
  .tierpick.check input { accent-color: var(--accent); cursor: pointer; }
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
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .hint { color: var(--muted); font-size: 12px; margin: 8px 0 0; }
  tbody tr[role="button"] { cursor: pointer; }
  tbody tr[role="button"]:hover td, tbody tr.open td { background: var(--panel-2); }
  tbody tr[role="button"]:focus-visible { outline: 1px solid var(--accent); outline-offset: -1px; }
  th.chev, td.chev { width: 18px; padding-right: 0; color: var(--muted); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .pcell { position: relative; }
  /* Right-anchored so the bar sits under the number it annotates: the cell is far wider than
     the text, and a left-anchored bar reads as a stray dash floating in empty space. */
  .pcell::after {
    content: ""; position: absolute; right: 8px; bottom: 2px; height: 2px;
    width: var(--w); background: var(--accent); opacity: .35;
  }
  tr.expand td { padding: 0 8px 10px 26px; background: var(--panel-2); }
  .muted { color: var(--muted); }
  .src { font-size: 11px; padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); }
  .src-live { color: var(--good); border-color: var(--good); }
  .src-fallback, .src-flat { color: var(--accent); border-color: var(--accent); }
</style>
