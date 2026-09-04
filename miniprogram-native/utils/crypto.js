// 端到端加密保险箱（原生小程序重写版）
// 小程序逻辑层没有 window.crypto，使用 crypto-js 实现 AES（OpenSSL 兼容 KDF，自动加盐）
const CryptoJS = require('./crypto-js.min.js');

function encryptText(text, pin) {
  return CryptoJS.AES.encrypt(String(text), pin).toString();
}

function decryptText(cipher, pin) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, pin);
    const t = bytes.toString(CryptoJS.enc.Utf8);
    return t || null; // 解密失败（PIN 错误）返回 null
  } catch (e) {
    return null;
  }
}

function randomPassword(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let s = '';
  for (let i = 0; i < (len || 16); i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

module.exports = { encryptText, decryptText, randomPassword };
