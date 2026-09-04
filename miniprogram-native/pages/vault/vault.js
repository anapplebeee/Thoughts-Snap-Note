const { loadThoughts, saveThoughts, uid } = require('../../utils/storage');
const { encryptText, decryptText, randomPassword } = require('../../utils/crypto');

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function withDate(list) {
  return list.map((t) => Object.assign({}, t, { dateText: fmtDate(t.createdAt) }));
}

Page({
  data: {
    items: [],
    draft: '',
    pin: '',
    unlocking: null,
    unlockPin: '',
    unlockError: '',
    decrypted: ''
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ items: withDate(loadThoughts().filter((t) => t.isEncrypted)) });
  },

  onDraftInput(e) { this.setData({ draft: e.detail.value }); },
  onPinInput(e) { this.setData({ pin: e.detail.value }); },

  onGenPwd() {
    const pwd = randomPassword(16);
    wx.setClipboardData({
      data: pwd,
      success: () => wx.showToast({ title: '随机密码已复制', icon: 'success' })
    });
  },

  onAddEncrypted() {
    const content = (this.data.draft || '').trim();
    const pin = (this.data.pin || '').trim();
    if (!content) { wx.showToast({ title: '先填写内容', icon: 'none' }); return; }
    if (pin.length < 4 || pin.length > 8) { wx.showToast({ title: 'PIN 需 4-8 位', icon: 'none' }); return; }

    const now = Date.now();
    const item = {
      id: uid(),
      title: '加密笔记',
      content: '【已启用端到端加密】',
      category: '密码隐私',
      tags: ['密码'],
      createdAt: now,
      updatedAt: now,
      isEncrypted: true,
      encryptedPayload: encryptText(content, pin)
    };
    const list = loadThoughts();
    list.push(item);
    saveThoughts(list);
    this.setData({ draft: '', pin: '' });
    this.refresh();
    wx.showToast({ title: '已加密保存', icon: 'success' });
  },

  onUnlock(e) {
    this.setData({ unlocking: e.currentTarget.dataset.id, unlockPin: '', unlockError: '', decrypted: '' });
  },
  onCloseUnlock() { this.setData({ unlocking: null }); },
  noop() {},
  onUnlockPinInput(e) { this.setData({ unlockPin: e.detail.value }); },

  onConfirmUnlock() {
    const it = loadThoughts().find((t) => t.id === this.data.unlocking);
    if (!it) return;
    const txt = decryptText(it.encryptedPayload, (this.data.unlockPin || '').trim());
    if (txt === null) {
      this.setData({ unlockError: 'PIN 错误或解密失败' });
      return;
    }
    this.setData({ decrypted: txt, unlockError: '' });
  },

  onDeleteVault() {
    const list = loadThoughts().filter((t) => t.id !== this.data.unlocking);
    saveThoughts(list);
    this.setData({ unlocking: null, decrypted: '' });
    this.refresh();
  },

  onShareAppMessage() {
    return { title: '想法随手记 · 端到端加密保险箱', path: '/pages/vault/vault' };
  }
});
