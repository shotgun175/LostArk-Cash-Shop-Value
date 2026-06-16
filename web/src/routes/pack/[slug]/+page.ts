import { error } from "@sveltejs/kit";
import { PACKS } from "$lib/packs/data/packs";
import type { EntryGenerator, PageLoad } from "./$types";

export const prerender = true;

// Prerender a page per known pack slug.
export const entries: EntryGenerator = () => PACKS.map((p) => ({ slug: p.slug }));

export const load: PageLoad = ({ params }) => {
  const pack = PACKS.find((p) => p.slug === params.slug);
  if (!pack) error(404, "Pack not found");
  return { pack };
};
