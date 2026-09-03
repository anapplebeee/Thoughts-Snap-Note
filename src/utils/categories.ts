import { CategoryMeta, CategoryType } from '../types';

export const CATEGORIES: CategoryMeta[] = [
  {
    key: '灵感创意',
    label: '灵感创意',
    icon: '💡',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    textColor: 'text-amber-700',
    accentBorder: 'border-amber-400',
  },
  {
    key: '工作任务',
    label: '工作任务',
    icon: '💼',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    textColor: 'text-blue-700',
    accentBorder: 'border-blue-400',
  },
  {
    key: '学习笔记',
    label: '学习笔记',
    icon: '📖',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    textColor: 'text-purple-700',
    accentBorder: 'border-purple-400',
  },
  {
    key: '生活日常',
    label: '生活日常',
    icon: '🌿',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textColor: 'text-emerald-700',
    accentBorder: 'border-emerald-400',
  },
  {
    key: '密码隐私',
    label: '密码隐私',
    icon: '🔐',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    textColor: 'text-rose-700',
    accentBorder: 'border-rose-400',
  },
  {
    key: '财务记账',
    label: '财务记账',
    icon: '💰',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    textColor: 'text-teal-700',
    accentBorder: 'border-teal-400',
  },
  {
    key: '微信收藏',
    label: '微信收藏',
    icon: '💬',
    badgeBg: 'bg-[#e8f8f0] text-[#07c160] border-[#b5eccd]',
    textColor: 'text-[#07c160]',
    accentBorder: 'border-[#07c160]',
  },
];

export function getCategoryMeta(catName: string): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === catName);
  if (found) return found;
  return {
    key: catName as CategoryType,
    label: catName || '随想',
    icon: '📝',
    badgeBg: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    textColor: 'text-neutral-700',
    accentBorder: 'border-neutral-400',
  };
}
