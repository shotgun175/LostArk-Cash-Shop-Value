<script lang="ts">
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import { g2gReadout, currencySymbol } from "$lib/packs/exchange";
  import { f4 } from "$lib/packs/f4.svelte";
  import { g2g } from "$lib/packs/g2g.svelte";

  // The shared F4 + G2G exchange inputs (Packs tab and Bonus Room). Both values live in their
  // per-region stores (f4.svelte.ts, g2g.svelte.ts), so an edit here shows on every tab that
  // reads them. Colors come from the parent tab's scoped palette tokens (--panel, --accent...).
  const sym = $derived(currencySymbol(app.region));
  const f4base = $derived(f4.perRc);
  // The G2G readout carries the live rate's freshness: a hover tooltip always, plus a visible
  // amber cue once the shown leg is over 6 h old and no override is set (g2g.stale); this
  // revisits the 2026-06-16 hover-only choice.
  const g2gOut = $derived(g2g.value ? g2gReadout(g2g.value, sym) : "—");

  // Highlight the whole value for quick re-entry, and on mobile nudge the field above the
  // on-screen keyboard once it settles (the keyboard otherwise covers the exchange inputs).
  function focusExchange(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    el.select();
    if (typeof window !== "undefined" && window.innerWidth < 700) {
      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    }
  }
</script>

<div class="exch">
  <span class="ex">
    <span class="lbl">Currency exchange (F4, optional):</span>
    <input class="f4" type="number" min="0" value={f4.value} oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)} onfocus={focusExchange} aria-label="F4 exchange gold" />
    <img class="ic" src="{base}/icons/gold.png" alt="gold" />
    <span class="lbl">for 238</span><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />
    <span class="lbl">=</span> <b class="num accent">{f4base.toFixed(2)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" /><span class="lbl">/</span><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />
  </span>
  <span class="ex">
    <img class="ic g2g" src="{base}/icons/g2g.png" alt="" title={g2g.tooltip} />
    <span class="lbl">exchange (optional):</span>
    <span class="lbl">{sym}</span><input class="g2g-in" type="number" min="0" step="0.0001" value={g2g.value ?? ""} oninput={(e) => g2g.setFromInput(e.currentTarget.valueAsNumber)} onfocus={focusExchange} aria-label="G2G price per 1,000 gold" />
    <span class="lbl">for 1k</span><img class="ic" src="{base}/icons/gold.png" alt="gold" />
    <span class="lbl">=</span> <b class="num accent" class:stale={g2g.stale}>{g2gOut}</b> <span class="lbl">/ 100k</span>{#if g2g.stale} <span class="lbl">rate from {g2g.when}</span>{/if}
  </span>
</div>

<style>
  .exch { display: flex; flex-wrap: wrap; gap: 12px 28px; align-items: center; font-size: 13px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px 16px; margin-bottom: 12px; }
  .ex { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .lbl { color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .accent.stale { color: var(--warn); }
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
</style>
