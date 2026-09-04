// 本地存储层（原生小程序：wx.getStorageSync / wx.setStorageSync）
const KEY_THOUGHTS = 'tsn_thoughts';
const KEY_MODEL = 'tsn_model_config';

function loadThoughts() {
  return wx.getStorageSync(KEY_THOUGHTS) || [];
}
function saveThoughts(arr) {
  wx.setStorageSync(KEY_THOUGHTS, arr);
}
function getModelConfig() {
  return wx.getStorageSync(KEY_MODEL) || { provider: 'deepseek', apiKey: '' };
}
function saveModelConfig(cfg) {
  wx.setStorageSync(KEY_MODEL, cfg);
}
function uid() {
  return 't_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
}
module.exports = { KEY_THOUGHTS, KEY_MODEL, loadThoughts, saveThoughts, getModelConfig, saveModelConfig, uid };
