import { flushSync } from "svelte";

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

  // Checkbox click handler for both surfaces (card + drill-down). The click must NOT be
  // preventDefault-ed: the browser flips a checkbox before dispatch, and a canceled click
  // reverts it after dispatch, which is AFTER Svelte's microtask flush, so the revert lands
  // on top of Svelte's write and the box sticks visually while the store moves (Svelte's
  // memoized checked-write never re-writes a value it believes it already wrote). Instead the
  // native flip stands, and once the toggle settles (flushSync) the DOM property is written
  // directly from the effective counted set. That direct write covers the one case Svelte
  // skips: unchecking the last stored pick clears the entry and the default set may re-include
  // this chest, so counted stays true and no reactive write fires while the DOM sits
  // unchecked. `counted` is a thunk so the post-flush read sees the fresh derived value.
  clickToggle(
    e: Event & { currentTarget: EventTarget & HTMLInputElement },
    slug: string,
    chest: string,
    pick: number,
    counted: () => string[],
  ): void {
    const el = e.currentTarget;
    this.toggle(slug, chest, pick, counted());
    flushSync();
    el.checked = counted().includes(chest);
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
