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
    } catch {
      this.status = "error";
    }
  }

  get snapshot() {
    return this.payload?.regions[this.region] ?? null;
  }
}

export const app = new AppState();
