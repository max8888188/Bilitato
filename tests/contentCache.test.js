import { describe, expect, it } from "vitest";
import "../content/contentUtils.js";
import "../content/contentCache.js";

const cacheUi = globalThis.BilitatoContentCache;

describe("contentCache", () => {
  it("reads task cache sources and models", () => {
    const cache = {
      summaryCacheSource: "Cloud",
      summaryModel: "gpt-test"
    };

    expect(cacheUi.getTaskCacheSource(cache, "summary")).toBe("cloud");
    expect(cacheUi.getTaskModel(cache, "summary")).toBe("gpt-test");
    expect(cacheUi.getTaskCacheSource(cache, "unknown")).toBe("");
  });

  it("renders local cache tag when source is missing", () => {
    expect(cacheUi.buildCacheTagHtml({}, ["summary"], true, false, false)).toBe('<span class="cache-tag">本地缓存</span>');
  });

  it("renders cloud cache tag with model and upload tooltip", () => {
    const html = cacheUi.buildCacheTagHtml({
      summaryCacheSource: "cloud",
      summaryModel: "gpt-test",
      cloudUpdatedAt: "2026-05-12T00:00:00.000Z"
    }, ["summary"], true, false, false);

    expect(html).toContain("cloud-cache-tag");
    expect(html).toContain("云端缓存");
    expect(html).toContain("模型: gpt-test");
    expect(html).toContain("上传: 2026-05-12 08:00:00 UTC+8");
  });

  it("hides tags while loading, fresh, or empty", () => {
    expect(cacheUi.buildCacheTagHtml({}, ["summary"], false, false, false)).toBe("");
    expect(cacheUi.buildCacheTagHtml({}, ["summary"], true, true, false)).toBe("");
    expect(cacheUi.buildCacheTagHtml({}, ["summary"], true, false, true)).toBe("");
  });
});
