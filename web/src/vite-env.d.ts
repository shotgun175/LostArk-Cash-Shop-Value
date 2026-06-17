/// <reference types="vite/client" />

// VITE_API_BASE is set only for the GitHub Pages build (the absolute Worker origin for prices).
// Unset for the Cloudflare/dev build, where prices are fetched same-origin.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}
