import { describe, expect, it } from "vitest";
import SubtitleProcessor from "../utils/subtitleProcessor.js";

describe("SubtitleProcessor", () => {
  it("normalizes subtitle text and keeps timestamps", () => {
    const result = SubtitleProcessor.process([
      { from: 0, to: 1, content: "这是第一句。" },
      { from: 2, to: 3, content: "这是第二句！" }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 3 });
    expect(result[0].text).toContain("[0:00] 这是第一句。");
    expect(result[0].text).toContain("[0:02] 这是第二句!");
  });

  it("filters short filler words and interaction prompts", () => {
    const result = SubtitleProcessor.process([
      { from: 0, to: 1, content: "嗯" },
      { from: 2, to: 3, content: "记得点赞关注" },
      { from: 4, to: 5, content: "今天讲一个核心问题" }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].text).toContain("今天讲一个核心问题");
    expect(result[0].text).not.toContain("点赞");
  });

  it("splits blocks when subtitle gaps are large", () => {
    const result = SubtitleProcessor.process([
      { from: 0, to: 1, content: "第一段内容" },
      { from: 10, to: 11, content: "第二段内容" }
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].text).toContain("[0:00]");
    expect(result[1].text).toContain("[0:10]");
  });
});
