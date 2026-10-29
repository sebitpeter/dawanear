import { medicines } from "../data/medicines.js";
import { pharmacies } from "../data/pharmacies.js";
import type { StockItem } from "../types.js";

/** Small deterministic pseudo-random generator so demo stock is the same every run. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** DEMO stock: each pharmacy carries ~80% of the catalogue at +/-25% of the base price. */
export function generateDemoStock(now = Math.floor(Date.now() / 1000)): StockItem[] {
  const rand = mulberry32(2026);
  const items: StockItem[] = [];
  for (const p of pharmacies) {
    for (const m of medicines) {
      if (rand() < 0.2) continue; // not carried at all
      const factor = 0.75 + rand() * 0.5;
      const price = Math.max(500, Math.round((m.base_price_ugx * factor) / 500) * 500);
      items.push({
        pharmacy_id: p.id,
        medicine_id: m.id,
        in_stock: rand() > 0.15,
        price_ugx: price,
        updated_at: now - Math.floor(rand() * 72 * 3600),
      });
    }
  }
  return items;
}
