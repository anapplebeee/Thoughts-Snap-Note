const { getModelConfig, saveModelConfig, loadThoughts } = require('../../utils/storage');

const PROVIDERS = ['deepseek', 'glm', 'custom'];
const NAMES = ['DeepSeek', '智谱 GLM', '自定义 OpenAI 兼容'];

Page({
  data: {
    providerNames: NAMES,
    providerIndex: 0,
    provider: 'deepseek',
    apiKey: '',
    baseUrl: '',
    modelName: ''
  },

  onLoad() {
    const cfg = getModelConfig() || {};
    const idx = Math.max(0, PROVIDERS.indexOf(cfg.provider || 'deepseek'));
    this.setData({
      providerIndex: idx,
      provider: cfg.provider || 'deepseek',
      apiKey: cfg.apiKey || '',
      baseUrl: cfg.baseUrl || '',
      modelName: cfg.modelName || ''
    });
  },

  onProviderChange(e) {
    const i = Number(e.detail.value);
    this.setData({ providerIndex: i, provider: PROVIDERS[i] });
  },
  onKeyInput(e) { this.setData({ apiKey: e.detail.value }); },
  onUrlInput(e) { this.setData({ baseUrl: e.detail.value }); },
  onModelInput(e) { this.setData({ modelName: e.detail.value }); },

  onSaveCfg() {
    saveModelConfig({
      provider: this.data.provider,
      apiKey: (this.data.apiKey || '').trim(),
      baseUrl: (this.data.baseUrl || '').trim(),
      modelName: (this.data.modelName || '').trim()
    });
    wx.showToast({ title: '已保存（仅本机）', icon: 'success' });
  },

  onExport() {
    const data = JSON.stringify(loadThoughts(), null, 2);
    wx.setClipboardData({
      data,
      success: () => wx.showToast({ title: '已复制 JSON', icon: 'success' })
    });
  },

  onShareAppMessage() {
    return { title: '想法随手记 · 极速灵感记录与 AI 整理', path: '/pages/index/index' };
  }
});
