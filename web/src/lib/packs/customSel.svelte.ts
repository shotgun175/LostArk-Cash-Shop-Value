// Which options the user has checked on each choose-N-of-M pack (keyed by pack slug -> chest
// display names). Region-independent — the choice is *which lines*, not their price — and
// persisted in localStorage. An absent entry means "use the default highest-gold N" (see
// packValue customChosen); a stored entry pins the user's own combination so a price move
// doesn't silently swap their picks.
class CustomSel {
  map = $state<Record<string, string[]>>({});

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const v = JSON.parse(localStorage.getItem("csv.customSel") ?? "{}");
        if (v && typeof v === "object") {
          // Keep only well-formed entries (string arrays): the values are load-bearing in
          // customChosen, so a corrupted shape must degrade to defaults, never throw.
          const clean: Record<string, string[]> = {};
          for (const [slug, val] of Object.entries(v)) {
            if (Array.isArray(val) && val.every((x) => typeof x === "string")) clean[slug] = val;
          }
          this.map = clean;
        }
      } catch {
        /* ignore malformed */
      }
    }
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("csv.customSel", JSON.stringify(this.map));
    }
  }

  get(slug: string): string[] | undefined {
    return this.map[slug];
  }

  has(slug: string): boolean {
    return slug in this.map;
  }

  count(): number {
    return Object.keys(this.map).length;
  }

  set(slug: string, chests: string[]): void {
    this.map = { ...this.map, [slug]: chests };
    this.persist();
  }

  // The one toggle rule both the card and the drill-down use. `counted` is the currently
  // counted chest names (the effective set, default or stored). Checking past the pick cap is
  // ignored (the UI also disables those boxes); unchecking the last counted option clears the
  // stored entry, which returns the pack to its default highest-gold picks.
  toggle(slug: string, chest: string, pick: number, counted: string[]): void {
    const next = counted.includes(chest)
      ? counted.filter((c) => c !== chest)
      : counted.length >= pick
        ? null
        : [...counted, chest];
    if (next === null) return;
    if (next.length === 0) this.clearOne(slug);
    else this.set(slug, next);
  }

  clearOne(slug: string): void {
    if (!(slug in this.map)) return;
    const next = { ...this.map };
    delete next[slug];
    this.map = next;
    this.persist();
  }

  clearAll(): void {
    this.map = {};
    this.persist();
  }
}

export const customSel = new CustomSel();
