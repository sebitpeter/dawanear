import { BUILT_IN_API_URL, config, isValidApiUrl, normalizeApiUrl, setApiUrl } from "../src/lib/config";

describe("server address", () => {
  afterEach(() => setApiUrl(""));

  it("normalizes what people type", () => {
    expect(normalizeApiUrl(" 192.168.1.23:4000/ ")).toBe("http://192.168.1.23:4000");
    expect(normalizeApiUrl("https://dawanear.example.org")).toBe("https://dawanear.example.org");
  });

  it("validates addresses", () => {
    expect(isValidApiUrl("192.168.1.23:4000")).toBe(true);
    expect(isValidApiUrl("not a url")).toBe(false);
  });

  it("switches the API address at runtime and resets to the built-in one", () => {
    setApiUrl("10.0.0.5:4000");
    expect(config.apiUrl).toBe("http://10.0.0.5:4000");
    setApiUrl("");
    expect(config.apiUrl).toBe(BUILT_IN_API_URL);
  });
});
