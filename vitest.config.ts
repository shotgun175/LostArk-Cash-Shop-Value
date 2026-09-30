import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
  test: {
    // Only the Worker's own tests run in the workers pool. web/ has its own vitest
    // (node env) — don't sweep web/test/ into the workerd runtime.
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
