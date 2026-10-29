import { SYNONYM_SET } from "../data/synonyms.js";

const common = { token_separators: ["-", "/", "+"], synonym_sets: [SYNONYM_SET] };

export const stockSchema = {
  name: "stock",
  ...common,
  fields: [
    { name: "medicine_id", type: "string", facet: true },
    { name: "medicine_name", type: "string" },
    { name: "generic_name", type: "string", facet: true },
    { name: "brand_names", type: "string[]" },
    { name: "active_ingredients", type: "string[]", facet: true },
    { name: "strength", type: "string" },
    { name: "dosage_form", type: "string", facet: true },
    { name: "category", type: "string", facet: true },
    { name: "rx_only", type: "bool", facet: true },
    { name: "pharmacy_id", type: "string", facet: true },
    { name: "pharmacy_name", type: "string" },
    { name: "area", type: "string", facet: true },
    { name: "phone", type: "string", index: false, optional: true },
    { name: "location", type: "geopoint" },
    { name: "price_ugx", type: "int32", facet: true },
    { name: "in_stock", type: "bool", facet: true },
    { name: "opens_min", type: "int32" },
    { name: "closes_min", type: "int32" },
    { name: "open_24h", type: "bool", facet: true },
    { name: "updated_at", type: "int64" },
    { name: "is_demo", type: "bool", facet: true },
  ],
  default_sorting_field: "price_ugx",
};

export const medicinesSchema = {
  name: "medicines",
  ...common,
  fields: [
    { name: "name", type: "string" },
    { name: "generic_name", type: "string", facet: true },
    { name: "brand_names", type: "string[]" },
    { name: "active_ingredients", type: "string[]", facet: true },
    { name: "strength", type: "string" },
    { name: "dosage_form", type: "string", facet: true },
    { name: "category", type: "string", facet: true },
    { name: "rx_only", type: "bool", facet: true },
  ],
};

export const pharmaciesSchema = {
  name: "pharmacies",
  token_separators: ["-"],
  fields: [
    { name: "name", type: "string" },
    { name: "area", type: "string", facet: true },
    { name: "location", type: "geopoint" },
    { name: "phone", type: "string", index: false, optional: true },
    { name: "opens_min", type: "int32" },
    { name: "closes_min", type: "int32" },
    { name: "open_24h", type: "bool", facet: true },
    { name: "is_demo", type: "bool", facet: true },
  ],
};
