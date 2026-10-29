import { config, searchesDirectly } from "./config";
import { kampalaMinutes } from "./format";
import type { SearchFilters, SearchResponse } from "./types";

const QUERY_BY = "generic_name,brand_names,medicine_name,active_ingredients";
const n = (x: number) => Number(x.toFixed(6));

/** Typesense parameters for the flat `stock` collection (used in direct mode). */
export function buildTypesenseParams(f: SearchFilters, now = new Date()): Record<string, string> {
  const [lat, lng] = f.origin;
  const geo = `location(${n(lat)}, ${n(lng)})`;
  const filters: string[] = [];
  if (f.inStockOnly) filters.push("in_stock:true");
  filters.push(`location:(${n(lat)}, ${n(lng)}, ${f.radiusKm} km)`);
  if (f.openNow) {
    const m = kampalaMinutes(now);
    filters.push(`(open_24h:true || (opens_min:<=${m} && closes_min:>${m}))`);
  }
  if (f.maxPrice) filters.push(`price_ugx:<=${f.maxPrice}`);
  const sort_by = f.sort === "price" ? `price_ugx:asc,${geo}:asc` : `${geo}:asc,price_ugx:asc`;
  return {
    q: f.q.trim() || "*",
    query_by: QUERY_BY,
    filter_by: filters.join(" && "),
    sort_by: f.q.trim() && f.sort === "distance" ? `_text_match(buckets: 3):desc,${geo}:asc` : sort_by,
    num_typos: "2",
    per_page: "30",
  };
}

/** Query string for the Stock API's /search proxy. */
export function buildApiQuery(f: SearchFilters): string {
  const p = new URLSearchParams({
    q: f.q.trim(),
    lat: String(f.origin[0]),
    lng: String(f.origin[1]),
    radius_km: String(f.radiusKm),
    in_stock: String(f.inStockOnly),
    open_now: String(f.openNow),
    sort: f.sort,
  });
  if (f.maxPrice) p.set("max_price", String(f.maxPrice));
  return p.toString();
}

export async function searchStock(f: SearchFilters, signal?: AbortSignal): Promise<SearchResponse> {
  let res: Response;
  if (searchesDirectly()) {
    const qs = new URLSearchParams(buildTypesenseParams(f)).toString();
    res = await fetch(`https://${config.typesenseHost}/collections/stock/documents/search?${qs}`, {
      headers: { "X-TYPESENSE-API-KEY": config.typesenseSearchKey },
      signal,
    });
  } else {
    res = await fetch(`${config.apiUrl}/search?${buildApiQuery(f)}`, { signal });
  }
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()) as SearchResponse;
}
