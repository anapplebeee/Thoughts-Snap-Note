import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Sparkles, Mic, Send, Bot, Tag, Shield, Check, CornerDownLeft, Maximize2, X, Plus } from 'lucide-react';
import { ThoughtItem, CategoryType, AIModelConfig } from '../types';

interface QuickCaptureCardProps {
  onSave: (thought: Partial<ThoughtItem>) => void;
  onOpenFullEditor: (initialContent?: string) => void;
  onOpenModelSelector: () => void;
  modelConfig: AIModelConfig;
}

const TEMPLATES = [
  { label: '⚡ 突发灵感', prefix: '【突发灵感】关于', cat: '灵感创意' },
  { label: '📋 今日待办', prefix: '【今日待办】今天需要完成：\n1. ', cat: '工作任务' },
  { label: '💡 读书思考', prefix: '【读书随感】在《》中读到：', cat: '学习笔记' },
  { label: '💰 记一笔账', prefix: '【记账消费】今天支出 ¥，用于：', cat: '财务记账' },
  { label: '🔒 密码备忘', prefix: '【密码隐私】账号：\n密码：', cat: '密码隐私' },
];

export function QuickCaptureCard({
  onSave,
  onOpenFullEditor,
  onOpenModelSelector,
  modelConfig,
}: QuickCaptureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('灵感创意');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastUsedModel, setLastUsedModel] = useState<string>('');
  const [quickToast, setQuickToast] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<any>(null);

  // Focus textarea when expanding
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Voice recording simulation timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsExpanded(true);
    } else {
      setIsRecording(false);
      // Simulate speech-to-text recognition result
      const voiceSamples = [
        '下周二下午两点需要和产品经理对齐微信小程序的新版本发布排期。',
        '突发奇想：可以在随手记里增加一个灵感画板，支持手写思维导图。',
        '买了一本《纳瓦尔宝典》，其中提到杠杆率与个人专长的重要性，深有感触。',
        '今日消费午餐三十五元，交通地铁四元，需记录在周账本中。',
      ];
      const recognized = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
      setContent((prev) => (prev ? `${prev}\n${recognized}` : recognized));
      triggerToast('🎙️ 语音已转换为文字！');
    }
  };

  const triggerToast = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => setQuickToast(''), 2500);
  };

  const handleAiAutoExtract = async () => {
    if (!content.trim()) {
      triggerToast('请先输入一些想法内容');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/classify-and-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          content,
          modelProvider: modelConfig.provider,
          modelConfig,
        }),
      });

      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
      }
      if (data.category) {
        setCategory(data.category as CategoryType);
      }
      if (data.usedModel) {
        setLastUsedModel(data.usedModel);
      }
      triggerToast(`✨ AI 提炼完成！(${data.usedModel || modelConfig.provider})`);
    } catch {
      triggerToast('智能分析重试中，已应用本地规则');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickSubmit = () => {
    if (!content.trim()) return;

    onSave({
      title: title.trim() || content.trim().slice(0, 16) + (content.length > 16 ? '...' : ''),
      content: content.trim(),
      category,
      tags: [category.slice(0, 2), '随手记'],
      source: 'direct',
    });

    // Reset
    setContent('');
    setTitle('');
    setCategory('灵感创意');
    setIsExpanded(false);
    triggerToast('✅ 灵感已保存！');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleQuickSubmit();
    }
  };

  const providerLabelMap: Record<string, string> = {
    gemini: 'Gemini 3.8 Flash',
    deepseek: 'DeepSeek-V3',
    glm: '智谱 GLM-4',
    custom: '自定义 AI',
  };

  return (
    <div
      id="quick-capture-card"
      className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all duration-200 relative"
    >
      {/* Toast Notice */}
      {quickToast && (
        <div className="absolute top-2 right-3 z-20 px-2.5 py-1 rounded-lg bg-neutral-900/90 text-white text-[11px] font-medium shadow-md animate-fade-in flex items-center space-x-1">
          <span>{quickToast}</span>
        </div>
      )}

      {!isExpanded ? (
        /* Collapsed Minimal Input State */
        <div
          onClick={() => setIsExpanded(true)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/70 transition-colors"
        >
          <div className="flex items-center space-x-2.5 flex-1 mr-2">
            <div className="w-7 h-7 rounded-lg bg-[#07c160]/15 text-[#07c160] flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs text-neutral-400 font-normal select-none">
              有什么灵感闪念？随时随地记下来...
            </span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceToggle();
              }}
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="语音录入"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModelSelector();
              }}
              className="px-2 py-1 rounded-lg bg-emerald-50 text-[#07c160] text-[10px] font-medium border border-[#07c160]/30 hover:bg-emerald-100 transition-colors flex items-center space-x-1"
              title="切换当前 AI 模型"
            >
              <Bot className="w-3 h-3" />
              <span>{providerLabelMap[modelConfig.provider] || 'AI 模型'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Fast Writing Interface */
        <div className="p-3.5 space-y-3">
          {/* Top Bar inside Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-neutral-800">极速记灵感</span>
              <button
                type="button"
                onClick={onOpenModelSelector}
                className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#07c160] text-[10px] font-medium border border-[#07c160]/30 hover:bg-emerald-100 flex items-center space-x-1"
                title="点击切换大模型"
              >
                <Bot className="w-3 h-3" />
                <span>{providerLabelMap[modelConfig.provider] || 'AI 模型'}</span>
                {lastUsedModel && <span className="text-neutral-400">· {lastUsedModel}</span>}
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onOpenFullEditor(content)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 text-[11px] flex items-center space-x-0.5"
                title="展开全功能编辑器 (支持加密等)"
              >
                <Maximize2 className="w-3 h-3" />
                <span>全功能</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Template Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => {
                  setContent((prev) => (prev ? `${prev}\n${tmpl.prefix}` : tmpl.prefix));
                  setCategory(tmpl.cat as CategoryType);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-[11px] whitespace-nowrap active:scale-95 transition-transform"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Optional Title input if AI extracted or user wants to add */}
          {title && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题 (选填)"
              className="w-full px-2.5 py-1 text-xs font-semibold text-neutral-900 border-b border-neutral-200 focus:outline-none focus:border-[#07c160]"
            />
          )}

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="写下一闪而过的点子、待办任务、摘抄笔记... (快捷键 Ctrl+Enter 快速记录)"
              className="w-full p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-200/80 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#07c160] focus:bg-white resize-none leading-relaxed"
            />

            {/* Voice Recording Active Wave Indicator */}
            {isRecording && (
              <div className="absolute inset-0 bg-white/95 rounded-xl border border-emerald-400 p-3 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-semibold text-neutral-800">
                    正在聆听语音录入... ({recordingSeconds}s)
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 bg-[#07c160] h-3 animate-pulse" />
                  <div className="w-1 bg-[#07c160] h-6 animate-pulse" />
                  <div className="w-1 bg-[#07c160] h-4 animate-pulse" />
                  <div className="w-1 bg-[#07c160] h-7 animate-pulse" />
                  <div className="w-1 bg-[#07c160] h-2 animate-pulse" />
                </div>
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-medium hover:bg-rose-600"
                >
                  点击结束并转换为文字
                </button>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              {/* Category selector tag */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="text-[11px] bg-neutral-100 text-neutral-700 rounded-lg px-2 py-1 border-none focus:ring-1 focus:ring-[#07c160]"
              >
                <option value="灵感创意">💡 灵感创意</option>
                <option value="工作任务">💼 工作任务</option>
                <option value="学习笔记">📖 学习笔记</option>
                <option value="生活日常">☕ 生活日常</option>
                <option value="财务记账">💰 财务记账</option>
                <option value="微信收藏">💬 微信收藏</option>
                <option value="密码隐私">🔒 密码隐私</option>
              </select>

              {/* AI Auto Tag & Extract Button */}
              <button
                type="button"
                onClick={handleAiAutoExtract}
                disabled={isAnalyzing || !content.trim()}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#07c160] hover:bg-emerald-100 disabled:opacity-50 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                title="AI 自动提炼标题与标签"
              >
                <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? '分析中...' : 'AI提炼'}</span>
              </button>

              {/* Voice button */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-rose-500 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
                title="语音听写录入"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleQuickSubmit}
                disabled={!content.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#07c160] hover:bg-[#06ad56] disabled:opacity-40 text-white text-xs font-semibold shadow-xs flex items-center space-x-1 active:scale-95 transition-transform"
              >
                <Send className="w-3 h-3" />
                <span>记一笔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
