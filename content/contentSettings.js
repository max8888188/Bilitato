(function () {
    const TASK_PROMPTS_DEFAULT = {
        summary: `
任务：总结视频核心内容。

要求：
1. 先概括视频主题和核心结论，让用户快速知道视频在讲什么。
2. 再整理视频中的主要观点、关键信息和重要细节。
3. 重点提炼信息，不要逐句复述字幕。
4. 忽略广告、赞助、推广和无关闲聊。
5. 如果字幕存在明显识别错误，可根据上下文合理修正。
6. 使用标准 Markdown 语法输出。
7. 关键标题使用 ### **标题名称** 格式。
8. 详细内容使用无序列表 - 形式展示，确保分点清晰。
`.trim(),
        segments: `
任务：根据字幕内容划分视频章节，并识别广告段落。

要求：
1. 按内容逻辑划分章节，通常为 5–10 个，具体数量可根据视频长度调整。
2. 每个章节需要有：
   - 一个简短清晰的小标题，像视频进度条章节标题
   - 一段精炼的内容概述，概括本段核心信息
3. 章节必须按时间顺序排列，并尽量连续覆盖视频内容，不要出现明显重叠或错序。
   - 但广告段例外：广告的 start 和 end 必须精确对应字幕中推广内容的实际边界，
   - 允许广告段与相邻 content 段之间存在小段空隙，不强求无缝衔接。

广告识别规则：
4. 广告通常具有以下特征：
   - 博主从讲述视频内容转为推荐产品或服务
   - 出现品牌介绍、购买、下载、注册链接、优惠等内容
   - 出现"感谢赞助 / 本期视频由…支持 / 推荐大家试试"
   - 视频主线突然中断，插入与主题无关的推广

5. 广告边界定义：
   - 广告开始：字幕中第一条出现明确产品名、品牌名或购买引导的那一句，以该句时间戳为准。过渡语（如"咱们先缓缓""起来活动活动"）不算广告开始。
   - 广告结束：字幕中第一条重新出现"当事人说""话说回来""好了说回正题"或明确回归故事叙述的那一句，以该句时间戳为准。
   - 广告段内出现的"用户好评""家人推荐""朋友使用体验"等内容，仍属于广告段的一部分，不视为回归主线。

6. 时间戳规则（严格执行）：
   - 输出的 start 和 end 必须直接来自字幕中对应那句话的时间戳，禁止自行估算。
   - 转换方法：[m:ss] 转秒数 = m×60+ss，例如 [6:47] = 6×60+47 = 407。
   - 如果找不到对应句子的精确时间戳，宁可缩小广告区间，不可扩大。

7. 其他规则：
   - 广告段标记为 ad，正常内容标记为 content。
   - 频道介绍、开场白、结尾感谢语不算广告。
   - 如果边界不确定，缩小广告区间，不要过度标记。
`.trim(),
        rumors: `
任务：识别视频中值得核查的重要声明，并评估其可信度。

筛选要求：
1. 只选择对视频核心结论、主要观点或关键判断有明显影响的声明，最多10条。
2. 优先选择反直觉、争议性强、涉及事实判断，或需要验证的重要说法。
3. 忽略广告、情绪表达、主观感受、闲聊和无关描述。

分析要求：
4. 对每个声明进行简要分析，并判断其可信度。
5. 只有在声明涉及需要实时数据才能核查的内容（如当前股价、最新政策、实时事件）时，才标记为 unknown。 
6.对于历史事实、科学结论、可通过已有知识判断的内容，必须给出明确的 real / doubt / fake 判断，不得标记为 unknown。
7. 分析应尽量客观、简洁，不要展开过长论述。
8. 如果字幕存在明显识别错误，可结合上下文做合理理解，但不要凭空补充事实。
`.trim()
    };

    const DEFAULT_PROMPT_SETTINGS = {
        mode: "guided",
        guided: {
            tone: "balanced",
            detail: "normal"
        },
        custom: {
            summary: TASK_PROMPTS_DEFAULT.summary,
            segments: TASK_PROMPTS_DEFAULT.segments,
            rumors: TASK_PROMPTS_DEFAULT.rumors
        }
    };

    function normalizePromptSettingsState(raw) {
        const base = raw && typeof raw === "object" ? raw : {};
        const mode = base.mode === "custom" ? "custom" : "guided";
        const guided = base.guided && typeof base.guided === "object" ? base.guided : {};
        const custom = base.custom && typeof base.custom === "object" ? base.custom : {};
        const tone = ["casual", "balanced", "professional"].includes(String(guided.tone || "")) ? String(guided.tone) : "balanced";
        const detail = ["brief", "normal", "detailed"].includes(String(guided.detail || "")) ? String(guided.detail) : "normal";
        return {
            mode,
            guided: { tone, detail },
            custom: {
                summary: String(custom.summary || TASK_PROMPTS_DEFAULT.summary),
                segments: String(custom.segments || TASK_PROMPTS_DEFAULT.segments),
                rumors: String(custom.rumors || TASK_PROMPTS_DEFAULT.rumors)
            }
        };
    }

    globalThis.BilitatoContentSettings = {
        DEFAULT_PROMPT_SETTINGS,
        TASK_PROMPTS_DEFAULT,
        normalizePromptSettingsState
    };
})();
