import { reset } from "cloudflare:test";
import { afterEach } from "vitest";

// The workers pool now isolates storage per test FILE, not per test. These tests assume
// each test starts with empty KV and an empty edge cache, so wipe all bindings after each.
afterEach(async () => {
  await reset();
});
