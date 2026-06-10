export const DEFAULT_ASR_CHUNK_SECONDS = 600;
export const DEFAULT_ASR_CHUNK_OVERLAP_SECONDS = 4;
export const MIN_ASR_CHUNK_SECONDS = 45;
export const ASR_CHUNK_SIZE_SAFETY_RATIO = 0.72;

export function clampAsrChunkSeconds(value, min = MIN_ASR_CHUNK_SECONDS, max = DEFAULT_ASR_CHUNK_SECONDS) {
    const numeric = Math.floor(Number(value) || 0);
    if (numeric <= 0) return min;
    return Math.max(min, Math.min(max, numeric));
}

export function estimateSafeChunkSeconds(totalBytes, totalDurationSec, maxBytes, options = {}) {
    const safetyRatio = Number(options.safetyRatio || ASR_CHUNK_SIZE_SAFETY_RATIO);
    const fallbackSeconds = clampAsrChunkSeconds(options.fallbackSeconds || DEFAULT_ASR_CHUNK_SECONDS);
    const durationSec = Number(totalDurationSec || 0);
    const bytes = Number(totalBytes || 0);
    const limit = Number(maxBytes || 0);
    if (!(durationSec > 0) || !(bytes > 0) || !(limit > 0)) {
        return fallbackSeconds;
    }
    const bytesPerSecond = bytes / durationSec;
    if (!(bytesPerSecond > 0)) {
        return fallbackSeconds;
    }
    const estimated = Math.floor((limit * safetyRatio) / bytesPerSecond);
    return clampAsrChunkSeconds(estimated, MIN_ASR_CHUNK_SECONDS, fallbackSeconds);
}

export function buildOverlappedChunkPlan(totalDurationSec, chunkDurationSec, overlapSec = DEFAULT_ASR_CHUNK_OVERLAP_SECONDS) {
    const total = Math.max(0, Number(totalDurationSec || 0));
    const chunkSeconds = clampAsrChunkSeconds(chunkDurationSec);
    const overlapSeconds = Math.max(0, Math.min(Number(overlapSec || 0), Math.max(0, chunkSeconds - 1)));
    if (!(total > 0)) return [];
    const plan = [];
    const step = Math.max(1, chunkSeconds - overlapSeconds);
    let start = 0;
    let index = 0;
    while (start < total) {
        const duration = Math.min(chunkSeconds, total - start);
        plan.push({
            index,
            startSec: roundAsrSeconds(start),
            durationSec: roundAsrSeconds(duration),
            endSec: roundAsrSeconds(start + duration)
        });
        if (start + duration >= total) break;
        start += step;
        index += 1;
    }
    return plan;
}

export function mergeTimestampedChunkRows(existingRows, chunkRows, chunkStartSec, overlapSec = DEFAULT_ASR_CHUNK_OVERLAP_SECONDS) {
    const merged = Array.isArray(existingRows) ? [...existingRows] : [];
    const rows = Array.isArray(chunkRows) ? chunkRows : [];
    const startOffset = Number(chunkStartSec || 0);
    const trimThreshold = Math.max(0, Number(overlapSec || 0));
    rows.forEach((row) => {
        const text = String(row?.text || "").trim();
        if (!text) return;
        const rawStart = Number(row?.start);
        const rawEnd = Number(row?.end);
        const start = Number.isFinite(rawStart) ? rawStart : 0;
        const end = Number.isFinite(rawEnd) ? rawEnd : start;
        if (startOffset > 0) {
            if (end <= trimThreshold) return;
        }
        const normalizedStart = startOffset + (startOffset > 0 ? Math.max(start, trimThreshold) : Math.max(0, start));
        const normalizedEnd = startOffset + Math.max(startOffset > 0 ? Math.max(end, trimThreshold) : Math.max(0, end), startOffset > 0 ? Math.max(start, trimThreshold) : Math.max(0, start));
        const last = merged[merged.length - 1];
        if (last && last.text === text && Math.abs(Number(last.end || 0) - normalizedStart) <= 1.5) {
            last.end = Math.max(Number(last.end || 0), normalizedEnd);
            return;
        }
        merged.push({
            start: roundAsrSeconds(normalizedStart),
            end: roundAsrSeconds(Math.max(normalizedStart, normalizedEnd)),
            text,
            index: merged.length
        });
    });
    return merged;
}

export function mergePlaintextChunkRows(existingRows, chunkRows) {
    const merged = Array.isArray(existingRows) ? [...existingRows] : [];
    const incoming = (Array.isArray(chunkRows) ? chunkRows : [])
        .map((row, index) => {
            const text = String(row?.text || "").trim();
            if (!text) return null;
            return {
                start: null,
                end: null,
                text,
                index,
                noTimestamp: true
            };
        })
        .filter(Boolean);
    if (!incoming.length) return merged;
    if (!merged.length) {
        incoming.forEach((row, index) => {
            row.index = index;
        });
        return incoming;
    }
    const maxWindow = Math.min(6, merged.length, incoming.length);
    let overlapCount = 0;
    for (let size = maxWindow; size >= 1; size -= 1) {
        const existingTail = merged.slice(-size).map((row) => normalizeChunkText(row?.text));
        const incomingHead = incoming.slice(0, size).map((row) => normalizeChunkText(row?.text));
        if (existingTail.every((text, index) => text && text === incomingHead[index])) {
            overlapCount = size;
            break;
        }
    }
    const appended = incoming.slice(overlapCount);
    appended.forEach((row) => {
        merged.push({
            start: null,
            end: null,
            text: row.text,
            index: merged.length,
            noTimestamp: true
        });
    });
    return merged;
}

function roundAsrSeconds(value) {
    const numeric = Number(value || 0);
    return Math.round(numeric * 1000) / 1000;
}

function normalizeChunkText(text) {
    return String(text || "")
        .replace(/\s+/g, "")
        .replace(/[。！？!?；;，,、…"'“”‘’（）()【】\[\]《》<>]/g, "")
        .trim()
        .toLowerCase();
}
