import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Served at the ROOT of the Worker domain — no base path (unlike TJW's GitHub-Pages subpath).
    adapter: adapter({ fallback: "200.html" }),
  },
};
export default config;
