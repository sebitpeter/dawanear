import { describe, expect, it } from "vitest";
import { buildAlternativesSearch, buildStockSearch } from "../src/lib/query.js";
import { isOpenAt, kampalaMinutes } from "../src/lib/time.js";

describe("buildStockSearch", () => {
  it("searches everything in stock by default", () => {
    const p = buildStockSearch({});
    expect(p.q).toBe("*");
    expect(p.filter_by).toBe("in_stock:true");
    expect(p.num_typos).toBe(2);
  });

  it("adds a geo radius and distance sort", () => {
    const p = buildStockSearch({ lat: 0.33, lng: 32.615, radiusKm: 5, sort: "distance" });
    expect(p.filter_by).toContain("location:(0.33, 32.615, 5 km)");
    expect(p.sort_by).toBe("location(0.33, 32.615):asc,price_ugx:asc");
  });

  it("ranks typed text first, then distance", () => {
    const p = buildStockSearch({ q: "amoxcilin", lat: 0.33, lng: 32.615 });
    expect(p.q).toBe("amoxcilin");
    expect(p.sort_by).toBe("_text_match(buckets: 3):desc,location(0.33, 32.615):asc");
  });

  it("builds the open-now, price and form filters", () => {
    const p = buildStockSearch({ openNow: true, nowMinutes: 870, maxPrice: 5000, dosageForm: "syrup", inStock: false });
    expect(p.filter_by).toBe('(open_24h:true || (opens_min:<=870 && closes_min:>870)) && price_ugx:<=5000 && dosage_form:="syrup"');
  });

  it("sorts by price when asked", () => {
    expect(buildStockSearch({ sort: "price" }).sort_by).toBe("price_ugx:asc");
  });
});

describe("buildAlternativesSearch", () => {
  const amox = { id: "amox-500-cap", active_ingredients: ["amoxicillin"], category: "antibiotic" };

  it("same ingredient: filters on the active ingredient, excludes the product, nearest first", () => {
    const p = buildAlternativesSearch({ medicine: amox, match: "ingredient", lat: 0.33, lng: 32.6 });
    expect(p.filter_by).toContain("active_ingredients:=[`amoxicillin`]");
    expect(p.filter_by).toContain("medicine_id:!=`amox-500-cap`");
    expect(p.filter_by).toContain("in_stock:true");
    expect(p.filter_by).toContain("location:(0.33, 32.6, 10 km)");
    expect(p.sort_by).toBe("location(0.33, 32.6):asc,price_ugx:asc");
  });

  it("same class: same category but a different ingredient", () => {
    const p = buildAlternativesSearch({ medicine: amox, match: "class", lat: 0.33, lng: 32.6, radiusKm: 5 });
    expect(p.filter_by).toContain("category:=`antibiotic`");
    expect(p.filter_by).toContain("active_ingredients:!=[`amoxicillin`]");
    expect(p.filter_by).toContain("5 km");
  });

  it("sorts by price when asked, or when there is no location", () => {
    expect(buildAlternativesSearch({ medicine: amox, match: "ingredient", lat: 0.33, lng: 32.6, sort: "price" }).sort_by)
      .toBe("price_ugx:asc,location(0.33, 32.6):asc");
    const noGeo = buildAlternativesSearch({ medicine: amox, match: "ingredient" });
    expect(noGeo.sort_by).toBe("price_ugx:asc");
    expect(String(noGeo.filter_by)).not.toContain("location");
  });

  it("quotes categories with spaces", () => {
    const p = buildAlternativesSearch({ medicine: { id: "x", active_ingredients: ["amlodipine"], category: "blood pressure" }, match: "class" });
    expect(p.filter_by).toContain("category:=`blood pressure`");
  });
});

describe("time helpers", () => {
  it("converts UTC to Kampala minutes (UTC+3)", () => {
    expect(kampalaMinutes(new Date("2026-10-28T06:30:00Z"))).toBe(570);
    expect(kampalaMinutes(new Date("2026-10-28T22:00:00Z"))).toBe(60);
  });
  it("knows when a pharmacy is open", () => {
    const p = { open_24h: false, opens_min: 480, closes_min: 1260 };
    expect(isOpenAt(p, 479)).toBe(false);
    expect(isOpenAt(p, 480)).toBe(true);
    expect(isOpenAt(p, 1260)).toBe(false);
    expect(isOpenAt({ ...p, open_24h: true }, 10)).toBe(true);
  });
});
