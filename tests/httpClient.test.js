import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../utils/httpClient.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("httpClient", () => {
  it("parses json responses", async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await requestJson("https://example.com/api");

    expect(result.data).toEqual({ ok: true });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("throws normalized http errors", async () => {
    globalThis.fetch = vi.fn(async () => new Response("missing", { status: 404 }));

    await expect(requestJson("https://example.com/api", { requestName: "test_request" }))
      .rejects
      .toMatchObject({ code: "HTTP_404", status: 404, requestName: "test_request" });
  });

  it("throws json parse errors", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{bad", { status: 200 }));

    await expect(requestJson("https://example.com/api"))
      .rejects
      .toMatchObject({ code: "JSON_PARSE_ERROR" });
  });
});
