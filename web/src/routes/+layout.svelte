<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { app } from "$lib/app.svelte";
  import RegionToggle from "$lib/components/RegionToggle.svelte";
  import FreshnessBanner from "$lib/components/FreshnessBanner.svelte";
  import PacksPanel from "$lib/components/packs/PacksPanel.svelte";
  import HellKeyMath from "$lib/components/packs/HellKeyMath.svelte";
  import MarisShop from "$lib/components/packs/MarisShop.svelte";
  import ArkPass from "$lib/components/packs/ArkPass.svelte";

  let { children } = $props();
  // Tab order mirrors TJW (Packs default); our own Prices tab is kept at the far right.
  const tabs = ["Packs", "Mari's Shop", "Ark Pass", "Hell Key math", "Prices"];
  let active = $state("Packs");

  // Pack drill-down (/pack/<slug>) is a real route; everything else is in-page tab state.
  const isPackPage = $derived(page.url.pathname.includes("/pack/"));
  function selectTab(t: string): void {
    active = t;
    if (isPackPage) goto(`${base}/`);
  }

  onMount(() => {
    app.load();
    // Poll in step with the worker's 60s cron so prices + the "prices as of" time stay current
    // on a page left open, without a manual reload.
    const id = setInterval(() => app.refresh(), 60_000);
    return () => clearInterval(id);
  });
</script>

<div class="wrap">
  <header>
    <div class="region-tr"><RegionToggle /></div>
    <h1>Lost Ark Cash Shop Value</h1>
    <p class="sub">Live NA/EU market prices for Lost Ark cash-shop mats.</p>
    <nav>
      {#each tabs as t (t)}
        <button class:active={!isPackPage && active === t} onclick={() => selectTab(t)}>{t}</button>
      {/each}
    </nav>
    <FreshnessBanner />
  </header>

  {#if isPackPage}
    {@render children()}
  {:else if active === "Prices"}
    {@render children()}
  {:else if active === "Packs"}
    <PacksPanel />
  {:else if active === "Hell Key math"}
    <HellKeyMath />
  {:else if active === "Mari's Shop"}
    <MarisShop />
  {:else if active === "Ark Pass"}
    <ArkPass />
  {/if}
</div>

<style>
  header{position:relative; text-align:center; padding:34px 0 12px}
  .region-tr{position:absolute; top:18px; right:0}
  h1{font-family:"Cinzel",serif; font-weight:700; letter-spacing:.5px; margin:0; font-size:34px;
    background:linear-gradient(92deg,var(--gold),#fff2cf 38%,var(--purple)); -webkit-background-clip:text; background-clip:text; color:transparent;}
  .sub{color:var(--muted); margin:6px 0 0; font-size:13.5px}
  nav{display:flex; gap:4px; justify-content:center; margin:18px 0 6px; flex-wrap:wrap}
  nav button{background:none; border:0; color:var(--muted); padding:8px 16px; border-radius:8px; font:500 13.5px "Sora",sans-serif; cursor:pointer}
  nav button:hover{color:var(--txt); background:var(--panel)}
  nav button.active{color:var(--bg); background:linear-gradient(180deg,var(--gold),var(--gold-2)); font-weight:600}
  @media (max-width:640px){ .region-tr{position:static; display:flex; justify-content:center; margin-bottom:14px} }
</style>
