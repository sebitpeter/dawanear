import "dotenv/config";
import path from "node:path";
import { createApp, parseCodes } from "./app.js";
import { typesenseFromEnv } from "./lib/typesense.js";
import { Store } from "./store.js";

const store = new Store(process.env.DATA_FILE ?? path.resolve("data/state.json"));
const typesense = typesenseFromEnv();
const app = createApp({
  store,
  typesense,
  pharmacyCodes: parseCodes(process.env.PHARMACY_CODES),
  syncToken: process.env.SYNC_TOKEN,
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, "0.0.0.0", () => {
  console.log(`DawaNear Stock API on http://localhost:${port} (Typesense ${typesense ? "configured" : "NOT configured"})`);
});
