import { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
  HelpCircle,
  Users,
  Calendar,
  Layers,
  Check,
  Bot,
} from 'lucide-react';
import { ThoughtItem, WeChatParsedItem, AIModelConfig } from '../types';

interface WeChatChatImporterProps {
  onAddThoughts: (newThoughts: Partial<ThoughtItem>[]) => void;
  onNavigateToThoughts: () => void;
  modelConfig?: AIModelConfig;
  onOpenModelSelector?: () => void;
}

const PRESET_CHATS = [
  {
    name: '💻 产品与研发讨论群',
    desc: '包含系统架构、加密方案和发布排期讨论',
    text: `[产品-林经理 14:20] 各位，本周重点是把微信小程序随手记发布上线，大家看下需求点：
1. 必须支持碎片想法秒级录入，特别是语音一键录入；
2. 接入大模型，对杂乱的想法进行智能分类、打标签和每日总结；
3. 用户如果在微信聊天里看到好内容，长按复制或者转发，能直接在小程序里解析归档。

[前端-小赵 14:23] 收到！微信聊天内容复制后粘贴，我们通过大模型过滤寒暄，提取成待办和想法卡片。
另外关于密码等私密信息，我们端侧采用了 AES-GCM 256 位加密，不存明文，绝对安全。

[测试-小周 14:26] 建议明天下午3点准时封版提测，测试用例已经覆盖了无网络本地缓存和断网重试。

[产品-林经理 14:28] 赞！那明天下午3点准时见。`,
  },
  {
    name: '☕ 读书与灵感交流群',
    desc: '探讨认知提升与效率工具书摘',
    text: `[书友-云飞 09:15] 刚读完《卡片笔记写作法》，强烈建议大家碎片化记录想法时，不要预设固定的死板分类，而要多用标签连接。
[书友-若兰 09:18] 确实！传统的文件夹很容易把想法埋葬，而大模型可以根据语义关联把上周的想法和今天的灵感串联起来。
[书友-云飞 09:22] 记住核心公式：闪念笔记（及时捕获） -> 文献笔记（提炼理解） -> 永久笔记（构建网络）。`,
  },
  {
    name: '🛒 家庭生活杂货采购备忘',
    desc: '日常采买与家庭杂务清单',
    text: `[妈妈 17:30] 周末去超市记得买：两袋低筋面粉、一盒黄油、两斤排骨、还有洗衣液。
[爸爸 17:32] 收到，顺便把小区的物业管理费交一下，截止日期是后天。
[妈妈 17:35] 还有下周三晚上7点家庭聚餐，定在西湖春天，别忘记提前订包厢。`,
  },
];

export function WeChatChatImporter({
  onAddThoughts,
  onNavigateToThoughts,
  modelConfig = { provider: 'gemini' },
  onOpenModelSelector,
}: WeChatChatImporterProps) {
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedTopic, setExtractedTopic] = useState('');
  const [extractedSummary, setExtractedSummary] = useState('');
  const [parsedItems, setParsedItems] = useState<WeChatParsedItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const handleApplyPreset = (text: string) => {
    setChatInput(text);
    setParsedItems([]);
    setHasSaved(false);
  };

  const handleParseChat = async () => {
    if (!chatInput.trim()) return;
    setIsLoading(true);
    setHasSaved(false);

    try {
      const res = await fetch('/api/ai/parse-wechat-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatContent: chatInput,
          modelProvider: modelConfig?.provider || 'gemini',
          modelConfig,
        }),
      });
      const data = await res.json();

      setExtractedTopic(data.topic || '微信聊天提炼');
      setExtractedSummary(data.summary || '');
      const items = data.extractedThoughts || [];
      setParsedItems(items);
      // Select all by default
      setSelectedIndices(items.map((_: any, i: number) => i));
    } catch (e) {
      alert('解析失败，请检查网络后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const handleSaveToThoughts = () => {
    if (selectedIndices.length === 0) return;
    const toSave: Partial<ThoughtItem>[] = selectedIndices.map((idx) => {
      const item = parsedItems[idx];
      return {
        title: item.title,
        content: item.content,
        category: item.category || '微信收藏',
        tags: item.tags || ['微信记录'],
        source: 'wechat_chat',
        wechatMetadata: {
          chatTopic: extractedTopic,
          speakers: item.originalSpeakers,
          originalTimestamp: '刚刚导入',
        },
        aiSummary: item.isTodo ? `【待办事项】${item.content.slice(0, 40)}` : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    onAddThoughts(toSave);
    setHasSaved(true);
  };

  return (
    <div id="wechat-chat-importer" className="space-y-4">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#07c160]/10 via-[#07c160]/5 to-transparent p-4 rounded-2xl border border-[#07c160]/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#07c160] text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-900">微信聊天内容传入想法</h2>
                {onOpenModelSelector && (
                  <button
                    type="button"
                    onClick={onOpenModelSelector}
                    className="text-[10px] text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center space-x-0.5 border border-emerald-300 shadow-2xs"
                    title="点击切换解析聊天的大模型"
                  >
                    <Bot className="w-2.5 h-2.5 text-[#07c160]" />
                    <span>{modelConfig.provider}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                大模型智能过滤寒暄，提取结构化灵感、任务与知识
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDoc(!showDoc)}
            className="text-xs text-[#07c160] hover:text-[#06ad56] flex items-center space-x-1 py-1 px-2 rounded-lg bg-white/80 border border-[#07c160]/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>小程序接入机制</span>
          </button>
        </div>

        {/* WeChat Mini Program Forwarding Principle Guide */}
        {showDoc && (
          <div className="mt-3 pt-3 border-t border-[#07c160]/15 text-xs text-neutral-700 space-y-2 leading-relaxed bg-white/70 p-3 rounded-xl">
            <div className="font-semibold text-neutral-900 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-[#07c160]" />
              <span>在真实微信小程序中的运行链路：</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-neutral-600">
              <li>
                <strong>长按微信聊天内容复制</strong>：进入本小程序直接粘贴，大模型自动解析；
              </li>
              <li>
                <strong>小程序服务号/机器人绑定</strong>：微信群内@助手服务号或长按消息选择“转发”，消息事件通过微信 Webhook 推送至后台 API 进行结构化萃取；
              </li>
              <li>
                <strong>卡片转发与消息抽屉</strong>：利用 <code>wx.getClipboardData()</code> 或微信会话卡片携带的 <code>shareTicket</code>，秒级捕获对话精髓。
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Preset Quick Fill Chips */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span>点击载入微信聊天模拟示例：</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_CHATS.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleApplyPreset(preset.text)}
              className="text-left p-2.5 rounded-xl bg-white border border-neutral-200/80 hover:border-[#07c160] hover:bg-neutral-50 transition-all text-xs shadow-2xs"
            >
              <div className="font-semibold text-neutral-800 truncate">{preset.name}</div>
              <div className="text-[11px] text-neutral-500 truncate mt-0.5">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800">
            微信聊天文本或转发记录
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) setChatInput(text);
              } catch {
                // Ignore if clipboard denied
              }
            }}
            className="text-xs text-[#07c160] hover:text-[#06ad56] font-medium"
          >
            粘贴剪贴板
          </button>
        </div>

        <textarea
          rows={6}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="在此粘贴微信聊天记录（支持复制的多条对话、群聊讨论、朋友圈书摘等）..."
          className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160] leading-relaxed resize-none font-mono"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400">
            已输入 {chatInput.length} 个字符
          </span>
          <button
            type="button"
            onClick={handleParseChat}
            disabled={isLoading || !chatInput.trim()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] disabled:opacity-50 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? '大模型深度解析中...' : '一键大模型智能提炼'}</span>
          </button>
        </div>
      </div>

      {/* Extracted Results Area */}
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-neutral-900">
                  🎯 对话主题：{extractedTopic}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#07c160]/10 text-[#07c160] font-medium">
                  提炼出 {parsedItems.length} 条想法
                </span>
              </div>
              {extractedSummary && (
                <p className="text-xs text-neutral-500 mt-1">{extractedSummary}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedIndices.length === parsedItems.length) {
                  setSelectedIndices([]);
                } else {
                  setSelectedIndices(parsedItems.map((_, i) => i));
                }
              }}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              {selectedIndices.length === parsedItems.length ? '取消全选' : '全选'}
            </button>
          </div>

          <div className="space-y-3">
            {parsedItems.map((item, idx) => {
              const isSelected = selectedIndices.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#07c160] bg-emerald-50/40 ring-1 ring-[#07c160]/20'
                      : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          isSelected ? 'bg-[#07c160] text-white' : 'border border-neutral-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900">{item.title}</h4>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 mt-2 leading-relaxed whitespace-pre-wrap pl-7">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between mt-2.5 pl-7 text-[11px] text-neutral-500">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.2 bg-white rounded border border-neutral-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {item.originalSpeakers && (
                      <span className="truncate max-w-[150px]">
                        发言人: {item.originalSpeakers.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm Import Button */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              已勾选 {selectedIndices.length} / {parsedItems.length} 条想法
            </span>

            <div className="flex items-center space-x-2">
              {hasSaved ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center text-xs text-emerald-600 font-semibold space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>已导入想法库</span>
                  </span>
                  <button
                    type="button"
                    onClick={onNavigateToThoughts}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
                  >
                    查看想法流
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToThoughts}
                  disabled={selectedIndices.length === 0}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] disabled:opacity-50 shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>存入我的随手记想法</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
