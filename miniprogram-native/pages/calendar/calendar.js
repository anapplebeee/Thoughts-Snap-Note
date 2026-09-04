const { loadThoughts } = require('../../utils/storage');

function pad(n) { return n < 10 ? '0' + n : '' + n; }

Page({
  data: { groups: [] },

  onShow() {
    this.build();
  },

  build() {
    const list = loadThoughts().slice().sort((a, b) => b.createdAt - a.createdAt);
    const map = {};
    list.forEach((t) => {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      (map[key] = map[key] || []).push(t);
    });
    const groups = Object.keys(map).sort().reverse().map((date) => ({ date, items: map[date] }));
    this.setData({ groups });
  },

  onShareAppMessage() {
    return { title: '想法随手记 · 日历回顾', path: '/pages/calendar/calendar' };
  },
  onShareTimeline() {
    return { title: '想法随手记 · 每天都有新想法', query: '' };
  }
});
