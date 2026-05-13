import { afterEach, describe, expect, it, vi } from "vitest";
import "../content/contentUtils.js";
import "../content/contentRichText.js";

const rich = globalThis.BilitatoContentRichText;

describe("contentRichText", () => {
  afterEach(() => {
    delete globalThis.MarkdownRenderer;
    vi.restoreAllMocks();
  });

  it("renders plain text blocks with escaped HTML", () => {
    const html = rich.renderRichContent("第一行\n<script>alert(1)</script>");

    expect(html).toContain("rich-text-block");
    expect(html).toContain("第一行<br>&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("detects and renders markdown-like tables", () => {
    const source = [
      "| 名称 | 数量 |",
      "| --- | ---: |",
      "| 苹果 | 3 |"
    ].join("\n");

    const html = rich.renderRichContent(source);

    expect(html).toContain("rich-table");
    expect(html).toContain("<th>名称</th>");
    expect(html).toContain("<td>苹果</td>");
    expect(rich.isTableBlock(source.split("\n"), 0)).toBe(true);
  });

  it("splits table lines", () => {
    expect(rich.splitTableLine("| A | B |")).toEqual(["A", "B"]);
  });

  it("uses MarkdownRenderer when available", () => {
    globalThis.MarkdownRenderer = {
      render: vi.fn(() => "<p>rendered</p>")
    };

    expect(rich.renderRichContent("**hi**")).toBe("<p>rendered</p>");
    expect(globalThis.MarkdownRenderer.render).toHaveBeenCalledWith("**hi**");
  });
});
