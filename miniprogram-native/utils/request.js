// 统一网络请求层（原生小程序）
// 注意：BASE_URL 必须替换为你的后端 HTTPS 域名，并在微信公众平台「request 合法域名」中加入
const BASE_URL = 'https://your-api-domain.com'; // TODO: 替换为你的后端 HTTPS 域名

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'POST',
      data: options.data || {},
      timeout: 30000,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject({ code: res.statusCode, message: (res.data && res.data.error) || '请求失败' });
      },
      fail: (err) => reject({ code: -1, message: (err && err.errMsg) || '网络错误' })
    });
  });
}

// 调用 AI 接口；失败返回 null，由页面做本地兜底
async function callAI(url, payload) {
  try {
    return await request({ url, data: payload });
  } catch (e) {
    return null;
  }
}

module.exports = { BASE_URL, request, callAI };
