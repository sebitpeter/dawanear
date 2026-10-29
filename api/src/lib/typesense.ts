// Minimal Typesense REST client using Node's built-in fetch (no extra deps, low memory).
import { SYNONYM_SET, synonymItems } from "../data/synonyms.js";

export interface TypesenseConfig {
  host: string;
  port?: number;
  protocol?: string;
  apiKey: string;
}

type FetchFn = typeof fetch;

export class TypesenseError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export class Typesense {
  private base: string;
  constructor(private cfg: TypesenseConfig, private fetchFn: FetchFn = fetch) {
    this.base = `${cfg.protocol ?? "https"}://${cfg.host}:${cfg.port ?? 443}`;
  }

  async request<T = unknown>(method: string, path: string, body?: unknown, raw = false): Promise<T> {
    const res = await this.fetchFn(this.base + path, {
      method,
      headers: { "X-TYPESENSE-API-KEY": this.cfg.apiKey, "Content-Type": raw ? "text/plain" : "application/json" },
      body: body === undefined ? undefined : raw ? String(body) : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new TypesenseError(res.status, `Typesense ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
    try { return JSON.parse(text) as T; } catch { return text as T; }
  }

  /** Creates a collection, or does nothing if it already exists. */
  async ensureCollection(schema: { name: string }): Promise<"created" | "exists"> {
    try {
      await this.request("POST", "/collections", schema);
      return "created";
    } catch (e) {
      if (e instanceof TypesenseError && e.status === 409) return "exists";
      throw e;
    }
  }

  async upsertSynonyms(): Promise<void> {
    await this.request("PUT", `/synonym_sets/${SYNONYM_SET}`, { items: synonymItems });
  }

  /** Bulk upsert using JSONL import. Returns number of successful docs. */
  async importDocs(collection: string, docs: object[]): Promise<number> {
    if (docs.length === 0) return 0;
    const jsonl = docs.map((d) => JSON.stringify(d)).join("\n");
    const out = await this.request<string>("POST", `/collections/${collection}/documents/import?action=upsert`, jsonl, true);
    const lines = String(out).trim().split("\n").map((l) => JSON.parse(l) as { success: boolean; error?: string });
    const failed = lines.filter((l) => !l.success);
    if (failed.length) throw new Error(`Import into ${collection}: ${failed.length} failed, first error: ${failed[0].error}`);
    return lines.length;
  }

  async upsertDoc(collection: string, doc: object): Promise<void> {
    await this.request("POST", `/collections/${collection}/documents?action=upsert`, doc);
  }

  async search<T = unknown>(collection: string, params: Record<string, string | number | boolean>): Promise<T> {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    return this.request<T>("GET", `/collections/${collection}/documents/search?${qs.toString()}`);
  }
}

export function typesenseFromEnv(env = process.env): Typesense | null {
  if (!env.TYPESENSE_HOST || !env.TYPESENSE_API_KEY) return null;
  return new Typesense({
    host: env.TYPESENSE_HOST,
    port: env.TYPESENSE_PORT ? Number(env.TYPESENSE_PORT) : 443,
    protocol: env.TYPESENSE_PROTOCOL ?? "https",
    apiKey: env.TYPESENSE_API_KEY,
  });
}
