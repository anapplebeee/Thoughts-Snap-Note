# 微信想法随手记 (WeChat Thought Note) · AI 大模型增强版

> 一款专为微信生态与快节奏移动记录打造的智能随手记 Web/小程序应用。  
> 集成了 **极速灵感闪记**、**多大模型热切换 (DeepSeek / 智谱 GLM / Gemini / 自定义)**、**日历与分类视图**、**微信聊天记录智能萃取** 以及 **端到端 AES-GCM 隐私保险箱**。

---

## 🌟 核心特性

1. **⚡ 随时随地极速灵感记录**
   - **首页置顶常驻极速卡片**：无需繁琐点击，打开即写；内置 `⚡突发灵感`、`📋今日待办`、`💡读书随感`、`💰记一笔账`、`🔒密码备忘` 快捷模板胶囊；
   - **一键语音录入**：支持移动端口述听写，秒转文字；
   - **快捷键秒存**：支持 `Ctrl + Enter` (或 `Cmd + Enter`) 快速沉淀；
   - **底部中置高光加号**：符合经典微信小程序导航手势，单手大拇指随触随记。

2. **🤖 多大模型统一接入与任意切换（支持用户自主配 Key）**
   - **支持终端用户自主配置 API Key**：用户可在前端界面直接录入自己的 DeepSeek / 智谱 GLM / Gemini / OpenAI Key，完全无需依赖服务端环境变量；
   - **密钥纯本地安全存储**：API Key 仅保存在用户浏览器本地（Local Storage），杜绝密钥泄露风险；
   - **实时连通性验证**：内置「测试连通性」测速与鉴权功能，毫秒级反馈 Key 的有效性与模型延迟；
   - **DeepSeek**：高性价比与极佳中文思维推理能力（默认 `deepseek-chat` / DeepSeek-V3）；
   - **智谱 GLM-4**：中文语义分类、结构化提取与高并发处理（默认 `glm-4-flash`）；
   - **Google Gemini**：原生内置 Google Gemini 3.8 Flash（支持自主填 Key 或使用平台内置托管）；
   - **自定义 OpenAI 兼容接口**：支持任意第三方 API 中转站、本地 Ollama、OneAPI 或私有大模型服务；
   - **AI 智能赋能**：自动萃取标题、智能打标签归类、敏感凭据自动预警、笔记润色与结构化排版、每日想法汇总复盘。

3. **💬 微信聊天记录一键导入萃取**
   - 从微信好友/微信群复制聊天记录，一键粘贴；
   - 大模型自动剔除寒暄噪音，结构化提炼出可执行的待办（TODO）、灵感点子、重要通知与知识摘要。

4. **🔒 零知识端到端加密保险箱 (AES-GCM)**
   - 个人密码、银行账户、隐私日记等高敏感内容在浏览器端使用 Web Crypto API 原生 AES-GCM 加密；
   - 密钥仅保存在用户脑海中的 4-8 位 PIN 码，服务端及存储介质无法解密，彻底杜绝数据泄露风险；
   - 内置高强度随机密码生成器与密码安全强度评估。

5. **📅 多维时间轴与数据自由**
   - **日历视图**：直观查看每天记录数量与时间分布，支持按日一键生成 **AI 日报总结**；
   - **分类检索与标签聚合**：支持灵感、工作、学习、财务、生活、微信收藏、隐私等分类；
   - **离线可用与数据导入导出**：支持 JSON 完整数据备份导出与一键恢复。

---

## 🛠️ 技术架构

- **前端技术栈**：React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion
- **后端技术栈**：Node.js + Express + `@google/genai` + `openai` SDK (兼容 DeepSeek、智谱及 OpenAI 标准)
- **安全与加密**：Web Crypto API 原生 AES-GCM 加密算法 + PBKDF2 密钥派生
- **图标系统**：Lucide React

---

## 🚀 本地开发与运行

### 1. 克隆与安装依赖
```bash
# 进入项目目录
npm install
```

### 2. 配置环境变量
复制根目录下的 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```
在 `.env` 中填入你的 API Key（**完全可选**。现在支持所有终端用户在小程序界面中自主输入个人 API Key，用户自配 Key 具有最高优先级）：
```env
# 可选：如果服务端不配置，终端用户可在前端界面直接录入自己的 Key
# Gemini API Key (可选)
GEMINI_API_KEY="your-gemini-api-key"

# DeepSeek API Key (可选，推荐)
DEEPSEEK_API_KEY="your-deepseek-api-key"

# 智谱 GLM API Key (可选，推荐)
ZHIPU_API_KEY="your-zhipu-api-key"

# 自定义 OpenAI 兼容接口 (可选)
CUSTOM_AI_URL="https://api.example.com/v1"
CUSTOM_AI_KEY="your-custom-key"
CUSTOM_AI_MODEL="gpt-4o-mini"
```

### 3. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问：`http://localhost:3000`

### 4. 生产构建
```bash
npm run build
npm start
```

---

## 📱 小程序与生产环境部署指南

本应用具有极其灵活的部署方案，可根据你的业务需求选择以下任意一种方式：

---

### 方案一：微信小程序 Web-view 极速上架部署（最推荐、最简易）

微信官方支持在小程序中使用 `<web-view>` 组件内嵌经过认证的 H5 网页。这是个人或团队上线微信小程序**成本最低、代码最少、无需等待复杂审核**的标准方案。

#### 第一步：部署后端服务（获取线上 HTTPS 地址）
你可以将本项目部署在任意支持 Node.js 的云服务器或容器服务上：
- **方式 A：Docker 快速部署（腾讯云/阿里云/轻量应用服务器）**
  1. 使用项目提供的 Dockerfile 构建镜像：
     ```bash
     docker build -t wechat-thought-notes .
     docker run -d -p 3000:3000 --name thought-notes \
       -e GEMINI_API_KEY="你的key" \
       -e DEEPSEEK_API_KEY="你的key" \
       wechat-thought-notes
     ```
  2. 配置 Nginx 反向代理，并配置 SSL 证书（Let's Encrypt 免费证书）：
     ```nginx
     server {
         listen 443 ssl;
         server_name notes.yourdomain.com;

         ssl_certificate /path/to/fullchain.pem;
         ssl_certificate_key /path/to/privkey.pem;

         location / {
             proxy_pass http://127.0.0.1:3000;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
         }
     }
     ```
- **方式 B：云原生容器（腾讯云微信云托管 CloudBase、Google Cloud Run、Railway 等）**
  - 无需自建运维环境，将代码仓库关联即可自动构建镜像，绑定自定义域名即获得合规 HTTPS 服务。

#### 第二步：微信公众平台配置业务域名
1. 登录 [微信公众平台 (mp.weixin.qq.com)](https://mp.weixin.qq.com)；
2. 进入 **开发管理 -> 开发设置 -> 业务域名**；
3. 将你的域名 `notes.yourdomain.com` 添加进去，并下载校验文件 `xxxx.txt` 放置到静态目录或解析通过。

#### 第三步：创建极简小程序外壳并发布
打开微信开发者工具，新建一个项目，只需两行核心代码：
- `pages/index/index.wxml`:
  ```xml
  <web-view src="https://notes.yourdomain.com"></web-view>
  ```
- `pages/index/index.json`:
  ```json
  {
    "navigationBarTitleText": "想法随手记",
    "navigationBarBackgroundColor": "#ededed",
    "navigationBarTextStyle": "black"
  }
  ```
点击微信开发者工具的 **上传**，在微信公众平台后台提交审核，审核通过后即正式上线微信小程序！

---

### 方案二：微信云托管 (CloudBase) 原生容器部署

微信云托管是微信官方团队推出的容器托管服务，具备 **免域名备案、天然微信登录免鉴权、自动扩缩容** 的巨大优势：

1. 登录微信公众平台，开通 **微信云托管**；
2. 创建服务，服务端口填 `3000`；
3. 选择 **本地代码上传** 或 **绑定 GitHub 仓库**；
4. 环境变量中配置 `DEEPSEEK_API_KEY` 或 `ZHIPU_API_KEY` 等密钥；
5. 部署完成后，在云托管后台直接分配公网域名或内网访问地址，省去自建服务器和备案的繁重工作。

---

### 方案三：跨平台小程序框架（Taro / uni-app）全原生移植

如果你希望将应用完全以原生双线程或原生组件模式编译：
1. **API 层直接复用**：
   本项目现有的 `/api/ai/classify-and-summarize`、`/api/ai/polish`、`/api/ai/parse-wechat-chat`、`/api/ai/daily-digest` 是标准的 RESTful JSON 接口，保持现有 Express 后端服务不变。
2. **数据存储适配**：
   将 `src/utils/storage.ts` 中的 `localStorage` 替换为微信原生存储 API：
   - `localStorage.getItem(k)` ➔ `wx.getStorageSync(k)`
   - `localStorage.setItem(k, v)` ➔ `wx.setStorageSync(k, v)`
3. **录音接口适配**：
   将 `src/components/QuickCaptureCard.tsx` 的录音交互对接微信原生同声传译或 `wx.getRecorderManager()` 录音管理器。

---

### 方案四：常规 Linux 服务器部署 (PM2 + Nginx)

如果你有一台 Linux 服务器（Ubuntu/Debian/CentOS），推荐使用 PM2 守护进程管理：

```bash
# 1. 安装 Node.js (18+) 与 PM2
npm install -g pm2

# 2. 拉取代码并构建
npm install
npm run build

# 3. 启动 PM2 守护进程
pm2 start dist/server.cjs --name "wechat-thought-notes" --env production

# 4. 设置开机自启
pm2 save
pm2 startup
```

---

## 🔒 隐私与安全性保障

- **端到端加密零知识证明**：
  敏感想法仅通过客户端基于 PIN 派生的对称密钥进行 AES-GCM 加密，密文存储，防止任何形式的明文勒索或泄漏。
- **大模型传输透明**：
  AI 归档与润色仅传输当前条目文本，支持自由配置使用国内合规的 DeepSeek 或智谱大模型，严格保障数据合规。

---

## 📄 许可证

MIT License. 欢迎提交 Issue 与 Pull Request！
