/**
 * EXPO_PUBLIC_* values are bundled into the app at build time. Only ever put a
 * SEARCH-ONLY Typesense key here, never the admin/write key.
 *
 * The Stock API address can also be changed at runtime (About screen → Server),
 * so one APK works with whatever laptop IP or deployed URL you have on demo day.
 */
export const BUILT_IN_API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000");

export const config = {
  apiUrl: BUILT_IN_API_URL,
  typesenseHost: process.env.EXPO_PUBLIC_TYPESENSE_HOST ?? "",
  typesenseSearchKey: process.env.EXPO_PUBLIC_TYPESENSE_SEARCH_KEY ?? "",
};

/** "192.168.1.23:4000" → "http://192.168.1.23:4000"; trims spaces and trailing slashes. */
export function normalizeApiUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, "");
  if (url && !/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url;
}

export function isValidApiUrl(input: string): boolean {
  try {
    const u = new URL(normalizeApiUrl(input));
    return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** Point the app at another Stock API (empty string = back to the built-in address). */
export function setApiUrl(input: string | null | undefined) {
  config.apiUrl = input ? normalizeApiUrl(input) : BUILT_IN_API_URL;
}

/** Search straight from the phone to Typesense when a search-only key is set; otherwise go through the Stock API. */
export const searchesDirectly = () => Boolean(config.typesenseHost && config.typesenseSearchKey);
