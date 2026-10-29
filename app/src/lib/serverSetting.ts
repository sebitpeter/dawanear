import AsyncStorage from "@react-native-async-storage/async-storage";
import { config, setApiUrl } from "./config";

const KEY = "dawanear.apiUrl";

/** Load a saved Stock API address (if any) when the app starts. */
export async function loadSavedApiUrl() {
  const saved = await AsyncStorage.getItem(KEY).catch(() => null);
  if (saved) setApiUrl(saved);
  return config.apiUrl;
}

export async function saveApiUrl(url: string) {
  setApiUrl(url);
  if (url.trim()) await AsyncStorage.setItem(KEY, config.apiUrl);
  else await AsyncStorage.removeItem(KEY);
  return config.apiUrl;
}

/** Calls GET /health with a short timeout. */
export async function checkApi(url = config.apiUrl, timeoutMs = 5000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/health`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
