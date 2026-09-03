import { ThoughtItem } from '../types';
import { encryptText } from './crypto';

const THOUGHTS_STORAGE_KEY = 'wechat_mini_thoughts_v1';
const VAULT_VERIFIER_KEY = 'wechat_mini_vault_verifier_v1';

// Seed sample thoughts to make the app immediately demonstrable and rich
export async function getInitialSeedThoughts(): Promise<ThoughtItem[]> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Default master PIN for the demo sample encrypted note is "123456"
  let sampleEncryptedPayload;
  try {
    sampleEncryptedPayload = await encryptText(
      'VPN网关: vpn.internal.company.com:443\n账号: dev_admin_09\n动态口令密钥: JBSWY3DPEHPK3PXP\n临时备用密码: P@ssw0rd2026!#\n请勿截屏或通过外网传输！',
      '123456'
    );
  } catch (e) {
    sampleEncryptedPayload = undefined;
  }

  return [
    {
      id: 'thought-seed-1',
      title: '小程序端随手记体验优化思路',
      content:
        '1. 随时随地按住说话录入，直接接入大模型语音转文字+自动润色。\n2. 微信内长按聊天记录，直接选择“转发到小程序助手”，自动摘录成结构化便签。\n3. 卡片支持一键打标签，归档到灵感分类中。\n4. 夜间模式采用微信深灰色，柔和护眼。',
      category: '灵感创意',
      tags: ['小程序', '交互设计', '大模型'],
      createdAt: now - 35 * 60 * 1000, // 35 minutes ago
      updatedAt: now - 35 * 60 * 1000,
      isPinned: true,
      aiSummary: '针对小程序碎片化记录的4项优化：长按语音、微信转发直达、智能标签与深色体验。',
      aiKeyPoints: ['支持长按语音转文字', '微信聊天长按转发直达', '智能打标签归档'],
      source: 'direct',
    },
    {
      id: 'thought-seed-2',
      title: '周四新版本提审与准备事项',
      content:
        '本周四下午4点前完成小程序代码合入：\n- 检查隐私合规协议与权限声明（剪贴板和麦克风权限）\n- 完成大模型 API 异常降级兜底测试\n- 准备提审测试账号密码，录制功能操作视频备查。',
      category: '工作任务',
      tags: ['待办', '微信提审', '合规'],
      createdAt: now - 3 * 3600 * 1000, // 3 hours ago
      updatedAt: now - 3 * 3600 * 1000,
      isPinned: true,
      aiSummary: '周四提审准备清单：完善权限协议、测试API降级策略及准备提审测试物料。',
      aiKeyPoints: ['下午4点前完成代码合入', '配置麦克风/剪贴板声明', '测试降级兜底'],
      source: 'direct',
    },
    {
      id: 'thought-seed-3',
      title: '微信群关于AI分类落地的探讨',
      content:
        '【张架构师 10:15】碎片化想法必须支持秒级自动分类，用户写完“买两斤苹果”，系统就要自动识别为“生活日常”和“财务记账”。\n【李产品 10:18】赞同！大模型提取标题也非常关键，用户随手敲一段话，标题往往是空着的，LLM自动总结一个10字内标题最佳。\n【王前端 10:22】收到，可以在输入失焦或点击保存时异步请求大模型归档。',
      category: '微信收藏',
      tags: ['微信讨论', '智能归档', '架构设计'],
      createdAt: now - 1 * dayMs, // Yesterday
      updatedAt: now - 1 * dayMs,
      source: 'wechat_chat',
      wechatMetadata: {
        chatTopic: 'AI助手研发群交流',
        speakers: ['张架构师', '李产品', '王前端'],
        originalTimestamp: '昨天 10:15',
      },
      aiSummary: '团队共识：碎片想法需支持秒级自动分类、标题自动提炼与异步归档。',
      aiKeyPoints: ['内容秒级智能分类', '空标题自动生成', '异步归档体验好'],
    },
    {
      id: 'thought-seed-4',
      title: '内网服务器与运维秘钥口令',
      content: '【已启用端到端加密】此内容已通过客户端 AES-GCM 算法加密，需输入主密码解锁。',
      category: '密码隐私',
      tags: ['密码', '服务器', '凭据'],
      createdAt: now - 2 * dayMs, // 2 days ago
      updatedAt: now - 2 * dayMs,
      isEncrypted: true,
      encryptedPayload: sampleEncryptedPayload,
      passwordDetails: {
        accountName: '云主机root与VPN',
        username: 'dev_admin_09',
        website: 'vpn.internal.company.com',
        extraNotes: '默认演示主密码为 123456',
      },
      aiSummary: '包含内网服务器账号密码及安全口令的私密凭证。',
    },
  ];
}

export function loadThoughts(): ThoughtItem[] {
  try {
    const raw = localStorage.getItem(THOUGHTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load thoughts from localStorage', e);
    return [];
  }
}

export function saveThoughts(thoughts: ThoughtItem[]): void {
  try {
    localStorage.setItem(THOUGHTS_STORAGE_KEY, JSON.stringify(thoughts));
  } catch (e) {
    console.error('Failed to save thoughts to localStorage', e);
  }
}

// Vault Master PIN Verifier (stores a test token encrypted with the master PIN)
export async function setupMasterPin(pin: string): Promise<boolean> {
  try {
    const verifierPayload = await encryptText('VAULT_VERIFIED_TOKEN_2026', pin);
    localStorage.setItem(VAULT_VERIFIER_KEY, JSON.stringify(verifierPayload));
    return true;
  } catch (e) {
    return false;
  }
}

export function hasMasterPinConfigured(): boolean {
  return Boolean(localStorage.getItem(VAULT_VERIFIER_KEY));
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(VAULT_VERIFIER_KEY);
  if (!raw) {
    // If none exists, allow initial setup or match default demo "123456"
    if (pin === '123456') {
      await setupMasterPin('123456');
      return true;
    }
    return false;
  }

  try {
    const payload = JSON.parse(raw);
    const { decryptText } = await import('./crypto');
    const decrypted = await decryptText(payload, pin);
    return decrypted === 'VAULT_VERIFIED_TOKEN_2026';
  } catch {
    return false;
  }
}
