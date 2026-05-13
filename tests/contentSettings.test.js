import { describe, expect, it } from "vitest";
import "../content/contentSettings.js";

const settings = globalThis.BilitatoContentSettings;

describe("contentSettings", () => {
  it("exposes default prompt settings", () => {
    expect(settings.DEFAULT_PROMPT_SETTINGS.mode).toBe("guided");
    expect(settings.TASK_PROMPTS_DEFAULT.summary).toContain("总结视频核心内容");
    expect(settings.TASK_PROMPTS_DEFAULT.segments).toContain("广告识别规则");
    expect(settings.TASK_PROMPTS_DEFAULT.rumors).toContain("值得核查");
  });

  it("normalizes invalid guided settings", () => {
    expect(settings.normalizePromptSettingsState({
      mode: "invalid",
      guided: { tone: "weird", detail: "too-much" }
    })).toMatchObject({
      mode: "guided",
      guided: { tone: "balanced", detail: "normal" }
    });
  });

  it("keeps custom prompts when custom mode is selected", () => {
    const result = settings.normalizePromptSettingsState({
      mode: "custom",
      guided: { tone: "casual", detail: "brief" },
      custom: {
        summary: "自定义总结",
        segments: "自定义分段",
        rumors: "自定义验真"
      }
    });

    expect(result).toEqual({
      mode: "custom",
      guided: { tone: "casual", detail: "brief" },
      custom: {
        summary: "自定义总结",
        segments: "自定义分段",
        rumors: "自定义验真"
      }
    });
  });
});
