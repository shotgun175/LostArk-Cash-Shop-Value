<!--
  HubBadge — "Part of Lost Ark Tools" link back to the hub.
  Synced from shotgun175.github.io/snippets/hub-badge.html (the canonical source).
  Adapted to a Svelte component because a raw <style>-in-markup paste isn't valid Svelte
  template content; the markup + scoped styles below mirror the snippet 1:1. The app already
  loads Cinzel (used by the name); the mono falls back to a system mono. Refresh this copy
  when the canonical badge changes.
-->
<a
  class="lat-badge"
  href="https://shotgun175.github.io/"
  target="_blank"
  rel="noopener"
  aria-label="Part of Lost Ark Tools — see all tools"
>
  <svg class="lat-badge__mark" width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#0a0b13" />
    <g stroke="#54d8d2" stroke-opacity="0.45" stroke-width="1.4" stroke-linecap="round">
      <path d="M9 9h14M9 16h14M9 23h14M9 9v14M16 9v14M23 9v14" />
    </g>
    <circle cx="16" cy="16" r="4.4" fill="#f0b94d" />
  </svg>

  <span class="lat-badge__text">
    <span class="lat-badge__kicker">Part of</span>
    <span class="lat-badge__name">Lost Ark Tools</span>
  </span>

  <svg
    class="lat-badge__arrow"
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
</a>

<style>
  .lat-badge {
    all: revert;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    border: 1px solid rgba(240, 185, 77, 0.45);
    border-radius: 10px;
    background: #14172a;
    color: #ece8df;
    text-decoration: none;
    line-height: 1.2;
    font-family: "IBM Plex Mono", ui-monospace, Consolas, monospace;
    box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.8);
    transition: border-color 0.18s ease, transform 0.18s ease;
  }
  .lat-badge * { box-sizing: border-box; }
  .lat-badge:hover { border-color: #f0b94d; transform: translateY(-1px); }
  .lat-badge:focus-visible { outline: 2px solid #54d8d2; outline-offset: 3px; }
  .lat-badge__mark { flex: none; display: block; }
  .lat-badge__text { display: flex; flex-direction: column; }
  .lat-badge__kicker {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #aab0d2;
  }
  .lat-badge__name {
    font-family: "Cinzel", Georgia, serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #f0b94d;
  }
  .lat-badge__arrow { flex: none; color: #54d8d2; transition: transform 0.18s ease; }
  .lat-badge:hover .lat-badge__arrow { transform: translateX(3px); }
  @media (prefers-reduced-motion: reduce) {
    .lat-badge, .lat-badge__arrow { transition: none; }
  }
</style>
