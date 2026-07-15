import { app } from "../app.svelte";
import type { Region } from "../api";
import { F4_DIVISOR, F4_DEFAULT_INPUT } from "./exchange";
import { BC_PER_BUNDLE } from "./data/marisShop";

// A round, deliberately-illustrative default — not pulled from any live source. The user tunes it
// once and it's remembered per region; we don't want the seeded value to look authoritative.
const DEFAULTS: Record<Region, number> = { nae: F4_DEFAULT_INPUT, euc: F4_DEFAULT_INPUT };

// The one shared F4 currency-exchange gold input, used by Packs, Mari's Shop and Ark Pass (per
// region, persisted). Royal and blue crystals are valued the same; only the denominator differs:
//   gold per royal crystal = value / F4_DIVISOR (238)   (packs "% vs exchange" basis)
//   gold per blue crystal  = value / BC_PER_BUNDLE (95) (Mari's / Ark Pass)
// Live accuracy isn't the goal here — it's a manual input the user tunes once.
class F4 {
  map = $state<Record<Region, number>>({ nae: DEFAULTS.nae, euc: DEFAULTS.euc });

  constructor() {
    if (typeof localStorage !== "undefined") {
      for (const r of ["nae", "euc"] as Region[]) {
        const v = Number(localStorage.getItem(`csv.f4.${r}`));
        if (Number.isFinite(v) && v > 0) this.map[r] = v;
      }
    }
  }

  get value(): number {
    return this.map[app.region];
  }
  set value(v: number) {
    this.map[app.region] = v; // allow transient NaN while typing/clearing
    if (typeof localStorage !== "undefined" && Number.isFinite(v) && v >= 0) {
      localStorage.setItem(`csv.f4.${app.region}`, String(v));
    }
  }

  get perRc(): number {
    return (this.value > 0 ? this.value : 0) / F4_DIVISOR;
  }
  get perBc(): number {
    return (this.value > 0 ? this.value : 0) / BC_PER_BUNDLE;
  }
}

export const f4 = new F4();
