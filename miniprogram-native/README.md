# 想法随手记 · 原生小程序（参赛版）

微信原生小程序实现，用于参赛提交。不依赖 `<web-view>`，**个人主体账号即可发布**。

## 目录结构
```
miniprogram-native/
├── app.js / app.json / app.wxss   # 全局配置（tabBar 五页）
├── project.config.json            # 开发者工具工程配置
├── sitemap.json
├── utils/
│   ├── request.js                 # 统一网络层（BASE_URL 需替换）
│   ├── storage.js                 # wx.getStorageSync 存储层
│   ├── crypto.js                  # 端到端加密（crypto-js AES）
│   └── crypto-js.min.js           # vendored（MIT）
└── pages/
    ├── index/      # 记录：极速记录卡片 + 列表 + AI 整理 + 编辑弹层
    ├── calendar/   # 日历：按日分组回顾
    ├── category/   # 分类：聚合计数 + 点击筛选
    ├── vault/      # 保险箱：PIN + AES 加密 / 解密 / 随机密码
    └── settings/   # 设置：模型提供商与 Key（仅存本机）、数据导出
```

## 快速上手
1. **导入工程**：微信开发者工具 → 导入项目 → 选择本 `miniprogram-native/` 目录。
2. **替换 AppID**：把 `project.config.json` 的 `appid` 从 `touristappid` 改为你的真实 AppID（`mp.weixin.qq.com` → 开发管理 → 开发设置）。
3. **配置后端域名**：把 `utils/request.js` 的 `BASE_URL` 改为你的后端 HTTPS 域名，并在微信公众平台「开发设置 → 服务器域名 → request 合法域名」加入该域名。
   - 后端即本仓库根目录的 Express 服务（`server.ts`），提供 `/api/ai/*` 接口。
4. **配置模型 Key**：小程序「设置」页选择 DeepSeek / 智谱 GLM / 自定义并填 Key（仅存本机 storage，不上传服务端）。
5. **上传提审**：开发者工具「上传」→ 公众平台「版本管理」→ 提交审核，类目选「工具 - 备忘录/笔记」。
6. **生成二维码**：审核通过发布后，用「小程序码」；提审阶段可用「体验版二维码」。

## 功能说明（与 H5 版对应）
- 极速记录：首页置顶卡片 + 快捷胶囊（突发灵感/待办/读书/记账/密码），保存时调 `/api/ai/classify-and-summarize` 自动出标题/分类/标签/摘要；**无 Key 或网络失败时本地兜底**。
- 加密保险箱：`crypto-js` AES（OpenSSL 兼容 KDF 自动加盐）+ PIN；服务端与本地均只存密文，解密仅在本机完成。
- 数据导出：设置页一键复制全部记录 JSON。

## 已知限制 / 后续计划
- **语音录入暂未实现**：原生需 `wx.getRecorderManager()` + 微信同声传译插件或自建 ASR；当前版本以键盘输入兜底。
- 模型连通性测试、每日 AI 复盘（`/api/ai/daily-digest`）、微信聊天记录萃取页后续接入。
- 图片/附件、备份导入恢复待补。

## 参赛提交材料对照
| 大赛要求 | 状态 |
|---|---|
| 作品名称 | 想法随手记（WeChat Thought Note） |
| AppID | 注册后填入 `project.config.json` |
| 小程序二维码 | 上传/发布后在公众平台生成 |
| 说明文档 PDF | 见仓库 `submission/小程序说明文档.pdf` |
| 参赛授权书 | 大赛官网下载模板 → 填写签署 |
| 队员身份证件 | 团队自行准备 |
