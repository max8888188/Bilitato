(function () {
    const utils = globalThis.BilitatoContentUtils || {};
    const getBvidFromUrl = utils.getBvidFromUrl || (() => "");

    function resolveCurrentBvidFromState(state, href) {
        const injectBvid = String(state?.injectBvid || "").trim();
        if (injectBvid) return injectBvid;
        const activeBvid = String(state?.tabState?.activeBvid || "").trim();
        if (activeBvid) return activeBvid;
        return getBvidFromUrl(href || "");
    }

    function resolveCidFromState(state) {
        const candidates = [
            state?.injectCid,
            state?.cache?.cid,
            state?.tabState?.activeCid
        ];
        for (const value of candidates) {
            const cid = Number(value || 0);
            if (Number.isFinite(cid) && cid > 0) return cid;
        }
        return 0;
    }

    function pickSubtitle(subtitles) {
        const list = Array.isArray(subtitles) ? subtitles : [];
        const zh = list.find((item) => /zh|cn|中文/i.test(String(item?.lan || item?.lan_doc || "")));
        return zh || list[0] || null;
    }

    function cleanBilibiliTitle(title) {
        return String(title || "").replace(/_哔哩哔哩_bilibili$/, "").trim();
    }

    function isStorageChangeStateDirty(changes, options = {}) {
        const afterBvid = String(options.afterBvid || "");
        const key = afterBvid ? `cache_${afterBvid}` : "";
        if (options.switched || options.routeMismatch) return true;
        if (changes?.settings?.newValue || changes?.providers?.newValue) return true;
        if (key && changes?.[key]?.newValue) return true;
        const tabKey = String(options.tabKey || "");
        if (tabKey && changes?.[tabKey]?.newValue) return true;
        return false;
    }

    globalThis.BilitatoContentPage = {
        cleanBilibiliTitle,
        isStorageChangeStateDirty,
        pickSubtitle,
        resolveCidFromState,
        resolveCurrentBvidFromState
    };
})();
