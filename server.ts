import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract user-configured API key
function extractApiKey(provider: string, config?: any): string | undefined {
  if (!config) return undefined;
  if (config.keys && config.keys[provider]) {
    const k = config.keys[provider]?.trim();
    if (k) return k;
  }
  if (config.apiKey) {
    const k = config.apiKey?.trim();
    if (k) return k;
  }
  if (config.customApiKey) {
    const k = config.customApiKey?.trim();
    if (k) return k;
  }
  return undefined;
}

// Helper to get Gemini client lazily, prioritizing user-configured key
function getGeminiClient(userApiKey?: string): GoogleGenAI | null {
  const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Unified client helper for OpenAI-compatible models (DeepSeek, GLM-4, Qwen, Custom)
function getOpenAICompatibleClient(
  provider: 'deepseek' | 'glm' | 'custom',
  customConfig?: any
): { client: OpenAI; model: string; providerName: string; hasKey: boolean } | null {
  const userKey = extractApiKey(provider, customConfig);
  let apiKey = userKey;
  let baseURL = customConfig?.customBaseUrl?.trim() || customConfig?.baseUrl?.trim();
  let model = customConfig?.customModelName?.trim() || customConfig?.modelName?.trim();
  let providerName: string = provider;

  if (provider === 'deepseek') {
    apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    baseURL = baseURL || 'https://api.deepseek.com';
    model = model || 'deepseek-chat';
    providerName = 'DeepSeek-V3';
  } else if (provider === 'glm') {
    apiKey = apiKey || process.env.ZHIPU_API_KEY;
    baseURL = baseURL || 'https://open.bigmodel.cn/api/paas/v4/';
    model = model || 'glm-4-flash';
    providerName = '智谱 GLM-4-Flash';
  } else if (provider === 'custom') {
    apiKey = apiKey || process.env.CUSTOM_AI_KEY || 'dummy-key';
    baseURL = baseURL || process.env.CUSTOM_AI_URL || 'https://api.openai.com/v1';
    model = model || process.env.CUSTOM_AI_MODEL || 'gpt-4o-mini';
    providerName = customConfig?.customModelName || '自定义模型';
  }

  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  return { client, model: model || 'deepseek-chat', providerName, hasKey: Boolean(apiKey) };
}

// Helper to extract clean JSON from LLM outputs
function safeParseJson(raw: string): any {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Strip markdown backticks
    const cleaned = raw
      .replace(/^```(json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Find outermost JSON object or array
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
    }
  }
  return {};
}

// Health & Model Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasDeepSeekKey: Boolean(process.env.DEEPSEEK_API_KEY),
    hasZhipuKey: Boolean(process.env.ZHIPU_API_KEY),
    hasCustomKey: Boolean(process.env.CUSTOM_AI_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ai/models-status', (req, res) => {
  res.json({
    gemini: {
      id: 'gemini',
      name: 'Google Gemini 3.8 Flash',
      available: Boolean(process.env.GEMINI_API_KEY),
      tag: '高智能·多模态',
      cost: '平台内置原生托管',
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek-V3 / R1',
      available: Boolean(process.env.DEEPSEEK_API_KEY),
      tag: '超高性价比·中文逻辑强',
      cost: '约 ¥1~2 / 100万 Tokens',
    },
    glm: {
      id: 'glm',
      name: '智谱 GLM-4-Flash',
      available: Boolean(process.env.ZHIPU_API_KEY),
      tag: '国内合规备案·响应极速',
      cost: '官方个人免费 / 极低成本',
    },
    custom: {
      id: 'custom',
      name: '自定义 OpenAI / OneAPI 接口',
      available: Boolean(process.env.CUSTOM_AI_KEY || process.env.CUSTOM_AI_URL),
      tag: '支持通义千问/Kimi/本地Ollama',
      cost: '按自建/代理端计费',
    },
  });
});

// AI Model Connection Test Endpoint (tests specific key and provider without silent fallback)
app.post('/api/ai/test-connection', async (req, res) => {
  const { provider = 'gemini', modelConfig } = req.body;
  const startTime = Date.now();

  if (provider === 'gemini') {
    const userKey = extractApiKey('gemini', modelConfig);
    const ai = getGeminiClient(userKey);
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: '未配置 Gemini API Key。请填入您的 Google Gemini API Key（以 AIzaSy 开头）或检查系统环境变量。',
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: '请只回复一个单词：OK',
      });
      const latency = Date.now() - startTime;
      const text = response.text?.trim() || 'OK';
      return res.json({
        success: true,
        provider: 'gemini',
        model: 'Google Gemini 3.8 Flash',
        latency,
        isUserKey: Boolean(userKey),
        message: `Gemini 响应正常（耗时 ${latency}ms）：${text}`,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        provider: 'gemini',
        error: `Gemini 校验失败: ${err?.message || 'API Key 无效或无法访问 Google Gemini 服务'}`,
      });
    }
  }

  if (provider === 'deepseek' || provider === 'glm' || provider === 'custom') {
    const userKey = extractApiKey(provider, modelConfig);
    const oai = getOpenAICompatibleClient(provider, modelConfig);
    if (!oai || !oai.hasKey) {
      const hint =
        provider === 'deepseek'
          ? '请先填入您的 DeepSeek API Key (以 sk- 开头)'
          : provider === 'glm'
          ? '请先填入您的智谱 GLM API Key (在开放平台 open.bigmodel.cn 获取)'
          : '请先填入自定义 API Key 和 Base URL';
      return res.status(400).json({ success: false, error: hint });
    }

    try {
      const completion = await oai.client.chat.completions.create({
        model: oai.model,
        messages: [{ role: 'user', content: '请只回复一个单词：OK' }],
        max_tokens: 10,
      });
      const latency = Date.now() - startTime;
      const reply = completion.choices[0]?.message?.content?.trim() || 'OK';
      return res.json({
        success: true,
        provider,
        model: oai.providerName,
        latency,
        isUserKey: Boolean(userKey),
        message: `【${oai.providerName}】验证成功（耗时 ${latency}ms）：${reply}`,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        provider,
        error: `【${oai.providerName}】请求失败: ${err?.message || '请检查 API Key 是否有效'}`,
      });
    }
  }

  return res.status(400).json({ success: false, error: '未知的模型提供商' });
});

// AI Classify, Auto-Tag, and Summarize single thought
app.post('/api/ai/classify-and-summarize', async (req, res) => {
  const { content, title, modelProvider = 'gemini', modelConfig } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: '请提供想法内容' });
  }

  // 1. Try OpenAI-compatible provider if selected (DeepSeek, GLM, Custom)
  if (modelProvider === 'deepseek' || modelProvider === 'glm' || modelProvider === 'custom') {
    const oai = getOpenAICompatibleClient(modelProvider, modelConfig);
    if (oai) {
      try {
        const completion = await oai.client.chat.completions.create({
          model: oai.model,
          messages: [
            {
              role: 'system',
              content: `你是一个微信灵感随手记 AI 助手。请对用户的碎片化想法进行归纳与分析，必须输出严格合法的 JSON 对象，不要包含 markdown 标记以外的杂项文字。
JSON 字段要求：
{
  "title": "10字以内精炼标题",
  "category": "必须从以下选择其一：灵感创意、工作任务、学习笔记、生活日常、密码隐私、财务记账、微信收藏",
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "30字以内的核心一句话总结",
  "keyPoints": ["要点1", "要点2"],
  "isSensitive": true或false(是否含密码/私钥/账号/银行卡等隐私),
  "suggestedAction": "建议后续操作"
}`,
            },
            {
              role: 'user',
              content: `${title ? `标题：${title}\n` : ''}内容：${content}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const rawText = completion.choices[0]?.message?.content || '{}';
        const parsed = safeParseJson(rawText);
        if (parsed.title || parsed.category) {
          return res.json({
            ...parsed,
            mode: modelProvider,
            usedModel: oai.providerName,
          });
        }
      } catch (err: any) {
        console.warn(`[${modelProvider}] API failed, falling back:`, err?.message);
      }
    }
  }

  // 2. Fallback to Gemini
  const geminiUserKey = extractApiKey('gemini', modelConfig);
  const ai = getGeminiClient(geminiUserKey);

  if (!ai) {
    // Intelligent local fallback if API key is not configured yet
    const fallbackCategory = detectFallbackCategory(content);
    const fallbackTags = extractFallbackTags(content);
    const isSensitive = detectSensitivity(content);

    return res.json({
      title: title || generateFallbackTitle(content),
      category: fallbackCategory,
      tags: fallbackTags,
      summary: content.length > 80 ? content.slice(0, 80) + '...' : content,
      keyPoints: [content.slice(0, 40)],
      isSensitive,
      suggestedAction: isSensitive ? '建议启用隐私加密保护' : '可添加至今日待办或灵感库',
      mode: 'heuristic_fallback',
      usedModel: '本地智能规则引擎',
      notice: '未检测到在线模型密钥，已启用本地离线智能归档规则。',
    });
  }

  try {
    const prompt = `请对用户的这条碎片化想法进行深度分析、归档分类与提炼总结。
内容：
${title ? `标题：${title}\n` : ''}${content}

请以纯 JSON 格式返回，包含：
- title: 提炼一个精炼清晰的标题（10字以内）
- category: 最佳分类，必须在以下范围内选择一个：["灵感创意", "工作任务", "学习笔记", "生活日常", "密码隐私", "财务记账", "微信收藏"]
- tags: 2-4个相关标签，以简短中文词汇表示（如 ["方案", "待办", "产品"]）
- summary: 一句话核心总结（30字以内，提纲挈领）
- keyPoints: 提取的要点列表（1-3条）
- isSensitive: 布尔值，是否包含账号、密码、密钥、银行卡、身份证等极度私密敏感信息
- suggestedAction: 建议的后续行动（如 "加密保存"、"设为今日待办"、"深入查阅资料" 等）
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            isSensitive: { type: Type.BOOLEAN },
            suggestedAction: { type: Type.STRING },
          },
          required: ['title', 'category', 'tags', 'summary', 'keyPoints', 'isSensitive'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      mode: 'gemini',
      usedModel: 'Gemini 3.8 Flash',
    });
  } catch (err: any) {
    console.error('Gemini classify error:', err);
    // Graceful fallback on network / API error
    const fallbackCategory = detectFallbackCategory(content);
    return res.json({
      title: title || generateFallbackTitle(content),
      category: fallbackCategory,
      tags: extractFallbackTags(content),
      summary: content.slice(0, 80),
      keyPoints: [content.slice(0, 50)],
      isSensitive: detectSensitivity(content),
      suggestedAction: '保留为草稿',
      mode: 'heuristic_fallback',
      usedModel: '本地智能规则引擎',
      errorNotice: '在线模型调用重试中，已使用本地智能分析。',
    });
  }
});

// AI Daily Digest / Summary across multiple thoughts
app.post('/api/ai/daily-digest', async (req, res) => {
  const { date, thoughts, modelProvider = 'gemini', modelConfig } = req.body;
  if (!Array.isArray(thoughts) || thoughts.length === 0) {
    return res.status(400).json({ error: '暂无可供总结的想法记录' });
  }

  const rawTextList = thoughts
    .map((t: any, i: number) => `[${i + 1}] (${t.category || '未分类'}) ${t.title || ''}: ${t.content || ''}`)
    .join('\n');

  // Try OpenAI-compatible model first if selected
  if (modelProvider === 'deepseek' || modelProvider === 'glm' || modelProvider === 'custom') {
    const oai = getOpenAICompatibleClient(modelProvider, modelConfig);
    if (oai) {
      try {
        const completion = await oai.client.chat.completions.create({
          model: oai.model,
          messages: [
            {
              role: 'system',
              content: `你是一个个人知识与生活复盘专家。请根据用户的想法列表生成每日复盘总结，必须输出严格合法的 JSON 对象，包含：
{
  "headline": "今日主题一句话",
  "overview": "整体复盘综述（100字内）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "actionItems": ["下一步建议清单1", "下一步建议清单2"]
}`,
            },
            {
              role: 'user',
              content: `用户在 ${date || '今天'} 记录的想法列表：\n${rawTextList}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const rawText = completion.choices[0]?.message?.content || '{}';
        const parsed = safeParseJson(rawText);
        if (parsed.headline && parsed.overview) {
          return res.json({
            date: date || new Date().toISOString().split('T')[0],
            ...parsed,
            mode: modelProvider,
            usedModel: oai.providerName,
          });
        }
      } catch (err: any) {
        console.warn(`[${modelProvider}] daily-digest failed:`, err?.message);
      }
    }
  }

  const geminiUserKey = extractApiKey('gemini', modelConfig);
  const ai = getGeminiClient(geminiUserKey);

  if (!ai) {
    return res.json({
      date: date || new Date().toISOString().split('T')[0],
      headline: `今日共记录 ${thoughts.length} 条想法`,
      overview: `记录涵盖了 ${[...new Set(thoughts.map((t: any) => t.category))].filter(Boolean).join('、') || '生活与工作'} 等领域。`,
      highlights: thoughts.slice(0, 3).map((t: any) => t.title || t.content.slice(0, 30)),
      actionItems: ['复盘今日灵感，推进待办任务'],
      mode: 'heuristic_fallback',
      usedModel: '本地启发式规则',
    });
  }

  try {
    const prompt = `你是一个个人知识与生活复盘专家。以下是用户在 ${date || '今天'} 记录的碎片想法列表：
${rawTextList}

请帮用户生成一份结构化且富有洞见的“每日想法总结复盘”：
1. headline: 吸引人的今日主题一句话（如 "灵感充沛的一天：技术攻坚与阅读沉淀"）
2. overview: 整体复盘综述（100字左右，温暖鼓励且有条理）
3. highlights: 3条最重要的亮点灵感或决策
4. actionItems: 从这些想法中自动萃取的下一步建议行动清单（2-4条）
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            overview: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['headline', 'overview', 'highlights', 'actionItems'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      date,
      ...parsed,
      mode: 'gemini',
      usedModel: 'Gemini 3.8 Flash',
    });
  } catch (err: any) {
    console.error('Daily digest error:', err);
    return res.json({
      date: date || new Date().toISOString().split('T')[0],
      headline: `今日记录汇总 (${thoughts.length}条)`,
      overview: '整理了今天的多条灵感与记录。',
      highlights: thoughts.slice(0, 3).map((t: any) => t.title || t.content.slice(0, 30)),
      actionItems: ['查看详细卡片进行归档'],
      mode: 'heuristic_fallback',
      usedModel: '本地启发式规则',
    });
  }
});

// AI WeChat Chat Parser: parses pasted/forwarded WeChat chat logs into thoughts
app.post('/api/ai/parse-wechat-chat', async (req, res) => {
  const { chatContent, modelProvider = 'gemini', modelConfig } = req.body;
  if (!chatContent || typeof chatContent !== 'string') {
    return res.status(400).json({ error: '请提供微信聊天记录文本' });
  }

  // 1. Try OpenAI-compatible provider
  if (modelProvider === 'deepseek' || modelProvider === 'glm' || modelProvider === 'custom') {
    const oai = getOpenAICompatibleClient(modelProvider, modelConfig);
    if (oai) {
      try {
        const completion = await oai.client.chat.completions.create({
          model: oai.model,
          messages: [
            {
              role: 'system',
              content: `用户从微信聊天中复制了一段聊天记录或转发对话。请分析内容提取出有价值的想法、待办、结论或知识点。返回严格的 JSON 对象：
{
  "topic": "核心主题",
  "summary": "50字内对话背景与结论",
  "extractedThoughts": [
    {
      "title": "简短标题",
      "content": "整理后的结构化内容",
      "category": "工作任务 或 灵感创意 或 学习笔记 或 微信收藏",
      "tags": ["标签1", "标签2"],
      "originalSpeakers": ["发言人A"],
      "isTodo": false
    }
  ]
}`,
            },
            {
              role: 'user',
              content: chatContent,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const rawText = completion.choices[0]?.message?.content || '{}';
        const parsed = safeParseJson(rawText);
        if (parsed.extractedThoughts && Array.isArray(parsed.extractedThoughts)) {
          return res.json({
            ...parsed,
            mode: modelProvider,
            usedModel: oai.providerName,
          });
        }
      } catch (err: any) {
        console.warn(`[${modelProvider}] chat parse failed:`, err?.message);
      }
    }
  }

  const geminiUserKey = extractApiKey('gemini', modelConfig);
  const ai = getGeminiClient(geminiUserKey);

  if (!ai) {
    const mockExtracted = [
      {
        title: '微信聊天提取记录',
        content: chatContent.slice(0, 500),
        category: '微信收藏',
        tags: ['微信记录', '交流讨论'],
        senderSummary: '提取自多方聊天记录',
        todos: ['跟进聊天中的约定事宜'],
      },
    ];
    return res.json({
      topic: '微信聊天记录摘录',
      summary: '提取自微信聊天对话',
      extractedThoughts: mockExtracted,
      mode: 'heuristic_fallback',
      usedModel: '本地提取规则',
      notice: '当前采用本地启发式聊天提取。',
    });
  }

  try {
    const prompt = `用户从微信聊天中复制了一段聊天记录或转发对话。请分析该微信聊天内容，提取出具有保留价值的想法、待办事项、讨论结论或重要知识点。
聊天内容如下：
${chatContent}

请返回 JSON：
- topic: 这次对话的核心主题（如 "关于小程序首页改版的讨论"）
- summary: 对话背景与结论总结（50字内）
- extractedThoughts: 提取出的独立想法列表，每个包含：
  - title: 简明标题
  - content: 整理后的内容（剔除寒暄噪音，结构化语言表达）
  - category: 适合放入的分类（如 "工作任务", "灵感创意", "学习笔记", "微信收藏"）
  - tags: 标签数组
  - originalSpeakers: 涉及的关键发言人
  - isTodo: 是否包含待办行动
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            extractedThoughts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  originalSpeakers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  isTodo: { type: Type.BOOLEAN },
                },
                required: ['title', 'content', 'category', 'tags'],
              },
            },
          },
          required: ['topic', 'summary', 'extractedThoughts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      mode: 'gemini',
      usedModel: 'Gemini 3.8 Flash',
    });
  } catch (err: any) {
    console.error('WeChat parse error:', err);
    return res.status(500).json({
      error: '解析微信聊天失败，请稍后重试',
    });
  }
});

// AI Polish / Restructure
app.post('/api/ai/polish', async (req, res) => {
  const { content, style, modelProvider = 'gemini', modelConfig } = req.body;
  if (!content) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const stylePrompt =
    style === 'actionable'
      ? '整理成结构清晰的待办事项与执行计划（分条列出执行步骤和时间节点）'
      : style === 'summary'
      ? '提炼核心要点，去除冗余字句，生成精简干练的便签笔记'
      : '将口语化、碎片化的随想润色为逻辑清晰、表达优雅的书面笔记，保留原意';

  // Try OpenAI-compatible model
  if (modelProvider === 'deepseek' || modelProvider === 'glm' || modelProvider === 'custom') {
    const oai = getOpenAICompatibleClient(modelProvider, modelConfig);
    if (oai) {
      try {
        const completion = await oai.client.chat.completions.create({
          model: oai.model,
          messages: [
            {
              role: 'system',
              content: `你是一个微信灵感笔记润色助手。${stylePrompt}。直接输出润色后的内容，无需客套话。`,
            },
            {
              role: 'user',
              content,
            },
          ],
        });

        const text = completion.choices[0]?.message?.content?.trim();
        if (text) {
          return res.json({
            polished: text,
            mode: modelProvider,
            usedModel: oai.providerName,
          });
        }
      } catch (err: any) {
        console.warn(`[${modelProvider}] polish error:`, err?.message);
      }
    }
  }

  const geminiUserKey = extractApiKey('gemini', modelConfig);
  const ai = getGeminiClient(geminiUserKey);
  if (!ai) {
    return res.json({
      polished: content.trim(),
      mode: 'heuristic_fallback',
      usedModel: '原始文本',
    });
  }

  try {
    const prompt = `请将以下想法内容进行润色与结构化重构。
目标风格：${stylePrompt}

原始内容：
${content}

请直接输出润色后的内容（可保留适当的表情符号和清晰分段），无需多余客套话。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      polished: response.text || content,
      mode: 'gemini',
      usedModel: 'Gemini 3.8 Flash',
    });
  } catch (err) {
    return res.json({
      polished: content,
      mode: 'heuristic_fallback',
    });
  }
});

// Heuristic fallback helper functions
function detectFallbackCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(密码|账号|密保|token|key|secret|pin|cvv|银行卡|私钥|登录)/i.test(lower)) return '密码隐私';
  if (/(微信|群聊|朋友圈|公众号|聊天|转发)/i.test(lower)) return '微信收藏';
  if (/(会议|待办|项目|汇报|排期|上线|bug|需求|客户|发票|预算)/i.test(lower)) return '工作任务';
  if (/(创意|点子|灵感|脑洞|想做|如果|假设|策划)/i.test(lower)) return '灵感创意';
  if (/(学习|笔记|读书|心得|教程|复习|算法|论文)/i.test(lower)) return '学习笔记';
  if (/(支出|收入|花费|买了|账单|转账|元|块钱)/i.test(lower)) return '财务记账';
  return '生活日常';
}

function extractFallbackTags(text: string): string[] {
  const tags: string[] = [];
  if (/(紧急|尽快|今天|明天|deadline)/i.test(text)) tags.push('待办');
  if (/(灵感|想法|思考)/i.test(text)) tags.push('灵感');
  if (/(工作|会议|同事)/i.test(text)) tags.push('工作');
  if (/(密码|安全|私密)/i.test(text)) tags.push('隐私');
  if (/(生活|购物|旅行)/i.test(text)) tags.push('生活');
  if (tags.length === 0) tags.push('随想');
  return tags;
}

function detectSensitivity(text: string): boolean {
  return /(密码|password|passwd|账号|身份证|cvv|卡号|secret|私钥|token|pin码)/i.test(text);
}

function generateFallbackTitle(text: string): string {
  const firstLine = text.trim().split('\n')[0] || '';
  if (firstLine.length <= 15) return firstLine;
  return firstLine.slice(0, 14) + '...';
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeChat Mini Program Thoughts App listening on port ${PORT}`);
  });
}

startServer();
