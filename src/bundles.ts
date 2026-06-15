// Static market stack-size map (slug -> units per listing). Empty in Plan 1 —
// the contract permits `bundles: {}`. Populated in Plan 3 by transcribing
// TheJungleWalrus's published prices.json `bundles` map when the pack math needs it.
export const BUNDLES: Record<string, number> = {};
