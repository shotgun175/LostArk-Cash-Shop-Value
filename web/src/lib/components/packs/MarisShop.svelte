<script lang="ts">
  import { layeredPrices } from "$lib/packs/prices.svelte";
  import { LIFE_ENERGY_POTION, SOARING_KIT } from "$lib/packs/priceMap";
  import { pheonGold } from "$lib/packs/ev";
  import { PHEONS_PER_ABILITY_STONE } from "$lib/packs/data/hellRewards";
  import { BC_COSTS } from "$lib/packs/data/constants";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { LE_PER_BASIC_POTION, bestToolGoldPerLe, potionDefault } from "$lib/packs/lifeEnergy";
  import { f4 } from "$lib/packs/f4.svelte";
  import { MARIS_WARES, BC_PER_BUNDLE } from "$lib/packs/data/marisShop";
  import { formatGold, formatSignedPct } from "$lib/format";
  import ItemIcon from "../ItemIcon.svelte";

  // The layered map (like every pack-valuing view), so user settings apply and the untradable
  // Basic Life Energy Potion gets its logging default (or the user's value from Your values).
  const prices = $derived(layeredPrices());
  const goldPerBc = $derived(f4.perBc);

  // A row is priced when its slug is in the map (an explicit 0 counts), as on Packs and the Bonus Room.
  const rows = $derived(
    MARIS_WARES.map((w) => {
      const goldCost = Math.round(w.bc * goldPerBc);
      const ahValue = w.slug !== null && w.slug in prices ? Math.round(prices[w.slug] * w.qty) : null;
      const savings = ahValue == null ? null : ahValue - goldCost;
      const savingsPct = ahValue == null || goldCost <= 0 ? null : (ahValue / goldCost - 1) * 100;
      // The potion and the soaring kit are not on the AH, so their values carry a footnote marker.
      const potion = w.slug === LIFE_ENERGY_POTION && ahValue != null;
      const kit = w.slug === SOARING_KIT && ahValue != null;
      const mark = potion ? { sym: "*", note: "maris-potion-note" } : kit ? { sym: "†", note: "maris-kit-note" } : null;
      return { w, goldCost, ahValue, savings, savingsPct, potion, kit, mark };
    }),
  );

  // The footnote under the table, shown only while a potion row is priced: the logging default
  // and the best-in-slot tool figure when timber prices exist, else the user's value is the source.
  const potionNote = $derived.by(() => {
    if (!rows.some((r) => r.potion)) return null;
    const def = potionDefault(prices);
    const best = bestToolGoldPerLe(prices);
    return def === null || best === null ? { def: null, best: null } : { def, best: LE_PER_BASIC_POTION * best.goldPerLe };
  });

  // The kit footnote, shown while the kit row is priced (always, since the map always holds the
  // kit). The value comes from the map; the Include pheons setting only picks the wording.
  const kitNote = $derived.by(() => {
    if (!rows.some((r) => r.kit)) return null;
    return { on: hellSettings.includePheons, perKit: PHEONS_PER_ABILITY_STONE * pheonGold(prices) };
  });
</script>

<div class="maris">
  <h2>Mari's Shop</h2>
  <p class="note">
    Wares cost blue crystals (BC), which you buy with gold at the F4 exchange rate (set in Your
    values), so the gold cost is <b>BC × (F4 gold ÷ {BC_PER_BUNDLE})</b>. "Savings vs AH" compares that
    to buying the same items outright on the Auction House at current prices (your Packs-page price
    edits apply here too).
  </p>

  <div class="tscroll">
  <table>
    <thead>
      <tr>
        <th class="ic-col" aria-label="icon"></th><th>Material</th>
        <th class="right">Qty</th><th class="right">BC cost</th>
        <th class="right">Cost in gold</th><th class="right">AH value</th><th class="right">Savings vs AH</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.w.name)}
        <tr>
          <td class="ic-col">{#if r.w.icon ?? r.w.slug}<ItemIcon slug={(r.w.icon ?? r.w.slug)!} />{/if}</td>
          <td>{r.w.name} <span class="bound">(Bound)</span></td>
          <td class="right num">{r.w.qty.toLocaleString("en-US")}</td>
          <td class="right num bc">{#if r.w.wasBc}<span class="vh">{"was "}</span><span class="was">{r.w.wasBc}</span><span class="vh">, now</span>{"\u00a0"}{/if}{r.w.bc} BC</td>
          <td class="right num">{formatGold(r.goldCost)}</td>
          <td class="right num muted" aria-describedby={r.mark?.note}>{#if r.mark}<span class="fnum">{formatGold(r.ahValue ?? 0)}<sup class="fn" aria-hidden="true">{r.mark.sym}</sup></span>{:else}{r.ahValue == null ? "no price" : formatGold(r.ahValue)}{/if}</td>
          <td class="right num" class:good={(r.savings ?? 0) > 0} class:bad={(r.savings ?? 0) < 0}>
            {#if r.savings == null || r.savingsPct == null}—{:else}{formatSignedPct(r.savingsPct)} <span class="delta">({r.savings >= 0 ? "+" : "−"}{formatGold(Math.abs(r.savings))} g)</span>{/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
  {#if potionNote}
    <p class="note foot" id="maris-potion-note">
      {#if potionNote.def !== null && potionNote.best !== null}
        * Life Energy Potions aren't on the Auction House, so they're valued at what 3,000 Life Energy
        earns logging at live timber prices: <b class="num">{formatGold(potionNote.def)}</b> gold per potion
        with no tool bonuses (<b class="num">{formatGold(potionNote.best)}</b> with a best-in-slot tool). A potion
        value you set in Your values replaces it.
      {:else}
        * Life Energy Potions aren't on the Auction House, so they're valued at your potion value from
        Your values.
      {/if}
    </p>
  {/if}
  {#if kitNote}
    <p class="note foot" id="maris-kit-note">
      {#if kitNote.on && kitNote.perKit > 0}
        † Stone of Soaring kits are untradable, so each counts as {PHEONS_PER_ABILITY_STONE} pheons:
        <b class="num">{formatGold(kitNote.perKit)}</b> gold per kit at {BC_COSTS.pheon} BC per pheon and your
        exchange rate (or your own pheon price). This follows the Pheons setting in Your values.
      {:else if kitNote.on}
        † Stone of Soaring kits are untradable and count as {PHEONS_PER_ABILITY_STONE} pheons each, but
        pheons have no price until you set an exchange rate (Your values) or your own pheon price.
      {:else}
        † Stone of Soaring kits are untradable and count as 0 while pheons are excluded (Your
        values). {#if kitNote.perKit > 0}With pheons included, each kit counts as {PHEONS_PER_ABILITY_STONE} pheons:
          <b class="num">{formatGold(kitNote.perKit)}</b> gold at your exchange rate (or your own pheon price).{:else}With pheons included and an
          exchange rate set, each kit counts as {PHEONS_PER_ABILITY_STONE} pheons.{/if}
      {/if}
    </p>
  {/if}
</div>

<style>
  .maris {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c;
    color: var(--text); font-family: "Sora", system-ui, sans-serif;
  }
  h2 { font-size: 20px; margin: 8px 0 6px; }
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 14px; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .tscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; min-width: 620px; border-collapse: collapse; }
  th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  th { color: var(--muted); font-weight: 600; }
  .right { text-align: right; }
  .ic-col { width: 30px; }
  td.muted { color: var(--muted); }
  .bound { color: var(--muted); font-size: 11.5px; }
  /* The space after the struck-out price (read aloud as "was 345, now 330 BC") is non-breaking,
     so the cell wraps as before, and one monospace character wide, so the margin takes it back
     to the old 2px gap. */
  .bc .was { color: var(--muted); text-decoration: line-through; opacity: .7; margin-right: calc(2px - 1ch); }
  .bc { position: relative; } /* contains the visually hidden spans inside the scroller */
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .delta { font-size: 11.5px; color: var(--muted); white-space: nowrap; } /* "(−169,474 g)" stays on one line; the table scrolls */
  /* The marker hangs into the cell's right padding, so the marked values stay aligned with the
     column's other numbers. */
  .fnum { position: relative; }
  .fn { position: absolute; left: 100%; top: -0.3em; margin-left: 1px; color: var(--accent); font-size: 0.8em; line-height: 1; }
  .foot { margin: 10px 0 0; }
  tr:hover td { background: var(--panel-2); }
</style>
