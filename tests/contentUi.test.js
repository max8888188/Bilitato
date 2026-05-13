import { afterEach, describe, expect, it, vi } from "vitest";
import "../content/contentUi.js";

const ui = globalThis.BilitatoContentUi;

describe("contentUi", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete globalThis.document;
  });

  it("renders bounded skeleton lines", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const html = ui.renderSkeletonLines(9, "demo-skeleton");

    expect(html).toContain("skeleton-block demo-skeleton");
    expect(html.match(/skeleton-line/g)).toHaveLength(5);
    expect(html).toContain("width:58%");
  });

  it("flashes button text and restores it", () => {
    vi.useFakeTimers();
    const button = {
      dataset: {},
      textContent: "复制"
    };

    ui.flashButtonState(button);

    expect(button.textContent).toBe("OK");
    expect(button.dataset.originText).toBe("复制");
    vi.advanceTimersByTime(1000);
    expect(button.textContent).toBe("复制");
  });

  it("creates and updates toast element", () => {
    vi.useFakeTimers();
    const classSet = new Set();
    const toast = {
      className: "",
      textContent: "",
      classList: {
        add: (name) => classSet.add(name),
        remove: (name) => classSet.delete(name)
      }
    };
    const body = { appendChild: vi.fn() };
    globalThis.document = {
      body,
      querySelector: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValue(toast),
      createElement: vi.fn(() => toast)
    };

    ui.showToast("保存成功");

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(body.appendChild).toHaveBeenCalledWith(toast);
    expect(toast.className).toBe("plugin-toast");
    expect(toast.textContent).toBe("保存成功");
    expect(classSet.has("show")).toBe(true);
    vi.advanceTimersByTime(1400);
    expect(classSet.has("show")).toBe(false);
  });
});
