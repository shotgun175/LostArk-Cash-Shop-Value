import type { Region } from "../api";
import type { TapOverrides } from "./tapPrices";

/** Provenance of the hell/netherworld reward tables, shown on the Hell Key tab. */
export const REWARD_DATA_VINTAGE = "sekwahar Season-4 datamine, 2026-07-30";

/**
 * Rarity picker options, in game order. "Actual" is the default view: every key is weighted by
 * its own rarity, exactly as the tab behaved before the picker existed. The seven names match
 * the probability-table columns in data/hellRewards.ts (Netherworld tiers carry only three of
 * them; the engine falls back to the key's own rarity and flags that as `rarityClamped`).
 */
export const RARITY_OPTIONS: readonly string[] = [
  "Actual",
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Relic",
  "Ancient",
];

/**
 * Hell Key tab settings, persisted in localStorage. Three independent knobs:
 *   rarity      what-if rarity to weight every key's floors by; "Actual" = each key's own
 *   wealth      whether the Wealth +1 buff is active. A floor-picker display setting ONLY:
 *               headline EVs and the per-floor table never move with it, by design
 *   tapOverride per-region manual override of the special-hone tap prices (see tapPrices.ts)
 * Storage keys: csv.hellRarity (the option string), csv.hellWealth ("1" when on, "0" when off,
 * a single flag that needs no parse guard), csv.tap.<region> (JSON TapOverrides).
 */
class HellSettings {
  rarity = $state<string>("Actual");
  wealth = $state<boolean>(false);
  tapOverride = $state<Record<Region, TapOverrides>>({ nae: {}, euc: {} });

  constructor() {
    if (typeof localStorage !== "undefined") {
      const r = localStorage.getItem("csv.hellRarity");
      if (r && RARITY_OPTIONS.includes(r)) this.rarity = r;
      this.wealth = localStorage.getItem("csv.hellWealth") === "1";
      this.tapOverride = { nae: this.loadTap("nae"), euc: this.loadTap("euc") };
    }
  }

  private loadTap(r: Region): TapOverrides {
    try {
      const v = JSON.parse(localStorage.getItem(`csv.tap.${r}`) ?? "{}");
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  }

  private persistTap(r: Region): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`csv.tap.${r}`, JSON.stringify(this.tapOverride[r]));
    }
  }

  setRarity(r: string): void {
    if (!RARITY_OPTIONS.includes(r)) return;
    this.rarity = r;
    if (typeof localStorage !== "undefined") localStorage.setItem("csv.hellRarity", r);
  }

  setWealth(on: boolean): void {
    this.wealth = on;
    if (typeof localStorage !== "undefined") localStorage.setItem("csv.hellWealth", on ? "1" : "0");
  }

  setTapOverride(region: Region, o: TapOverrides): void {
    this.tapOverride = { ...this.tapOverride, [region]: o };
    this.persistTap(region);
  }
}

export const hellSettings = new HellSettings();
