(function () {
    function renderSkeletonLines(lineCount, extraClass) {
        const lines = Array.from({ length: Math.max(3, Math.min(5, Number(lineCount) || 4)) }, () => {
            const width = 58 + Math.floor(Math.random() * 39);
            return `<span class="skeleton-line" style="width:${width}%"></span>`;
        }).join("");
        return `<div class="skeleton-block ${extraClass || ""}">${lines}</div>`;
    }

    function flashButtonState(buttonNode) {
        if (!buttonNode) return;
        const origin = buttonNode.dataset.originText || buttonNode.textContent || "";
        buttonNode.dataset.originText = origin;
        buttonNode.textContent = "OK";
        setTimeout(() => {
            buttonNode.textContent = origin;
        }, 1000);
    }

    function showToast(text) {
        let toast = document.querySelector(".plugin-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "plugin-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1400);
    }

    globalThis.BilitatoContentUi = {
        flashButtonState,
        renderSkeletonLines,
        showToast
    };
})();
