<script lang="ts">
  import { base } from "$app/paths";
  import type { Attachment } from "svelte/attachments";
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
  // decides from the page's data). It is one line of chips; each chip is a button that opens a
  // popover (a bottom sheet on phones) holding only that value's field. Every value is written to
  // its existing store, so an edit here moves every tab at once. `path`: the route path without
  // the base path ("/", "/maris", "/pack/<slug>").
  let { path }: { path: string } = $props();

  const use = $derived(valuesForPath(path, { now: app.now }));
  const has = (k: ValueKey): boolean => use.keys.includes(k);
  // The open popover (one at a time, valuesBarState.svelte.ts), only for a value this page shows.
  const openKey = $derived.by(() => {
    const k = valuesBar.openFor(path);
    return k !== null && has(k) ? k : null;
  });
  // Each popover is named by its field's title.
  const TITLE_ID: Record<ValueKey, string> = {
    exchange: "vb-f4-title",
    g2g: "vb-g2g-title",
    gem: "vb-gem-title",
    potion: "vb-potion-title",
    pheons: "vb-pheons-label",
  };

  const region = $derived(app.region);
  const sym = $derived(currencySymbol(region));
  const prices = $derived(layeredPrices());
  const regionOv = $derived(overrides.forRegion(region));

  // Exchange: the shared F4 input (gold for one 238 RC listing). The box is empty while the
  // region uses the seed (shown as the placeholder); clearing it returns the region to the seed.
  const f4Set = $derived(Number.isFinite(f4.value) && f4.value >= 0);
  const f4Text = $derived(f4Set ? f4.value.toLocaleString("en-US") : "not set");
  const f4Box = $derived(f4.isDefault || !f4Set ? "" : f4.value);

  // Real-money rate: the typed override, else the live feed (g2g.svelte.ts), with its freshness.
  // Like the exchange box, the box is empty while the live rate applies (shown as the placeholder).
  const g2gOut = $derived(g2g.value ? g2gReadout(g2g.value, sym) : null);
  const g2gBox = $derived(g2g.override ?? "");

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

  // While a price box has focus its shown value is frozen, so the value it just wrote (read
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

  // Phones (600 px or narrower) show the popover as a bottom sheet; the CSS uses the same width.
  const isSheet = (): boolean => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;

  // Highlight the whole value for quick re-entry, and on narrow screens nudge the field above the
  // on-screen keyboard once it settles (the bottom sheet holds its own fields, so not there; nor
  // while the bar is pinned to the top of the window, where the field already shows and a scroll
  // would only jump the page).
  function focusSelect(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    el.select();
    const pinned = (el.closest<HTMLElement>(".vb")?.getBoundingClientRect().top ?? 1) < 1;
    if (typeof window !== "undefined" && window.innerWidth < 700 && !isSheet() && !pinned) {
      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    }
  }

  /** Closes the popover; `focusChip` returns focus to the chip that opened it. */
  function dismiss(key: ValueKey, focusChip: boolean): void {
    valuesBar.close();
    if (focusChip) document.getElementById(`vb-chip-${key}`)?.focus({ preventScroll: true });
  }

  // The open popover's behavior, attached when it renders (after a chip click, never on page
  // load): it sits just below its chip, left-aligned and clamped inside the viewport (the phone
  // sheet is placed by CSS, which ignores that position), focuses its field, and closes on
  // Escape or on a click outside both the popover and the chips (a chip click switches to that
  // chip's popover, or closes its own, through valuesBar.toggle).
  function popover(key: ValueKey): Attachment<HTMLElement> {
    return (pop) => {
      const bar = pop.closest<HTMLElement>(".vb");
      const place = (): void => {
        const chip = document.getElementById(`vb-chip-${key}`);
        if (!bar || !chip) return;
        const b = bar.getBoundingClientRect();
        const c = chip.getBoundingClientRect();
        const left = Math.max(8, Math.min(c.left, document.documentElement.clientWidth - pop.offsetWidth - 8));
        // Offsets are from the bar's padding box, inside its border.
        pop.style.setProperty("--x", `${left - b.left - bar.clientLeft}px`);
        pop.style.setProperty("--y", `${c.bottom - b.top - bar.clientTop + 6}px`);
      };
      const inside = (t: EventTarget | null): boolean =>
        t instanceof Element && (pop.contains(t) || t.closest("[data-vb-chip]") !== null);
      // A press that starts inside (selecting the text in a box, say) and ends outside is not a
      // click outside.
      let downInside = false;
      const onDown = (e: PointerEvent): void => {
        downInside = inside(e.target);
      };
      const onClick = (e: MouseEvent): void => {
        const wasInside = downInside || inside(e.target);
        downInside = false;
        if (wasInside) return;
        // A click on something focusable keeps that focus; anywhere else returns it to the chip.
        const t = e.target;
        dismiss(key, !(t instanceof Element && t.closest("a, button, input, select, textarea, label, [tabindex]")));
      };
      const onKey = (e: KeyboardEvent): void => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        dismiss(key, true);
      };
      place();
      pop.querySelector<HTMLElement>("input, .seg .sel")?.focus({ preventScroll: true });
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("click", onClick, true);
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", place);
      // Chips rewrap as their values change width; keep the popover under its chip.
      const ro = bar && typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
      if (bar) ro?.observe(bar);
      return () => {
        // Not every browser fires blur on a focused box that is removed, so unfreeze here too.
        typing = null;
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", place);
        ro?.disconnect();
      };
    };
  }
</script>

{#snippet gold()}<img class="ic" src="{base}/icons/gold.png" alt="gold" />{/snippet}
{#snippet rc()}<img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />{/snippet}
{#snippet g2gIcon(cls: string)}<img class="g2g {cls}" src="{base}/icons/g2g.png" alt="" title={g2g.tooltip} />{/snippet}

{#if use.keys.length > 0}
  <section class="vb bar" aria-label="Your values">
    <span class="title">Your values</span>
    {#if has("exchange")}
      <button type="button" class="chip" id="vb-chip-exchange" data-vb-chip aria-haspopup="dialog" aria-expanded={openKey === "exchange"} aria-controls={openKey === "exchange" ? "vb-pop" : undefined} title="F4 currency exchange" onclick={() => valuesBar.toggle("exchange", path)}>
        <ItemIcon slug="f4-shop" size={22} />
        <b class="num">{f4Text}</b>{#if f4Set}{@render gold()}<span class="wide"><span class="mut">=</span><b class="num">{F4_DIVISOR}</b>{@render rc()}</span>{/if}
      </button>
    {/if}
    {#if has("g2g")}
      <button type="button" class="chip" id="vb-chip-g2g" data-vb-chip aria-haspopup="dialog" aria-expanded={openKey === "g2g"} aria-controls={openKey === "g2g" ? "vb-pop" : undefined} onclick={() => valuesBar.toggle("g2g", path)}>
        <span class="vh">Real-money gold price</span>
        {@render g2gIcon("flat")}
        {#if g2gOut}<b class="num" class:stale={g2g.stale}>{g2gOut}</b><span class="wide"><span class="mut">/ 100k</span>{@render gold()}</span>{:else}<span class="mut">no rate</span>{/if}
      </button>
    {/if}
    {#if has("gem")}
      <button type="button" class="chip" id="vb-chip-gem" data-vb-chip aria-haspopup="dialog" aria-expanded={openKey === "gem"} aria-controls={openKey === "gem" ? "vb-pop" : undefined} onclick={() => valuesBar.toggle("gem", path)}>
        <ItemIcon slug="lv-8-gem" size={22} />
        <span class="wide">Lv. 8</span><b class="num">{formatGold(gem.lv8)}</b>{@render gold()}
      </button>
    {/if}
    {#if has("potion")}
      <button type="button" class="chip" id="vb-chip-potion" data-vb-chip aria-haspopup="dialog" aria-expanded={openKey === "potion"} aria-controls={openKey === "potion" ? "vb-pop" : undefined} onclick={() => valuesBar.toggle("potion", path)}>
        <ItemIcon slug={LIFE_ENERGY_POTION} size={22} />
        {#if potionValue != null}<b class="num">{formatGold(potionValue)}</b>{@render gold()}{:else}<span class="mut">no value</span>{/if}
      </button>
    {/if}
    {#if has("pheons")}
      <button type="button" class="chip" class:on={pheonsOn} class:off={!pheonsOn} id="vb-chip-pheons" data-vb-chip aria-haspopup="dialog" aria-expanded={openKey === "pheons"} aria-controls={openKey === "pheons" ? "vb-pop" : undefined} onclick={() => valuesBar.toggle("pheons", path)}>
        <ItemIcon slug="pheon" size={22} />
        <span class="state"><span class="wide">Pheons</span> {pheonsOn ? "included" : "excluded"}</span>
      </button>
    {/if}

    {#if openKey}
      <div class="backdrop" aria-hidden="true"></div>
      <div class="pop" id="vb-pop" role="dialog" aria-labelledby={TITLE_ID[openKey]} {@attach popover(openKey)}>
        <span class="grab" aria-hidden="true"></span>
        {#if openKey === "exchange"}
          <div class="field">
            <label class="fh" for="vb-f4"><ItemIcon slug="f4-shop" size={28} /> <span id="vb-f4-title">Currency exchange (F4)</span></label>
            <div class="row">
              <input id="vb-f4" type="number" min="0" aria-describedby="vb-f4-hint" placeholder={String(f4.seed)}
                value={shown("f4", f4Box)}
                onfocus={(e) => { startTyping("f4", f4Box); focusSelect(e); }}
                onblur={(e) => stopTyping(e.currentTarget, f4Box)}
                oninput={(e) => valuesBar.writeF4(e.currentTarget.value, e.currentTarget.validity?.badInput)} />
              {@render gold()}<span class="mut">= {F4_DIVISOR}</span>{@render rc()}
            </div>
            <p class="hint" id="vb-f4-hint">
              <b class="num accent">{f4.perRc.toFixed(2)}</b>{@render gold()} per {@render rc()},
              <b class="num accent">{formatGold(f4.perBc)}</b>{@render gold()} per <img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" />
            </p>
          </div>
        {:else if openKey === "g2g"}
          <div class="field">
            <label class="fh" for="vb-g2g">{@render g2gIcon("big")} <span id="vb-g2g-title">Real-money gold price</span></label>
            <div class="row">
              <span class="mut">{sym}</span><input id="vb-g2g" type="number" min="0" step="0.0001" aria-describedby="vb-g2g-hint"
                placeholder={g2g.live != null ? String(g2g.live) : ""}
                value={shown("g2g", g2gBox)}
                onfocus={(e) => { startTyping("g2g", g2gBox); focusSelect(e); }}
                onblur={(e) => stopTyping(e.currentTarget, g2gBox)}
                oninput={(e) => valuesBar.writeG2g(e.currentTarget.value, e.currentTarget.validity?.badInput)} />
              <span class="mut">per 1k</span>{@render gold()}
            </div>
            <p class="hint" id="vb-g2g-hint">
              = <b class="num accent" class:stale={g2g.stale}>{g2gOut ?? "no rate"}</b> <span>/ 100k</span>{@render gold()}{#if g2g.stale} <span>rate from {g2g.when}</span>{/if}<br />
              Your own rate wins; clear the box to use the live rate.
            </p>
          </div>
        {:else if openKey === "gem"}
          <div class="field">
            <label class="fh" for="vb-gem"><ItemIcon slug="lv-8-gem" size={28} /> <span id="vb-gem-title">Lv. 8 gem price</span></label>
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
        {:else if openKey === "potion"}
          <div class="field">
            <label class="fh" for="vb-potion"><ItemIcon slug={LIFE_ENERGY_POTION} size={28} /> <span id="vb-potion-title">Life Energy Potion value</span></label>
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
        {:else if openKey === "pheons"}
          <div class="field">
            <div class="fh"><ItemIcon slug="pheon" size={28} /> <span id="vb-pheons-label">Pheons</span></div>
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
        <div class="pfoot">
          <!-- The pheons setting is one switch for both regions; every other value is per region. -->
          <p class="foot">Saved for {openKey === "pheons" ? "NA and EU" : region === "euc" ? "EU" : "NA"}. Shared with every tab that uses it.</p>
          <button type="button" class="btn primary" onclick={() => dismiss(openKey!, true)}>Done</button>
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  /* The bar stays pinned to the top of the window as the page scrolls, over the page's cards (a
     phone puts it at the bottom instead, below). Never give it a transform, filter or contain: any
     of them would trap the phone's fixed bottom sheet inside the bar. */
  .vb {
    --panel: #12141c; --chip: #161922; --line: #242838; --border: #2c3142; --field: #0c0e15;
    --text: #e6edf3; --soft: #b9c0d0; --muted: #8b90a6; --accent: #ffd166; --warn: #f0b341;
    position: sticky; top: 0; z-index: 30;
    margin: 14px 0 6px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .55);
    color: var(--text); font-family: "Sora", system-ui, sans-serif; font-size: 13px; text-align: left;
  }
  /* A page or footer control that gets keyboard focus scrolls clear of the pinned bar (two rows of
     chips at most). This sits on those controls, not on the window: scroll-padding there makes the
     browser treat the pinned chips as hidden, so tabbing into the bar scrolled the page away. */
  :global(html:has(.vb) :is(main, footer) :is(a, button, input, select, textarea, summary, [tabindex])) { scroll-margin-top: 96px; }
  .num { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  .accent { color: var(--accent); }
  .stale { color: var(--warn); }
  .mut { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin: 0 1px; }
  .g2g { border-radius: 3px; }
  .g2g.flat { width: 18px; height: 18px; }
  .g2g.big { width: 28px; height: 28px; border-radius: 6px; }
  .title { color: var(--accent); font-weight: 600; white-space: nowrap; }

  /* One wrapping line of chips; each chip opens its own popover. */
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; white-space: nowrap;
    background: var(--chip); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px 3px 4px;
    color: var(--soft); font: 12.5px "Sora", system-ui, sans-serif; cursor: pointer;
    transition: background-color .12s, border-color .12s; }
  /* A small chevron says the chip opens something; it brightens on hover and flips while open. */
  .chip::after { content: ""; flex: none; width: 5px; height: 5px; margin: 0 1px 3px 2px;
    border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg); opacity: .4; transition: opacity .12s; }
  .chip:hover, .chip:focus-visible, .chip[aria-expanded="true"] { background: #1d2130; border-color: #3a4160; }
  .chip:hover::after, .chip:focus-visible::after, .chip[aria-expanded="true"]::after { opacity: .9; }
  .chip[aria-expanded="true"]::after { transform: rotate(-135deg); margin-bottom: -2px; }
  .chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .chip b { color: var(--text); font-weight: 600; }
  .chip.off { color: var(--muted); }
  .chip.off :global(.icon) { filter: grayscale(.85) brightness(.75); }
  .chip.on { color: var(--accent); border-color: rgba(255, 209, 102, .55); background: rgba(255, 209, 102, .07); }
  .chip.on:hover, .chip.on[aria-expanded="true"] { background: rgba(255, 209, 102, .13); }
  /* Parts of a chip only wider screens show; a phone cell keeps the icon and the short value. */
  .wide { display: contents; }
  /* Read by screen readers only: the real-money chip shows just its icon. */
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .btn { margin-left: auto; background: #1d2130; color: var(--text); border: 1px solid #343a50; border-radius: 8px;
    padding: 6px 12px; font: 600 12.5px "Sora", system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
  .btn.primary { background: var(--accent); color: #14161d; border-color: var(--accent); }
  .btn:hover { filter: brightness(1.1); }

  /* The popover: just below its chip (--x / --y, set when it opens), above the page, no backdrop.
     It travels with the pinned bar, so on a short window (a phone on its side) it scrolls inside
     itself rather than run off the bottom of the screen out of reach. */
  .pop { position: absolute; z-index: 40; left: var(--x, 12px); top: var(--y, 44px); box-sizing: border-box;
    width: min(360px, calc(100vw - 16px)); padding: 14px 16px 12px;
    max-height: calc(100dvh - var(--y, 44px) - 16px); overflow-y: auto;
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
    box-shadow: 0 14px 36px rgba(0, 0, 0, .55); }
  .backdrop, .grab { display: none; }
  .fh { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; margin-bottom: 10px; }
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
  .pfoot { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); }
  .foot { margin: 0; color: var(--muted); font-size: 11.5px; line-height: 1.45; }

  /* Phones: the bar is a toolbar fixed to the bottom of the screen, in thumb reach, with one
     equal-width cell per value (the icon over a short value) so every value shows at once, and the
     page gets room below its footer to scroll clear of it. A cell opens the same content as a
     bottom sheet over a light backdrop that closes it when tapped. */
  @media (max-width: 600px) {
    .vb { position: fixed; left: 0; right: 0; bottom: 0; top: auto; margin: 0; border-width: 1px 0 0; border-radius: 0;
      box-shadow: 0 -8px 20px rgba(0, 0, 0, .45); }
    .bar { flex-wrap: nowrap; align-items: stretch; gap: 6px; padding: 4px 8px calc(4px + env(safe-area-inset-bottom)); }
    .title, .wide, .chip::after { display: none; }
    /* Every cell has the same two rows, so the values line up across cells whatever their font: the
       icon across the top, then the value and its coin. No column gap (the coin carries its own),
       so a value with no coin stays centered. */
    .chip { flex: 1 1 0; min-width: 0; display: grid; grid-template-columns: auto auto; grid-template-rows: 18px 16px;
      justify-content: center; align-content: center; align-items: center; gap: 2px 0; padding: 5px 1px 4px;
      border-radius: 10px; font-size: 12px; line-height: 16px; }
    .chip > :global(.icon-box), .chip > .g2g { grid-column: 1 / -1; justify-self: center; }
    /* ItemIcon sizes its box with an inline style. */
    .chip > :global(.icon-box) { width: 18px !important; height: 18px !important; }
    .chip > .ic { margin: 0 0 0 2px; }
    .state { text-transform: capitalize; }
    :global(html:has(.vb) :is(main, footer) :is(a, button, input, select, textarea, summary, [tabindex])) { scroll-margin: 0 0 72px; }
    :global(body:has(.vb)) { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
    .backdrop { display: block; position: fixed; inset: 0; z-index: 40; background: rgba(5, 6, 10, .45); }
    .pop { position: fixed; z-index: 41; left: 0; right: 0; top: auto; bottom: 0; width: auto;
      max-height: 80vh; overflow-y: auto; overscroll-behavior: contain;
      padding: 8px 16px calc(14px + env(safe-area-inset-bottom));
      border-width: 1px 0 0; border-radius: 16px 16px 0 0; box-shadow: 0 -10px 30px rgba(0, 0, 0, .5); }
    .grab { display: block; width: 40px; height: 4px; border-radius: 2px; background: #3a4058; margin: 0 auto 12px; }
  }
  /* Under 390 px the coins drop so a value fits its cell (five cells is the budget: "348,000" and
     its coin fill a 390 px phone's cell). */
  @media (max-width: 389px) {
    .chip > .ic { display: none; }
  }
  /* Under 350 px the bar's spacing tightens and the values drop a size, so "Excluded" still fits. */
  @media (max-width: 349px) {
    .bar { padding-left: 4px; padding-right: 4px; gap: 4px; }
    .chip { font-size: 11px; }
  }
</style>
