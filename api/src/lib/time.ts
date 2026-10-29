/** Minutes after midnight in Kampala (UTC+3, no daylight saving). */
export function kampalaMinutes(date: Date = new Date()): number {
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
  return (utcMin + 180) % 1440;
}

export function isOpenAt(p: { open_24h: boolean; opens_min: number; closes_min: number }, minutes: number): boolean {
  if (p.open_24h) return true;
  return minutes >= p.opens_min && minutes < p.closes_min;
}
