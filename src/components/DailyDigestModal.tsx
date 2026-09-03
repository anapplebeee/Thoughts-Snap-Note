import { useState, useEffect } from 'react';
import { Sparkles, X, Check, Copy, Calendar, Award, CheckSquare, RefreshCw, Bot } from 'lucide-react';
import { ThoughtItem, DailyDigest, AIModelConfig } from '../types';

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  thoughts: ThoughtItem[];
  modelConfig?: AIModelConfig;
  onOpenModelSelector?: () => void;
}

export function DailyDigestModal({
  isOpen,
  onClose,
  dateStr,
  thoughts,
  modelConfig = { provider: 'gemini' },
  onOpenModelSelector,
}: DailyDigestModalProps) {
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDigest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/daily-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          thoughts: thoughts.map((t) => ({
            title: t.title,
            content: t.content,
            category: t.category,
          })),
          modelProvider: modelConfig.provider,
          modelConfig,
        }),
      });
      const data = await res.json();
      setDigest(data);
    } catch (e) {
      setDigest({
        date: dateStr,
        headline: `今日想法汇总 (${thoughts.length} 条记录)`,
        overview: '包含工作、生活与灵感碎片。',
        highlights: thoughts.slice(0, 3).map((t) => t.title || t.content.slice(0, 30)),
        actionItems: ['复盘今日重点并做好明天规划'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && thoughts.length > 0) {
      fetchDigest();
    }
  }, [isOpen, dateStr]);

  if (!isOpen) return null;

  const handleCopyDigest = async () => {
    if (!digest) return;
    const text = `【${digest.date} AI每日复盘总结】\n${digest.headline}\n\n📝 整体综述：\n${
      digest.overview
    }\n\n🌟 今日亮点：\n${digest.highlights
      .map((h, i) => `${i + 1}. ${h}`)
      .join('\n')}\n\n📌 后续行动：\n${digest.actionItems
      .map((a, i) => `${i + 1}. ${a}`)
      .join('\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#07c160] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-neutral-900">大模型·每日想法总结复盘</h2>
                {onOpenModelSelector && (
                  <button
                    type="button"
                    onClick={onOpenModelSelector}
                    className="text-[10px] text-emerald-700 bg-white/80 hover:bg-white px-1.5 py-0.2 rounded font-medium flex items-center space-x-0.5 border border-emerald-200"
                    title="切换总结使用的 AI 模型"
                  >
                    <Bot className="w-2.5 h-2.5 text-[#07c160]" />
                    <span>{modelConfig.provider}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
                <Calendar className="w-3 h-3" />
                <span>{dateStr} · 汇聚 {thoughts.length} 条记录</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-white/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#07c160] border-t-transparent animate-spin" />
              <p className="text-xs text-neutral-500">Gemini 大模型正在梳理今天的灵感与待办...</p>
            </div>
          ) : digest ? (
            <div className="space-y-4 text-xs">
              {/* Headline */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-[#07c160] uppercase tracking-wider">
                  TODAY'S THEME
                </span>
                <h3 className="text-sm font-bold text-neutral-900 leading-snug">{digest.headline}</h3>
              </div>

              {/* Overview */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-800 text-xs flex items-center space-x-1">
                  <span>📖 综述复盘</span>
                </h4>
                <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
                  {digest.overview}
                </p>
              </div>

              {/* Highlights */}
              {digest.highlights && digest.highlights.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-neutral-800 text-xs flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>核心亮点与沉淀</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {digest.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-neutral-800 flex items-start space-x-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {digest.actionItems && digest.actionItems.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-neutral-800 text-xs flex items-center space-x-1">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>自动萃取的后续行动清单</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {digest.actionItems.map((action, i) => (
                      <li
                        key={i}
                        className="p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900 flex items-center space-x-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchDigest}
            disabled={isLoading}
            className="inline-flex items-center space-x-1 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white"
          >
            <RefreshCw className="w-3 h-3" />
            <span>重新提炼</span>
          </button>

          <button
            type="button"
            onClick={handleCopyDigest}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制到剪贴板</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制日报到微信</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
