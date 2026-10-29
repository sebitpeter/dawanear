// DEMO DATA: every pharmacy below is FICTIONAL. Names, phone numbers and stock
// are invented for the droidcon Uganda hackathon demo. Coordinates are rough
// points inside real Kampala neighbourhoods so geo search can be shown.
import type { Pharmacy } from "../types.js";

export const pharmacies: Pharmacy[] = [
  { id: "ph01", name: "Nakawa Wellness Pharmacy (Demo)", area: "Nakawa", location: [0.3293, 32.6141], phone: "+256700000101", opens_min: 480, closes_min: 1260, open_24h: false, is_demo: true },
  { id: "ph02", name: "Ntinda Corner Chemist (Demo)", area: "Ntinda", location: [0.3540, 32.6150], phone: "+256700000102", opens_min: 450, closes_min: 1320, open_24h: false, is_demo: true },
  { id: "ph03", name: "Kireka Family Pharmacy (Demo)", area: "Kireka", location: [0.3460, 32.6470], phone: "+256700000103", opens_min: 0, closes_min: 1440, open_24h: true, is_demo: true },
  { id: "ph04", name: "Bukoto Care Pharmacy (Demo)", area: "Bukoto", location: [0.3480, 32.5950], phone: "+256700000104", opens_min: 510, closes_min: 1200, open_24h: false, is_demo: true },
  { id: "ph05", name: "Kansanga Health Point (Demo)", area: "Kansanga", location: [0.2930, 32.6080], phone: "+256700000105", opens_min: 480, closes_min: 1380, open_24h: false, is_demo: true },
  { id: "ph06", name: "Wandegeya Student Pharmacy (Demo)", area: "Wandegeya", location: [0.3330, 32.5710], phone: "+256700000106", opens_min: 420, closes_min: 1320, open_24h: false, is_demo: true },
  { id: "ph07", name: "Kololo Hillside Pharmacy (Demo)", area: "Kololo", location: [0.3330, 32.5930], phone: "+256700000107", opens_min: 540, closes_min: 1140, open_24h: false, is_demo: true },
  { id: "ph08", name: "Kabalagala Night Pharmacy (Demo)", area: "Kabalagala", location: [0.2990, 32.5950], phone: "+256700000108", opens_min: 0, closes_min: 1440, open_24h: true, is_demo: true },
  { id: "ph09", name: "Naalya Estate Chemist (Demo)", area: "Naalya", location: [0.3680, 32.6440], phone: "+256700000109", opens_min: 480, closes_min: 1260, open_24h: false, is_demo: true },
  { id: "ph10", name: "Bugolobi Market Pharmacy (Demo)", area: "Bugolobi", location: [0.3170, 32.6190], phone: "+256700000110", opens_min: 450, closes_min: 1290, open_24h: false, is_demo: true },
];
