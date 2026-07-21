<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import RegionToggle from "$lib/components/RegionToggle.svelte";
  import FreshnessBanner from "$lib/components/FreshnessBanner.svelte";
  import HubBadge from "$lib/components/HubBadge.svelte";

  let { children } = $props();

  // Each tab is now a real route (deep-linkable, browser back/forward works, per-route code split).
  // This layout persists across navigations, so the region toggle, freshness banner, and the 60s
  // poll below survive tab switches without re-fetching. Tab order mirrors TJW (Packs is home);
  // our own Prices tab stays at the far right.
  const tabs = [
    { label: "Packs", href: `${base}/` },
    { label: "Mari's Shop", href: `${base}/maris` },
    { label: "Ark Pass", href: `${base}/ark-pass` },
    { label: "Hell Key math", href: `${base}/hell-key` },
    { label: "Prices", href: `${base}/prices` },
  ];

  // Active tab = the nav link whose path matches the current URL. Trailing slashes are normalized so
  // the home link matches "/" (and the base-path root). The /pack/<slug> drill-down matches no tab,
  // so nothing highlights there, same as the old tabbed behavior.
  const stripSlash = (p: string): string => (p.length > 1 ? p.replace(/\/$/, "") : p);
  const currentPath = $derived(stripSlash(page.url.pathname));
  const isActive = (href: string): boolean => stripSlash(href) === currentPath;

  onMount(() => {
    app.load();
    // Poll in step with the worker's 60s cron so prices + the "prices as of" time stay current
    // on a page left open, without a manual reload. Hidden tabs skip the tick (a backgrounded tab
    // would otherwise poll forever against the Workers free-tier request cap); returning to the
    // tab refreshes immediately so it never feels stale.
    const id = setInterval(() => {
      if (!document.hidden) app.refresh();
    }, 60_000);
    const onVisibility = () => {
      if (!document.hidden) app.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  });
</script>

<div class="wrap">
  <header>
    <div class="region-tr"><RegionToggle /></div>
    <h1>Lost Ark Cash Shop Value</h1>
    <p class="sub">Live NA/EU market prices for Lost Ark cash-shop mats.</p>
    <nav>
      {#each tabs as t (t.href)}
        <a href={t.href} class:active={isActive(t.href)}>{t.label}</a>
      {/each}
    </nav>
    <FreshnessBanner />
  </header>

  {@render children()}

  <footer class="hub-footer">
    <HubBadge />
  </footer>
</div>

<style>
  header{position:relative; text-align:center; padding:34px 0 12px}
  .region-tr{position:absolute; top:18px; right:0}
  h1{font-family:"Cinzel",serif; font-weight:700; letter-spacing:.5px; margin:0; font-size:34px;
    background:linear-gradient(92deg,var(--gold),#fff2cf 38%,var(--purple)); -webkit-background-clip:text; background-clip:text; color:transparent;}
  .sub{color:var(--muted); margin:6px 0 0; font-size:13.5px}
  nav{display:flex; gap:4px; justify-content:center; margin:18px 0 6px; flex-wrap:wrap}
  nav a{color:var(--muted); padding:8px 16px; border-radius:8px; font:500 13.5px "Sora",sans-serif; cursor:pointer; text-decoration:none}
  nav a:hover{color:var(--txt); background:var(--panel)}
  nav a.active{color:var(--bg); background:linear-gradient(180deg,var(--gold),var(--gold-2)); font-weight:600}
  @media (max-width:640px){ .region-tr{position:static; display:flex; justify-content:center; margin-bottom:14px} }
  .hub-footer{ display:flex; justify-content:center; margin-top:40px; padding-top:24px; border-top:1px solid var(--line); }
</style>
