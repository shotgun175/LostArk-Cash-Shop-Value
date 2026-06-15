<script lang="ts">
  import { hasIcon, iconUrl, displayName } from "$lib/catalog";
  let { slug }: { slug: string } = $props();
  let broken = $state(false);
  const initials = $derived(
    displayName(slug).split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join(""),
  );
  const showImg = $derived(hasIcon(slug) && !broken);
</script>

{#if showImg}
  <img class="icon" src={iconUrl(slug)} alt={displayName(slug)} onerror={() => (broken = true)} />
{:else}
  <span class="icon fallback" aria-hidden="true">{initials}</span>
{/if}

<style>
  .icon { width: 26px; height: 26px; border-radius: 6px; background: #0c0e15;
    border: 1px solid var(--line); object-fit: contain; flex: none; }
  .fallback { display: inline-grid; place-items: center; font: 600 10px "Sora", sans-serif;
    color: var(--muted); letter-spacing: .3px; }
</style>
