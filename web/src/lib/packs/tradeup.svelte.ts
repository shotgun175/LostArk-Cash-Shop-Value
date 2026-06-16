// Which materials the user has opted to value at their NPC trade-up rate (e.g. 5 Destiny
// Leapstones -> 1 Great Destiny Leapstone). Global (not per region), persisted in localStorage.
class TradeUp {
  active = $state<Record<string, true>>({});

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const a = JSON.parse(localStorage.getItem("csv.tradeup") ?? "[]");
        if (Array.isArray(a)) this.active = Object.fromEntries(a.map((s) => [String(s), true]));
      } catch {
        /* ignore malformed */
      }
    }
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("csv.tradeup", JSON.stringify(Object.keys(this.active)));
    }
  }

  has(slug: string): boolean {
    return slug in this.active;
  }

  count(): number {
    return Object.keys(this.active).length;
  }

  clear(): void {
    this.active = {};
    this.persist();
  }

  toggle(slug: string): void {
    const next = { ...this.active };
    if (slug in next) delete next[slug];
    else next[slug] = true;
    this.active = next;
    this.persist();
  }
}

export const tradeUp = new TradeUp();
