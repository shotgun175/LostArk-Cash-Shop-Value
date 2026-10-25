import { app } from "../app.svelte";
import type { Region } from "../api";
import { load, save } from "../storage";

// The one shared G2G real-money rate (price per 1,000 gold), used by the Packs tab and the Bonus
// Room. It auto-populates from the live feed for the selected region (USD for NA, EUR for EU); a
// typed value overrides it per region and is remembered; clearing the box returns to the live
// rate. Storage is read once at import, so an edit on one tab shows on the other immediately.
const ovKey = (r: Region): string => `csv.g2g.override.${r}`;

// A live rate whose per-currency success stamp is older than this reads as stale (twelve missed
// 30-minute polls).
const STALE_MS = 6 * 3_600_000;

/** The stored override for `r`, or null when absent or not a finite number above 0. */
function restoreOverride(r: Region): number | null {
  const raw = load(ovKey(r));
  if (raw == null || raw === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
}

class G2G {
  overrides = $state<Record<Region, number | null>>({ nae: null, euc: null });

  constructor() {
    // Retire pre-region keys (the old UI auto-saved its default; both must not read back as overrides).
    save("csv.g2g", null);
    save("csv.g2g.override", null);
    this.overrides = { nae: restoreOverride("nae"), euc: restoreOverride("euc") };
  }

  /** The user's typed rate for the current region, or null. */
  get override(): number | null {
    return this.overrides[app.region];
  }

  /** The live feed's rate for the current region, or null when the payload has none. */
  get live(): number | null {
    const g = app.payload?.g2g;
    return app.region === "euc" ? (g?.eurPer1kGold ?? null) : (g?.usdPer1kGold ?? null);
  }

  /** The effective price per 1k gold (override, else live), null if none is available. */
  get value(): number | null {
    return this.override ?? this.live;
  }

  /**
   * When the shown region's live rate last updated: the per-currency success stamp (USD for NA,
   * EUR for EU). The block-level fetchedAt is the poll-attempt rate-limiter and would claim a
   * frozen leg was freshly updated.
   */
  get at(): Date | null {
    const g = app.payload?.g2g;
    const at = app.region === "euc" ? g?.eurFetchedAt : g?.usdFetchedAt;
    const t = at ? new Date(at) : null;
    return t && !Number.isNaN(t.getTime()) ? t : null;
  }

  /** `at` formatted for display, or null when there is no stamp. */
  get when(): string | null {
    return (
      this.at?.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) ??
      null
    );
  }

  /** The hover tooltip on the G2G icon. */
  get tooltip(): string {
    return this.when ? `Rate updated ${this.when}` : "Live exchange rate";
  }

  /**
   * True once the live rate is over 6 h old and no override is set (a typed rate is the user's
   * own number, so it never reads stale). Reads app.now, so it turns stale with no new payload.
   */
  get stale(): boolean {
    const at = this.at;
    return this.override == null && at != null && app.now - at.getTime() > STALE_MS;
  }

  /** Sets this region's override from the input box: finite and above 0 saves it, else clears it. */
  setFromInput(v: number): void {
    const r = app.region;
    if (Number.isFinite(v) && v > 0) {
      this.overrides = { ...this.overrides, [r]: v };
      save(ovKey(r), String(v));
    } else {
      this.overrides = { ...this.overrides, [r]: null };
      save(ovKey(r), null);
    }
  }
}

export const g2g = new G2G();
