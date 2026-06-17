import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: "200.html" }),
    // BASE_PATH is empty for the Cloudflare/dev build (served at the Worker root) and
    // "/LostArk-Cash-Shop-Value" for the GitHub Pages build (served under the repo subpath).
    // relative:false keeps absolute /_app/... asset URLs so the SPA fallback resolves from any depth.
    paths: { base: process.env.BASE_PATH ?? "", relative: false },
  },
};
export default config;
