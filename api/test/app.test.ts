import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp, parseCodes } from "../src/app.js";
import { Typesense } from "../src/lib/typesense.js";
import { Store } from "../src/store.js";

interface Call { method: string; url: string; body?: string }

function fakeTypesense() {
  const calls: Call[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ method: String(init.method), url: String(url), body: init.body as string | undefined });
    if (String(url).includes("/documents/import")) {
      const n = String(init.body).split("\n").length;
      return new Response(Array(n).fill('{"success":true}').join("\n"), { status: 200 });
    }
    if (String(url).includes("/documents/search")) {
      return new Response(JSON.stringify({ found: 1, hits: [{ document: { id: "ph01-para-500-tab" } }] }), { status: 200 });
    }
    return new Response("{}", { status: 201 });
  }) as unknown as typeof fetch;
  return { ts: new Typesense({ host: "example.test", apiKey: "test-key" }, fetchFn), calls };
}

describe("Stock API", () => {
  let store: Store;
  let fake: ReturnType<typeof fakeTypesense>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new Store();
    fake = fakeTypesense();
    app = createApp({ store, typesense: fake.ts, pharmacyCodes: parseCodes("ph01:1111"), now: () => new Date("2026-10-28T09:00:00Z") });
  });

  it("parses demo pharmacy codes", () => {
    expect(parseCodes("ph01:1111, ph02:2222,bad")).toEqual({ ph01: "1111", ph02: "2222" });
  });

  it("reports health", async () => {
    const res = await request(app).get("/health");
    expect(res.body).toEqual({ ok: true, typesense: true, demo_data: true });
  });

  it("lists demo pharmacies with open_now", async () => {
    const res = await request(app).get("/pharmacies");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    expect(res.body.every((p: { is_demo: boolean }) => p.is_demo)).toBe(true);
    expect(res.body[0]).toHaveProperty("open_now", true); // 12:00 in Kampala
  });

  it("shows a pharmacy with its stock", async () => {
    const res = await request(app).get("/pharmacies/ph01");
    expect(res.status).toBe(200);
    expect(res.body.stock.length).toBeGreaterThan(10);
    expect(res.body.stock[0].medicine).toHaveProperty("name");
    expect((await request(app).get("/pharmacies/nope")).status).toBe(404);
  });

  it("filters the medicine catalogue", async () => {
    const res = await request(app).get("/medicines?q=coartem");
    expect(res.body.map((m: { id: string }) => m.id)).toEqual(["al-20-120-tab"]);
  });

  it("proxies search to Typesense with geo + filters", async () => {
    const res = await request(app).get("/search?q=amoxcilin&lat=0.33&lng=32.615&radius_km=5&open_now=true");
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(1);
    const params = new URL(fake.calls[0].url).searchParams;
    expect(fake.calls[0].url).toContain("/collections/stock/documents/search");
    expect(params.get("q")).toBe("amoxcilin");
    expect(params.get("filter_by")).toContain("location:(0.33, 32.615, 5 km)");
    expect(params.get("filter_by")).toContain("opens_min:<=720");
  });

  it("returns same-ingredient and same-class alternatives", async () => {
    const res = await request(app).get("/alternatives/amox-500-cap?lat=0.33&lng=32.615&sort=price");
    expect(res.status).toBe(200);
    expect(res.body.medicine.id).toBe("amox-500-cap");
    expect(res.body.same_ingredient.found).toBe(1);
    expect(res.body.same_class.found).toBe(1);
    const searches = fake.calls.filter((c) => c.url.includes("/documents/search")).map((c) => new URL(c.url).searchParams);
    expect(searches).toHaveLength(2);
    expect(searches[0].get("filter_by")).toContain("active_ingredients:=[`amoxicillin`]");
    expect(searches[1].get("filter_by")).toContain("category:=`antibiotic`");
    expect(searches[0].get("sort_by")?.startsWith("price_ugx:asc")).toBe(true);
  });

  it("404s alternatives for an unknown medicine", async () => {
    expect((await request(app).get("/alternatives/nope")).status).toBe(404);
  });

  it("rejects stock updates without the right code", async () => {
    const res = await request(app).put("/pharmacies/ph01/stock/para-500-tab").set("X-Pharmacy-Code", "0000").send({ in_stock: false });
    expect(res.status).toBe(401);
  });

  it("logs a pharmacist in", async () => {
    expect((await request(app).post("/pharmacy/login").send({ pharmacyId: "ph01", code: "1111" })).status).toBe(200);
    expect((await request(app).post("/pharmacy/login").send({ pharmacyId: "ph01", code: "1" })).status).toBe(401);
  });

  it("updates stock and upserts the document into Typesense", async () => {
    const res = await request(app)
      .put("/pharmacies/ph01/stock/para-500-tab")
      .set("X-Pharmacy-Code", "1111")
      .send({ in_stock: false, price_ugx: 2500 });
    expect(res.status).toBe(200);
    expect(res.body.synced).toBe(true);
    expect(res.body.item).toMatchObject({ in_stock: false, price_ugx: 2500 });
    const upsert = fake.calls.find((c) => c.url.includes("/collections/stock/documents?action=upsert"));
    expect(JSON.parse(upsert!.body!)).toMatchObject({ id: "ph01-para-500-tab", in_stock: false, price_ugx: 2500, is_demo: true });
    expect(store.stockFor("ph01").find((s) => s.medicine_id === "para-500-tab")?.in_stock).toBe(false);
  });

  it("validates the price", async () => {
    const res = await request(app).put("/pharmacies/ph01/stock/para-500-tab").set("X-Pharmacy-Code", "1111").send({ price_ugx: -5 });
    expect(res.status).toBe(400);
  });

  it("syncs collections, synonyms and documents", async () => {
    const res = await request(app).post("/admin/sync");
    expect(res.status).toBe(200);
    expect(res.body.imported.pharmacies).toBe(10);
    expect(res.body.imported.medicines).toBe(30);
    expect(fake.calls.some((c) => c.url.includes("/synonym_sets/medicine-synonyms"))).toBe(true);
  });

  it("returns 503 for search when Typesense is not configured", async () => {
    const offline = createApp({ store, typesense: null, pharmacyCodes: {} });
    expect((await request(offline).get("/search?q=panadol")).status).toBe(503);
  });
});

describe("demo data", () => {
  it("is deterministic and every pharmacy is fictional", () => {
    const a = new Store().allStock().map((s) => `${s.pharmacy_id}-${s.medicine_id}-${s.price_ugx}`);
    const b = new Store().allStock().map((s) => `${s.pharmacy_id}-${s.medicine_id}-${s.price_ugx}`);
    expect(a).toEqual(b);
    expect(new Store().pharmacies.every((p) => p.name.includes("(Demo)"))).toBe(true);
  });
});
