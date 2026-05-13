export function formatSecondsZh(value) {
    const sec = Number(value || 0);
    if (!Number.isFinite(sec) || sec <= 0) return "0 秒";
    if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0)} 秒`;
    const minutes = Math.floor(sec / 60);
    const remain = Math.round(sec % 60);
    return `${minutes} 分 ${remain} 秒`;
}

export function parseGroqQuotaHeaders(headers) {
    return {
        remainingTokens: Number(headers.get("x-ratelimit-remaining-tokens") || 0),
        remainingRequests: Number(headers.get("x-ratelimit-remaining-requests") || 0),
        resetTokensSec: Number(headers.get("x-ratelimit-reset-tokens") || 0)
    };
}

export function buildGroqQuotaLine(quota) {
    if (!quota) return "";
    const req = Number.isFinite(quota.remainingRequests) ? quota.remainingRequests : 0;
    const tok = Number.isFinite(quota.remainingTokens) ? quota.remainingTokens : 0;
    const reset = Number.isFinite(quota.resetTokensSec) && quota.resetTokensSec > 0 ? `，Token 重置约 ${formatSecondsZh(quota.resetTokensSec)}` : "";
    return `剩余配额: ${req} 次 / ${tok} tokens${reset}`;
}

export function buildGroqTranscriptionPrompt(videoTitle = "") {
    const rawTitle = String(videoTitle || "").trim().replace(/\s+/g, " ");
    const normalizedTitle = rawTitle ? rawTitle.slice(0, 80) : "未知标题";
    void normalizedTitle;
    return `只转写音频里真实说出的中文内容，并输出带时间戳的中文字幕。`.trim();
}

export function parseRetryAfterSeconds(retryHeader, detailText) {
    const direct = Number(String(retryHeader || "").trim());
    if (Number.isFinite(direct) && direct > 0) return Math.ceil(direct);
    const text = String(detailText || "");
    const m = text.match(/retry[_-\s]?after["'\s:]+([0-9.]+)/i);
    if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > 0) return Math.ceil(n);
    }
    return 0;
}
