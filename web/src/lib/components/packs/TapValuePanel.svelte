<script lang="ts">
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import { effectivePrices } from "$lib/packs/prices.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { tapDerivation, TAP_SLUGS, type TapOverrides } from "$lib/packs/tapPrices";
  import { columnPrice } from "$lib/packs/ev";
  import { HELL_TIERS } from "$lib/packs/data/hellRewards";
  import { formatGold } from "$lib/format";

  // What one "Free taps" unit is worth, and where that number came from. The tap price is
  // computed from live mat prices (tapPrices.ts), so it moves with the market and is by far
  // the biggest single lever on a key's EV; this panel makes it visible and overridable.
  let { ilvl }: { ilvl: number } = $props();

  // 1730/1750 hone on the Transferred (T4.5) track, everything below on Circulated (T4).
  const kind = $derived(ilvl >= 1730 ? "transferred" : "circulated");
  const track = $derived(kind === "transferred" ? "Transferred" : "Circulated");

  const ov = $derived<TapOverrides>(hellSettings.tapOverride[app.region] ?? {});
  const target = $derived(ov.target ?? "auto");
  // Deliberately raw prices, not the tab's withTapPrices map: tapDerivation builds the engine
  // inputs itself, and it reports what the mats say regardless of any override. The result is
  // memo-cached and shared, so it is only ever read here, never mutated.
  const derivation = $derived(tapDerivation(effectivePrices(), kind, target));

  // Missing-inputs fallback, read straight off the reward tables' "Free taps" valuation so the
  // number here can never drift from the one the EV actually falls back to. Circulated lives in
  // a per-tier override; Transferred has none, and an undefined tier lands on the global entry.
  const tier = $derived(
    Object.values(HELL_TIERS).find(
      (t) => t.ilvl === ilvl && t.valuation?.["Free taps"]?.slug === TAP_SLUGS[kind],
    ),
  );
  const fallback = $derived(columnPrice("Free taps", {}, tier));
  const shown = $derived(derivation ? derivation.goldPerTap : fallback);

  const on = $derived(ov[kind] !== undefined);

  function toggle(checked: boolean): void {
    const next: TapOverrides = { ...ov };
    if (checked) next[kind] = Math.round(shown);
    else delete next[kind];
    hellSettings.setTapOverride(app.region, next);
  }

  function setValue(v: number): void {
    hellSettings.setTapOverride(app.region, { ...ov, [kind]: v });
  }
</script>

<div class="tap">
  <div class="line" class:superseded={on}>
    <span class="lbl">Special hone tap ({track}):</span>
    <b class="num accent">{formatGold(Math.round(shown))}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" /><span class="lbl">/tap</span>
    <!-- No derivation caption on purpose: the optimizer's "best use" (slot/level) read as a
         claim about the player's own honing state, which it is not (user 2026-08-03). The
         price plus Override says everything the player needs. -->
    {#if !derivation}
      <span class="badge">fallback</span>
    {/if}
  </div>

  <label class="check">
    <input type="checkbox" checked={on} onchange={(e) => toggle(e.currentTarget.checked)} />
    Override
  </label>
  {#if on}
    <input
      class="val num"
      type="number"
      min="0"
      value={Number.isFinite(ov[kind]) ? ov[kind] : ""}
      oninput={(e) => setValue(e.currentTarget.valueAsNumber)}
      aria-label="Special hone tap gold per tap"
    />
  {/if}
</div>
<p class="help">
  Every "Free taps" reward is valued at this price. It is solved from live honing mats, so it
  tracks the market; override it if your own tap economics differ.
</p>

<style>
  .tap {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 14px; font-size: 13px;
  }
  .line { display: inline-flex; align-items: center; gap: 6px; }
  .line.superseded { opacity: .5; }
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
  input.val {
    width: 92px; background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 6px; padding: 5px 8px; font-size: 13px;
  }
  input.val:focus { outline: none; border-color: var(--accent); }
  .help { color: var(--muted); font-size: 12px; line-height: 1.5; margin: 6px 0 14px; }
</style>
