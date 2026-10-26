<script lang="ts">
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import { valuesForPath, type ValueKey } from "$lib/valuesBar";
  import { valuesBar } from "$lib/valuesBarState.svelte";
  import { f4 } from "$lib/packs/f4.svelte";
  import { g2g } from "$lib/packs/g2g.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { effectivePrices, layeredPrices } from "$lib/packs/prices.svelte";
  import { g2gReadout, currencySymbol, F4_DIVISOR } from "$lib/packs/exchange";
  import { GEM_LV8_DEFAULT, GEM_LV8_SLUG, gemBaseline, gemPriceAt } from "$lib/packs/gems";
  import { LIFE_ENERGY_POTION } from "$lib/packs/priceMap";
  import { LE_PER_BASIC_POTION, bestToolGoldPerLe, loggingGoldPerLe } from "$lib/packs/lifeEnergy";
  import { pheonGold } from "$lib/packs/ev";
  import { PHEONS_PER_ABILITY_STONE } from "$lib/packs/data/hellRewards";
  import { BC_COSTS } from "$lib/packs/data/constants";
  import { formatGold } from "$lib/format";
  import ItemIcon from "./ItemIcon.svelte";

  // "Your values": the shared inputs every tab values against (the F4 exchange, the real-money
  // gold rate, the Lv. 8 gem price, the Life Energy Potion value and the pheons setting), shown
  // under the header on every page, limited to the ones the page actually uses (valuesBar.ts
  // decides from the page's data). Collapsed it is one line of chips; Edit opens one card with a
  // field per value. Every value is written to its existing store, so an edit here moves every
  // tab at once. `path`: the route path without the base path ("/", "/maris", "/pack/<slug>").
  let { path }: { path: string } = $props();

  const use = $derived(valuesForPath(path, { now: app.now }));
  const has = (k: ValueKey): boolean => use.keys.includes(k);

  const region = $derived(app.region);
  const sym = $derived(currencySymbol(region));
  const prices = $derived(layeredPrices());
  const regionOv = $derived(overrides.forRegion(region));

  // Exchange: the shared F4 input (gold for one 238 RC listing). A cleared box is a transient NaN.
  const f4Set = $derived(Number.isFinite(f4.value) && f4.value >= 0);
  const f4Text = $derived(f4Set ? f4.value.toLocaleString("en-US") : "not set");

  // Real-money rate: the typed override, else the live feed (g2g.svelte.ts), with its freshness.
  const g2gOut = $derived(g2g.value ? g2gReadout(g2g.value, sym) : null);

  // Gem baseline: the user's lv-8-gem value or the regional default (gems.ts). Read from the
  // unlayered prices: the price map always fills lv-8-gem, so it cannot tell a default apart.
  const gem = $derived(gemBaseline(effectivePrices(), region));
  const GEM_LEVELS: readonly { level: number; slug: string | null }[] = [
    { level: 7, slug: null }, // no Lv. 7 item is priced on its own; it is always Lv. 8 / 3
    { level: 3, slug: "lv-3-gem" },
    { level: 2, slug: "lv-2-gem" },
    { level: 1, slug: "lv-1-gem" },
  ];
  const gemLevels = $derived(
    GEM_LEVELS.map(({ level, slug }) => ({
      level,
      slug,
      gold: slug !== null && slug in prices ? prices[slug] : gemPriceAt(level, gem.lv8),
      edited: slug !== null && slug in regionOv,
    })),
  );

  // Potion: the user's value, else the logging default from the same layered map (it reads only
  // timber and blue-crystal prices, which the potion's own override never touches). The
  // best-in-slot tool figure sits beside it for reference and never becomes the value.
  const potionOv = $derived(regionOv[LIFE_ENERGY_POTION]);
  const leDefault = $derived.by(() => {
    const perLe = loggingGoldPerLe(prices);
    const best = bestToolGoldPerLe(prices);
    if (perLe === null || best === null) return null;
    const lines = `${best.lines.slice(0, -1).join(", ")} and ${best.lines[best.lines.length - 1]}`;
    return {
      potion: LE_PER_BASIC_POTION * perLe,
      bestPotion: LE_PER_BASIC_POTION * best.goldPerLe,
      tip: `Logging at live timber prices: 3,000 LE × ${perLe.toFixed(3)} gold per LE with no tool bonuses, or × ${best.goldPerLe.toFixed(3)} with a best-in-slot all-in-one tool (${lines} at max rolls).`,
    };
  });
  const potionValue = $derived(potionOv ?? leDefault?.potion ?? null);

  // Pheons: one global setting; the pheon price is per region (a user pheon price, else 8.5 BC
  // at the F4 rate), read from the same map the engine values against.
  const pheonsOn = $derived(hellSettings.includePheons);
  const perStone = $derived(PHEONS_PER_ABILITY_STONE * pheonGold(prices));
  const pheonOverride = $derived(overrides.has(region, "pheon"));
  const pheonItems = $derived(
    use.stones && use.kit ? "Ability stones and Stone of Soaring kits" : use.kit ? "Stone of Soaring kits" : "Ability stones",
  );

  // While a price box has focus its shown value is frozen, so the override it just wrote (read
  // back normalized, e.g. "1e5" -> 100000) never rewrites the text mid-typing; blur shows the
  // stored value again, which also clears an entry that was never saved (a negative number).
  let typing = $state<string | null>(null);
  let frozen = "";
  const shown = (id: string, stored: string | number): string | number => (typing === id ? frozen : stored);
  function startTyping(id: string, stored: string | number): void {
    frozen = String(stored);
    typing = id;
  }
  function stopTyping(el: HTMLInputElement, stored: string | number): void {
    typing = null;
    el.value = String(stored);
  }

  // Highlight the whole value for quick re-entry, and on phones nudge the field above the
  // on-screen keyboard once it settles.
  function focusSelect(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    el.select();
    if (typeof window !== "undefined" && window.innerWidth < 700) {
      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    }
  }
</script>

{#snippet gold()}<img class="ic" src="{base}/icons/gold.png" alt="gold" />{/snippet}
{#snippet rc()}<img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />{/snippet}
{#snippet g2gIcon(cls: string)}<img class="g2g {cls}" src="{base}/icons/g2g.png" alt="" title={g2g.tooltip} />{/snippet}

{#if use.keys.length > 0}
  {#if !valuesBar.open}
    <section class="vb bar" aria-label="Your values">
      <span class="title">Your values</span>
      {#if has("exchange")}
        <span class="chip" title="F4 currency exchange">
          <ItemIcon slug="f4-shop" size={22} />
          <b class="num">{f4Text}</b>{#if f4Set}{@render gold()}<span class="mut">=</span><b class="num">{F4_DIVISOR}</b>{@render rc()}{/if}
        </span>
      {/if}
      {#if has("g2g")}
        <span class="chip">
          {@render g2gIcon("flat")}
          {#if g2gOut}<b class="num" class:stale={g2g.stale}>{g2gOut}</b><span class="mut">/ 100k</span>{@render gold()}{:else}<span class="mut">no rate</span>{/if}
        </span>
      {/if}
      {#if has("gem")}
        <span class="chip">
          <ItemIcon slug="lv-8-gem" size={22} />
          <span>Lv. 8</span><b class="num">{formatGold(gem.lv8)}</b>{@render gold()}{#if gem.isDefault}<span class="tag">default</span>{/if}
        </span>
      {/if}
      {#if has("potion")}
        <span class="chip">
          <ItemIcon slug={LIFE_ENERGY_POTION} size={22} />
          {#if potionValue != null}<b class="num">{formatGold(potionValue)}</b>{@render gold()}{#if potionOv == null}<span class="tag">default</span>{/if}{:else}<span class="mut">no value</span>{/if}
        </span>
      {/if}
      {#if has("pheons")}
        <span class="chip" class:on={pheonsOn} class:off={!pheonsOn}>
          <ItemIcon slug="pheon" size={22} />
          <span>{pheonsOn ? "Pheons included" : "Pheons excluded"}</span>
        </span>
      {/if}
      <button type="button" class="btn primary" aria-expanded="false" onclick={() => valuesBar.setOpen(true)}>Edit <span aria-hidden="true">▾</span></button>
    </section>
  {:else}
    <section class="vb card" aria-label="Your values">
      <div class="head">
        <span class="title">Your values</span>
        <button type="button" class="btn" aria-expanded="true" onclick={() => valuesBar.setOpen(false)}>Done <span aria-hidden="true">▴</span></button>
      </div>
      <div class="grid">
        {#if has("exchange")}
          <div class="field">
            <label class="fh" for="vb-f4"><ItemIcon slug="f4-shop" size={28} /> Currency exchange (F4)</label>
            <div class="row">
              <input id="vb-f4" type="number" min="0" aria-describedby="vb-f4-hint" value={f4.value} oninput={(e) => (f4.value = e.currentTarget.valueAsNumber)} onfocus={focusSelect} />
              {@render gold()}<span class="mut">= {F4_DIVISOR}</span>{@render rc()}
            </div>
            <p class="hint" id="vb-f4-hint">
              <b class="num accent">{f4.perRc.toFixed(2)}</b>{@render gold()} per {@render rc()},
              <b class="num accent">{formatGold(f4.perBc)}</b>{@render gold()} per <img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" />
            </p>
          </div>
        {/if}
        {#if has("g2g")}
          <div class="field">
            <label class="fh" for="vb-g2g">{@render g2gIcon("big")} Real-money gold price</label>
            <div class="row">
              <span class="mut">{sym}</span><input id="vb-g2g" type="number" min="0" step="0.0001" aria-describedby="vb-g2g-hint" value={g2g.value ?? ""} oninput={(e) => g2g.setFromInput(e.currentTarget.valueAsNumber)} onfocus={focusSelect} />
              <span class="mut">per 1k</span>{@render gold()}
            </div>
            <p class="hint" id="vb-g2g-hint">
              = <b class="num accent" class:stale={g2g.stale}>{g2gOut ?? "no rate"}</b> <span>/ 100k</span>{@render gold()}{#if g2g.stale} <span>rate from {g2g.when}</span>{/if}<br />
              Your own rate wins; clear the box to use the live rate.
            </p>
          </div>
        {/if}
        {#if has("gem")}
          <div class="field">
            <label class="fh" for="vb-gem"><ItemIcon slug="lv-8-gem" size={28} /> Lv. 8 gem price</label>
            <div class="row">
              <input id="vb-gem" type="number" min="0" step="any" aria-describedby="vb-gem-levels vb-gem-note" placeholder={String(GEM_LV8_DEFAULT[region])}
                value={shown("gem", regionOv[GEM_LV8_SLUG] ?? "")}
                onfocus={(e) => { startTyping("gem", regionOv[GEM_LV8_SLUG] ?? ""); focusSelect(e); }}
                onblur={(e) => stopTyping(e.currentTarget, regionOv[GEM_LV8_SLUG] ?? "")}
                oninput={(e) => valuesBar.writeOverride(GEM_LV8_SLUG, e.currentTarget.value, e.currentTarget.validity?.badInput)} />
              {@render gold()}
            </div>
            <ul class="levels" id="vb-gem-levels">
              {#each gemLevels as l (l.level)}
                <li>
                  <span class="mut">Lv. {l.level}</span> <b class="num accent">{formatGold(l.gold)}</b>{@render gold()}
                  {#if l.edited && l.slug}<span class="mut">(your edit)</span> <button type="button" class="reset" onclick={() => overrides.clear(region, l.slug!)}>reset</button>{/if}
                </li>
              {/each}
            </ul>
            <p class="fine" id="vb-gem-note">Every gem level follows it: 3 gems fuse into 1 of the next level, so Lv. 7 is a third of Lv. 8. Clear the box to go back to the default.</p>
          </div>
        {/if}
        {#if has("potion")}
          <div class="field">
            <label class="fh" for="vb-potion"><ItemIcon slug={LIFE_ENERGY_POTION} size={28} /> Life Energy Potion value</label>
            <div class="row">
              <input id="vb-potion" type="number" min="0" step="any"
                aria-describedby={leDefault ? "vb-potion-hint vb-potion-note" : "vb-potion-note"}
                placeholder={leDefault ? String(Math.round(leDefault.potion)) : "Your value"}
                value={shown("potion", potionOv ?? "")}
                onfocus={(e) => { startTyping("potion", potionOv ?? ""); focusSelect(e); }}
                onblur={(e) => stopTyping(e.currentTarget, potionOv ?? "")}
                oninput={(e) => valuesBar.writeOverride(LIFE_ENERGY_POTION, e.currentTarget.value, e.currentTarget.validity?.badInput)} />
              {@render gold()}
            </div>
            {#if leDefault}
              <p class="hint" id="vb-potion-hint" title={leDefault.tip}>
                No tool bonuses (default): <b class="num accent">{formatGold(leDefault.potion)}</b>{@render gold()} per potion<br />
                Best-in-slot tool: <b class="num">{formatGold(leDefault.bestPotion)}</b>{@render gold()} per potion
              </p>
              <p class="fine" id="vb-potion-note">Gold per potion. The default is what 3,000 Life Energy earns logging at live timber prices (Lv. 70 Logging, Relic charm, no tool bonuses). Clear the box to go back to it.</p>
            {:else}
              <p class="fine" id="vb-potion-note">Gold per potion. Leave empty for no price; 0 counts as zero.</p>
            {/if}
          </div>
        {/if}
        {#if has("pheons")}
          <div class="field">
            <div class="fh" id="vb-pheons-label"><ItemIcon slug="pheon" size={28} /> Pheons</div>
            <div class="seg" role="group" aria-labelledby="vb-pheons-label" aria-describedby="vb-pheons-hint">
              <button type="button" class:sel={!pheonsOn} aria-pressed={!pheonsOn} onclick={() => hellSettings.setIncludePheons(false)}>Excluded</button>
              <button type="button" class:sel={pheonsOn} aria-pressed={pheonsOn} onclick={() => hellSettings.setIncludePheons(true)}>Included</button>
            </div>
            <p class="hint" id="vb-pheons-hint">
              {pheonItems} can't be traded, so they count as 0 gold while pheons are excluded.
              {#if perStone > 0}Included, each counts as {PHEONS_PER_ABILITY_STONE} pheons: <b class="num accent">{formatGold(Math.round(perStone))}</b>{@render gold()}{pheonOverride ? " at your own pheon price." : ` at ${BC_COSTS.pheon} BC per pheon and your exchange rate.`}{:else}Included, each counts as {PHEONS_PER_ABILITY_STONE} pheons, but pheons have no price until you set an exchange rate or your own pheon price.{/if}
              {#if use.stones}Including them raises every Hell and Netherworld Key value, and every pack holding a key, several times over.{/if}
            </p>
          </div>
        {/if}
      </div>
      <p class="foot">Saved for {region === "euc" ? "EU" : "NA"}. Shared with every tab that uses them.</p>
    </section>
  {/if}
{/if}

<style>
  .vb {
    --panel: #12141c; --chip: #161922; --line: #242838; --border: #2c3142; --field: #0c0e15;
    --text: #e6edf3; --soft: #b9c0d0; --muted: #8b90a6; --accent: #ffd166; --warn: #f0b341;
    margin: 14px 0 6px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
    color: var(--text); font-family: "Sora", system-ui, sans-serif; font-size: 13px; text-align: left;
  }
  .num { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  .accent { color: var(--accent); }
  .stale { color: var(--warn); }
  .mut { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin: 0 1px; }
  .g2g { border-radius: 3px; }
  .g2g.flat { width: 18px; height: 18px; }
  .g2g.big { width: 28px; height: 28px; border-radius: 6px; }
  .title { color: var(--accent); font-weight: 600; white-space: nowrap; }

  /* Collapsed: one wrapping line of chips with the Edit button at the end. */
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; white-space: nowrap;
    background: var(--chip); border: 1px solid var(--line); border-radius: 999px; padding: 3px 11px 3px 4px;
    color: var(--soft); font-size: 12.5px; }
  .chip b { color: var(--text); font-weight: 600; }
  .chip .tag { color: var(--muted); font-size: 11px; }
  .chip.off { color: var(--muted); }
  .chip.off :global(.icon) { filter: grayscale(.85) brightness(.75); }
  .chip.on { color: var(--accent); border-color: rgba(255, 209, 102, .55); background: rgba(255, 209, 102, .07); }
  .btn { margin-left: auto; background: #1d2130; color: var(--text); border: 1px solid #343a50; border-radius: 8px;
    padding: 6px 12px; font: 600 12.5px "Sora", system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
  .btn.primary { background: var(--accent); color: #14161d; border-color: var(--accent); }
  .btn:hover { filter: brightness(1.1); }

  /* Expanded: one card, a field per value; one column on phones, up to three across. */
  .card { padding: 14px 16px; }
  .head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .head .title { font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 12px; }
  .field { background: var(--chip); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; min-width: 0; }
  .fh { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; margin-bottom: 8px; }
  .row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; color: var(--soft); }
  input { width: 120px; background: var(--field); color: var(--text); border: 1px solid var(--border); border-radius: 7px;
    padding: 6px 9px; font: 13px "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  input:focus { outline: none; border-color: var(--accent); }
  input::placeholder { color: #6b7186; }
  /* Hide the number-input spinners so the value uses the full width and never clips. */
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .hint { color: var(--muted); font-size: 12px; line-height: 1.55; margin: 8px 0 0; }
  .fine { color: var(--muted); font-size: 11.5px; line-height: 1.45; margin: 6px 0 0; }
  .levels { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; }
  .levels li { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .reset { background: none; border: 1px solid var(--border); color: var(--accent); border-radius: 6px; padding: 1px 7px;
    font: 600 11px "Sora", system-ui, sans-serif; cursor: pointer; }
  .reset:hover { border-color: var(--accent); }
  .seg { display: inline-flex; border: 1px solid #343a50; border-radius: 999px; overflow: hidden; }
  .seg button { background: none; border: 0; color: var(--muted); padding: 6px 14px; font: 12.5px "Sora", system-ui, sans-serif; cursor: pointer; }
  .seg button.sel { background: #2a2f42; color: var(--text); font-weight: 600; }
  .foot { margin: 12px 0 0; color: var(--muted); font-size: 12px; }
</style>
