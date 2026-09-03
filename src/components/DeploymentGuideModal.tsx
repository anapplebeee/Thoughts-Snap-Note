import { useState } from 'react';
import { X, Check, Copy, BookOpen, Layers, Terminal, Globe, Cloud, Sparkles, Smartphone } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeploymentGuideModal({ isOpen, onClose }: DeploymentGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'webview' | 'cloudbase' | 'docker' | 'native'>('webview');
  const [copiedSnippet, setCopiedSnippet] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(''), 2000);
  };

  const webviewWxml = `<web-view src="https://你的服务器域名.com"></web-view>`;
  const webviewJson = `{
  "navigationBarTitleText": "微信想法随手记",
  "navigationBarBackgroundColor": "#ededed",
  "navigationBarTextStyle": "black"
}`;

  const dockerSnippet = `# 1. 构建镜像
docker build -t wechat-thought-notes .

# 2. 运行容器 (绑定 3000 端口)
docker run -d -p 3000:3000 --name thought-notes \\
  -e DEEPSEEK_API_KEY="你的DeepSeek-Key" \\
  -e ZHIPU_API_KEY="你的智谱Key" \\
  wechat-thought-notes`;

  const nginxSnippet = `server {
    listen 443 ssl;
    server_name notes.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/notes.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notes.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

  return (
    <div
      id="deployment-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
    >
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-100">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-50/80 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#07c160] text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center space-x-1.5">
                <span>小程序与服务部署指引</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                  README
                </span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                支持微信 Web-view 快速上线、微信云托管、Docker 及 Linux 部署
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200/80 bg-neutral-100/50 p-1.5 space-x-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('webview')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'webview'
                ? 'bg-white text-[#07c160] shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web-view 极速上架</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloudbase')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'cloudbase'
                ? 'bg-white text-[#07c160] shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>微信云托管</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docker')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'docker'
                ? 'bg-white text-[#07c160] shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>服务器 / Docker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'native'
                ? 'bg-white text-[#07c160] shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>原生 API 移植</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-neutral-700 leading-relaxed">
          {/* TAB 1: WEBVIEW */}
          {activeTab === 'webview' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950">
                <span className="font-bold">✨ 为什么首选 Web-view 方式？</span>
                <p className="mt-1 text-[11px] leading-normal text-emerald-900">
                  这是上线微信小程序最快、门槛最低的官方方案。无需重写任何前端逻辑，保留完整的 React 19、大模型切换与端到端加密，更新应用时无需每次提审微信审核！
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-neutral-900 flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] flex items-center justify-center">1</span>
                  <span>部署服务并配置域名 SSL</span>
                </h4>
                <p className="text-neutral-600 text-[11px]">
                  将本项目通过 Docker 或 Node.js 运行在你的云服务器（或 Cloud Run、Railway 等），并通过域名与 HTTPS 证书对外暴露访问（如 <code>https://notes.yourdomain.com</code>）。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-neutral-900 flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] flex items-center justify-center">2</span>
                  <span>微信公众平台配置「业务域名」</span>
                </h4>
                <p className="text-neutral-600 text-[11px]">
                  登录 <strong>mp.weixin.qq.com</strong>，前往 <strong>开发管理 -&gt; 开发设置 -&gt; 业务域名</strong>，添加你的域名，下载并放置微信校验文件至根目录。
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-neutral-900 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] flex items-center justify-center">3</span>
                    <span>小程序工程代码（仅需 2 个文件）</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(webviewWxml, 'wxml')}
                    className="text-[11px] text-[#07c160] hover:underline flex items-center space-x-0.5"
                  >
                    {copiedSnippet === 'wxml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'wxml' ? '已复制' : '复制 WXML'}</span>
                  </button>
                </div>
                <div className="bg-neutral-900 text-neutral-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {webviewWxml}
                </div>
                <p className="text-neutral-400 text-[10px]">
                  在微信开发者工具中点击「上传」代码，然后在后台点击「提交审核」，审核通过即可正式上线发布！
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CLOUDBASE */}
          {activeTab === 'cloudbase' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-blue-950">
                <span className="font-bold">☁️ 微信云托管 (CloudBase) 的独家优势：</span>
                <p className="mt-1 text-[11px] text-blue-900">
                  微信官方容器服务，<strong>免购买云服务器、免域名备案</strong>，支持微信私网互联与自动按量缩容至 0，费用极其低廉。
                </p>
              </div>

              <ol className="space-y-2.5 list-decimal list-inside text-neutral-700">
                <li>
                  登录微信公众平台，左侧导航栏找到 <strong>「微信云托管」</strong> 并开通；
                </li>
                <li>
                  创建新服务，选择 <strong>「代码上传」</strong> 或直接关联你的 <strong>GitHub 仓库</strong>；
                </li>
                <li>
                  容器构建配置：已内置 <code>Dockerfile</code>，暴露端口指定为 <code>3000</code>；
                </li>
                <li>
                  在服务环境变量中填入你的 <code>DEEPSEEK_API_KEY</code> 或 <code>ZHIPU_API_KEY</code>；
                </li>
                <li>
                  部署成功后分配默认二级域名，即可直接在小程序内或浏览器中高速访问！
                </li>
              </ol>
            </div>
          )}

          {/* TAB 3: DOCKER & NGINX */}
          {activeTab === 'docker' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">🐳 Docker 容器化命令</span>
                <button
                  type="button"
                  onClick={() => handleCopy(dockerSnippet, 'docker')}
                  className="text-[11px] text-[#07c160] hover:underline flex items-center space-x-0.5"
                >
                  {copiedSnippet === 'docker' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'docker' ? '已复制' : '复制 Docker 命令'}</span>
                </button>
              </div>
              <pre className="bg-neutral-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                {dockerSnippet}
              </pre>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-neutral-900">🌐 Nginx 反向代理配置</span>
                <button
                  type="button"
                  onClick={() => handleCopy(nginxSnippet, 'nginx')}
                  className="text-[11px] text-[#07c160] hover:underline flex items-center space-x-0.5"
                >
                  {copiedSnippet === 'nginx' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'nginx' ? '已复制' : '复制 Nginx 配置'}</span>
                </button>
              </div>
              <pre className="bg-neutral-900 text-neutral-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed">
                {nginxSnippet}
              </pre>
            </div>
          )}

          {/* TAB 4: NATIVE MIGRATION */}
          {activeTab === 'native' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950">
                <span className="font-bold">📱 原生小程序 / Taro / uni-app 移植对接说明</span>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-neutral-600">
                  如果你计划将应用以原生 WXML/WXSS 或 Taro/uni-app 重新编译：
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-700 text-[11px]">
                  <li>
                    <strong>API 复用：</strong>本项目的 <code>server.ts</code> 后端已经封装好标准的 <code>/api/ai/*</code> RESTful 接口，可直接复用；
                  </li>
                  <li>
                    <strong>本地缓存适配：</strong>将 <code>localStorage</code> 改为 <code>wx.getStorageSync</code> 与 <code>wx.setStorageSync</code>；
                  </li>
                  <li>
                    <strong>录音适配：</strong>使用微信原生 <code>wx.getRecorderManager()</code> 接口录制并识别语音。
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-50/80 border-t border-neutral-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-neutral-500 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>项目根目录已生成完整 README.md</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
