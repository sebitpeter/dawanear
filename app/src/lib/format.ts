export function formatUGX(amount: number): string {
  return "UGX " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null || Number.isNaN(meters)) return "";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function timeAgo(unixSeconds: number, nowMs = Date.now()): string {
  const diff = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

/** Minutes after midnight in Kampala (UTC+3, no daylight saving). */
export function kampalaMinutes(date = new Date()): number {
  return (date.getUTCHours() * 60 + date.getUTCMinutes() + 180) % 1440;
}

export function isOpenNow(p: { open_24h: boolean; opens_min: number; closes_min: number }, date = new Date()): boolean {
  if (p.open_24h) return true;
  const m = kampalaMinutes(date);
  return m >= p.opens_min && m < p.closes_min;
}

function hhmm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function hoursLabel(p: { open_24h: boolean; opens_min: number; closes_min: number }): string {
  return p.open_24h ? "Open 24 hours" : `${hhmm(p.opens_min)} – ${hhmm(p.closes_min)}`;
}

export function directionsUrl([lat, lng]: [number, number]): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
