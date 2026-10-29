import { buildApiQuery, buildTypesenseParams } from "../src/lib/search";
import type { SearchFilters } from "../src/lib/types";

const base: SearchFilters = { q: "amoxcilin", origin: [0.33, 32.615], radiusKm: 5, inStockOnly: true, openNow: false, maxPrice: null, sort: "distance" };

describe("search params", () => {
  it("builds a typo-tolerant geo query for Typesense", () => {
    const p = buildTypesenseParams(base);
    expect(p.q).toBe("amoxcilin");
    expect(p.num_typos).toBe("2");
    expect(p.filter_by).toBe("in_stock:true && location:(0.33, 32.615, 5 km)");
    expect(p.sort_by).toBe("_text_match(buckets: 3):desc,location(0.33, 32.615):asc");
  });

  it("adds open now and price filters, and sorts by price", () => {
    const p = buildTypesenseParams({ ...base, q: "", openNow: true, maxPrice: 5000, sort: "price" }, new Date("2026-10-28T11:30:00Z"));
    expect(p.q).toBe("*");
    expect(p.filter_by).toContain("(open_24h:true || (opens_min:<=870 && closes_min:>870))");
    expect(p.filter_by).toContain("price_ugx:<=5000");
    expect(p.sort_by).toBe("price_ugx:asc,location(0.33, 32.615):asc");
  });

  it("builds the Stock API query string", () => {
    const qs = new URLSearchParams(buildApiQuery({ ...base, maxPrice: 10000 }));
    expect(qs.get("q")).toBe("amoxcilin");
    expect(qs.get("radius_km")).toBe("5");
    expect(qs.get("max_price")).toBe("10000");
    expect(qs.get("sort")).toBe("distance");
  });
});
