// Creates the Typesense collections + synonym set and imports the demo data.
// Run: npm run seed   (reads api/.env)
import "dotenv/config";
import { syncAll } from "../src/lib/sync.js";
import { typesenseFromEnv } from "../src/lib/typesense.js";
import path from "node:path";
import { Store } from "../src/store.js";

const ts = typesenseFromEnv();
if (!ts) {
  console.error("Missing TYPESENSE_HOST / TYPESENSE_API_KEY in api/.env");
  process.exit(1);
}
const result = await syncAll(ts, new Store(process.env.DATA_FILE ?? path.resolve("data/state.json")));
console.log(JSON.stringify(result, null, 2));
