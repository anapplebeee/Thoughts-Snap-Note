const { loadThoughts } = require('../../utils/storage');

Page({
  data: { cats: [], filter: '', filtered: [] },

  onShow() {
    this.build();
  },

  build() {
    const list = loadThoughts();
    const count = {};
    list.forEach((t) => { count[t.category] = (count[t.category] || 0) + 1; });
    const cats = Object.keys(count)
      .map((name) => ({ name, count: count[name] }))
      .sort((a, b) => b.count - a.count);
    this.setData({ cats, filtered: this.applyFilter(list, this.data.filter) });
  },

  applyFilter(list, f) {
    return f ? list.filter((t) => t.category === f) : list;
  },

  onPick(e) {
    const name = e.currentTarget.dataset.name;
    const f = this.data.filter === name ? '' : name;
    this.setData({ filter: f, filtered: this.applyFilter(loadThoughts(), f) });
  },

  onShareAppMessage() {
    return { title: '想法随手记 · 分类检索', path: '/pages/category/category' };
  }
});
