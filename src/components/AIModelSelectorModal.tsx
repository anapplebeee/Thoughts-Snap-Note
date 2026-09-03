import { useState, useEffect } from 'react';
import {
  Bot,
  Check,
  Key,
  ShieldCheck,
  Zap,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AIModelProvider, AIModelConfig } from '../types';

interface AIModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AIModelConfig;
  onSaveConfig: (config: AIModelConfig) => void;
}

interface ModelMeta {
  id: AIModelProvider;
  name: string;
  badge: string;
  provider: string;
  costDesc: string;
  description: string;
  recommendedReason: string;
  portalUrl?: string;
  portalName?: string;
  keyPrefixHint?: string;
  defaultBaseUrl?: string;
  defaultModel?: string;
}

const MODEL_OPTIONS: ModelMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini 3.8 Flash',
    badge: '顶尖推理·多模态',
    provider: 'Google DeepMind',
    costDesc: '官方免费额度高 / 平台托管',
    description: '综合智能水平顶尖，理解上下文准确，速度极快。',
    recommendedReason: '可填入自主申请的 Google API Key，亦可留空使用内置托管。',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    portalName: '前往 Google AI Studio 免费获取 Key',
    keyPrefixHint: '通常以 AIzaSy... 开头',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek-V3 / R1',
    badge: '超高性价比·中文强',
    provider: '杭州深度求索 (DeepSeek)',
    costDesc: '约 ¥1~2 / 100万 Tokens',
    description: '逻辑推理能力卓越，中文语境理解地道，价格极为亲民实惠。',
    recommendedReason: '个人用户首选，几元钱即可处理海量灵感与归纳提炼。',
    portalUrl: 'https://platform.deepseek.com/api_keys',
    portalName: '前往 DeepSeek 开放平台获取 Key',
    keyPrefixHint: '以 sk-... 开头',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'glm',
    name: '智谱 GLM-4-Flash',
    badge: '国内备案·毫秒级极速',
    provider: '智谱 AI (Zhipu BigModel)',
    costDesc: '官方新用户免费额度丰厚',
    description: '国内完全合规备案，网络直连稳定，响应毫秒级，速度飞快。',
    recommendedReason: '国内网络直连首选，无需任何网络代理，新用户免费赠送额度。',
    portalUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    portalName: '前往智谱开放平台获取 Key',
    keyPrefixHint: '智谱开放平台 API Key',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    defaultModel: 'glm-4-flash',
  },
  {
    id: 'custom',
    name: '自定义 OpenAI / OneAPI',
    badge: '协议兼容·自由定制',
    provider: 'OpenAI 规范第三方/自建端点',
    costDesc: '依据自建或代理端计费',
    description: '支持接入通义千问 Qwen、Kimi、Moonshot、Ollama 本地模型或中转接口。',
    recommendedReason: '适合高级开发者接入已有的聚合网关或本地私有化大模型。',
    keyPrefixHint: '自定义端点密钥',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
];

export function AIModelSelectorModal({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}: AIModelSelectorModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIModelProvider>(currentConfig.provider);

  // Per-provider user-configured keys
  const [keys, setKeys] = useState<{
    gemini: string;
    deepseek: string;
    glm: string;
    custom: string;
  }>({
    gemini: currentConfig.keys?.gemini || '',
    deepseek: currentConfig.keys?.deepseek || '',
    glm: currentConfig.keys?.glm || '',
    custom: currentConfig.keys?.custom || currentConfig.customApiKey || '',
  });

  const [baseUrl, setBaseUrl] = useState(currentConfig.customBaseUrl || '');
  const [modelName, setModelName] = useState(currentConfig.customModelName || '');
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [serverStatus, setServerStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(currentConfig.provider);
      setKeys({
        gemini: currentConfig.keys?.gemini || '',
        deepseek: currentConfig.keys?.deepseek || '',
        glm: currentConfig.keys?.glm || '',
        custom: currentConfig.keys?.custom || currentConfig.customApiKey || '',
      });
      setBaseUrl(currentConfig.customBaseUrl || '');
      setModelName(currentConfig.customModelName || '');
      setTestStatus('idle');
      setTestMessage('');
      setShowKeyPassword(false);

      // Fetch server environment status
      fetch('/api/ai/models-status')
        .then((res) => res.json())
        .then((data) => setServerStatus(data))
        .catch(() => {});
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const currentMeta = MODEL_OPTIONS.find((m) => m.id === selectedProvider) || MODEL_OPTIONS[0];
  const currentKey = keys[selectedProvider] || '';

  const handleUpdateCurrentKey = (val: string) => {
    setKeys((prev) => ({
      ...prev,
      [selectedProvider]: val,
    }));
    // Clear test status on key edit
    if (testStatus !== 'idle') {
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  const handleClearCurrentKey = () => {
    handleUpdateCurrentKey('');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(`正在向【${currentMeta.name}】发送验证请求，校验 API Key 连通性...`);

    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          modelConfig: {
            keys,
            apiKey: currentKey.trim() || undefined,
            baseUrl: baseUrl.trim() || undefined,
            modelName: modelName.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        const keyNotice = data.isUserKey ? '（使用您自主配置的密钥）' : '（使用系统托管默认配置）';
        setTestMessage(`验证成功！${data.model} 响应正常，延迟 ${data.latency}ms ${keyNotice}`);
      } else {
        setTestStatus('failed');
        setTestMessage(data.error || '验证失败，请检查 API Key 是否正确或网络连接状态');
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`网络请求异常: ${err.message || '无法连接后端验证接口'}`);
    }
  };

  const handleSave = () => {
    const newConfig: AIModelConfig = {
      provider: selectedProvider,
      keys: {
        gemini: keys.gemini.trim() || undefined,
        deepseek: keys.deepseek.trim() || undefined,
        glm: keys.glm.trim() || undefined,
        custom: keys.custom.trim() || undefined,
      },
      customApiKey: keys[selectedProvider]?.trim() || keys.custom?.trim() || undefined,
      customBaseUrl: baseUrl.trim() || undefined,
      customModelName: modelName.trim() || undefined,
    };
    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-neutral-100 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-[#07c160] flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">AI 智能模型与密钥配置</h2>
              <p className="text-[11px] text-neutral-500">
                支持用户自主配置专属 API Key，数据保存在本地浏览器
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Section 1: Provider Selection List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#07c160]" />
                <span>选择大模型引擎</span>
              </label>
              <span className="text-[10px] text-neutral-400">点击卡片切换</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {MODEL_OPTIONS.map((model) => {
                const isSelected = selectedProvider === model.id;
                const userConfiguredKey = keys[model.id]?.trim();
                const hasEnvKey = serverStatus[model.id]?.available;

                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      setSelectedProvider(model.id);
                      setTestStatus('idle');
                      setTestMessage('');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#07c160] bg-emerald-50/40 ring-1 ring-[#07c160]/40'
                        : 'border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-neutral-900">{model.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                            {model.badge}
                          </span>

                          {/* Key status indicator */}
                          {userConfiguredKey ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold inline-flex items-center space-x-0.5">
                              <Key className="w-2.5 h-2.5" />
                              <span>已自主配 Key</span>
                            </span>
                          ) : model.id === 'gemini' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 font-medium inline-flex items-center space-x-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>可自填 / 平台托管</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-medium inline-flex items-center space-x-0.5">
                              <span>待配置 Key</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-500 leading-relaxed">{model.description}</p>
                        <div className="flex items-center space-x-2 pt-0.5">
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                            💰 {model.costDesc}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#07c160] text-white' : 'border border-neutral-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dedicated Key Configuration for Active Model */}
          <div className="bg-neutral-50/90 p-4 rounded-2xl border border-neutral-200/90 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">
                    【{currentMeta.name}】用户密钥配置
                  </h3>
                  <p className="text-[10px] text-neutral-500">{currentMeta.recommendedReason}</p>
                </div>
              </div>

              {currentMeta.portalUrl && (
                <a
                  href={currentMeta.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#07c160] hover:text-[#06ad56] font-medium inline-flex items-center space-x-1 underline underline-offset-2 shrink-0"
                  title={currentMeta.portalName}
                >
                  <span>获取 Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Key Input Box */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-neutral-700">
                    API Key (您的专属密钥)
                  </label>
                  {currentKey && (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      已输入 {currentKey.length} 位字符
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showKeyPassword ? 'text' : 'password'}
                    value={currentKey}
                    onChange={(e) => handleUpdateCurrentKey(e.target.value)}
                    placeholder={
                      selectedProvider === 'gemini'
                        ? 'AIzaSy... (请输入您的 Gemini API Key，或留空使用平台托管)'
                        : selectedProvider === 'deepseek'
                        ? 'sk-... (请输入您的 DeepSeek API Key)'
                        : selectedProvider === 'glm'
                        ? '请输入您的智谱开放平台 API Key'
                        : '请输入您的自定义 API Key'
                    }
                    className="w-full pl-3 pr-16 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 focus:border-[#07c160]"
                  />

                  <div className="absolute right-2 flex items-center space-x-1">
                    {currentKey && (
                      <button
                        type="button"
                        onClick={handleClearCurrentKey}
                        className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                        title="清空密钥"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                      title={showKeyPassword ? '隐藏明文' : '查看明文'}
                    >
                      {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">
                    {selectedProvider === 'gemini' ? (
                      currentKey ? (
                        <span className="text-emerald-600">✅ 当前使用您自填的 Gemini Key</span>
                      ) : (
                        <span className="text-neutral-400">留空时自动使用平台预置环境服务</span>
                      )
                    ) : currentKey ? (
                      <span className="text-emerald-600">✅ 密钥已填写，可点击下方“测试连通性”</span>
                    ) : (
                      <span className="text-amber-600">⚠️ 请输入个人 API Key 后使用该模型</span>
                    )}
                  </span>
                  <span className="text-neutral-400">{currentMeta.keyPrefixHint}</span>
                </div>
              </div>

              {/* Custom Provider Specific Inputs */}
              {selectedProvider === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-neutral-200/60">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                      API 基础地址 (Base URL)
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#07c160]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                      模型标识 (Model)
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="gpt-4o-mini / qwen-plus"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#07c160]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="pt-1 text-[10px] text-neutral-400 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>所有 API Key 仅加密保存在您的浏览器本地，绝不上报或存储于任何外部数据库。</span>
            </div>
          </div>

          {/* Test Status Banner */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start space-x-2.5 transition-all ${
                testStatus === 'testing'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                  : testStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-900 border border-rose-200/80'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0 mt-0.5" />}
              {testStatus === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {testStatus === 'failed' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-xs">
                  {testStatus === 'testing' ? '正在测试模型响应...' : testStatus === 'success' ? '连通性验证成功' : '验证未通过'}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">{testMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between shrink-0 space-x-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium flex items-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>测试连通性</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>保存并应用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
