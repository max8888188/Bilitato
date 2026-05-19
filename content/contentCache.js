(function () {
    const utils = globalThis.BilitatoContentUtils || {};

    function getTaskCacheSource(cache, task) {
        if (task === "summary") return String(cache?.summaryCacheSource || "").trim().toLowerCase();
        if (task === "segments") return String(cache?.segmentsCacheSource || "").trim().toLowerCase();
        if (task === "rumors") return String(cache?.rumorsCacheSource || "").trim().toLowerCase();
        return "";
    }

    function getTaskModel(cache, task) {
        if (task === "summary") return String(cache?.summaryModel || "").trim();
        if (task === "segments") return String(cache?.segmentsModel || "").trim();
        if (task === "rumors") return String(cache?.rumorsModel || "").trim();
        return "";
    }

    function buildCloudCacheTooltip(cache, tasks) {
        const models = [...new Set((Array.isArray(tasks) ? tasks : []).map((task) => getTaskModel(cache, task)).filter(Boolean))];
        const uploadedAt = (utils.formatUtc8DateTime || (() => ""))(
            cache?.cloudUpdatedAt
            || cache?.updated_at
            || cache?.cloudSyncedAt
            || ""
        );
        const lines = [];
        lines.push("该视频已有云端缓存内容，不消耗调用次数");
        if (models.length) lines.push(`模型: ${models.join(" / ")}`);
        if (uploadedAt) lines.push(`上传: ${uploadedAt}`);
        return lines.join("\n");
    }

    function buildCacheTagHtml(cache, tasks, hasContent, isLoading, isFresh) {
        if (!hasContent || isLoading || isFresh) return "";
        const requestedTasks = Array.isArray(tasks) ? tasks : [];
        const sources = [...new Set(requestedTasks.map((task) => getTaskCacheSource(cache, task)).filter(Boolean))];
        if (!sources.length) {
            return '<span class="cache-tag">本地缓存</span>';
        }
        const tags = [];
        if (sources.includes("local")) tags.push('<span class="cache-tag">本地缓存</span>');
        if (sources.includes("cloud")) {
            const tooltip = buildCloudCacheTooltip(cache, requestedTasks);
            const escapeHtmlAttr = utils.escapeHtmlAttr || ((value) => String(value || ""));
            const tooltipAttr = tooltip ? ` data-tooltip="${escapeHtmlAttr(tooltip)}"` : "";
            tags.push(`<span class="cache-tag cloud-cache-tag"${tooltipAttr}>云端缓存</span>`);
        }
        return tags.join("");
    }

    globalThis.BilitatoContentCache = {
        buildCacheTagHtml,
        buildCloudCacheTooltip,
        getTaskCacheSource,
        getTaskModel
    };
})();
