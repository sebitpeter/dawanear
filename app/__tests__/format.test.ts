import { directionsUrl, formatDistance, formatUGX, hoursLabel, isOpenNow, kampalaMinutes, timeAgo } from "../src/lib/format";

describe("format helpers", () => {
  it("formats Uganda shillings", () => {
    expect(formatUGX(2000)).toBe("UGX 2,000");
    expect(formatUGX(1250000)).toBe("UGX 1,250,000");
  });

  it("formats distances", () => {
    expect(formatDistance(126)).toBe("130 m");
    expect(formatDistance(1512)).toBe("1.5 km");
    expect(formatDistance(12500)).toBe("13 km");
    expect(formatDistance(undefined)).toBe("");
  });

  it("formats time ago", () => {
    const now = 1_000_000_000_000;
    expect(timeAgo(now / 1000 - 30, now)).toBe("just now");
    expect(timeAgo(now / 1000 - 600, now)).toBe("10 min ago");
    expect(timeAgo(now / 1000 - 7200, now)).toBe("2 h ago");
    expect(timeAgo(now / 1000 - 3 * 86400, now)).toBe("3 d ago");
  });

  it("uses Kampala time for open now", () => {
    expect(kampalaMinutes(new Date("2026-10-28T06:00:00Z"))).toBe(540);
    const p = { open_24h: false, opens_min: 480, closes_min: 1260 };
    expect(isOpenNow(p, new Date("2026-10-28T06:00:00Z"))).toBe(true); // 9 AM
    expect(isOpenNow(p, new Date("2026-10-28T19:00:00Z"))).toBe(false); // 10 PM
    expect(isOpenNow({ ...p, open_24h: true }, new Date("2026-10-28T23:00:00Z"))).toBe(true);
  });

  it("labels hours and builds a Google Maps link", () => {
    expect(hoursLabel({ open_24h: false, opens_min: 480, closes_min: 1260 })).toBe("8:00 AM – 9:00 PM");
    expect(hoursLabel({ open_24h: true, opens_min: 0, closes_min: 1440 })).toBe("Open 24 hours");
    expect(directionsUrl([0.33, 32.61])).toBe("https://www.google.com/maps/dir/?api=1&destination=0.33,32.61");
  });
});
