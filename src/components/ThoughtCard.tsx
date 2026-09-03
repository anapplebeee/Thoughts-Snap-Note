import { useState, type MouseEvent, type Key } from 'react';
import {
  Pin,
  Lock,
  Unlock,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ThoughtItem } from '../types';
import { getCategoryMeta } from '../utils/categories';

interface ThoughtCardProps {
  key?: Key;
  thought: ThoughtItem;
  onEdit: (thought: ThoughtItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRequestUnlock: (thought: ThoughtItem) => void;
  isVaultUnlocked: boolean;
  decryptedContent?: string;
  onAnalyzeAi?: (thought: ThoughtItem) => void;
}

export function ThoughtCard({
  thought,
  onEdit,
  onDelete,
  onTogglePin,
  onRequestUnlock,
  isVaultUnlocked,
  decryptedContent,
  onAnalyzeAi,
}: ThoughtCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const meta = getCategoryMeta(thought.category);
  const isLocked = Boolean(thought.isEncrypted && !isVaultUnlocked);
  const displayContent = isLocked
    ? '••••••••••••••••••••••••••••••••'
    : decryptedContent || thought.content;

  const handleCopy = async (textToCopy: string, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatTime = (ms: number) => {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / (60 * 1000));
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const d = new Date(ms);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  return (
    <article
      id={`thought-card-${thought.id}`}
      className={`group relative bg-white rounded-2xl p-4 transition-all duration-200 border ${
        thought.isPinned
          ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-100'
          : 'border-neutral-200/80 shadow-2xs hover:shadow-xs hover:border-neutral-300'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* Category Chip */}
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badgeBg}`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>

          {/* Source Badges */}
          {thought.source === 'wechat_chat' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#07c160]/10 text-[#07c160] border border-[#07c160]/20">
              <MessageSquare className="w-3 h-3" />
              <span>微信导入</span>
            </span>
          )}

          {/* Encrypted Badge */}
          {thought.isEncrypted && (
            <span
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isLocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? '密文保护' : '已解密'}</span>
            </span>
          )}
        </div>

        {/* Pin & Timestamp */}
        <div className="flex items-center space-x-2 text-xs text-neutral-400">
          <time dateTime={new Date(thought.createdAt).toISOString()}>{formatTime(thought.createdAt)}</time>
          <button
            type="button"
            onClick={() => onTogglePin(thought.id)}
            title={thought.isPinned ? '取消置顶' : '置顶此想法'}
            className={`p-1 rounded-md transition-colors ${
              thought.isPinned
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${thought.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Title */}
      {thought.title && (
        <h3 className="text-base font-semibold text-neutral-900 mb-1.5 leading-snug tracking-tight">
          {thought.title}
        </h3>
      )}

      {/* WeChat Chat Context (if available) */}
      {thought.wechatMetadata && (
        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#07c160]/5 border border-[#07c160]/15 text-xs text-neutral-600 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-[#07c160] font-medium">来源对话:</span>
            <span className="font-semibold truncate text-neutral-800">
              {thought.wechatMetadata.chatTopic || '微信聊天'}
            </span>
          </div>
          {thought.wechatMetadata.speakers && (
            <span className="text-[11px] text-neutral-500 shrink-0 ml-2">
              发言人: {thought.wechatMetadata.speakers.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isLocked ? (
        <div
          onClick={() => onRequestUnlock(thought)}
          className="cursor-pointer my-2 p-3.5 rounded-xl bg-neutral-50 border border-dashed border-neutral-300 hover:border-emerald-400 transition-colors text-center group/lock"
        >
          <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover/lock:scale-110 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-neutral-700">此想法包含敏感密码或机密内容</p>
            <p className="text-[11px] text-emerald-600 font-medium">点击输入主密码即可解密查看</p>
          </div>
        </div>
      ) : (
        <div className="my-2">
          {/* Password Specific Card View */}
          {thought.passwordDetails && (
            <div className="mb-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5">
                <span className="font-medium text-neutral-700 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>凭证详情</span>
                </span>
                {thought.passwordDetails.website && (
                  <span className="text-neutral-500 font-mono text-[11px]">
                    {thought.passwordDetails.website}
                  </span>
                )}
              </div>
              {thought.passwordDetails.username && (
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="text-neutral-500">账号 / 用户名:</span>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span>{thought.passwordDetails.username}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(thought.passwordDetails?.username || '', e)}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                      title="复制账号"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regular Text Content */}
          <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed break-words font-normal">
            {displayContent}
          </div>
        </div>
      )}

      {/* AI Summary Highlight Box */}
      {thought.aiSummary && !isLocked && (
        <div className="mt-2.5 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/60 p-2.5 text-xs text-neutral-700">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          >
            <div className="flex items-center space-x-1.5 text-[#07c160] font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>大模型智能提炼</span>
            </div>
            <button type="button" className="text-neutral-400 hover:text-neutral-600 p-0.5">
              {isSummaryExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1 text-neutral-800 leading-snug font-medium">{thought.aiSummary}</p>

          {isSummaryExpanded && thought.aiKeyPoints && thought.aiKeyPoints.length > 0 && (
            <ul className="mt-2 pt-2 border-t border-emerald-200/50 space-y-1 list-disc list-inside text-[11px] text-neutral-600">
              {thought.aiKeyPoints.map((kp, idx) => (
                <li key={idx}>{kp}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tags List */}
      {thought.tags && thought.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {thought.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Actions Toolbar */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={(e) => handleCopy(displayContent, e)}
            className="inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制</span>
              </>
            )}
          </button>

          {onAnalyzeAi && !isLocked && (
            <button
              type="button"
              onClick={() => onAnalyzeAi(thought)}
              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-emerald-50 text-[#07c160] transition-colors font-medium"
              title="大模型重新分析归档"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI分析</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onEdit(thought)}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors"
            title="编辑"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(thought.id)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
