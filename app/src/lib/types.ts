export type LatLng = [number, number];

export interface StockDoc {
  id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  brand_names: string[];
  active_ingredients: string[];
  strength: string;
  dosage_form: string;
  category: string;
  rx_only: boolean;
  pharmacy_id: string;
  pharmacy_name: string;
  area: string;
  phone?: string;
  location: LatLng;
  price_ugx: number;
  in_stock: boolean;
  opens_min: number;
  closes_min: number;
  open_24h: boolean;
  updated_at: number;
  is_demo: boolean;
}

export interface SearchHit {
  document: StockDoc;
  geo_distance_meters?: { location?: number };
  highlights?: unknown[];
}

export interface SearchResponse {
  found: number;
  hits: SearchHit[];
  search_time_ms?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  area: string;
  location: LatLng;
  phone: string;
  opens_min: number;
  closes_min: number;
  open_24h: boolean;
  is_demo: boolean;
  open_now?: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand_names: string[];
  strength: string;
  dosage_form: string;
  rx_only: boolean;
}

export interface PharmacyStockRow {
  pharmacy_id: string;
  medicine_id: string;
  in_stock: boolean;
  price_ugx: number;
  updated_at: number;
  medicine?: Medicine;
}

export interface PharmacyDetail extends Pharmacy {
  stock: PharmacyStockRow[];
}

export type SortMode = "distance" | "price";

export interface SearchFilters {
  q: string;
  origin: LatLng;
  radiusKm: number;
  inStockOnly: boolean;
  openNow: boolean;
  maxPrice: number | null;
  sort: SortMode;
}

export interface AlternativesResponse {
  medicine: { id: string; name: string; generic_name: string; active_ingredients: string[]; category: string; rx_only: boolean };
  same_ingredient: SearchResponse;
  same_class: SearchResponse;
}
