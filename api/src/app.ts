import express, { type NextFunction, type Request, type Response } from "express";
import { buildAlternativesSearch, buildStockSearch, type StockQuery } from "./lib/query.js";
import { syncAll } from "./lib/sync.js";
import { isOpenAt, kampalaMinutes } from "./lib/time.js";
import type { Typesense } from "./lib/typesense.js";
import type { Store } from "./store.js";
import type { StockItem } from "./types.js";

export interface AppOptions {
  store: Store;
  typesense: Typesense | null;
  /** "ph01:1111,ph02:2222" style demo pharmacy codes. */
  pharmacyCodes: Record<string, string>;
  syncToken?: string;
  now?: () => Date;
}

export function parseCodes(raw = ""): Record<string, string> {
  return Object.fromEntries(
    raw.split(",").map((pair) => pair.trim().split(":")).filter((p) => p.length === 2 && p[0] && p[1]),
  );
}

const optNum = (v: unknown) => (v === undefined || v === "" ? undefined : Number(v));
const optBool = (v: unknown) => (v === undefined || v === "" ? undefined : v === "true" || v === "1");

export function createApp(opts: AppOptions) {
  const { store, typesense, pharmacyCodes } = opts;
  const now = opts.now ?? (() => new Date());
  const app = express();
  app.use(express.json({ limit: "50kb" }));

  // Allow the Expo app (web and phone) to call the API.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Pharmacy-Code, X-Sync-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const requireTypesense = (res: Response) => {
    if (!typesense) {
      res.status(503).json({ error: "Typesense is not configured. Set TYPESENSE_HOST and TYPESENSE_API_KEY in api/.env" });
      return false;
    }
    return true;
  };

  app.get("/health", (_req, res) => {
    res.json({ ok: true, typesense: Boolean(typesense), demo_data: true });
  });

  app.get("/pharmacies", (_req, res) => {
    const minutes = kampalaMinutes(now());
    res.json(store.pharmacies.map((p) => ({ ...p, open_now: isOpenAt(p, minutes) })));
  });

  app.get("/pharmacies/:id", (req, res) => {
    const p = store.pharmacy(req.params.id);
    if (!p) return res.status(404).json({ error: "Pharmacy not found" });
    const stock = store
      .stockFor(p.id)
      .map((s) => ({ ...s, medicine: store.medicine(s.medicine_id) }))
      .sort((a, b) => (a.medicine?.name ?? "").localeCompare(b.medicine?.name ?? ""));
    res.json({ ...p, open_now: isOpenAt(p, kampalaMinutes(now())), stock });
  });

  app.get("/medicines", (req, res) => {
    const q = String(req.query.q ?? "").toLowerCase();
    const list = q
      ? store.medicines.filter((m) => [m.name, m.generic_name, ...m.brand_names].some((t) => t.toLowerCase().includes(q)))
      : store.medicines;
    res.json(list);
  });

  // Customer search, proxied to Typesense so the phone never needs a write key.
  app.get("/search", async (req, res, next) => {
    if (!requireTypesense(res)) return;
    try {
      const query: StockQuery = {
        q: String(req.query.q ?? ""),
        lat: optNum(req.query.lat),
        lng: optNum(req.query.lng),
        radiusKm: optNum(req.query.radius_km),
        inStock: optBool(req.query.in_stock),
        openNow: optBool(req.query.open_now),
        maxPrice: optNum(req.query.max_price),
        dosageForm: req.query.dosage_form ? String(req.query.dosage_form) : undefined,
        pharmacyId: req.query.pharmacy_id ? String(req.query.pharmacy_id) : undefined,
        sort: ["distance", "price", "relevance"].includes(String(req.query.sort)) ? (req.query.sort as StockQuery["sort"]) : undefined,
        nowMinutes: kampalaMinutes(now()),
      };
      res.json(await typesense!.search("stock", buildStockSearch(query)));
    } catch (e) { next(e); }
  });

  // Alternatives: same active ingredient, and same therapeutic class. Two searches in parallel.
  app.get("/alternatives/:medicineId", async (req, res, next) => {
    if (!requireTypesense(res)) return;
    const m = store.medicine(req.params.medicineId);
    if (!m) return res.status(404).json({ error: "Medicine not found" });
    const base = {
      medicine: m,
      lat: optNum(req.query.lat),
      lng: optNum(req.query.lng),
      radiusKm: optNum(req.query.radius_km),
      sort: req.query.sort === "price" ? ("price" as const) : ("distance" as const),
    };
    try {
      const [sameIngredient, sameClass] = await Promise.all([
        typesense!.search("stock", buildAlternativesSearch({ ...base, match: "ingredient" })),
        typesense!.search("stock", buildAlternativesSearch({ ...base, match: "class" })),
      ]);
      res.json({
        medicine: { id: m.id, name: m.name, generic_name: m.generic_name, active_ingredients: m.active_ingredients, category: m.category, rx_only: m.rx_only },
        same_ingredient: sameIngredient,
        same_class: sameClass,
      });
    } catch (e) { next(e); }
  });

  app.post("/pharmacy/login", (req, res) => {
    const { pharmacyId, code } = req.body ?? {};
    if (!pharmacyId || !code || pharmacyCodes[pharmacyId] !== String(code)) {
      return res.status(401).json({ error: "Wrong pharmacy ID or code" });
    }
    res.json({ ok: true, pharmacy: store.pharmacy(pharmacyId) });
  });

  const requirePharmacy = (req: Request, res: Response, next: NextFunction) => {
    const code = req.header("x-pharmacy-code");
    if (!code || pharmacyCodes[req.params.id] !== code) return res.status(401).json({ error: "Wrong pharmacy code" });
    next();
  };

  // Pharmacist stock update: toggle in stock and/or change the price.
  app.put("/pharmacies/:id/stock/:medicineId", requirePharmacy, async (req, res, next) => {
    const p = store.pharmacy(req.params.id);
    const m = store.medicine(req.params.medicineId);
    if (!p || !m) return res.status(404).json({ error: "Pharmacy or medicine not found" });
    const { in_stock, price_ugx } = req.body ?? {};
    if (in_stock !== undefined && typeof in_stock !== "boolean") return res.status(400).json({ error: "in_stock must be true or false" });
    if (price_ugx !== undefined && (!Number.isInteger(price_ugx) || price_ugx < 0 || price_ugx > 10_000_000)) {
      return res.status(400).json({ error: "price_ugx must be a whole number of shillings" });
    }
    const existing = store.stockFor(p.id).find((s) => s.medicine_id === m.id);
    if (!existing && price_ugx === undefined) return res.status(400).json({ error: "price_ugx is required when adding a new medicine" });
    const item: StockItem = {
      pharmacy_id: p.id,
      medicine_id: m.id,
      in_stock: in_stock ?? existing?.in_stock ?? true,
      price_ugx: price_ugx ?? existing!.price_ugx,
      updated_at: Math.floor(now().getTime() / 1000),
    };
    store.upsertStock(item);
    let synced = false;
    try {
      if (typesense) { await typesense.upsertDoc("stock", store.toDoc(item)); synced = true; }
    } catch (e) { return next(e); }
    res.json({ ok: true, item, synced });
  });

  // Rebuild Typesense from the demo data. Protected by SYNC_TOKEN when set.
  app.post("/admin/sync", async (req, res, next) => {
    if (opts.syncToken && req.header("x-sync-token") !== opts.syncToken) return res.status(401).json({ error: "Bad sync token" });
    if (!requireTypesense(res)) return;
    try { res.json(await syncAll(typesense!, store)); } catch (e) { next(e); }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.message);
    res.status(502).json({ error: "Search service error", detail: err.message.slice(0, 200) });
  });

  return app;
}
