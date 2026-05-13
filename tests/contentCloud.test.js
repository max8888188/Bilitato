import { describe, expect, it } from "vitest";
import "../content/contentUtils.js";
import "../content/contentCloud.js";

const cloud = globalThis.BilitatoContentCloud;

describe("contentCloud", () => {
  it("detects complete cloud cache content", () => {
    const cache = {
      rawSubtitle: [{ text: "字幕" }],
      summary: "总结",
      rumors: { claims: [{ text: "说法" }] }
    };

    expect(cloud.hasSubtitle(cache)).toBe(true);
    expect(cloud.hasSummary(cache)).toBe(true);
    expect(cloud.hasRumors(cache)).toBe(true);
  });

  it("does not read cloud again after a request finished for same video", () => {
    expect(cloud.shouldAttemptCloudReadForVideo({}, { bvid: "bv1abc", status: "failed" }, "BV1ABC")).toBe(false);
    expect(cloud.shouldAttemptCloudReadForVideo({}, { bvid: "bv1abc", status: "idle" }, "BV1ABC")).toBe(true);
  });

  it("reads cloud for summary page only when summary data is missing", () => {
    expect(cloud.shouldAttemptCloudReadForPage({}, {}, "BV1", "summary")).toBe(true);
    expect(cloud.shouldAttemptCloudReadForPage({ summary: "已有总结" }, {}, "BV1", "summary")).toBe(false);
    expect(cloud.shouldAttemptCloudReadForPage({}, {}, "BV1", "CC")).toBe(false);
  });

  it("creates normalized cloud read state", () => {
    expect(cloud.createCloudReadState("bv1abc", "loading", 2, 100)).toEqual({
      bvid: "bv1abc",
      status: "loading",
      requestId: 2,
      startedAt: 100
    });
  });
});
