import { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  generateStrongPassword,
  evaluatePasswordStrength,
  encryptText,
  decryptText,
} from '../utils/crypto';
import { setupMasterPin, verifyMasterPin } from '../utils/storage';

interface VaultManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPin: string | null;
  onUnlockSuccess: (pin: string) => void;
  onLockVault: () => void;
  isUnlocked: boolean;
}

export function VaultManagerModal({
  isOpen,
  onClose,
  masterPin,
  onUnlockSuccess,
  onLockVault,
  isUnlocked,
}: VaultManagerModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password Generator Tool
  const [genLength, setGenLength] = useState(16);
  const [genPassword, setGenPassword] = useState(() => generateStrongPassword(16));
  const [copied, setCopied] = useState(false);
  const [showGenPassword, setShowGenPassword] = useState(true);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    setErrorMessage('');
    if (!pinInput.trim()) {
      setErrorMessage('请输入保险箱主密码');
      return;
    }

    const ok = await verifyMasterPin(pinInput.trim());
    if (ok) {
      onUnlockSuccess(pinInput.trim());
      setSuccessMessage('保险箱已成功解锁！');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage('主密码错误，请重试（初始预设密码为 123456）');
    }
  };

  const handleSaveNewPin = async () => {
    setErrorMessage('');
    if (pinInput.length < 4) {
      setErrorMessage('密码长度至少需要4位');
      return;
    }
    if (pinInput !== pinConfirm) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    const success = await setupMasterPin(pinInput);
    if (success) {
      onUnlockSuccess(pinInput);
      setSuccessMessage('主密码已成功设置并解锁！');
      setIsSettingNewPin(false);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage('密码设置失败，请重试');
    }
  };

  const handleRegenPassword = () => {
    const pwd = generateStrongPassword(genLength);
    setGenPassword(pwd);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(genPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const strength = evaluatePasswordStrength(genPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">端到端密码与隐私保险箱</h2>
              <span className="text-xs text-neutral-500">AES-GCM 256位客户端加密保护</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Vault Status */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-semibold text-neutral-800">
                  当前保险箱状态: {isUnlocked ? '已解锁' : '已锁定'}
                </span>
              </div>

              {isUnlocked ? (
                <button
                  type="button"
                  onClick={onLockVault}
                  className="px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-medium"
                >
                  立即上锁
                </button>
              ) : (
                <span className="text-[11px] text-neutral-500">输入主密码解锁</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              受保护的密码、凭证与隐私想法已在本地由密钥散列加密。即便数据库导出，未获主密码者亦无法读取明文。
            </p>
          </div>

          {/* Unlock / Set PIN Area */}
          {!isUnlocked && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800">
                  {isSettingNewPin ? '设置新的保险箱主密码' : '输入主密码解锁'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingNewPin(!isSettingNewPin);
                    setErrorMessage('');
                    setPinInput('');
                    setPinConfirm('');
                  }}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  {isSettingNewPin ? '已有密码？点击直接解锁' : '修改 / 重置主密码'}
                </button>
              </div>

              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={isSettingNewPin ? '输入4位以上主密码' : '请输入主密码 (预设为 123456)'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160]"
              />

              {isSettingNewPin && (
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="再次确认新主密码"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160]"
                />
              )}

              <button
                type="button"
                onClick={isSettingNewPin ? handleSaveNewPin : handleUnlock}
                className="w-full py-2.5 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {isSettingNewPin ? '保存并启用新主密码' : '验证并解锁'}
              </button>
            </div>
          )}

          {/* Strong Password Generator Utility */}
          <div className="pt-3 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-900">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>内置安全强密码生成器</span>
              </div>
              <button
                type="button"
                onClick={handleRegenPassword}
                className="inline-flex items-center space-x-1 text-xs text-neutral-600 hover:text-neutral-900"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重新生成</span>
              </button>
            </div>

            {/* Generated Output */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono text-xs truncate mr-2">
                <span className="font-bold text-neutral-900 select-all">
                  {showGenPassword ? genPassword : '••••••••••••••••'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${strength.color}`}>
                  {strength.label}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowGenPassword(!showGenPassword)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md"
                  title={showGenPassword ? '隐藏' : '显示'}
                >
                  {showGenPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Length slider */}
            <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
              <span>密码长度: {genLength} 位</span>
              <input
                type="range"
                min={8}
                max={32}
                value={genLength}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGenLength(val);
                  setGenPassword(generateStrongPassword(val));
                }}
                className="w-32 accent-[#07c160]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
