import type { Region } from "../api";
import { load, save } from "../storage";
import { COMPUTED_PRICE_NOTES } from "./priceMap";

// User-supplied market-price overrides, per region, persisted in localStorage. Merged on top of
// the live feed before pack values are computed, so editing a mat price flows through the EV math.
class Overrides {
  map = $state<Record<Region, Record<string, number>>>({ nae: {}, euc: {} });

  constructor() {
    this.map = { nae: this.load("nae"), euc: this.load("euc") };
  }

  private load(r: Region): Record<string, number> {
    try {
      const v = JSON.parse(load(`csv.ov.${r}`) ?? "{}");
      // Keep only what set() accepts: finite, non-negative numbers from a plain object. Entries on
      // computed-price slugs (keys, cubes, relic recipe) are left over from when those lines were
      // editable; buildPriceMap overwrites them, so they would only inflate the custom-prices chip.
      const clean: Record<string, number> = {};
      if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const [slug, n] of Object.entries(v)) {
          if (COMPUTED_PRICE_NOTES.has(slug)) continue;
          if (typeof n === "number" && Number.isFinite(n) && n >= 0) clean[slug] = n;
        }
      }
      return clean;
    } catch {
      return {};
    }
  }

  private persist(r: Region): void {
    save(`csv.ov.${r}`, JSON.stringify(this.map[r]));
  }

  forRegion(r: Region): Record<string, number> {
    return this.map[r];
  }

  has(r: Region, slug: string): boolean {
    return slug in this.map[r];
  }

  /** How many overrides the region has, leaving out the slugs in `except`. */
  count(r: Region, except?: ReadonlySet<string>): number {
    const slugs = Object.keys(this.map[r]);
    return except ? slugs.filter((s) => !except.has(s)).length : slugs.length;
  }

  /** Removes every override for the region except the slugs in `except`. */
  clearAll(r: Region, except?: ReadonlySet<string>): void {
    const kept: Record<string, number> = {};
    if (except) for (const [s, v] of Object.entries(this.map[r])) if (except.has(s)) kept[s] = v;
    this.map[r] = kept;
    this.persist(r);
  }

  set(r: Region, slug: string, value: number): void {
    if (!Number.isFinite(value) || value < 0) return;
    this.map[r] = { ...this.map[r], [slug]: value };
    this.persist(r);
  }

  /** Removes one slug's override for the region (back to the market or default price). */
  clear(r: Region, slug: string): void {
    if (!(slug in this.map[r])) return;
    const next = { ...this.map[r] };
    delete next[slug];
    this.map[r] = next;
    this.persist(r);
  }
}

export const overrides = new Overrides();
