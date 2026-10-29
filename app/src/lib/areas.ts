import type { LatLng } from "./types";

/** Approximate centre points of Kampala areas, used when GPS is off. */
export const AREAS: { name: string; location: LatLng }[] = [
  { name: "Nakawa", location: [0.33, 32.615] },
  { name: "Ntinda", location: [0.354, 32.615] },
  { name: "Kireka", location: [0.346, 32.647] },
  { name: "Wandegeya", location: [0.333, 32.571] },
  { name: "Kansanga", location: [0.293, 32.608] },
  { name: "Bukoto", location: [0.348, 32.595] },
];

export const DEFAULT_ORIGIN: LatLng = AREAS[0].location;
