import { config } from "./config";
import type { AlternativesResponse, LatLng, Pharmacy, PharmacyDetail, PharmacyStockRow, SortMode } from "./types";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

/** Path for the alternatives endpoint (exported for tests). */
export function alternativesPath(medicineId: string, origin?: LatLng, sort: SortMode = "distance") {
  const p = new URLSearchParams({ sort });
  if (origin) {
    p.set("lat", String(origin[0]));
    p.set("lng", String(origin[1]));
  }
  return `/alternatives/${encodeURIComponent(medicineId)}?${p.toString()}`;
}

export const api = {
  alternatives: (medicineId: string, origin?: LatLng, sort: SortMode = "distance") =>
    call<AlternativesResponse>(alternativesPath(medicineId, origin, sort)),
  pharmacies: () => call<Pharmacy[]>("/pharmacies"),
  pharmacy: (id: string) => call<PharmacyDetail>(`/pharmacies/${encodeURIComponent(id)}`),
  login: (pharmacyId: string, code: string) =>
    call<{ ok: true; pharmacy: Pharmacy }>("/pharmacy/login", { method: "POST", body: JSON.stringify({ pharmacyId, code }) }),
  updateStock: (pharmacyId: string, medicineId: string, code: string, change: { in_stock?: boolean; price_ugx?: number }) =>
    call<{ ok: true; item: PharmacyStockRow; synced: boolean }>(
      `/pharmacies/${encodeURIComponent(pharmacyId)}/stock/${encodeURIComponent(medicineId)}`,
      { method: "PUT", body: JSON.stringify(change), headers: { "X-Pharmacy-Code": code } },
    ),
};
