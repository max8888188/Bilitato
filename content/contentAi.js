(function () {
    function buildTasksProgressTaskId(tasks) {
        const list = Array.isArray(tasks) ? tasks.map((item) => String(item || "").trim()).filter(Boolean) : [];
        return `tasks:${list.sort().join(",") || "unknown"}`;
    }

    function buildChatProgressTaskId(messageId) {
        return `chat:${String(messageId || "unknown")}`;
    }

    function needsSubtitleForTasks(tasks) {
        const list = Array.isArray(tasks) ? tasks : [];
        return list.includes("summary") || list.includes("segments");
    }

    function canRunTasksWithCache(tasks, currentBvid, cache) {
        if (!needsSubtitleForTasks(tasks)) return true;
        const hasSubtitle = Array.isArray(cache?.rawSubtitle) && cache.rawSubtitle.length > 0;
        return !!currentBvid && cache?.bvid === currentBvid && hasSubtitle;
    }

    function createChatMessageId(now = Date.now(), randomText = Math.random().toString(36)) {
        return `${now}_${String(randomText || "").slice(2, 8)}`;
    }

    function createPendingChatMessages(text, messageId, createdAt = Date.now()) {
        return [
            { id: `u_${messageId}`, role: "user", content: text, status: "done", createdAt },
            { id: `a_${messageId}`, role: "assistant", content: "", metrics: null, status: "loading", messageId, createdAt }
        ];
    }

    globalThis.BilitatoContentAi = {
        buildChatProgressTaskId,
        buildTasksProgressTaskId,
        canRunTasksWithCache,
        createChatMessageId,
        createPendingChatMessages,
        needsSubtitleForTasks
    };
})();
