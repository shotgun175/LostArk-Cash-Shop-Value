<script lang="ts">
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import { layeredPrices } from "$lib/packs/prices.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { pheonGold } from "$lib/packs/ev";
  import { PHEONS_PER_ABILITY_STONE } from "$lib/packs/data/hellRewards";
  import { formatGold } from "$lib/format";

  // The opt-in "Include pheons" setting (TJW 2026-10-21, adopted 2026-10-25): Ability stones are
  // untradable, so they count as 0 gold unless this is on, when each one is worth 9 pheons. The
  // setting is global (hellSettings.includePheons, persisted); the pheon price itself is per
  // region (the F4 exchange input, or a user pheon price). Mirrors TapValuePanel's layout.
  let { context = "hell" }: { context?: "hell" | "bonus" } = $props();

  // The same layered map every valuation reads, so the price shown is the one the engine uses
  // (a user pheon price wins over 8.5 BC at the F4 rate).
  const perPheon = $derived(pheonGold(layeredPrices()));
  const perStone = $derived(PHEONS_PER_ABILITY_STONE * perPheon);
  const on = $derived(hellSettings.includePheons);
  const hasOverride = $derived(overrides.has(app.region, "pheon"));
  // No pheon price at all: the F4 input is 0 or cleared and there is no user pheon price.
  const unpriced = $derived(perPheon === 0 && !hasOverride);
  const helpId = $derived(`pheon-help-${context}`);
  // Extra help sentences: the Bonus Room's kit shares this setting, and with no pheon price the
  // fix is the F4 input (on the Packs tab, or above it on the Bonus Room).
  const BONUS_NOTE =
    "On this tab the same setting values the Stone of Soaring Engraving Setting Kit at 9 pheons (0 when off).";
  const rateNote = $derived(
    context === "bonus"
      ? "Set an F4 exchange rate above to price pheons."
      : "Set an F4 exchange rate on the Packs tab to price pheons.",
  );
</script>

<div class="tap">
  <div class="line" class:off={!on}>
    <span class="lbl">Ability stone (9 pheons):</span>
    <b class="num accent">{formatGold(Math.round(perStone))}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" />
    {#if hasOverride}
      <span class="badge">override</span>
    {:else if unpriced}
      <span class="badge">no exchange rate</span>
    {/if}
  </div>

  <label class="check">
    <input
      type="checkbox"
      checked={on}
      onchange={(e) => hellSettings.setIncludePheons(e.currentTarget.checked)}
      aria-describedby={helpId}
    />
    Include pheons
  </label>
</div>
<p class="help" id={helpId}>
  Ability stones can't be traded, so they count as 0 gold by default. Turn this on to value each one
  at 9 pheons (a pheon is 8.5 Blue Crystals at your F4 exchange rate). At today's rate that makes
  ability stones the best chest on most floors, so every Hell and Netherworld Key value, and every
  pack holding a key, rises several times over.{#if context === "bonus"}{" "}{BONUS_NOTE}{/if}{#if unpriced}{" "}{rateNote}{/if}
</p>

<style>
  .tap {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 14px; font-size: 13px;
  }
  .line { display: inline-flex; align-items: center; gap: 6px; }
  .line.off { opacity: .5; }
  .lbl { color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; }
  .badge {
    padding: 1px 6px; border-radius: 4px; font-size: 11px;
    color: var(--accent); border: 1px solid var(--accent);
  }
  .check { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); cursor: pointer; }
  .check input { accent-color: var(--accent); cursor: pointer; }
  .help { color: var(--muted); font-size: 12px; line-height: 1.5; margin: 6px 0 14px; }
</style>
