<script lang="ts">
  import { hasIcon, iconUrl, displayName, isPreframed } from "$lib/catalog";
  let { slug, size = 34 }: { slug: string; size?: number } = $props();
  let broken = $state(false);
  const initials = $derived(
    displayName(slug).split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join(""),
  );
  const showImg = $derived(hasIcon(slug) && !broken);
  // Overlay the ornate frame on real art only (not the lettered fallback chip), except for icons
  // whose art already bakes a frame in.
  const framed = $derived(showImg && !isPreframed(slug));
</script>

<span class="icon-box" class:framed style="width: {size}px; height: {size}px;">
  {#if showImg}
    <img class="icon" src={iconUrl(slug)} alt={displayName(slug)} onerror={() => (broken = true)} />
  {:else}
    <span class="icon fallback" aria-hidden="true">{initials}</span>
  {/if}
</span>

<style>
  .icon-box { position: relative; display: inline-flex; flex: none; vertical-align: middle; }
  .icon { width: 100%; height: 100%; border-radius: 6px; background: #0c0e15;
    border: 1px solid var(--border, var(--line, #30363d)); object-fit: contain; }
  .fallback { display: inline-grid; place-items: center; font: 600 10px "Sora", sans-serif;
    color: var(--muted); letter-spacing: .3px; }
  /* The overlay frame replaces the hairline border so framed icons don't show a double edge. The
     corner-bracket frame only touches the corners, so let the art fill the whole box (like the
     pre-framed icons) instead of insetting it — an inset leaves a dark gap that reads as "smaller". */
  .icon-box.framed .icon { border-color: transparent; }
  .icon-box.framed::after {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: url(/icons/icon-frame.png) center / 100% 100% no-repeat;
  }
</style>
