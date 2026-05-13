import { describe, expect, it } from "vitest";
import {
  buildGroqQuotaLine,
  buildGroqTranscriptionPrompt,
  formatSecondsZh,
  parseGroqQuotaHeaders,
  parseRetryAfterSeconds
} from "../utils/asrTranscription.js";

describe("asrTranscription helpers", () => {
  it("parses Groq quota headers", () => {
    const headers = new Headers({
      "x-ratelimit-remaining-tokens": "1234",
      "x-ratelimit-remaining-requests": "56",
      "x-ratelimit-reset-tokens": "90"
    });

    expect(parseGroqQuotaHeaders(headers)).toEqual({
      remainingTokens: 1234,
      remainingRequests: 56,
      resetTokensSec: 90
    });
  });

  it("builds a readable quota line", () => {
    expect(buildGroqQuotaLine({
      remainingRequests: 3,
      remainingTokens: 800,
      resetTokensSec: 75
    })).toBe("剩余配额: 3 次 / 800 tokens，Token 重置约 1 分 15 秒");
  });

  it("parses Retry-After values from headers and error bodies", () => {
    expect(parseRetryAfterSeconds("2.2", "")).toBe(3);
    expect(parseRetryAfterSeconds("", '{"retry_after": 8.1}')).toBe(9);
    expect(parseRetryAfterSeconds("", "no retry info")).toBe(0);
  });

  it("formats seconds in Chinese", () => {
    expect(formatSecondsZh(0)).toBe("0 秒");
    expect(formatSecondsZh(9.5)).toBe("9.5 秒");
    expect(formatSecondsZh(75)).toBe("1 分 15 秒");
  });

  it("builds the Groq transcription prompt", () => {
    expect(buildGroqTranscriptionPrompt("任意标题")).toContain("只转写音频里真实说出的中文内容");
  });
});
