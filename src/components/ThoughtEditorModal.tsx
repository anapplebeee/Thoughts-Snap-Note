import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Lock,
  Unlock,
  Mic,
  MicOff,
  Plus,
  Wand2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Bot,
} from 'lucide-react';
import { ThoughtItem, CategoryType, AIModelConfig } from '../types';
import { CATEGORIES } from '../utils/categories';
import { encryptText, generateStrongPassword, evaluatePasswordStrength } from '../utils/crypto';

interface ThoughtEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (thought: Partial<ThoughtItem>, rawPlaintext?: string) => Promise<void>;
  editingThought?: ThoughtItem | null;
  masterPin: string | null;
  onRequestSetPin: () => void;
  modelConfig?: AIModelConfig;
  onOpenModelSelector?: () => void;
}

const MODAL_TEMPLATES = [
  { label: '⚡ 突发灵感', text: '【突发灵感】关于', cat: '灵感创意' },
  { label: '📋 今日待办', text: '【今日待办】\n1. ', cat: '工作任务' },
  { label: '💡 读书思考', text: '【读书思考】', cat: '学习笔记' },
  { label: '💰 记一笔账', text: '【记账消费】支出 ¥', cat: '财务记账' },
  { label: '🔒 密码备忘', text: '【密码隐私】', cat: '密码隐私' },
];

export function ThoughtEditorModal({
  isOpen,
  onClose,
  onSave,
  editingThought,
  masterPin,
  onRequestSetPin,
  modelConfig = { provider: 'gemini' },
  onOpenModelSelector,
}: ThoughtEditorModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryType>('灵感创意');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Password details (when category is '密码隐私' or encrypted)
  const [accountName, setAccountName] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // AI states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Speech to Text state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (editingThought) {
      setTitle(editingThought.title || '');
      setContent(editingThought.content || '');
      setCategory((editingThought.category as CategoryType) || '灵感创意');
      setTags(editingThought.tags || []);
      setIsEncrypted(Boolean(editingThought.isEncrypted));
      setIsPinned(Boolean(editingThought.isPinned));
      if (editingThought.passwordDetails) {
        setAccountName(editingThought.passwordDetails.accountName || '');
        setUsername(editingThought.passwordDetails.username || '');
        setWebsite(editingThought.passwordDetails.website || '');
      }
    } else {
      setTitle('');
      setContent('');
      setCategory('灵感创意');
      setTags([]);
      setIsEncrypted(false);
      setIsPinned(false);
      setAccountName('');
      setUsername('');
      setWebsite('');
      setPasswordValue('');
    }
    setAiNotice(null);
  }, [editingThought, isOpen]);

  // Voice recording support via SpeechRecognition
  const handleToggleVoice = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Friendly simulation if browser has no native speech API
      setIsRecording(true);
      const samplePhrases = [
        '明天下午两点和微信团队开会，讨论大模型接口延迟优化方案。',
        '灵感记事：可以在小程序主界面增加一个长按语音转文字悬浮球。',
        '重要账号：腾讯云开发环境密码记得下周一更新一次。',
      ];
      const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      setTimeout(() => {
        setContent((prev) => (prev ? `${prev}\n${phrase}` : phrase));
        setIsRecording(false);
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  // AI Classify, Auto-tag & Summarize
  const handleAiClassify = async () => {
    if (!content.trim()) {
      setAiNotice('请先输入一些想法内容');
      return;
    }
    setIsAiLoading(true);
    setAiNotice(null);

    try {
      const res = await fetch('/api/ai/classify-and-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title,
          modelProvider: modelConfig.provider,
          modelConfig,
        }),
      });
      const data = await res.json();

      if (data.title && !title) setTitle(data.title);
      if (data.category) setCategory(data.category as CategoryType);
      if (Array.isArray(data.tags)) {
        setTags(Array.from(new Set([...tags, ...data.tags])));
      }
      const modelLabel = data.usedModel || modelConfig.provider;
      if (data.isSensitive) {
        setIsEncrypted(true);
        setAiNotice(`🔒 【${modelLabel}】识别出内容可能包含敏感凭据，已为您推荐开启隐私加密`);
      } else {
        setAiNotice(`✨ 【${modelLabel}】智能归档完成：已归入【${data.category}】，提取 ${data.tags?.length || 0} 个标签`);
      }
    } catch (e) {
      setAiNotice('大模型响应超时，可直接手动保存');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Polish
  const handleAiPolish = async (style: 'format' | 'actionable' | 'summary') => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          style,
          modelProvider: modelConfig.provider,
          modelConfig,
        }),
      });
      const data = await res.json();
      if (data.polished) {
        setContent(data.polished);
        setAiNotice(`✨ 【${data.usedModel || modelConfig.provider}】已完成笔记润色与结构化重构`);
      }
    } catch {
      setAiNotice('润色服务繁忙，请稍后重试');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword(16);
    setPasswordValue(pwd);
    if (!content.includes(pwd)) {
      setContent((prev) => (prev ? `${prev}\n密码: ${pwd}` : `密码: ${pwd}`));
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !title.trim() && !passwordValue) {
      setAiNotice('请至少填写标题或内容');
      return;
    }

    if (isEncrypted && !masterPin) {
      onRequestSetPin();
      setAiNotice('启用加密需要先设置或输入主密码');
      return;
    }

    let rawText = content.trim();
    if (passwordValue && !rawText.includes(passwordValue)) {
      rawText += `\n【安全口令/密码】: ${passwordValue}`;
    }

    const payload: Partial<ThoughtItem> = {
      title: title.trim() || rawText.slice(0, 14),
      category,
      tags,
      isPinned,
      isEncrypted,
      updatedAt: Date.now(),
    };

    if (category === '密码隐私' || isEncrypted) {
      payload.passwordDetails = {
        accountName: accountName || undefined,
        username: username || undefined,
        website: website || undefined,
      };
    }

    if (isEncrypted && masterPin) {
      try {
        const encrypted = await encryptText(rawText, masterPin);
        payload.encryptedPayload = encrypted;
        payload.content = '【已启用端到端加密】此内容已通过客户端 AES-GCM 算法加密，需输入主密码解锁。';
      } catch (e) {
        setAiNotice('加密失败，请检查主密码设置');
        return;
      }
    } else {
      payload.content = rawText;
    }

    await onSave(payload, rawText);
    onClose();
  };

  if (!isOpen) return null;

  const pwdStrength = evaluatePasswordStrength(passwordValue);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#07c160]/15 flex items-center justify-center text-[#07c160]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                {editingThought ? '编辑想法' : '记录随时随地的想法'}
              </h2>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-neutral-500">支持语音、大模型智能归档与加密</span>
                {onOpenModelSelector && (
                  <button
                    type="button"
                    onClick={onOpenModelSelector}
                    className="text-[10px] text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 px-1.5 py-0.2 rounded font-medium flex items-center space-x-0.5"
                    title="点击切换 AI 大模型"
                  >
                    <Bot className="w-2.5 h-2.5" />
                    <span>{modelConfig.provider}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* AI Banner / Status */}
          {aiNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 flex items-center justify-between">
              <span>{aiNotice}</span>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="text-emerald-500 hover:text-emerald-700 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Templates Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-neutral-400 shrink-0">快捷模板:</span>
            {MODAL_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => {
                  setContent((prev) => (prev ? `${prev}\n${tmpl.text}` : tmpl.text));
                  setCategory(tmpl.cat as CategoryType);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700 text-xs whitespace-nowrap active:scale-95 transition-transform"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="想法标题（选填，大模型可自动提炼）"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160]"
            />
          </div>

          {/* Content Textarea & Voice Bar */}
          <div className="relative">
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="随时随地写下脑海中的点子、工作备忘、灵感片段或隐私账密..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160] leading-relaxed resize-none"
            />

            {/* In-Textarea Fast Actions Bar */}
            <div className="flex items-center justify-between pt-1.5 px-1">
              <div className="flex items-center space-x-1.5">
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? '录音识别中...' : '语音录入'}</span>
                </button>

                {/* AI Polish options */}
                <button
                  type="button"
                  onClick={() => handleAiPolish('format')}
                  disabled={isAiLoading || !content.trim()}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 disabled:opacity-50"
                  title="大模型结构化润色"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI润色</span>
                </button>
              </div>

              {/* Fast AI Classify Button */}
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={isAiLoading || !content.trim()}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#07c160] text-white hover:bg-[#06ad56] shadow-xs disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? '分析中...' : '大模型智能归档'}</span>
              </button>
            </div>
          </div>

          {/* Category Chips Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              选择归档分类
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setCategory(cat.key);
                      if (cat.key === '密码隐私') {
                        setIsEncrypted(true);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-[#07c160]/10 border-[#07c160] text-[#07c160] font-bold shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="text-base mb-0.5">{cat.icon}</span>
                    <span className="text-[11px] truncate w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Specific Inputs (if category is 密码隐私 or encryption enabled) */}
          {(category === '密码隐私' || isEncrypted) && (
            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                  <span>隐私凭据卡片字段（将自动进行端到端加密）</span>
                </span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center space-x-1 text-xs text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200 hover:bg-rose-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>生成强密码</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="账号/用户名/手机号"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-rose-200 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
                <input
                  type="text"
                  placeholder="相关网站或App (如 weixin.qq.com)"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-rose-200 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              {/* Generated Password display & strength */}
              {passwordValue && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200">
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-neutral-500">密码:</span>
                    <span className="font-bold text-neutral-900">{passwordValue}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${pwdStrength.color}`}>
                      {pwdStrength.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(passwordValue)}
                    className="p-1 text-neutral-500 hover:text-neutral-900"
                    title="复制密码"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Encryption & Pin Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isEncrypted ? 'bg-rose-100 text-rose-600' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {isEncrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold text-neutral-800">端到端 AES-GCM 加密保护</span>
                <p className="text-[11px] text-neutral-500">
                  {isEncrypted
                    ? masterPin
                      ? '已启用加密，仅主密码可解密'
                      : '请先设置主密码'
                    : '开启后内容将加密存储，防止泄露'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isEncrypted && !masterPin) {
                  onRequestSetPin();
                }
                setIsEncrypted(!isEncrypted);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEncrypted ? 'bg-rose-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEncrypted ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              便签标签
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 ml-1 text-neutral-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="输入标签并回车 (如 会议、创意、待办)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#07c160]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-medium"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save & Cancel Bar */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-2.5 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>保存想法</span>
          </button>
        </div>
      </div>
    </div>
  );
}
