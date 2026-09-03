import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Shield,
  MessageSquare,
  Calendar as CalendarIcon,
  Layers,
  Download,
  Upload,
  Lock,
  Unlock,
  KeyRound,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ThoughtItem, ActiveTab, CategoryType, AIModelConfig } from './types';
import { loadThoughts, saveThoughts, getInitialSeedThoughts, verifyMasterPin } from './utils/storage';
import { decryptText } from './utils/crypto';
import { CATEGORIES } from './utils/categories';
import { WeChatNavbar } from './components/WeChatNavbar';
import { ThoughtCard } from './components/ThoughtCard';
import { ThoughtEditorModal } from './components/ThoughtEditorModal';
import { WeChatChatImporter } from './components/WeChatChatImporter';
import { CalendarView } from './components/CalendarView';
import { CategoryView } from './components/CategoryView';
import { VaultManagerModal } from './components/VaultManagerModal';
import { DailyDigestModal } from './components/DailyDigestModal';
import { TabBar } from './components/TabBar';
import { AIModelSelectorModal } from './components/AIModelSelectorModal';
import { QuickCaptureCard } from './components/QuickCaptureCard';

export default function App() {
  const [thoughts, setThoughts] = useState<ThoughtItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('thoughts');
  const [isDesktopView, setIsDesktopView] = useState(false);

  // Search & Filters in main stream
  const [searchQuery, setSearchQuery] = useState('');
  const [streamCategory, setStreamCategory] = useState<string>('ALL');

  // Encryption & Vault state
  const [masterPin, setMasterPin] = useState<string | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingThought, setEditingThought] = useState<ThoughtItem | null>(null);
  const [editorInitialContent, setEditorInitialContent] = useState<string>('');

  // AI Model selector state
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState<AIModelConfig>(() => {
    try {
      const saved = localStorage.getItem('wechat_thought_model_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { provider: 'gemini' };
  });

  const handleUpdateModelConfig = (newConfig: AIModelConfig) => {
    setModelConfig(newConfig);
    try {
      localStorage.setItem('wechat_thought_model_config', JSON.stringify(newConfig));
    } catch {}
  };

  // Daily digest modal state
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [digestDate, setDigestDate] = useState<string>('');
  const [digestThoughts, setDigestThoughts] = useState<ThoughtItem[]>([]);

  const modelDisplayName = useMemo(() => {
    switch (modelConfig.provider) {
      case 'deepseek':
        return 'DeepSeek';
      case 'glm':
        return '智谱GLM';
      case 'custom':
        return modelConfig.customModelName || '自定义模型';
      case 'gemini':
      default:
        return 'Gemini';
    }
  }, [modelConfig]);

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    const existing = loadThoughts();
    if (existing.length > 0) {
      setThoughts(existing);
    } else {
      getInitialSeedThoughts().then((seeds) => {
        setThoughts(seeds);
        saveThoughts(seeds);
      });
    }
  }, []);

  // Sync to localStorage
  const updateThoughts = (newThoughts: ThoughtItem[]) => {
    setThoughts(newThoughts);
    saveThoughts(newThoughts);
  };

  // Add or update thought
  const handleSaveThought = async (partial: Partial<ThoughtItem>, rawPlaintext?: string) => {
    let updated: ThoughtItem[];
    if (editingThought && editingThought.id) {
      updated = thoughts.map((t) =>
        t.id === editingThought.id
          ? ({ ...t, ...partial, updatedAt: Date.now() } as ThoughtItem)
          : t
      );
      if (rawPlaintext) {
        setDecryptedCache((prev) => ({ ...prev, [editingThought.id]: rawPlaintext }));
      }
    } else {
      const newId = `thought-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newThought: ThoughtItem = {
        id: newId,
        title: partial.title || '',
        content: partial.content || '',
        category: partial.category || '灵感创意',
        tags: partial.tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: Boolean(partial.isPinned),
        isEncrypted: Boolean(partial.isEncrypted),
        encryptedPayload: partial.encryptedPayload,
        passwordDetails: partial.passwordDetails,
        source: 'direct',
      };
      updated = [newThought, ...thoughts];
      if (rawPlaintext) {
        setDecryptedCache((prev) => ({ ...prev, [newId]: rawPlaintext }));
      }
    }
    updateThoughts(updated);
    setEditingThought(null);
    setEditorInitialContent('');
  };

  const handleDeleteThought = (id: string) => {
    if (window.confirm('确定要删除这条想法记录吗？')) {
      const updated = thoughts.filter((t) => t.id !== id);
      updateThoughts(updated);
    }
  };

  const handleTogglePin = (id: string) => {
    const updated = thoughts.map((t) =>
      t.id === id ? { ...t, isPinned: !t.isPinned } : t
    );
    updateThoughts(updated);
  };

  // Request Unlock for a specific thought
  const handleRequestUnlock = async (thought: ThoughtItem) => {
    if (!thought.isEncrypted || !thought.encryptedPayload) return;

    if (!masterPin) {
      setIsVaultModalOpen(true);
      return;
    }

    try {
      const plaintext = await decryptText(thought.encryptedPayload, masterPin);
      setDecryptedCache((prev) => ({ ...prev, [thought.id]: plaintext }));
    } catch {
      setIsVaultModalOpen(true);
    }
  };

  // When vault is unlocked with a valid PIN
  const handleVaultUnlockSuccess = async (pin: string) => {
    setMasterPin(pin);
    // Decrypt all encrypted thoughts into memory cache
    const cache: Record<string, string> = { ...decryptedCache };
    for (const t of thoughts) {
      if (t.isEncrypted && t.encryptedPayload) {
        try {
          const plain = await decryptText(t.encryptedPayload, pin);
          cache[t.id] = plain;
        } catch {
          // ignore
        }
      }
    }
    setDecryptedCache(cache);
  };

  const handleLockVault = () => {
    setMasterPin(null);
    setDecryptedCache({});
  };

  // WeChat Chat Importer batch adds
  const handleBatchAddThoughts = (items: Partial<ThoughtItem>[]) => {
    const newItems: ThoughtItem[] = items.map((item, idx) => ({
      id: `wechat-chat-${Date.now()}-${idx}`,
      title: item.title || '微信聊天提取',
      content: item.content || '',
      category: item.category || '微信收藏',
      tags: item.tags || ['微信记录'],
      source: 'wechat_chat',
      wechatMetadata: item.wechatMetadata,
      aiSummary: item.aiSummary,
      createdAt: Date.now() - idx * 1000,
      updatedAt: Date.now(),
    }));

    const updated = [...newItems, ...thoughts];
    updateThoughts(updated);
  };

  // Export & Import backup
  const handleExportData = () => {
    const dataStr = JSON.stringify(thoughts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wechat-thoughts-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          updateThoughts(parsed);
          alert(`成功导入 ${parsed.length} 条想法记录！`);
        }
      } catch {
        alert('文件格式错误，请导入有效的备份 JSON 文件');
      }
    };
    reader.readAsText(file);
  };

  // Filtered thoughts for the main Stream tab
  const streamThoughts = useMemo(() => {
    return thoughts.filter((t) => {
      if (streamCategory !== 'ALL' && t.category !== streamCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title?.toLowerCase().includes(q);
        const inContent = t.content?.toLowerCase().includes(q);
        const inTags = t.tags?.some((tg) => tg.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inTags) return false;
      }
      return true;
    });
  }, [thoughts, streamCategory, searchQuery]);

  // Sort pinned first
  const sortedStreamThoughts = useMemo(() => {
    return [...streamThoughts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [streamThoughts]);

  // Open daily digest modal
  const handleOpenDailyDigest = (dateStr: string, dateThoughts: ThoughtItem[]) => {
    setDigestDate(dateStr);
    setDigestThoughts(dateThoughts);
    setIsDigestOpen(true);
  };

  // Filtered thoughts for Vault tab
  const vaultThoughts = useMemo(() => {
    return thoughts.filter((t) => t.isEncrypted || t.category === '密码隐私');
  }, [thoughts]);

  const pageTitle = {
    thoughts: '想法随手记',
    calendar: '日期与日历',
    categories: '分类归档',
    wechat: '微信聊天导入',
    vault: '密码隐私保险箱',
  }[activeTab];

  return (
    <div className={`min-h-screen bg-[#ededed] ${isDesktopView ? 'py-6 px-4' : 'p-0'}`}>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Mini Program Frame Container */}
      <div
        className={`mx-auto bg-[#f7f7f7] transition-all duration-300 min-h-screen flex flex-col shadow-xl ${
          isDesktopView
            ? 'max-w-4xl rounded-3xl overflow-hidden border border-neutral-300 ring-8 ring-neutral-900/5'
            : 'max-w-lg min-h-screen border-x border-neutral-200/80'
        }`}
      >
        {/* WeChat Mini Program Navigation Bar */}
        <WeChatNavbar
          title={pageTitle}
          isDesktopView={isDesktopView}
          onToggleDesktopView={() => setIsDesktopView(!isDesktopView)}
          onOpenVaultSettings={() => setIsVaultModalOpen(true)}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
          currentModelName={modelDisplayName}
          vaultUnlocked={Boolean(masterPin)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-24 space-y-4 overflow-x-hidden">
          {/* TAB 1: THOUGHTS STREAM */}
          {activeTab === 'thoughts' && (
            <div className="space-y-3.5">
              {/* Top Quick Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索你的想法、灵感、密码或标签..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-neutral-200/80 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Instant Inspiration Quick Capture Card */}
              <QuickCaptureCard
                onSave={handleSaveThought}
                onOpenFullEditor={(initialText) => {
                  setEditingThought(null);
                  setEditorInitialContent(initialText || '');
                  setIsEditorOpen(true);
                }}
                onOpenModelSelector={() => setIsModelSelectorOpen(true)}
                modelConfig={modelConfig}
              />

              {/* Fast Category Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setStreamCategory('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    streamCategory === 'ALL'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                      : 'bg-white border-neutral-200/80 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  全部 ({thoughts.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const isSelected = streamCategory === cat.key;
                  const count = thoughts.filter((t) => t.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setStreamCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center space-x-1 ${
                        isSelected
                          ? 'bg-[#07c160] text-white border-[#07c160] shadow-2xs'
                          : 'bg-white border-neutral-200/80 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* AI Daily Quick Action Card */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-[#07c160]/10 to-teal-500/10 p-3.5 rounded-2xl border border-[#07c160]/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#07c160] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">大模型智能总结与提炼</h3>
                    <p className="text-[11px] text-neutral-600">
                      自动归档分类、微信聊天导入、AES密码保险箱
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayList = thoughts.filter((t) => {
                      const d = new Date(t.createdAt).toISOString().split('T')[0];
                      return d === today;
                    });
                    handleOpenDailyDigest(today, todayList.length > 0 ? todayList : thoughts.slice(0, 5));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] shadow-xs shrink-0"
                >
                  今日复盘
                </button>
              </div>

              {/* Thought Cards List */}
              <div className="space-y-3">
                {sortedStreamThoughts.length > 0 ? (
                  sortedStreamThoughts.map((thought) => (
                    <ThoughtCard
                      key={thought.id}
                      thought={thought}
                      onEdit={(t) => {
                        setEditingThought(t);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteThought}
                      onTogglePin={handleTogglePin}
                      onRequestUnlock={handleRequestUnlock}
                      isVaultUnlocked={Boolean(masterPin)}
                      decryptedContent={decryptedCache[thought.id]}
                      onAnalyzeAi={async (t) => {
                        setEditingThought(t);
                        setIsEditorOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-2xs">
                    <p className="text-sm font-semibold text-neutral-800">暂无符合条件的想法</p>
                    <p className="text-xs text-neutral-500">点击下方绿色按钮随时记录一条灵感</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingThought(null);
                        setIsEditorOpen(true);
                      }}
                      className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>立刻记录</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <CalendarView
              thoughts={thoughts}
              onEditThought={(t) => {
                setEditingThought(t);
                setIsEditorOpen(true);
              }}
              onDeleteThought={handleDeleteThought}
              onTogglePin={handleTogglePin}
              onRequestUnlock={handleRequestUnlock}
              isVaultUnlocked={Boolean(masterPin)}
              decryptedCache={decryptedCache}
              onOpenNewThought={() => {
                setEditingThought(null);
                setIsEditorOpen(true);
              }}
              onOpenDailyDigest={handleOpenDailyDigest}
            />
          )}

          {/* TAB 3: CATEGORIES VIEW */}
          {activeTab === 'categories' && (
            <CategoryView
              thoughts={thoughts}
              onEditThought={(t) => {
                setEditingThought(t);
                setIsEditorOpen(true);
              }}
              onDeleteThought={handleDeleteThought}
              onTogglePin={handleTogglePin}
              onRequestUnlock={handleRequestUnlock}
              isVaultUnlocked={Boolean(masterPin)}
              decryptedCache={decryptedCache}
              onOpenNewThought={() => {
                setEditingThought(null);
                setIsEditorOpen(true);
              }}
            />
          )}

          {/* TAB 4: WECHAT CHAT IMPORTER */}
          {activeTab === 'wechat' && (
            <WeChatChatImporter
              onAddThoughts={handleBatchAddThoughts}
              onNavigateToThoughts={() => setActiveTab('thoughts')}
              modelConfig={modelConfig}
              onOpenModelSelector={() => setIsModelSelectorOpen(true)}
            />
          )}

          {/* TAB 5: ENCRYPTED VAULT VIEW */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {/* Vault Header Banner */}
              <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-4 rounded-2xl border border-rose-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">密码与隐私保险箱</h2>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      客户端 AES-GCM 256位加密，服务端无明文存储
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs"
                >
                  {masterPin ? '管理主密码' : '解锁 / 设置密码'}
                </button>
              </div>

              {/* Status Notice */}
              <div className="flex items-center justify-between px-1 text-xs text-neutral-600">
                <div className="flex items-center space-x-1.5">
                  {masterPin ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>保险箱已解锁（可查看私密明文）</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      <Lock className="w-3.5 h-3.5" />
                      <span>保险箱已锁定（密文保护中）</span>
                    </span>
                  )}
                </div>

                {masterPin && (
                  <button
                    type="button"
                    onClick={handleLockVault}
                    className="text-neutral-500 hover:text-neutral-800"
                  >
                    立刻上锁
                  </button>
                )}
              </div>

              {/* Encrypted Thoughts List */}
              <div className="space-y-3">
                {vaultThoughts.length > 0 ? (
                  vaultThoughts.map((thought) => (
                    <ThoughtCard
                      key={thought.id}
                      thought={thought}
                      onEdit={(t) => {
                        setEditingThought(t);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteThought}
                      onTogglePin={handleTogglePin}
                      onRequestUnlock={handleRequestUnlock}
                      isVaultUnlocked={Boolean(masterPin)}
                      decryptedContent={decryptedCache[thought.id]}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-800">暂无加密想法或密码凭据</p>
                    <p className="text-xs text-neutral-500">
                      在新建想法时勾选“启用密码/隐私加密”，即可收纳至此保险箱
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingThought(null);
                        setIsEditorOpen(true);
                      }}
                      className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新建加密隐私记录</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) for Instant Capture */}
        <button
          id="fab-new-thought"
          type="button"
          onClick={() => {
            setEditingThought(null);
            setIsEditorOpen(true);
          }}
          className="fixed bottom-18 right-4 sm:right-auto sm:translate-x-120 sm:left-1/2 z-40 w-12 h-12 rounded-full bg-[#07c160] hover:bg-[#06ad56] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          title="快速记录新想法"
          aria-label="快速记录新想法"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Bottom TabBar */}
        <TabBar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenCreate={() => {
            setEditingThought(null);
            setIsEditorOpen(true);
          }}
          vaultUnlocked={Boolean(masterPin)}
        />

        {/* Modals */}
        <ThoughtEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingThought(null);
            setEditorInitialContent('');
          }}
          onSave={handleSaveThought}
          editingThought={
            editingThought ||
            (editorInitialContent
              ? ({
                  id: '',
                  title: '',
                  content: editorInitialContent,
                  category: '灵感创意',
                  tags: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  source: 'direct',
                } as ThoughtItem)
              : null)
          }
          masterPin={masterPin}
          onRequestSetPin={() => setIsVaultModalOpen(true)}
          modelConfig={modelConfig}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        />

        <VaultManagerModal
          isOpen={isVaultModalOpen}
          onClose={() => setIsVaultModalOpen(false)}
          masterPin={masterPin}
          onUnlockSuccess={handleVaultUnlockSuccess}
          onLockVault={handleLockVault}
          isUnlocked={Boolean(masterPin)}
        />

        <DailyDigestModal
          isOpen={isDigestOpen}
          onClose={() => setIsDigestOpen(false)}
          dateStr={digestDate}
          thoughts={digestThoughts}
          modelConfig={modelConfig}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        />

        {/* AI Model Provider Switcher Modal */}
        <AIModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          currentConfig={modelConfig}
          onSaveConfig={handleUpdateModelConfig}
        />
      </div>
    </div>
  );
}
