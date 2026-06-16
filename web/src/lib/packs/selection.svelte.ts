// Which output the user has chosen from each selection chest (keyed by chest name -> output slug).
// Region-independent — the choice is *which item*, not its price — and persisted in localStorage.
// Overrides the engine's default "highest-value option" rule so the pick drives the pack total
// everywhere that chest appears (cards, drill-down, Ark Pass). Empty map = use the default pick.
class Selection {
  map = $state<Record<string, string>>({});

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const v = JSON.parse(localStorage.getItem("csv.pick") ?? "{}");
        if (v && typeof v === "object") this.map = v;
      } catch {
        /* ignore malformed */
      }
    }
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("csv.pick", JSON.stringify(this.map));
    }
  }

  get(chest: string): string | undefined {
    return this.map[chest];
  }

  has(chest: string): boolean {
    return chest in this.map;
  }

  count(): number {
    return Object.keys(this.map).length;
  }

  set(chest: string, slug: string): void {
    this.map = { ...this.map, [chest]: slug };
    this.persist();
  }

  clearOne(chest: string): void {
    if (!(chest in this.map)) return;
    const next = { ...this.map };
    delete next[chest];
    this.map = next;
    this.persist();
  }

  clearAll(): void {
    this.map = {};
    this.persist();
  }
}

export const selection = new Selection();
