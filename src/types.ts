export type CategoryType =
  | '灵感创意'
  | '工作任务'
  | '学习笔记'
  | '生活日常'
  | '密码隐私'
  | '财务记账'
  | '微信收藏';

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded encrypted string
  iv: string;         // Base64 encoded 12-byte initialization vector
  salt: string;       // Base64 encoded 16-byte PBKDF2 salt
}

export interface PasswordCredentials {
  accountName?: string;
  username?: string;
  website?: string;
  extraNotes?: string;
}

export interface ThoughtItem {
  id: string;
  title: string;
  content: string; // If isEncrypted is true, this may hold a placeholder or decrypted in-memory value
  category: CategoryType | string;
  tags: string[];
  createdAt: number; // Milliseconds timestamp
  updatedAt: number;
  isPinned?: boolean;
  isEncrypted?: boolean;
  encryptedPayload?: EncryptedPayload;
  aiSummary?: string;
  aiKeyPoints?: string[];
  source?: 'direct' | 'wechat_chat' | 'voice';
  wechatMetadata?: {
    chatTopic?: string;
    speakers?: string[];
    originalTimestamp?: string;
  };
  passwordDetails?: PasswordCredentials;
}

export interface DailyDigest {
  date: string;
  headline: string;
  overview: string;
  highlights: string[];
  actionItems: string[];
  mode?: string;
}

export interface WeChatParsedItem {
  title: string;
  content: string;
  category: string;
  tags: string[];
  originalSpeakers?: string[];
  isTodo?: boolean;
}

export type ActiveTab = 'thoughts' | 'calendar' | 'categories' | 'wechat' | 'vault';

export type AIModelProvider = 'gemini' | 'deepseek' | 'glm' | 'custom';

export interface AIModelConfig {
  provider: AIModelProvider;
  keys?: {
    gemini?: string;
    deepseek?: string;
    glm?: string;
    custom?: string;
  };
  customApiKey?: string;
  customBaseUrl?: string;
  customModelName?: string;
}

export interface CategoryMeta {
  key: CategoryType;
  label: string;
  icon: string;
  badgeBg: string;
  textColor: string;
  accentBorder: string;
}
