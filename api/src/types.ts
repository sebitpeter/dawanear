export type LatLng = [number, number]; // Typesense geopoint order: [lat, lng]

export interface Pharmacy {
  id: string;
  name: string;
  area: string;
  location: LatLng;
  phone: string;
  opens_min: number; // minutes after midnight, Kampala time
  closes_min: number;
  open_24h: boolean;
  is_demo: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand_names: string[];
  active_ingredients: string[];
  strength: string;
  dosage_form: string;
  category: string;
  rx_only: boolean;
  base_price_ugx: number;
}

export interface StockItem {
  pharmacy_id: string;
  medicine_id: string;
  in_stock: boolean;
  price_ugx: number;
  updated_at: number; // unix seconds
}

/** One flat document per pharmacy + medicine, as stored in Typesense `stock`. */
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
  phone: string;
  location: LatLng;
  price_ugx: number;
  in_stock: boolean;
  opens_min: number;
  closes_min: number;
  open_24h: boolean;
  updated_at: number;
  is_demo: boolean;
}
