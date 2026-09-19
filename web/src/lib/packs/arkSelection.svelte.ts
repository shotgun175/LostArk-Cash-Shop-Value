import { ARK_PASS_SEASON_ID } from "./data/arkPass";

// Per-LEVEL pick for the Ark Pass (keyed by level number -> chosen output slug). Deliberately
// separate from the global `selection` store (keyed by chest name and shared with the Packs tab)
// so an Ark Pass pick is scoped to one level and never crosses into pack cards. Persisted in
// localStorage under its own key, stamped with the season: picks saved in any other season
// (including the unstamped pre-2026-09-19 format) are discarded on load, since a level number
// means a different chest each season. Empty map = each level uses its default
// (defaultPickSlug or the highest-value option).
const KEY = "csv.arkpick";

class ArkSelection {
  map = $state<Record<number, string>>({});

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
        if (v?.season === ARK_PASS_SEASON_ID && v.picks && typeof v.picks === "object") this.map = v.picks;
        else if (v !== null) localStorage.removeItem(KEY);
      } catch {
        /* ignore malformed */
      }
    }
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify({ season: ARK_PASS_SEASON_ID, picks: this.map }));
    }
  }

  get(level: number): string | undefined {
    return this.map[level];
  }

  has(level: number): boolean {
    return level in this.map;
  }

  count(): number {
    return Object.keys(this.map).length;
  }

  set(level: number, slug: string): void {
    this.map = { ...this.map, [level]: slug };
    this.persist();
  }

  clearOne(level: number): void {
    if (!(level in this.map)) return;
    const next = { ...this.map };
    delete next[level];
    this.map = next;
    this.persist();
  }

  clearAll(): void {
    this.map = {};
    this.persist();
  }
}

export const arkSelection = new ArkSelection();
