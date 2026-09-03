import { Lightbulb, Calendar, Layers, MessageSquare, Shield, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface TabBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenCreate: () => void;
  vaultUnlocked: boolean;
}

export function TabBar({ activeTab, onChangeTab, onOpenCreate, vaultUnlocked }: TabBarProps) {
  const leftTabs: { key: ActiveTab; label: string; icon: any; badge?: boolean }[] = [
    { key: 'thoughts', label: '想法', icon: Lightbulb },
    { key: 'calendar', label: '日历', icon: Calendar },
  ];

  const rightTabs: { key: ActiveTab; label: string; icon: any; badge?: boolean }[] = [
    { key: 'categories', label: '分类', icon: Layers },
    { key: 'wechat', label: '导入', icon: MessageSquare },
    { key: 'vault', label: '保险箱', icon: Shield, badge: !vaultUnlocked },
  ];

  return (
    <div
      id="wechat-tab-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#f7f7f7]/95 backdrop-blur-md border-t border-[#e2e2e2] max-w-lg mx-auto select-none"
    >
      <div className="flex items-center justify-between px-2 py-1 relative">
        {/* Left Tabs */}
        <div className="flex-1 flex items-center justify-around">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative active:scale-95 ${
                  isActive ? 'text-[#07c160]' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Prominent Quick Add Button */}
        <div className="px-2 shrink-0 -mt-4">
          <button
            type="button"
            onClick={onOpenCreate}
            className="w-12 h-12 rounded-full bg-[#07c160] hover:bg-[#06ad56] text-white flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform ring-4 ring-[#ededed]"
            title="快捷记录灵感"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Tabs */}
        <div className="flex-1 flex items-center justify-around">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative active:scale-95 ${
                  isActive ? 'text-[#07c160]' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
