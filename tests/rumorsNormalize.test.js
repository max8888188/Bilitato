import { describe, expect, it } from "vitest";
import { normalizeRumors } from "../utils/resultNormalize.js";

describe("normalizeRumors", () => {
  it("normalizes rumor overview and claims", () => {
    const result = normalizeRumors({
      overall_score: "78",
      overview: "整体可信",
      claims: [
        {
          text: "某个说法",
          verdict: "real",
          confidence: "0.8",
          analysis: "理由",
          timestamp: "12"
        }
      ]
    });

    expect(result).toEqual({
      overall_score: 78,
      overview: "整体可信",
      claims: [
        {
          claim: "某个说法",
          verdict: "real",
          confidence: 0.8,
          analysis: "理由",
          timestamp_sec: 12
        }
      ]
    });
  });

  it("uses safe defaults when fields are missing or malformed", () => {
    const result = normalizeRumors({
      overall_score: "不是数字",
      claims: [{ claim: "缺少判断" }]
    });

    expect(result).toEqual({
      overall_score: 0,
      overview: "",
      claims: [
        {
          claim: "缺少判断",
          verdict: "unknown",
          confidence: 0,
          analysis: "",
          timestamp_sec: 0
        }
      ]
    });
  });

  it("returns null for non-object inputs", () => {
    expect(normalizeRumors(null)).toBeNull();
    expect(normalizeRumors("nope")).toBeNull();
  });
});
