import type { Store } from "../store.js";
import { medicinesSchema, pharmaciesSchema, stockSchema } from "./schemas.js";
import type { Typesense } from "./typesense.js";

/** Creates collections + synonym set (if missing) and upserts every document. */
export async function syncAll(ts: Typesense, store: Store) {
  await ts.upsertSynonyms();
  const collections: Record<string, string> = {};
  for (const schema of [stockSchema, medicinesSchema, pharmaciesSchema]) {
    collections[schema.name] = await ts.ensureCollection(schema);
  }
  const medicines = await ts.importDocs(
    "medicines",
    store.medicines.map(({ base_price_ugx: _ignored, ...m }) => m),
  );
  const pharmacies = await ts.importDocs("pharmacies", store.pharmacies);
  const stock = await ts.importDocs("stock", store.allStock().map((s) => store.toDoc(s)));
  return { collections, imported: { medicines, pharmacies, stock } };
}
