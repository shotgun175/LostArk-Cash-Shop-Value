import type { Region } from "../api";
import { formatMoney } from "../format";

// F4 in-game currency-exchange baseline. baseline gold-per-crystal = input gold / F4_DIVISOR;
// "% vs exchange" compares a pack's gold/RC to it. The /238 divisor is the crystal count in the
// exchange unit, a fixed game constant distilled from TJW's compiled app (confirmed 2026-06-15:
// "19200 gold for 238 crystals = 80.67 gold/crystal"); the live ~250 gold/crystal is a RATE the
// user-adjustable input produces (inputGold / 238), so the Packs panel makes the input region-aware.
// F4_DEFAULT_INPUT is the app's per-region seed (f4.svelte.ts imports it): a round, illustrative
// value, not a live rate.
export const F4_DIVISOR = 238;
export const F4_DEFAULT_INPUT = 20000;

// Real-money cost of 12,000 Royal Crystals per region (NA $100, EU €94.99). Converts a pack's gold
// value into gold-per-currency-unit so the "% vs G2G" / "g per $/€" columns compare within one
// currency per region (NA in USD, EU in EUR).
export const RC_CASH_PER_12K: Record<Region, number> = { nae: 100, euc: 94.99 };
export function cashPerRc(region: Region): number {
  return RC_CASH_PER_12K[region] / 12000;
}

export function f4Baseline(inputGold: number): number {
  return inputGold / F4_DIVISOR;
}

/** % a pack's gold/RC beats (or trails) the F4 exchange baseline. null when baseline unusable. */
export function vsExchangePct(goldPerRc: number, baseline: number): number | null {
  if (!baseline || !Number.isFinite(baseline)) return null;
  return ((goldPerRc - baseline) / baseline) * 100;
}

/** Gold you get per real dollar buying gold on G2G. null when input unusable. */
export function g2gGoldPerDollar(pricePer1k: number): number | null {
  return pricePer1k > 0 && Number.isFinite(pricePer1k) ? 1000 / pricePer1k : null;
}

/** The "= $3.27" half of the readout (price-per-100k = pricePer1k * 100). */
export function g2gReadout(pricePer1k: number, sym: string): string {
  return formatMoney(pricePer1k * 100, sym);
}

/** % a pack's gold/$ beats (or trails) buying gold on G2G. Positive = pack wins. */
export function vsG2GPct(goldPerDollar: number, g2gGpd: number | null): number | null {
  if (!g2gGpd) return null;
  return (goldPerDollar / g2gGpd - 1) * 100;
}

export function currencySymbol(region: Region): string {
  return region === "euc" ? "€" : "$";
}
