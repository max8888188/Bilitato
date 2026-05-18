import { describe, expect, it } from "vitest";
import "../content/contentUtils.js";
import "../content/contentErrorMessages.js";

const messages = globalThis.BilitatoContentErrorMessages;

describe("contentErrorMessages", () => {
  it("maps http auth errors to settings guidance", () => {
    const view = messages.mapErrorToView({ code: "HTTP_401", message: "API Error 401" });

    expect(view).toMatchObject({
      title: "API Key 无效",
      action: "goto-setup-guide",
      presentation: "modal"
    });
  });

  it("adds ModelScope account binding guidance and retry for auth errors", () => {
    const view = messages.mapErrorToView(
      { code: "HTTP_401", message: "API Error 401" },
      "请求失败",
      { provider: "modelscope" }
    );
    const html = messages.renderErrorPanel(view, "run-summary");

    expect(view.extraMessage).toContain("ModelScope");
    expect(view.extraMessage).toContain("阿里云");
    expect(view.secondaryAction).toBe("retry");
    expect(html).toContain("请务必确保您的 ModelScope 账号已绑定阿里云");
    expect(html).toContain("修改 API");
    expect(html).toContain("https://modelscope.cn/my/settings/account");
    expect(html).toContain("assets/ui/aliyun.png");
    expect(html).toContain("ModelScope 绑定阿里云账号示意");
    expect(html).toContain('data-action="goto-setup-guide"');
    expect(html).toContain('data-action="run-summary"');
  });

  it("maps retryable errors to panel guidance", () => {
    const view = messages.mapErrorToView({ code: "TIMEOUT", message: "timeout" });

    expect(view).toMatchObject({
      title: "请求超时",
      action: "retry",
      presentation: "panel"
    });
  });

  it("maps missing segment output to a retryable format error", () => {
    const view = messages.mapErrorToView({ message: "分段输出缺失" });
    const html = messages.renderErrorPanel(view, "run-summary");

    expect(view).toMatchObject({
      code: "JSON_PARSE_ERROR",
      action: "retry",
      presentation: "panel"
    });
    expect(html).toContain("模型返回格式异常");
    expect(html).toContain('data-action="run-summary"');
  });

  it("adds retry to non-toast setting-style errors", () => {
    const view = messages.mapErrorToView({ code: "HTTP_404", message: "not found" });
    const html = messages.renderErrorPanel(view, "run-summary");

    expect(view.secondaryAction).toBe("retry");
    expect(html).toContain('data-action="goto-setup-guide"');
    expect(html).toContain('data-action="run-summary"');
  });

  it("maps missing subtitles to refresh guidance", () => {
    const view = messages.mapErrorToView({ message: "未获取到视频字幕" });
    const html = messages.renderErrorPanel(view, "run-summary");

    expect(view).toMatchObject({
      code: "SUBTITLE_MISSING",
      title: "请求失败",
      action: "refresh-page",
      presentation: "panel"
    });
    expect(html).toContain("未获取到视频字幕");
    expect(html).toContain('data-action="refresh-page"');
  });

  it("infers http code from raw message", () => {
    expect(messages.inferErrorCode("API Error 503: down")).toBe("HTTP_5XX");
  });

  it("renders error panel with retry action", () => {
    const html = messages.renderErrorPanel(messages.mapErrorToView({ code: "TIMEOUT" }), "run-summary");

    expect(html).toContain("请求超时");
    expect(html).toContain('data-action="run-summary"');
  });
});
