const { loadThoughts, getModelConfig } = require('./utils/storage');

App({
  globalData: {
    thoughts: [],
    modelConfig: null
  },

  onLaunch() {
    this.globalData.modelConfig = getModelConfig();
    let thoughts = loadThoughts();
    if (!thoughts || thoughts.length === 0) {
      // 首次启动写入一条示例，便于演示与评审体验
      thoughts = [{
        id: 't_seed_1',
        title: '欢迎使用想法随手记',
        content: '打开即写，AI 自动帮你分类、打标签、生成摘要。点底部「+」随时记录灵感。',
        category: '灵感创意',
        tags: ['欢迎'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
        aiSummary: '欢迎笔记：极速记录 + AI 智能整理。',
        aiKeyPoints: ['打开即写', 'AI 自动分类']
      }];
      wx.setStorageSync('tsn_thoughts', thoughts);
    }
    this.globalData.thoughts = thoughts;
  }
});
