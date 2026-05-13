(function () {
    const utils = globalThis.BilitatoContentUtils || {};
    const escapeHtml = utils.escapeHtml || ((value) => String(value || ""));

    function renderRichContent(text) {
        const markdownRenderer = globalThis.MarkdownRenderer;
        if (markdownRenderer && typeof markdownRenderer.render === "function") {
            const html = markdownRenderer.render(text || "");
            if (html) return html;
        }
        const lines = String(text || "").split(/\r?\n/);
        const chunks = [];
        let index = 0;
        while (index < lines.length) {
            if (isTableBlock(lines, index)) {
                const header = splitTableLine(lines[index]);
                index += 2;
                const rows = [];
                while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
                    rows.push(splitTableLine(lines[index]));
                    index += 1;
                }
                chunks.push(renderHtmlTable(header, rows));
                continue;
            }
            const block = [];
            while (index < lines.length && !isTableBlock(lines, index)) {
                block.push(lines[index]);
                index += 1;
            }
            const textBlock = block.join("\n").trim();
            if (textBlock) chunks.push(`<div class="rich-text-block">${escapeHtml(textBlock).replace(/\n/g, "<br>")}</div>`);
        }
        return chunks.join("");
    }

    function isTableBlock(lines, index) {
        if (index < 0 || index + 1 >= lines.length) return false;
        return /^\s*\|.*\|\s*$/.test(lines[index]) && /^\s*\|?[\s:\-|\u3000]+\|?\s*$/.test(lines[index + 1]);
    }

    function splitTableLine(line) {
        return String(line || "")
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => String(cell || "").trim());
    }

    function renderHtmlTable(header, rows) {
        const headHtml = header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("");
        const bodyHtml = rows.map((row) => {
            const cells = header.map((_, idx) => `<td>${escapeHtml(row[idx] || "")}</td>`).join("");
            return `<tr>${cells}</tr>`;
        }).join("");
        return `<div class="rich-table-wrap"><table class="rich-table"><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
    }

    globalThis.BilitatoContentRichText = {
        isTableBlock,
        renderHtmlTable,
        renderRichContent,
        splitTableLine
    };
})();
