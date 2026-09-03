import { useState, useMemo } from 'react';
import { Layers, Search, Plus, Filter, Tag } from 'lucide-react';
import { ThoughtItem, CategoryType } from '../types';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import { ThoughtCard } from './ThoughtCard';

interface CategoryViewProps {
  thoughts: ThoughtItem[];
  onEditThought: (thought: ThoughtItem) => void;
  onDeleteThought: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRequestUnlock: (thought: ThoughtItem) => void;
  isVaultUnlocked: boolean;
  decryptedCache: Record<string, string>;
  onOpenNewThought: () => void;
}

export function CategoryView({
  thoughts,
  onEditThought,
  onDeleteThought,
  onTogglePin,
  onRequestUnlock,
  isVaultUnlocked,
  decryptedCache,
  onOpenNewThought,
}: CategoryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Counts per category
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.key] = 0;
    }
    for (const t of thoughts) {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      } else {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    }
    return counts;
  }, [thoughts]);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of thoughts) {
      if (t.tags) {
        for (const tg of t.tags) set.add(tg);
      }
    }
    return Array.from(set);
  }, [thoughts]);

  // Filtered thoughts
  const filteredThoughts = useMemo(() => {
    return thoughts.filter((t) => {
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
        return false;
      }
      if (selectedTag && (!t.tags || !t.tags.includes(selectedTag))) {
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
  }, [thoughts, selectedCategory, selectedTag, searchQuery]);

  return (
    <div id="category-view" className="space-y-4">
      {/* Category Grid Cards */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#07c160]/10 flex items-center justify-center text-[#07c160]">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-neutral-900">多维知识与灵感分类</h2>
          </div>
          <span className="text-xs text-neutral-500">共 {thoughts.length} 条记录</span>
        </div>

        {/* All vs Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* "ALL" Chip */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedTag(null);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-base">🗂️</span>
              <span className="text-xs font-semibold">全部想法</span>
            </div>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {thoughts.length}
            </span>
          </button>

          {/* Specific Categories */}
          {CATEGORIES.map((cat) => {
            const count = categoryStats[cat.key] || 0;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSelectedTag(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#07c160] text-white border-[#07c160] shadow-xs'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs font-semibold truncate">{cat.label}</span>
                </div>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1 ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag Cloud Bar */}
        {allTags.length > 0 && (
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center space-x-1 text-xs text-neutral-500 mb-1.5">
              <Tag className="w-3 h-3 text-neutral-400" />
              <span>常用标签快捷筛选：</span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-emerald-600 hover:underline ml-1"
                >
                  清除标签筛选
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-[#07c160] text-white font-medium'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`在${
            selectedCategory === 'ALL' ? '全部' : selectedCategory
          }分类中搜索想法关键字或标签...`}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160] shadow-2xs"
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

      {/* Filtered Thoughts List */}
      <div className="space-y-3">
        {filteredThoughts.length > 0 ? (
          filteredThoughts.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              onEdit={onEditThought}
              onDelete={onDeleteThought}
              onTogglePin={onTogglePin}
              onRequestUnlock={onRequestUnlock}
              isVaultUnlocked={isVaultUnlocked}
              decryptedContent={decryptedCache[thought.id]}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-2xs">
            <p className="text-sm font-semibold text-neutral-800">
              当前筛选条件下暂无想法
            </p>
            <p className="text-xs text-neutral-500">
              尝试清除筛选条件，或在当前分类下新建一条想法
            </p>
            <button
              type="button"
              onClick={onOpenNewThought}
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建想法</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
