import { app } from "../app.svelte";
import type { Region } from "../api";

const DEFAULTS: Record<Region, number> = { nae: 59500, euc: 59500 };

// The one shared F4 currency-exchange gold input, used by Packs, Mari's Shop and Ark Pass (per
// region, persisted). Royal and blue crystals are valued the same; only the denominator differs:
//   gold per royal crystal = value / 238  (packs "% vs exchange" basis)
//   gold per blue crystal  = value / 95   (Mari's / Ark Pass)
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
    return (this.value > 0 ? this.value : 0) / 238;
  }
  get perBc(): number {
    return (this.value > 0 ? this.value : 0) / 95;
  }
}

export const f4 = new F4();
