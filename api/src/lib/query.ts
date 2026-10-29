import { kampalaMinutes } from "./time.js";

export interface StockQuery {
  q?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  inStock?: boolean; // default true
  openNow?: boolean;
  maxPrice?: number;
  dosageForm?: string;
  pharmacyId?: string;
  sort?: "distance" | "price" | "relevance";
  perPage?: number;
  nowMinutes?: number;
}

export const QUERY_BY = "generic_name,brand_names,medicine_name,active_ingredients";

const num = (n: number) => Number(n.toFixed(6));

/** Builds Typesense search parameters for the flat `stock` collection. */
export function buildStockSearch(o: StockQuery): Record<string, string | number | boolean> {
  const filters: string[] = [];
  const hasGeo = typeof o.lat === "number" && typeof o.lng === "number" && !Number.isNaN(o.lat) && !Number.isNaN(o.lng);
  if (o.inStock !== false) filters.push("in_stock:true");
  if (hasGeo && o.radiusKm && o.radiusKm > 0) filters.push(`location:(${num(o.lat!)}, ${num(o.lng!)}, ${o.radiusKm} km)`);
  if (o.openNow) {
    const m = o.nowMinutes ?? kampalaMinutes();
    filters.push(`(open_24h:true || (opens_min:<=${m} && closes_min:>${m}))`);
  }
  if (o.maxPrice && o.maxPrice > 0) filters.push(`price_ugx:<=${Math.floor(o.maxPrice)}`);
  if (o.dosageForm) filters.push(`dosage_form:=${JSON.stringify(o.dosageForm)}`);
  if (o.pharmacyId) filters.push(`pharmacy_id:=${o.pharmacyId}`);

  const geoSort = hasGeo ? `location(${num(o.lat!)}, ${num(o.lng!)}):asc` : "";
  const sort = o.sort ?? (hasGeo ? "distance" : "relevance");
  let sort_by = "_text_match:desc,price_ugx:asc";
  if (sort === "distance" && geoSort) sort_by = `${geoSort},price_ugx:asc`;
  if (sort === "price") sort_by = geoSort ? `price_ugx:asc,${geoSort}` : "price_ugx:asc";

  const q = (o.q ?? "").trim();
  const params: Record<string, string | number | boolean> = {
    q: q || "*",
    query_by: QUERY_BY,
    sort_by,
    num_typos: 2,
    prefix: true,
    per_page: o.perPage ?? 30,
    facet_by: "dosage_form,area,open_24h",
  };
  // When the user typed something, rank by text match first unless they chose a sort.
  if (q && o.sort === undefined && geoSort) params.sort_by = `_text_match(buckets: 3):desc,${geoSort}`;
  if (filters.length) params.filter_by = filters.join(" && ");
  return params;
}

export type AlternativeMatch = "ingredient" | "class";

export interface AlternativesQuery {
  medicine: { id: string; active_ingredients: string[]; category: string };
  match: AlternativeMatch;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: "distance" | "price";
  perPage?: number;
}

/** Backtick-quote a filter value so spaces and commas are safe. */
const quote = (v: string) => "`" + v.replace(/`/g, "") + "`";

/**
 * In-stock alternatives near the user.
 * - "ingredient": a different product with the same active ingredient (e.g. syrup instead of capsules).
 * - "class": same therapeutic class (category) but a different active ingredient.
 * The app always tells people to ask a pharmacist before switching.
 */
export function buildAlternativesSearch(o: AlternativesQuery): Record<string, string | number | boolean> {
  const ing = `[${o.medicine.active_ingredients.map(quote).join(",")}]`;
  const filters = ["in_stock:true", `medicine_id:!=${quote(o.medicine.id)}`];
  if (o.match === "ingredient") filters.push(`active_ingredients:=${ing}`);
  else filters.push(`category:=${quote(o.medicine.category)}`, `active_ingredients:!=${ing}`);
  const hasGeo = typeof o.lat === "number" && typeof o.lng === "number" && !Number.isNaN(o.lat) && !Number.isNaN(o.lng);
  const radius = o.radiusKm && o.radiusKm > 0 ? o.radiusKm : 10;
  if (hasGeo) filters.push(`location:(${num(o.lat!)}, ${num(o.lng!)}, ${radius} km)`);
  const geoSort = hasGeo ? `location(${num(o.lat!)}, ${num(o.lng!)}):asc` : undefined;
  const sort = o.sort === "price" || !geoSort ? ["price_ugx:asc", geoSort] : [geoSort, "price_ugx:asc"];
  return {
    q: "*",
    query_by: QUERY_BY,
    filter_by: filters.join(" && "),
    sort_by: sort.filter(Boolean).join(","),
    per_page: o.perPage ?? 20,
  };
}
