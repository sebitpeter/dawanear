import fs from "node:fs";
import { medicines as seedMedicines } from "./data/medicines.js";
import { pharmacies as seedPharmacies } from "./data/pharmacies.js";
import { generateDemoStock } from "./lib/seed.js";
import type { Medicine, Pharmacy, StockDoc, StockItem } from "./types.js";

/**
 * In-memory store (no database for the MVP). Typesense holds the searchable
 * copy; this store is the source of truth for the API and can optionally be
 * saved to a JSON file so stock changes survive a restart.
 */
export class Store {
  readonly pharmacies: Pharmacy[];
  readonly medicines: Medicine[];
  private stock = new Map<string, StockItem>();

  constructor(private dataFile?: string) {
    this.pharmacies = seedPharmacies;
    this.medicines = seedMedicines;
    const saved = dataFile && fs.existsSync(dataFile) ? (JSON.parse(fs.readFileSync(dataFile, "utf8")) as StockItem[]) : null;
    for (const s of saved ?? generateDemoStock()) this.stock.set(Store.key(s.pharmacy_id, s.medicine_id), s);
  }

  static key(pharmacyId: string, medicineId: string) {
    return `${pharmacyId}-${medicineId}`;
  }

  pharmacy(id: string) { return this.pharmacies.find((p) => p.id === id); }
  medicine(id: string) { return this.medicines.find((m) => m.id === id); }

  stockFor(pharmacyId: string): StockItem[] {
    return [...this.stock.values()].filter((s) => s.pharmacy_id === pharmacyId);
  }

  allStock(): StockItem[] { return [...this.stock.values()]; }

  upsertStock(item: StockItem): StockItem {
    this.stock.set(Store.key(item.pharmacy_id, item.medicine_id), item);
    this.save();
    return item;
  }

  private save() {
    if (this.dataFile) fs.writeFileSync(this.dataFile, JSON.stringify(this.allStock()));
  }

  toDoc(s: StockItem): StockDoc {
    const p = this.pharmacy(s.pharmacy_id);
    const m = this.medicine(s.medicine_id);
    if (!p || !m) throw new Error(`Unknown pharmacy or medicine: ${s.pharmacy_id}/${s.medicine_id}`);
    return {
      id: Store.key(p.id, m.id),
      medicine_id: m.id,
      medicine_name: m.name,
      generic_name: m.generic_name,
      brand_names: m.brand_names,
      active_ingredients: m.active_ingredients,
      strength: m.strength,
      dosage_form: m.dosage_form,
      category: m.category,
      rx_only: m.rx_only,
      pharmacy_id: p.id,
      pharmacy_name: p.name,
      area: p.area,
      phone: p.phone,
      location: p.location,
      price_ugx: s.price_ugx,
      in_stock: s.in_stock,
      opens_min: p.opens_min,
      closes_min: p.closes_min,
      open_24h: p.open_24h,
      updated_at: s.updated_at,
      is_demo: true,
    };
  }
}
