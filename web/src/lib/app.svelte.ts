import { loadPrices, type PricePayload, type Region } from "./api";

class AppState {
  region = $state<Region>("nae");
  payload = $state<PricePayload | null>(null);
  status = $state<"loading" | "ok" | "error">("loading");

  async load(fetchImpl?: typeof fetch) {
    this.status = "loading";
    try {
      this.payload = await loadPrices(fetchImpl);
      this.status = "ok";
    } catch (e) {
      console.error("prices load failed", e);
      this.status = "error";
    }
  }

  // Silent background poll: swap in fresh prices without flipping to the loading/error state, so a
  // periodic refresh doesn't blank the page and a transient blip keeps showing the last good data.
  async refresh(fetchImpl?: typeof fetch) {
    try {
      this.payload = await loadPrices(fetchImpl);
      this.status = "ok";
    } catch (e) {
      console.error("prices refresh failed", e);
    }
  }

  get snapshot() {
    return this.payload?.regions[this.region] ?? null;
  }
}

export const app = new AppState();
