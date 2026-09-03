import { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, MoreHorizontal, Circle, Shield, Smartphone, Monitor, Download, Upload, Info, Bot, BookOpen } from 'lucide-react';
import { DeploymentGuideModal } from './DeploymentGuideModal';

interface WeChatNavbarProps {
  title?: string;
  isDesktopView: boolean;
  onToggleDesktopView: () => void;
  onOpenVaultSettings: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onOpenModelSelector?: () => void;
  currentModelName?: string;
  vaultUnlocked: boolean;
}

export function WeChatNavbar({
  title = '想法随手记',
  isDesktopView,
  onToggleDesktopView,
  onOpenVaultSettings,
  onExportData,
  onImportData,
  onOpenModelSelector,
  currentModelName = 'Gemini',
  vaultUnlocked,
}: WeChatNavbarProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header id="wechat-header" className="sticky top-0 z-40 bg-[#ededed] border-b border-[#e2e2e2] select-none">
        {/* Mobile Status Bar */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs text-neutral-800 font-medium">
          <span className="tracking-tight">{currentTime || '09:41'}</span>
          <div className="flex items-center space-x-1.5 opacity-80">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <div className="flex items-center space-x-0.5">
              <span className="text-[10px]">100%</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Mini Program Navigation & Capsule Bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#07c160] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              想
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-900 leading-tight tracking-tight">
                {title}
              </h1>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={onOpenModelSelector}
                  className="text-[10px] text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 px-1.5 py-0.2 rounded font-medium flex items-center space-x-0.5 transition-colors"
                  title="点击切换 AI 大模型 (DeepSeek / GLM / Gemini)"
                >
                  <Bot className="w-2.5 h-2.5" />
                  <span>{currentModelName}</span>
                </button>
                {vaultUnlocked ? (
                  <span className="inline-flex items-center text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700">
                    已解锁
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] px-1 py-0.2 rounded bg-neutral-200 text-neutral-600">
                    加密已就绪
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2">
            {/* Quick Model Pill */}
            {onOpenModelSelector && (
              <button
                type="button"
                onClick={onOpenModelSelector}
                className="hidden xs:flex items-center space-x-1 px-2 py-1 rounded-full bg-white/80 border border-neutral-300 text-[11px] font-medium text-neutral-700 hover:bg-white active:scale-95 transition-all shadow-2xs"
                title="切换 AI 模型"
              >
                <Bot className="w-3 h-3 text-[#07c160]" />
                <span className="max-w-[80px] truncate">{currentModelName}</span>
              </button>
            )}

            {/* WeChat Standard Capsule Button */}
            <div
              id="wechat-capsule-button"
              className="flex items-center bg-white/90 backdrop-blur-xs border border-neutral-300 rounded-full px-2 py-1 shadow-xs space-x-2"
            >
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="p-1 text-neutral-700 hover:text-neutral-900 active:scale-95 transition-transform"
                title="小程序菜单"
                aria-label="小程序菜单"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="w-px h-3.5 bg-neutral-200" />
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className="p-1 text-neutral-700 hover:text-neutral-900 active:scale-95 transition-transform"
                title="关于小程序"
                aria-label="关于小程序"
              >
                <Circle className="w-3.5 h-3.5 text-neutral-800 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Capsule Action Sheet Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-neutral-100 m-0 sm:m-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-medium text-neutral-500">小程序功能选项</span>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 p-1"
              >
                关闭
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {onOpenModelSelector && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenModelSelector();
                  }}
                  className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-sm border border-emerald-200 col-span-2"
                >
                  <Bot className="w-4 h-4 text-[#07c160]" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>切换 AI 大模型 (DeepSeek / GLM / Gemini)</span>
                    <span className="text-xs font-bold text-[#07c160]">{currentModelName}</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onToggleDesktopView();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm border border-neutral-200/60"
              >
                {isDesktopView ? (
                  <>
                    <Smartphone className="w-4 h-4 text-[#07c160]" />
                    <span>切回手机外框</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-4 h-4 text-[#07c160]" />
                    <span>展开宽屏浏览</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenVaultSettings();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm border border-neutral-200/60"
              >
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>加密密码设置</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportData();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm border border-neutral-200/60"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>导出全量备份</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onImportData();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm border border-neutral-200/60"
              >
                <Upload className="w-4 h-4 text-amber-600" />
                <span>恢复备份数据</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeploymentGuide(true);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 text-sm border border-emerald-200 col-span-2"
              >
                <BookOpen className="w-4 h-4 text-[#07c160]" />
                <div className="flex-1 flex items-center justify-between">
                  <span>小程序部署指引 & README</span>
                  <span className="text-[11px] font-semibold text-[#07c160]">查看教程 →</span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowAbout(true);
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 text-xs text-neutral-500 hover:text-neutral-800"
            >
              <Info className="w-3.5 h-3.5" />
              <span>关于本微信小程序架构说明</span>
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 border border-neutral-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#07c160] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                想
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">微信想法随手记小程序</h3>
                <p className="text-xs text-neutral-500">v1.2.0 · AI大模型增强版</p>
              </div>
            </div>

            <div className="text-xs text-neutral-600 space-y-2 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
              <p>🎯 <strong>功能完备性：</strong></p>
              <ul className="list-disc list-inside space-y-1 text-neutral-700">
                <li>随时随地记录碎片想法（支持一键模板与语音录入）</li>
                <li>接入 DeepSeek / 智谱 GLM / Gemini 大模型，自动归档分类</li>
                <li>日历视图与多维度分类库，支持日期溯源与每日AI复盘</li>
                <li>微信聊天记录与转发内容一键智能提炼成想法</li>
                <li>端到端 AES-GCM 密码与敏感隐私保险箱</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowAbout(false);
                  setShowDeploymentGuide(true);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#07c160] border border-[#07c160]/30 font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>查看小程序部署指引 (Web-view / 云托管 / Docker)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="w-full py-2.5 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white font-medium text-sm transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Guide Modal */}
      <DeploymentGuideModal
        isOpen={showDeploymentGuide}
        onClose={() => setShowDeploymentGuide(false)}
      />
    </>
  );
}
