// Per-LEVEL pick for the Ark Pass (keyed by level number -> chosen output slug). Deliberately
// separate from the global `selection` store (keyed by chest name and shared with the Packs tab)
// so an Ark Pass pick is scoped to one level and never crosses into pack cards. Persisted in
// localStorage under its own key. Empty map = each level uses its default (defaultPickSlug or the
// highest-value option).
class ArkSelection {
  map = $state<Record<number, string>>({});

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const v = JSON.parse(localStorage.getItem("csv.arkpick") ?? "{}");
        if (v && typeof v === "object") this.map = v;
      } catch {
        /* ignore malformed */
      }
    }
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("csv.arkpick", JSON.stringify(this.map));
    }
  }

  get(level: number): string | undefined {
    return this.map[level];
  }

  has(level: number): boolean {
    return level in this.map;
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
