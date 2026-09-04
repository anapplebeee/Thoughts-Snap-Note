const { loadThoughts, saveThoughts, getModelConfig, uid } = require('../../utils/storage');
const { callAI } = require('../../utils/request');

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function decorate(list) {
  return list
    .slice()
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.createdAt - a.createdAt)
    .map((t) => Object.assign({}, t, { dateText: fmtDate(t.createdAt) }));
}

Page({
  data: {
    draft: '',
    draftCategory: '',
    thoughts: [],
    saving: false,
    editing: null,
    editContent: ''
  },

  onShow() {
    this.setData({ thoughts: decorate(loadThoughts()) });
  },

  onDraftInput(e) {
    this.setData({ draft: e.detail.value });
  },

  onPickCat(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ draftCategory: this.data.draftCategory === cat ? '' : cat });
  },

  async onSave() {
    const content = (this.data.draft || '').trim();
    if (!content) {
      wx.showToast({ title: '先写点什么', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    const now = Date.now();
    const item = {
      id: uid(),
      title: '',
      content,
      category: this.data.draftCategory || '灵感创意',
      tags: [],
      createdAt: now,
      updatedAt: now,
      aiSummary: '',
      aiKeyPoints: []
    };

    const cfg = getModelConfig();
    const res = await callAI('/api/ai/classify-and-summarize', {
      content,
      title: '',
      modelProvider: cfg.provider || 'deepseek',
      modelConfig: cfg
    });

    if (res && res.title) {
      item.title = res.title;
      if (res.category) item.category = res.category;
      if (Array.isArray(res.tags)) item.tags = res.tags;
      if (res.summary) item.aiSummary = res.summary;
      if (Array.isArray(res.keyPoints)) item.aiKeyPoints = res.keyPoints;
    } else {
      // 本地兜底
      item.title = content.split('\n')[0].slice(0, 15) || '新想法';
      item.aiSummary = '（未配置模型 Key，已本地保存）';
    }

    const list = loadThoughts();
    list.push(item);
    saveThoughts(list);
    this.setData({ saving: false, draft: '', draftCategory: '', thoughts: decorate(list) });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onOpen(e) {
    const id = e.currentTarget.dataset.id;
    const list = loadThoughts();
    const it = list.find((t) => t.id === id);
    if (it) this.setData({ editing: id, editContent: it.content });
  },

  onCloseEdit() {
    this.setData({ editing: null, editContent: '' });
  },

  noop() {},

  onEditInput(e) {
    this.setData({ editContent: e.detail.value });
  },

  onUpdate() {
    const list = loadThoughts();
    const it = list.find((t) => t.id === this.data.editing);
    if (it) {
      it.content = this.data.editContent;
      it.updatedAt = Date.now();
      saveThoughts(list);
    }
    this.setData({ editing: null, editContent: '', thoughts: decorate(list) });
  },

  onDelete() {
    const list = loadThoughts().filter((t) => t.id !== this.data.editing);
    saveThoughts(list);
    this.setData({ editing: null, editContent: '', thoughts: decorate(list) });
  },

  onShareAppMessage() {
    return { title: '想法随手记 · 极速灵感记录与 AI 整理', path: '/pages/index/index' };
  },
  onShareTimeline() {
    return { title: '想法随手记 · 随时记录，AI 帮你整理', query: '' };
  }
});
