// content/contentReleaseNotice.js

(function () {
  const STORAGE_KEY = "bilitato_last_seen_version";

  const RELEASE_NOTES = {
    "1.2.2": {
      title: "Bilitato 已更新至 v1.2.2",
      subtitle: "本次重点优化新手体验、总结模式和云端缓存提示。",
      highlights: [
        {
          tag: "新增",
          title: "新手引导预览",
          desc: "新增第三步预览效果，无需先配置 API Key，也能查看已有云端缓存的视频总结。",
        },
        {
          tag: "优化",
          title: "高速/省流模式",
          desc: "默认使用高速模式，总结支持流式展示；省流模式保留 1 次调用生成总结和分段。",
        },
        {
          tag: "体验",
          title: "设置与缓存提示",
          desc: "设置页改为自动保存提示，API Key 可显示明文并自动清理首尾空格，云端缓存会提示不消耗调用次数。",
        },
        
      ],
      privacy: "本插件不会上传任何API Key、Prompt或您和AI的聊天内容。",
    },
    "1.2.0": {
      title: "Bilitato 已更新至 v1.2.0",
      subtitle: "本次重点优化转录、下载与稳定性。",
      highlights: [
        {
          tag: "新增",
          title: "SiliconFlow转录支持",
          desc: "支持无需翻墙的FunAudioLLM/SenseVoiceSmall大模型（无法生成时间戳，但不影响总结）",
        },
        {
          tag: "优化",
          title: "视频/音频下载更稳定",
          desc: "重做下载方式，减少 403、下载失败、下载成网页文件等问题。",
        },
        {
          tag: "修复",
          title: "音频转录修复",
          desc: "修复无字幕视频音频转录可能会出现字幕串线的问题。",
        },
      ],
      privacy: "本插件不会上传任何API Key、Prompt或您和AI的聊天内容。",
    },
  };

  function getCurrentVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch {
      return "";
    }
  }

  function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result?.[key]);
      });
    });
  }

  function storageSet(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function shouldShowReleaseNotice(version = getCurrentVersion()) {
    if (!version || !RELEASE_NOTES[version]) return false;

    const lastSeenVersion = await storageGet(STORAGE_KEY);
    return lastSeenVersion !== version;
  }

  async function markReleaseNoticeSeen(version = getCurrentVersion()) {
    if (!version) return;

    await storageSet({
      [STORAGE_KEY]: version,
    });
  }

  function renderReleaseNotice({ root, version = getCurrentVersion() }) {
    if (!root) return false;

    const note = RELEASE_NOTES[version];
    if (!note) return false;
    const pageVersions = [version, "1.2.0"].filter((item, index, arr) => item && RELEASE_NOTES[item] && arr.indexOf(item) === index);

    const box = root.querySelector(".ai-summary-plugin-box");
    if (!box) return false;

    box.querySelector(".release-notice-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.className = "release-notice-overlay";

    overlay.innerHTML = `
      <div class="release-notice-card" role="dialog" aria-modal="true">
        <button class="release-notice-close" type="button" title="关闭">×</button>
        <div class="release-notice-content"></div>
        <div class="release-notice-pager"></div>
        <div class="release-notice-actions">
          <button class="release-notice-secondary" type="button">
            稍后再看
          </button>
          <button class="release-notice-primary" type="button">
            我知道了
          </button>
        </div>
      </div>
    `;

    let pageIndex = 0;
    const renderPage = () => {
      const pageVersion = pageVersions[pageIndex] || version;
      const pageNote = RELEASE_NOTES[pageVersion] || note;
      const content = overlay.querySelector(".release-notice-content");
      const pager = overlay.querySelector(".release-notice-pager");
      if (content) {
        content.innerHTML = `
          <div class="release-notice-top">
            <span class="release-notice-badge">更新说明</span>
            <span class="release-notice-version">v${escapeHtml(pageVersion)}</span>
          </div>

          <div class="release-notice-title">${escapeHtml(pageNote.title)}</div>
          <div class="release-notice-subtitle">${escapeHtml(pageNote.subtitle)}</div>

          <div class="release-notice-list">
            ${pageNote.highlights
              .map(
                (item) => `
                  <div class="release-notice-item">
                    <span class="release-notice-item-tag">${escapeHtml(item.tag)}</span>
                    <div class="release-notice-item-main">
                      <div class="release-notice-item-title">${escapeHtml(item.title)}</div>
                      <div class="release-notice-item-desc">${escapeHtml(item.desc)}</div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="release-notice-privacy">
            ${escapeHtml(pageNote.privacy)}
          </div>
        `;
      }
      if (pager) {
        pager.innerHTML = pageVersions.length > 1 ? `
          <button class="release-notice-page-btn" type="button" data-release-page="prev" ${pageIndex === 0 ? "disabled" : ""}>上一页</button>
          <span class="release-notice-page-count">${pageIndex + 1} / ${pageVersions.length}</span>
          <button class="release-notice-page-btn" type="button" data-release-page="next" ${pageIndex >= pageVersions.length - 1 ? "disabled" : ""}>下一页</button>
        ` : "";
      }
    };
    renderPage();

    const closeAndMarkSeen = async () => {
      await markReleaseNoticeSeen(version);
      overlay.remove();
    };

    const closeOnly = () => {
      overlay.remove();
    };

    overlay
      .querySelector(".release-notice-close")
      ?.addEventListener("click", closeAndMarkSeen);

    overlay
      .querySelector(".release-notice-primary")
      ?.addEventListener("click", closeAndMarkSeen);

    overlay
      .querySelector(".release-notice-secondary")
      ?.addEventListener("click", closeOnly);

    overlay.addEventListener("click", (event) => {
      const pageButton = event.target.closest?.("[data-release-page]");
      if (!pageButton) return;
      const direction = pageButton.dataset.releasePage;
      if (direction === "prev") pageIndex = Math.max(0, pageIndex - 1);
      if (direction === "next") pageIndex = Math.min(pageVersions.length - 1, pageIndex + 1);
      renderPage();
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeOnly();
    });

    box.appendChild(overlay);
    return true;
  }

  async function maybeShowReleaseNotice({ root, version = getCurrentVersion() }) {
    const shouldShow = await shouldShowReleaseNotice(version);
    if (!shouldShow) return false;

    return renderReleaseNotice({ root, version });
  }

  globalThis.BilitatoReleaseNotice = {
    RELEASE_NOTES,
    shouldShowReleaseNotice,
    markReleaseNoticeSeen,
    renderReleaseNotice,
    maybeShowReleaseNotice,
  };
})();
