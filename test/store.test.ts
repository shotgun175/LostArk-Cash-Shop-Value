import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { readPayload, writePayload } from "../src/store";
import type { PricePayload } from "../src/normalize";

const payload: PricePayload = {
  schema_version: 1,
  generated_at: "2026-06-15T00:00:00.000Z",
  regions: { nae: { source_valid_at: "2026-06-15T00:00:00.000Z", prices: { grudge: 100 } } },
  bundles: {},
};

describe("store", () => {
  it("returns null when nothing is stored", async () => {
    expect(await readPayload(env.PRICES)).toBeNull();
  });

  it("round-trips a payload through KV", async () => {
    await writePayload(env.PRICES, payload);
    expect(await readPayload(env.PRICES)).toEqual(payload);
  });
});
