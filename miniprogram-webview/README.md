# 想法随手记 · web-view 小程序壳 — 快速上线指南

本目录是一个**极简微信小程序壳**，仅用 `<web-view>` 内嵌已建好的 H5 应用，用于最快速度上线。
完整的小程序化差距分析见仓库根目录 `小程序上线差距分析.md`。

## 一、前置硬门槛（必须先把资质搞定）
1. 小程序账号必须是 **企业 / 组织 / 媒体 / 政府** 类型 —— **个人账号无法使用 `<web-view>`**（这是平台规则，不是配置问题）。
2. 一个 **已完成 ICP 备案** 的 **HTTPS** 域名，用于承载 H5。
3. 后端/H5 可公网访问（项目已自带 `Dockerfile` + Express，可直接部署）。

## 二、上线步骤

### 1. 部署 H5 到 HTTPS 域名
```bash
docker build -t thoughts-snap-note .
docker run -d -p 3000:3000 --name tsn -e DEEPSEEK_API_KEY="你的key" thoughts-snap-note
```
- 建议用 Nginx 反代并配置 SSL（Let's Encrypt 免费证书）。
- 或直接使用「微信云托管 CloudBase」：绑定仓库自动构建、免备案/免运维，拿到合规 HTTPS 域名。

### 2. 配置微信业务域名（关键）
- 微信公众平台 → **开发管理 → 开发设置 → 业务域名**，添加你的域名。
- 下载校验文件 `MP_verify_xxxx.txt`，放到 H5 仓库的 **`public/`** 目录后重新 `npm run build` 部署。
  - Vite 会把 `public/` 原样拷贝到 `dist/` 根，Express 静态服务即可在 `https://域名/MP_verify_xxxx.txt` 提供校验。

### 3. 打开壳工程并填两项
- 微信开发者工具 → 导入项目 → 选择本 `miniprogram-webview/` 目录。
- 改 `project.config.json` 的 `appid` 为你的真实 AppID（`touristappid` 只能预览、不能上传）。
- 改 `config.js` 的 `H5_URL` 为你的真实 HTTPS 域名。

### 4. 预览验证
- 真机预览，确认 H5 正常加载、AI 调用、加密保险箱可用（web-view 内 `Web Crypto`/`localStorage` **可用**）。
- ⚠️ 语音速记（浏览器 `SpeechRecognition`）在 web-view 内**不可用**，先以键盘输入兜底。

### 5. 上传 & 提审
- 开发者工具点「上传」，填版本号与备注。
- 公众平台 → 版本管理 → 提交审核，类目选「**工具 - 备忘录/笔记**」。
- 审核通常 **1–3 天**，通过后「全量发布」。

## 三、web-view 方案的已知限制（决定你后续要不要做原生）
- ❌ 朋友圈分享（`onShareTimeline`）不可用
- ❌ 订阅消息 / 微信支付 / 客服会话不可用
- ⚠️ 微信聊天「一键导入」依赖剪贴板：web-view 内浏览器剪贴板 API 可能受限，建议用户长按粘贴，或后续用微信 JSSDK `wx.getClipboardData` 增强
- ⚠️ 转发好友/群的分享卡片内容较单调，无法携带 H5 内动态内容

## 四、下一步（获得用户增长）
- 走原生小程序：从 `app.json` + 存储层移植 + 加密保险箱重写开始，补齐朋友圈分享 / 订阅消息 / 语音录入（详见根目录分析报告「阶段 2」）。
