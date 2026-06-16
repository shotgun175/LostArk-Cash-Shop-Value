import type { Region } from "../api";

// User-supplied market-price overrides, per region, persisted in localStorage. Merged on top of
// the live feed before pack values are computed, so editing a mat price flows through the EV math.
class Overrides {
  map = $state<Record<Region, Record<string, number>>>({ nae: {}, euc: {} });

  constructor() {
    if (typeof localStorage !== "undefined") {
      this.map = { nae: this.load("nae"), euc: this.load("euc") };
    }
  }

  private load(r: Region): Record<string, number> {
    try {
      const v = JSON.parse(localStorage.getItem(`csv.ov.${r}`) ?? "{}");
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  }

  private persist(r: Region): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`csv.ov.${r}`, JSON.stringify(this.map[r]));
    }
  }

  forRegion(r: Region): Record<string, number> {
    return this.map[r];
  }

  has(r: Region, slug: string): boolean {
    return slug in this.map[r];
  }

  count(r: Region): number {
    return Object.keys(this.map[r]).length;
  }

  clearAll(r: Region): void {
    this.map[r] = {};
    this.persist(r);
  }

  set(r: Region, slug: string, value: number): void {
    if (!Number.isFinite(value) || value < 0) return;
    this.map[r] = { ...this.map[r], [slug]: value };
    this.persist(r);
  }
}

export const overrides = new Overrides();
