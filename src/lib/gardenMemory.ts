// Per-session navigation memory: which region was last explored and which
// projects were visited. sessionStorage only — nothing is sent anywhere.

import type { GardenRegionId } from "@/data/projects";

const REGION_KEY = "goi:region";
const VISITED_KEY = "goi:visited";

export type RegionView = GardenRegionId | "all";

export function readRegion(): RegionView {
  try {
    const v = sessionStorage.getItem(REGION_KEY);
    return v === "creative-corner" || v === "growing-grounds" ? v : "all";
  } catch {
    return "all";
  }
}

export function saveRegion(region: RegionView) {
  try {
    sessionStorage.setItem(REGION_KEY, region);
  } catch {}
}

export function readVisited(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(VISITED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function markVisited(slug: string) {
  try {
    const set = new Set(readVisited());
    set.add(slug);
    sessionStorage.setItem(VISITED_KEY, JSON.stringify([...set]));
  } catch {}
}

const LAST_KEY = "goi:last-project";

/** The project whose preview was opened last, so Back to Work can return to it. */
export function saveLastProject(slug: string) {
  try {
    sessionStorage.setItem(LAST_KEY, slug);
  } catch {}
}

export function readLastProject(): string | null {
  try {
    return sessionStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
