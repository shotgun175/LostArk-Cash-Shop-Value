import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

describe("scaffold smoke", () => {
  it("returns 404 for unknown routes", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://x/unknown"), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });
});
