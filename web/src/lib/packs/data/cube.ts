import type { CubeRow } from "./types";

// Ebony-cube reward rows (source B cube_rewards). Only the 4 cube tiers mapped to ebony-cube
// unlock slugs are included; Haal's Hourglass and Unit-gold rows are dataset-only and ignored.
// Silvers/TotalGoldValue columns are ignored by the cube EV formula, so they are omitted here.
export const CUBE_REWARDS: Record<string, CubeRow> = {
  "Cube 1640": { lv2Gems: 6, leapstones: 14, blueJuice: 4, redJuice: 4 },
  "Cube 1680": { lv2Gems: 12, leapstones: 25, blueJuice: 5, redJuice: 5 },
  "Cube 1700": { lv2Gems: 16, leapstones: 32, blueJuice: 6, redJuice: 6 },
  "Cube 1720": { lv2Gems: 22, leapstones: 41, blueJuice: 8, redJuice: 8 },
};

// Ebony-cube unlock slug -> cube reward row (source B mapping_used_by_app / ve).
export const CUBE_MAP: Record<string, string> = {
  "ebony-cube-1st-unlock": "Cube 1640",
  "ebony-cube-2nd-unlock": "Cube 1680",
  "ebony-cube-3rd-unlock": "Cube 1700",
  "ebony-cube-4th-unlock": "Cube 1720",
};
