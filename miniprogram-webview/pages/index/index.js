const { H5_URL } = require('../../config.js');

Page({
  data: {
    url: H5_URL
  },

  onLoad(options) {
    // 可在此根据启动参数（如扫码 scene）拼接不同入口，例如：
    // if (options.scene) this.setData({ url: `${H5_URL}?from=scan&s=${options.scene}` });
  },

  // 允许转发给微信好友 / 群（web-view 页面支持转发，但分享卡片内容较单调）
  // 注意：web-view 方案无法使用 onShareTimeline（朋友圈分享），需原生版补齐
  onShareAppMessage() {
    return {
      title: '想法随手记 · 极速灵感记录与 AI 整理',
      path: '/pages/index/index'
    };
  }
});
