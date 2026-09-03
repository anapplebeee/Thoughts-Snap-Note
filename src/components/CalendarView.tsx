import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { ThoughtItem } from '../types';
import { ThoughtCard } from './ThoughtCard';

interface CalendarViewProps {
  thoughts: ThoughtItem[];
  onEditThought: (thought: ThoughtItem) => void;
  onDeleteThought: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRequestUnlock: (thought: ThoughtItem) => void;
  isVaultUnlocked: boolean;
  decryptedCache: Record<string, string>;
  onOpenNewThought: () => void;
  onOpenDailyDigest: (dateStr: string, dateThoughts: ThoughtItem[]) => void;
}

export function CalendarView({
  thoughts,
  onEditThought,
  onDeleteThought,
  onTogglePin,
  onRequestUnlock,
  isVaultUnlocked,
  decryptedCache,
  onOpenNewThought,
  onOpenDailyDigest,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Group thoughts by date YYYY-MM-DD
  const thoughtsByDate = useMemo(() => {
    const map = new Map<string, ThoughtItem[]>();
    for (const t of thoughts) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [thoughts]);

  // Generate days in month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empties
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: '' });
    }
    // Days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr });
    }
    return days;
  }, [currentMonth]);

  const selectedThoughts = useMemo(() => {
    return thoughtsByDate.get(selectedDateStr) || [];
  }, [thoughtsByDate, selectedDateStr]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div id="calendar-view" className="space-y-4">
      {/* Calendar Card */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#07c160]/10 flex items-center justify-center text-[#07c160]">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-neutral-900">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h2>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentMonth(now);
                setSelectedDateStr(todayStr);
              }}
              className="text-xs px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 mr-1"
            >
              今天
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day of Week labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-400 mb-1.5">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((item, idx) => {
            if (!item.dayNumber) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }
            const isSelected = item.dateStr === selectedDateStr;
            const isToday = item.dateStr === todayStr;
            const count = thoughtsByDate.get(item.dateStr)?.length || 0;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`relative h-9 flex flex-col items-center justify-center rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#07c160] text-white font-bold shadow-xs'
                    : isToday
                    ? 'bg-neutral-100 text-[#07c160] font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>{item.dayNumber}</span>
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' : 'bg-[#07c160]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Details & AI Daily Digest Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5 text-xs text-neutral-600">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-800">{selectedDateStr}</span>
          <span>共 {selectedThoughts.length} 条记录</span>
        </div>

        {selectedThoughts.length > 0 && (
          <button
            type="button"
            onClick={() => onOpenDailyDigest(selectedDateStr, selectedThoughts)}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium hover:opacity-95 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI今日复盘总结</span>
          </button>
        )}
      </div>

      {/* Thoughts List on Selected Date */}
      {selectedThoughts.length > 0 ? (
        <div className="space-y-3">
          {selectedThoughts.map((thought) => (
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
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {selectedDateStr} 暂无记录
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              生活中的每一个闪光点，都值得随手记下来
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewThought}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-[#07c160] text-white text-xs font-semibold hover:bg-[#06ad56] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>在这天记录新想法</span>
          </button>
        </div>
      )}
    </div>
  );
}
