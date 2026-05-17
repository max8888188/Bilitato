export const TASK_PROMPT_FORMAT_RULES = {
    segments: "【技术规范】只输出 JSON 数组，严禁包含任何 Markdown 代码块或解释性文字。格式严格遵守：[{\"start\":数字,\"end\":数字,\"label\":\"字符串\",\"type\":\"content\"|\"ad\"}]。",
    rumors: "【技术规范】只输出 JSON 对象，严禁 Markdown。结构必须包含：{ \"overall_score\": 数字, \"overview\": \"字符串\", \"claims\": [{\"text\":\"内容\",\"timestamp\":数字,\"verdict\":布尔值,\"analysis\":\"原因\"}] }。",
    summary: "【技术规范】输出纯文本，严禁使用 Markdown 格式（如 #, **, > 等符号），严禁输出 JSON。"
};

export const MERGED_SEGMENTS_FORMAT_RULE = `
【分段输出字段规范（必须匹配系统标准）】
SEGMENTS 部分必须输出 JSON 数组，每个对象必须且仅能包含以下字段：
- start: 数字（秒）
- end: 数字（秒，且必须大于 start）
- label: 字符串（章节标题）
- type: "content" 或 "ad"

禁止输出字段：time_start、time_end、start_time、end_time、title、name、summary、content 等。
示例：
[{"start":0,"end":105,"label":"案件引入与背景介绍","type":"content"}]
`.trim();

export const OUTPUT_PROTOCOL = `
【输出协议 - 严格执行】
你必须严格按照以下格式输出，任何偏离都会导致解析失败：

<<<SUMMARY_START>>>
（总结正文，纯文本，不要 JSON 不要 Markdown）
<<<SUMMARY_END>>>

<<<SEGMENTS_START>>>
（分段 JSON 数组，不要任何其他文字）
<<<SEGMENTS_END>>>

禁止：
- 禁止在标签外输出任何解释文字
- 禁止修改标签格式（<<<和>>>必须保留）
- 禁止在 SEGMENTS 部分输出非 JSON 内容
- 禁止省略任何一个标签
`.trim();

export const BASE_PROMPT = `
你是一个中文视频内容分析助手。请基于字幕内容完成分析。
如果字幕中存在明显识别错误，可根据上下文进行合理修正。
忽略无意义重复、口误和噪声内容。
`;

export const TASK_PROMPTS = {
    summary: `
任务：生成一份结构化的视频分析总结。

要求：
1. 先用 2-4 句话概括视频主题、核心观点和整体结论，
让用户快速知道“这个视频主要讲了什么”。

2. 然后提炼视频中的核心内容，
包括：
- 主要观点
- 关键论据
- 重要细节
- 典型案例
- 数据或结论
- 作者态度与倾向（如果明显）

3. 不要逐句复述字幕，
而是重新组织内容，
形成更易阅读的总结。

4. 对长视频：
必须覆盖视频前、中、后期的重要内容，
不要只总结前半部分。

5. 如果视频存在多个主题或章节，
请分点整理。

6. 忽略：
- 广告
- 套话
- 无意义闲聊
- 重复内容
- 点赞关注引导

7. 如果字幕存在明显 ASR 错误，
可根据上下文合理修正。

8. 输出必须具有“信息密度”，
避免空泛总结。

9. 如果 detail 为 detailed：
需要进一步展开：
- 背景逻辑
- 原因分析
- 观点之间的关系
- 可能影响
- 视频隐含结论`,

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
4. 必须覆盖视频全程，不要在视频中途停止分段，字幕中最后出现的内容必须被包含在某个章节内。

广告识别规则：
5. 广告通常具有以下特征：
   - 博主从讲述视频内容转为推荐产品或服务
   - 出现品牌介绍、购买、下载、注册链接、优惠等内容
   - 出现"感谢赞助 / 本期视频由…支持 / 推荐大家试试"
   - 视频主线突然中断，插入与主题无关的推广

6. 广告边界定义：
   - 广告开始：字幕中第一条出现明确产品名、品牌名或购买引导的那一句，以该句时间戳为准。过渡语（如"咱们先缓缓""起来活动活动"）不算广告开始。
   - 广告结束：字幕中第一条重新出现"当事人说""话说回来""好了说回正题"或明确回归故事叙述的那一句，以该句时间戳为准。
   - 广告段内出现的"用户好评""家人推荐""朋友使用体验"等内容，仍属于广告段的一部分，不视为回归主线。

7. 时间戳规则（严格执行）：
   - 输出的 start 和 end 必须直接来自字幕中对应那句话的时间戳，禁止自行估算。
   - 转换方法：[m:ss] 转秒数 = m×60+ss，例如 [6:47] = 6×60+47 = 407。
   - 如果找不到对应句子的精确时间戳，宁可缩小广告区间，不可扩大。

8. 其他规则：
   - 广告段标记为 ad，正常内容标记为 content。
   - 频道介绍、开场白、结尾感谢语不算广告。
   - 如果边界不确定，缩小广告区间，不要过度标记。
`,
    rumors: `
任务：识别视频中值得核查的重要声明，并评估其可信度。

筛选要求：
1. 只选择对视频核心结论、主要观点或关键判断有明显影响的声明。
2. 优先选择反直觉、争议性强、涉及事实判断，或需要验证的重要说法。
3. 忽略广告、情绪表达、主观感受、闲聊和无关描述。

分析要求：
4. 对每个声明进行简要分析，并判断其可信度。
5. 如果内容依赖实时信息、外部事实或当前无法确认的信息，可标记为 unknown。
6. 分析应尽量客观、简洁，不要展开过长论述。
7. 如果字幕存在明显识别错误，可结合上下文做合理理解，但不要凭空补充事实。
`
};

export const TONE_PROMPTS = {
    casual: `
表达更自然轻松，
允许更口语化，
像在向朋友解释视频内容。
但不要降低信息密度。
`,

    balanced: `
输出风格清晰自然，
兼顾可读性与信息密度。
    
要求：
- 不要过度简写
- 不要只给结论
- 需要保留主要观点和关键细节
- 用自然易读的方式组织内容
- 避免过于学术化
- 避免过于口语化
- 更像高质量内容平台的编辑总结
`,

    professional: `
使用更专业、分析化、报告式表达。
要求：
- 优先使用清晰结构
- 避免口语化感叹
- 强调逻辑关系
- 强调因果与影响
- 不要像聊天
- 更像行业分析/研究摘要
`
};

export const DETAIL_PROMPTS = {
    brief: `
输出长度控制：
- 尽量压缩篇幅
- 使用简洁表达
- 只保留最核心结论
- 总长度尽量控制较短
`,
    normal: `
输出长度控制：
- 保持适中信息密度
- 覆盖主要观点与关键细节
- 不需要展开所有例子
- 保持较强可读性
`,
    detailed: `
输出长度控制：
- 充分展开视频核心内容
- 不要只写结论
- 需要解释：
  - 为什么
  - 怎么发生
  - 有哪些影响
  - 不同观点之间的关系
- 长视频需要覆盖前中后期内容
- 尽量保留关键案例、细节与逻辑链
- 信息密度优先，不怕稍长
`
};

export const DEFAULT_PROMPT_SETTINGS = {
    mode: "guided",
    guided: {
        tone: "balanced",
        detail: "normal"
    },
    custom: {
        summary: TASK_PROMPTS.summary,
        segments: TASK_PROMPTS.segments,
        rumors: TASK_PROMPTS.rumors
    }
};

export function normalizePromptSettings(raw) {
    const base = raw && typeof raw === "object" ? raw : {};
    const mode = base.mode === "custom" ? "custom" : "guided";
    const guidedRaw = base.guided && typeof base.guided === "object" ? base.guided : {};
    const customRaw = base.custom && typeof base.custom === "object" ? base.custom : {};
    const tone = Object.prototype.hasOwnProperty.call(TONE_PROMPTS, guidedRaw.tone) ? guidedRaw.tone : "balanced";
    const detail = Object.prototype.hasOwnProperty.call(DETAIL_PROMPTS, guidedRaw.detail) ? guidedRaw.detail : "normal";
    return {
        mode,
        guided: { tone, detail },
        custom: {
            summary: String(customRaw.summary || TASK_PROMPTS.summary),
            segments: String(customRaw.segments || TASK_PROMPTS.segments),
            rumors: String(customRaw.rumors || TASK_PROMPTS.rumors)
        }
    };
}

export function formatDurationAsClock(totalSeconds) {
    const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function resolveDurationPromptContext(taskContext) {
    const totalSeconds = Number(taskContext?.videoDuration?.totalSeconds || 0);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const normalizedSec = Math.floor(totalSeconds);
    const formattedTime = String(taskContext?.videoDuration?.formattedTime || "").trim() || formatDurationAsClock(normalizedSec);
    return { totalSeconds: normalizedSec, formattedTime };
}

export function buildVideoMetaBlock(taskContext) {
    const info = resolveDurationPromptContext(taskContext);
    if (!info) return "";
    return `【视频元数据】\n视频总时长为 ${info.totalSeconds} 秒 (${info.formattedTime})。`;
}

export function buildDurationHardRule(taskContext) {
    const info = resolveDurationPromptContext(taskContext);
    if (!info) return "";
    const lastSegmentStart = Math.floor(info.totalSeconds * 0.75);
    return `核心强制：视频总时长 ${info.totalSeconds} 秒（${info.formattedTime}），最后一个章节的 start 必须大于 ${lastSegmentStart} 秒，确保视频后半段内容（包括结局）不被遗漏。章节时间戳必须直接来自字幕，禁止估算。请根据总时长将章节控制为 6-8 个并尽量均衡分布。`;
}

export function buildPrompt({
    type,
    subtitle,
    mode = "guided",
    guided = {},
    customPrompts = {},
    taskContext = {}
}) {
    const formatRule = TASK_PROMPT_FORMAT_RULES[type] || "";
    const videoMetaBlock = buildVideoMetaBlock(taskContext);
    const durationHardRule = type === "segments" ? buildDurationHardRule(taskContext) : "";
    const subtitleBlock = `【字幕内容】\n${subtitle}`.trim();
    if (mode === "custom") {
        const userPrompt = customPrompts[type] || TASK_PROMPTS[type] || "";
        return [
            BASE_PROMPT,
            userPrompt,
            durationHardRule,
            videoMetaBlock,
            subtitleBlock,
            formatRule
        ].filter(Boolean).join("\n\n");
    }
    const toneRule = TONE_PROMPTS[guided.tone || "balanced"] || "";
    const detailRule = DETAIL_PROMPTS[guided.detail || "normal"] || "";
    return [
        BASE_PROMPT,
        TASK_PROMPTS[type],
        "【输出风格要求】",
        toneRule,
        detailRule,
        durationHardRule,
        videoMetaBlock,
        subtitleBlock,
        formatRule
    ].filter(Boolean).join("\n\n");
}

export function buildMergedSummarySegmentsPrompt({
    subtitle,
    mode = "guided",
    guided = {},
    customPrompts = {},
    taskContext = {}
}) {
    const videoMetaBlock = buildVideoMetaBlock(taskContext);
    const durationHardRule = buildDurationHardRule(taskContext);
    const subtitleBlock = `【字幕内容】\n${subtitle}`.trim();
    const summaryPrompt = mode === "custom"
        ? (customPrompts.summary || TASK_PROMPTS.summary || "")
        : (TASK_PROMPTS.summary || "");
    const segmentsPrompt = mode === "custom"
        ? (customPrompts.segments || TASK_PROMPTS.segments || "")
        : (TASK_PROMPTS.segments || "");
    const parts = [BASE_PROMPT];
    if (mode !== "custom") {
        const toneRule = TONE_PROMPTS[guided.tone || "balanced"] || "";
        const detailRule = DETAIL_PROMPTS[guided.detail || "normal"] || "";
        parts.push("【输出风格要求】", toneRule, detailRule);
    }
    parts.push("【任务1：视频总结】", summaryPrompt);
    parts.push("【任务2：视频分段】", segmentsPrompt, durationHardRule);
    parts.push(MERGED_SEGMENTS_FORMAT_RULE);
    parts.push(videoMetaBlock);
    parts.push(subtitleBlock);
    parts.push(OUTPUT_PROTOCOL);
    return parts.filter(Boolean).join("\n\n");
}

export function extractProtocolSection(text, startTag, endTag) {
    const source = String(text || "");
    const startIndex = source.indexOf(startTag);
    if (startIndex < 0) {
        return { found: false, content: "" };
    }
    const contentStart = startIndex + startTag.length;
    const endIndex = source.indexOf(endTag, contentStart);
    if (endIndex < 0) {
        return { found: false, content: "" };
    }
    return {
        found: true,
        content: source.slice(contentStart, endIndex).trim()
    };
}

export function extractFirstProtocolSection(text, tags) {
    const list = Array.isArray(tags) ? tags : [];
    for (const pair of list) {
        const startTag = pair?.[0];
        const endTag = pair?.[1];
        if (!startTag || !endTag) continue;
        const section = extractProtocolSection(text, startTag, endTag);
        if (section.found) return section;
    }
    return null;
}
