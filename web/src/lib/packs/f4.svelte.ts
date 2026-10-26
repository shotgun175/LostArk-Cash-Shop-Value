import { app } from "../app.svelte";
import type { Region } from "../api";
import { F4_DIVISOR, F4_DEFAULT_INPUT } from "./exchange";
import { BC_PER_BUNDLE } from "./data/marisShop";
import { load, save } from "../storage";

// A round, deliberately-illustrative default — not pulled from any live source. The user tunes it
// once and it's remembered per region; we don't want the seeded value to look authoritative.
const DEFAULTS: Record<Region, number> = { nae: F4_DEFAULT_INPUT, euc: F4_DEFAULT_INPUT };
const key = (r: Region): string => `csv.f4.${r}`;

// The one shared F4 currency-exchange gold input, used by Packs, Mari's Shop and Ark Pass (per
// region, persisted). Royal and blue crystals are valued the same; only the denominator differs:
//   gold per royal crystal = value / F4_DIVISOR (238)   (packs "% vs exchange" basis)
//   gold per blue crystal  = value / BC_PER_BUNDLE (95) (Mari's / Ark Pass)
// Live accuracy isn't the goal here — it's a manual input the user tunes once.
// While a region has no saved value it uses the seed (`isDefault`); `reset` returns it there and
// removes the saved key, which is what clearing the box in "Your values" does.
class F4 {
  map = $state<Record<Region, number>>({ nae: DEFAULTS.nae, euc: DEFAULTS.euc });
  // True while the region has a saved value of its own; false while it uses the seed.
  custom = $state<Record<Region, boolean>>({ nae: false, euc: false });

  constructor() {
    for (const r of ["nae", "euc"] as Region[]) {
      // 0 is a valid saved input (the setter stores it), so only absent/empty falls back to the seed.
      const raw = load(key(r));
      if (raw !== null && raw !== "") {
        const v = Number(raw);
        if (Number.isFinite(v) && v >= 0) {
          this.map[r] = v;
          this.custom[r] = true;
        }
      }
    }
  }

  get value(): number {
    return this.map[app.region];
  }
  set value(v: number) {
    this.map[app.region] = v; // allow transient NaN while typing/clearing
    if (Number.isFinite(v) && v >= 0) {
      this.custom[app.region] = true;
      save(key(app.region), String(v));
    }
  }

  /** The current region's seed (the input box's placeholder). */
  get seed(): number {
    return DEFAULTS[app.region];
  }

  /** True while the current region uses the seed (no saved value of its own). */
  get isDefault(): boolean {
    return !this.custom[app.region];
  }

  /** Returns region `r` to the seed and removes its saved value, so a reload agrees. */
  reset(r: Region = app.region): void {
    this.map[r] = DEFAULTS[r];
    this.custom[r] = false;
    save(key(r), null);
  }

  get perRc(): number {
    return (this.value > 0 ? this.value : 0) / F4_DIVISOR;
  }
  get perBc(): number {
    return (this.value > 0 ? this.value : 0) / BC_PER_BUNDLE;
  }
}

export const f4 = new F4();
