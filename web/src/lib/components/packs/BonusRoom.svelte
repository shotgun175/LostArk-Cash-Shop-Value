<script lang="ts">
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import { BONUS_ROOM } from "$lib/packs/data/bonusRoom";
  import { bonusRoomActive, bonusRoomRows, timeLeft, type BonusGroupRow, type BonusProductRow } from "$lib/packs/bonusRoom";
  import { layeredPrices } from "$lib/packs/prices.svelte";
  import { f4 } from "$lib/packs/f4.svelte";
  import { g2g } from "$lib/packs/g2g.svelte";
  import { overrides } from "$lib/packs/overrides.svelte";
  import { selection } from "$lib/packs/selection.svelte";
  import { hellSettings } from "$lib/packs/hellSettings.svelte";
  import { cashPerRc } from "$lib/packs/exchange";
  import { pheonGold } from "$lib/packs/ev";
  import { SOARING_KIT } from "$lib/packs/priceMap";
  import { LE_PER_BASIC_POTION, loggingGoldPerLe } from "$lib/packs/lifeEnergy";
  import { formatGold, formatSignedPct } from "$lib/format";
  import ItemIcon from "../ItemIcon.svelte";
  import PackCard from "./PackCard.svelte";
  import PackLinesTable from "./PackLinesTable.svelte";
  import ExchangeInputs from "./ExchangeInputs.svelte";
  import PheonPanel from "./PheonPanel.svelte";

  // The Bonus Room tab (TJW's 2026-10-21 logic and data, our design): each group's products as
  // Packs-style cards, the group's free bonus pack, and the whole group's value vs its cost. All
  // values come from the same layered price map as the Packs tab, so price edits apply here too.
  // The tab is reachable only while the room runs (the nav hides it otherwise); a stale link or
  // bookmark lands on the short "not running" notice instead.
  const room = BONUS_ROOM;
  const active = $derived(bonusRoomActive(room, app.now));
  const ended = $derived(room != null && app.now >= Date.parse(room.endsAt));
  // "Scheduled maintenance on 11/18/2026" -> "...ended with the scheduled maintenance on 11/18/2026."
  const endedWith = $derived(room ? room.endsLabel.charAt(0).toLowerCase() + room.endsLabel.slice(1) : "");

  const prices = $derived(layeredPrices());
  const groups = $derived(
    active && room
      ? bonusRoomRows(room, prices, {
          f4Input: f4.value,
          g2gInput: g2g.value ?? 0,
          cashPerRc: cashPerRc(app.region),
          picks: selection.map,
        })
      : [],
  );
  // "buy all 3 in a group": the count comes from the data (every Autumn group has 3 products).
  const perGroup = $derived(
    room && room.groups.length > 0 && room.groups.every((g) => g.products.length === room.groups[0].products.length)
      ? room.groups[0].products.length
      : null,
  );

  // The two value inputs write this region's price overrides, the same store a pack card's
  // click-to-edit price writes, so they apply on every tab. They write ONLY from an input event
  // (never on load or render); an emptied box removes the override.
  const GEM_SLUG = "lv-3-gem";
  const POTION_SLUG = "basic-life-energy-potion";
  const KIT_SLUG = SOARING_KIT;
  const LV3_PER_LV7 = 81; // 3 gems fuse into 1 of the next level, four levels from Lv. 3 to Lv. 7
  const KIT_NOTE = "Counts as 0 gold while pheons are excluded (setting above).";
  const KIT_UNPRICED_NOTE = "Counts as 0 gold until an F4 exchange rate prices pheons (above).";

  const regionOv = $derived(overrides.forRegion(app.region));
  const gemOv = $derived(regionOv[GEM_SLUG]);
  const potionOv = $derived(regionOv[POTION_SLUG]);
  const lv3 = $derived(prices[GEM_SLUG] ?? 0);
  // The potion's logging default (lifeEnergy.ts), from the same layered map: it reads only the
  // timber and blue-crystal prices, which the potion's own override never touches.
  const leDefault = $derived.by(() => {
    const perLe = loggingGoldPerLe(prices);
    return perLe === null ? null : { perLe, potion: LE_PER_BASIC_POTION * perLe };
  });
  // Rounded like a pack card's price editor so 150,000 / 81 x 81 reads back as 150000.
  const gemShown = $derived(gemOv != null ? Number((gemOv * LV3_PER_LV7).toFixed(4)) : "");

  // While a value box has focus its shown value is frozen, so the override it just wrote (read
  // back normalized, e.g. "1e5" -> 100000) never rewrites the text mid-typing; blur shows the
  // stored value again, which also clears an entry that was never saved (a negative number).
  let typing = $state<string | null>(null); // id of the focused value box
  let frozen = "";
  const shownValue = (id: string, stored: string | number): string | number => (typing === id ? frozen : stored);
  function startTyping(id: string, stored: string | number): void {
    frozen = String(stored);
    typing = id;
  }
  function stopTyping(el: HTMLInputElement, stored: string | number): void {
    typing = null;
    el.value = String(stored);
  }

  function onPriceInput(slug: string, perUnitDivisor: number, el: HTMLInputElement): void {
    if (el.validity?.badInput) return; // half-typed ("1e"): keep the last value until it parses
    const raw = el.value.trim();
    if (raw === "") {
      overrides.clear(app.region, slug);
      return;
    }
    const v = Number(raw);
    if (Number.isFinite(v) && v >= 0) overrides.set(app.region, slug, v / perUnitDivisor);
  }

  // The soaring kit is computed (9 pheons with Include pheons on, else 0), so when it is 0 (pheons
  // off, or on with no pheon price yet) its product reads 0 gold and -100%: say why on that card
  // instead of the generic unpriced notice.
  function noticeFor(p: BonusProductRow): string | null {
    if (p.lines.some((l) => l.slug === KIT_SLUG)) {
      if (!hellSettings.includePheons) return KIT_NOTE;
      if (pheonGold(prices) === 0) return KIT_UNPRICED_NOTE;
    }
    return p.hasUnpriced && p.valueSet ? "Some contents have no price" : null;
  }

  // A product holding one chest several times shows the count as a badge ("×6"), unless its
  // in-game name already ends with it ("... X 125", "... X10"). The count comes from the data,
  // since a row's lines can expand one chest into several materials.
  const productData = new Map((room?.groups ?? []).flatMap((g) => g.products).map((p) => [p.slug, p]));
  function badgeFor(p: BonusProductRow): string | null {
    const c = productData.get(p.slug)?.contents;
    if (!c || c.length !== 1 || !(c[0].qty > 1) || /\bX\s?\d+\s*$/i.test(p.name)) return null;
    return `×${c[0].qty}`;
  }

  // The footer names what the group total leaves out: unpriced products and bonus, and "(part)" for
  // one that is valued but has an unpriced line.
  function notCounted(g: BonusGroupRow): string | null {
    const items = [...g.products, g.bonus];
    const names = items
      .filter((x) => x.hasUnpriced)
      .map((x) => (x.valueSet ? `${x.name} (part)` : x.name));
    if (names.length === 0) return null;
    const potion = g.products.some((p) => p.hasUnpriced && p.calculator === "life-energy");
    return `Not counted (no price yet): ${names.join(", ")}.${potion ? " Enter a Life Energy Potion value above to count it." : ""}`;
  }
</script>

<div class="br">
  {#if !active || !room}
    <div class="inactive">
      <h2>Bonus Room</h2>
      <p>No Bonus Room is running right now.</p>
      {#if room && ended}<p class="muted">The {room.name} Bonus Room ended with the {endedWith}.</p>{/if}
      <a class="back" href="{base}/">Back to Packs</a>
    </div>
  {:else}
    <div class="room-head">
      <h2>Bonus Room</h2>
      <p class="note">
        {room.name} rotation. One purchase of each product per roster; buy {perGroup != null ? `all ${perGroup}` : "every product"} in a group to get its bonus.
      </p>
      <p class="status"><b class="num">{timeLeft(Date.parse(room.endsAt) - app.now)} left</b> <span class="sep" aria-hidden="true">·</span> <span>{room.endsLabel}</span></p>
    </div>

    <ExchangeInputs />

    <div class="controls">
      <div class="ctl">
        <label class="ctl-label" for="br-gem">Your Lv. 7 gem price</label>
        <div class="ctl-row">
          <input id="br-gem" type="number" min="0" step="any" placeholder={String(Math.round(lv3 * LV3_PER_LV7))}
            aria-describedby="br-gem-hint br-gem-note" value={shownValue("gem", gemShown)}
            onfocus={() => startTyping("gem", gemShown)} onblur={(e) => stopTyping(e.currentTarget, gemShown)}
            oninput={(e) => onPriceInput(GEM_SLUG, LV3_PER_LV7, e.currentTarget)} />
          <img class="ic" src="{base}/icons/gold.png" alt="gold" />
        </div>
        <p class="hint" id="br-gem-hint">
          {#if gemOv != null}Lv. 7 / 81 = <b class="num accent">{formatGold(lv3)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" /> per Lv. 3 gem{:else}Default Lv. 3 gem value: <b class="num accent">{formatGold(lv3)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" />{/if}
        </p>
        <p class="fine" id="br-gem-note">Sets the Lv. 3 gem price on every tab, the same as editing it on a pack card. Clear the box to go back to the default.</p>
      </div>
      <div class="ctl">
        <label class="ctl-label" for="br-potion">Life Energy Potion value</label>
        <div class="ctl-row">
          <input id="br-potion" type="number" min="0" step="any"
            placeholder={leDefault ? String(Math.round(leDefault.potion)) : "Your value"}
            aria-describedby={leDefault ? "br-potion-hint br-potion-note" : "br-potion-note"} value={shownValue("potion", potionOv ?? "")}
            onfocus={() => startTyping("potion", potionOv ?? "")} onblur={(e) => stopTyping(e.currentTarget, potionOv ?? "")}
            oninput={(e) => onPriceInput(POTION_SLUG, 1, e.currentTarget)} />
          <img class="ic" src="{base}/icons/gold.png" alt="gold" />
        </div>
        {#if leDefault}
          <p class="hint" id="br-potion-hint">
            {#if potionOv != null}Logging default: <b class="num accent">{formatGold(leDefault.potion)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" />{:else}Default: <b class="num accent">{formatGold(leDefault.potion)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" /> per potion (3,000 LE at {leDefault.perLe.toFixed(3)} gold per LE){/if}
          </p>
          <p class="fine" id="br-potion-note">Gold per potion, saved for this region. The default is what 3,000 Life Energy earns logging at live timber prices (Lv. 70 Logging, Relic charm, no tool bonuses). Clear the box to go back to it.</p>
        {:else}
          <p class="fine" id="br-potion-note">Gold per potion, saved for this region. Leave empty for no price; 0 counts as zero.</p>
        {/if}
      </div>
    </div>

    <PheonPanel context="bonus" {prices} />

    <p class="note">Products use the same prices as the Packs tab, including your price edits. Items with no price are left out of gold totals.</p>

    {#if app.status === "loading"}
      <p class="state">Loading prices…</p>
    {:else if app.status === "error"}
      <p class="state bad">Failed to load prices.</p>
    {:else if !app.snapshot || Object.keys(app.snapshot.prices).length === 0}
      <p class="state">No prices yet. The feed may be refreshing.</p>
    {:else}
      <div class="groups">
        {#each groups as g, i (g.slug)}
          {@const n = g.products.length}
          {@const left = notCounted(g)}
          <section class="group" aria-labelledby="br-{g.slug}">
            <header class="ghead">
              <span class="gnum num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 id="br-{g.slug}">{g.name}</h3>
              <span class="gcount">{n} product{n === 1 ? "" : "s"}</span>
            </header>

            <div class="products">
              {#each g.products as p (p.slug)}
                <PackCard row={p} link={false} collapsible unpriced={!p.valueSet} notice={noticeFor(p)} icon={p.icon} badge={badgeFor(p)} />
              {/each}
            </div>

            <div class="bonus">
              <p class="banner">Bonus for buying all {n}</p>
              <div class="reward">
                <ItemIcon slug={g.bonus.icon} size={40} />
                <h4>{g.bonus.name}</h4>
                <span class="rval">
                  {#if g.bonus.valueSet}<b class="num accent">{formatGold(g.bonus.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" />{:else}<span class="noprice">no price</span>{/if}
                </span>
              </div>
              <details class="contents">
                <summary>Bonus contents</summary>
                <PackLinesTable lines={g.bonus.lines} />
              </details>
            </div>

            <footer class="gtotal">
              <h4>Whole group</h4>
              <dl>
                <div>
                  <dt>Products + bonus</dt>
                  <dd>{#if g.total != null}<b class="num accent">{formatGold(g.total)}</b><img class="ic" src="{base}/icons/gold.png" alt="gold" />{:else}<span class="noprice">no price</span>{/if}</dd>
                </div>
                <div>
                  <dt>Total cost</dt>
                  <dd>
                    {#if g.rcCost > 0}<b class="num accent">{g.rcCost.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/royal-crystal.png" alt="RC" />{/if}{#if g.rcCost > 0 && g.bcCost > 0}<span class="lbl"> + </span>{/if}{#if g.bcCost > 0}<b class="num accent">{g.bcCost.toLocaleString("en-US")}</b><img class="ic" src="{base}/icons/blue-crystal.png" alt="BC" />{/if}
                    {#if g.costGold != null}<span class="lbl">({formatGold(g.costGold)} gold at your F4 rate)</span>{/if}
                  </dd>
                </div>
              </dl>
              <div class="cmp">
                <span class="pct" class:good={g.vsExchange != null && g.vsExchange >= 0} class:bad={g.vsExchange != null && g.vsExchange < 0}>
                  <b class="num">{formatSignedPct(g.vsExchange)}</b> <span class="lbl">vs exchange</span>
                </span>
                <span class="pct" class:good={g.vsG2G != null && g.vsG2G >= 0} class:bad={g.vsG2G != null && g.vsG2G < 0}>
                  <b class="num">{formatSignedPct(g.vsG2G)}</b> <span class="lbl">vs</span><img class="ic g2g" src="{base}/icons/g2g.png" alt="G2G" />
                </span>
              </div>
              {#if left}<p class="fine">{left}</p>{/if}
            </footer>
          </section>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  /* The Packs tab's content tokens (PacksPanel .packs), so PackCard, PackLinesTable,
     ExchangeInputs and PheonPanel render exactly as they do there. */
  .br {
    --bg: #0e1116; --panel: #161b22; --panel-2: #1f242c; --border: #30363d;
    --text: #e6edf3; --muted: #9aa4b2; --accent: #ffd166; --good: #6ed47a; --bad: #ef6f6c; --warn: #f0b341;
    color: var(--text);
    font-family: "Sora", system-ui, sans-serif;
  }
  h2 { font-size: 20px; margin: 8px 0 6px; }
  .num { font-variant-numeric: tabular-nums; font-family: "JetBrains Mono", monospace; }
  .accent { color: var(--accent); }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .lbl, .muted { color: var(--muted); }
  .ic { width: 14px; height: 14px; vertical-align: -2px; margin: 0 1px; }
  .ic.g2g { border-radius: 3px; opacity: .9; margin: 0 0 0 1px; }
  .note { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0 0 14px; }
  .noprice { color: var(--muted); font-style: italic; }
  .fine { color: var(--muted); font-size: 12px; line-height: 1.45; margin: 6px 0 0; }

  /* Not running: one short panel. */
  .inactive { background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 18px 20px; margin-top: 8px; }
  .inactive h2 { margin-top: 0; }
  .inactive p { margin: 0 0 8px; }
  .back { color: var(--accent); text-decoration: none; font-size: 13.5px; }
  .back:hover { text-decoration: underline; text-underline-offset: 3px; }

  .room-head .note { margin-bottom: 6px; }
  .status { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 13px;
    color: var(--muted); margin: 0 0 14px; }
  .status b { color: var(--accent); }
  .sep { opacity: .5; }

  /* The two value inputs: one column on phones, side by side from 700px. */
  .controls { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
  @media (min-width: 700px) { .controls { grid-template-columns: 1fr 1fr; } }
  .ctl { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px;
    font-size: 13px; min-width: 0; }
  .ctl-label { display: block; font-weight: 600; margin-bottom: 6px; }
  .ctl-row { display: flex; align-items: center; gap: 5px; }
  .ctl input { width: 130px; background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
    padding: 6px 10px; border-radius: 6px; font-size: 13px;
    font-family: "JetBrains Mono", monospace; font-variant-numeric: tabular-nums; }
  .ctl input:focus { outline: none; border-color: var(--accent); }
  .ctl input::placeholder { color: var(--muted); opacity: .7; }
  .ctl input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  .ctl input[type="number"]::-webkit-outer-spin-button,
  .ctl input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .hint { color: var(--muted); margin: 8px 0 0; }

  .state { color: var(--muted); text-align: center; padding: 40px 0; }
  .state.bad { color: var(--bad); }

  /* Groups stack; each group's products flow 1 / 2 / 3 across with the width, like the Packs grid. */
  .groups { display: flex; flex-direction: column; gap: 22px; }
  .group { border: 1px solid var(--border); border-top: 2px solid var(--accent); border-radius: 10px;
    background: rgba(255, 255, 255, .015); padding: 14px; min-width: 0; }
  .ghead { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-bottom: 12px; }
  .gnum { color: var(--accent); font-size: 13px; font-weight: 700; letter-spacing: .5px; }
  .ghead h3 { margin: 0; font-size: 16px; }
  .gcount { color: var(--muted); font-size: 12.5px; }
  .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 12px; }

  .bonus { margin-top: 12px; background: var(--panel); border: 1px dashed rgba(255, 209, 102, .45);
    border-radius: 8px; padding: 12px 16px; min-width: 0; }
  .banner { margin: 0 0 10px; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .6px;
    text-transform: uppercase; }
  .reward { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
  .reward h4 { margin: 0; font-size: 14px; font-weight: 600; flex: 1 1 180px; min-width: 0; }
  .rval { font-size: 14px; white-space: nowrap; }
  .contents { margin-top: 10px; }
  /* A phone-sized tap target (about 44 px tall); the negative margin keeps the visual spacing. */
  .contents summary { color: var(--muted); font-size: 12.5px; cursor: pointer; padding: 12px 0; margin: -10px 0; }
  .contents summary:hover { color: var(--text); }
  .contents[open] summary { margin-bottom: -4px; }

  .gtotal { margin-top: 12px; background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px 16px; min-width: 0; }
  .gtotal h4 { margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
    color: var(--muted); }
  dl { margin: 0 0 10px; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 14px; font-size: 13px; }
  dl > div { display: contents; }
  dt { color: var(--muted); }
  dd { margin: 0; text-align: right; }
  .cmp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; }
  .pct { display: inline-flex; align-items: center; gap: 5px; font-size: 15px; font-weight: 600; }
  .pct .num { font-size: 15px; }
  .pct .lbl { font-size: 12px; font-weight: 400; }
</style>
