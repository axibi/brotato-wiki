export const SITE = {
  name: '土豆兄弟百科',
  nameEn: 'Brotato Wiki CN',
  tagline: '角色 · 武器 · 道具 · 攻略',
  description:
    '《土豆兄弟 Brotato》中文百科：64 名角色、78 把武器、247 件道具的完整数据库，配套新手入门、属性解析、流派构筑与高难度通关攻略。',
  url: import.meta.env.PUBLIC_SITE_URL || 'https://brotato-wiki-cn.pages.dev',
  locale: 'zh-CN',
  version: '1.1.x',
  author: 'Brotato Wiki CN 编辑组',
  email: '',
};

export const NAV = [
  { href: '/characters', label: '角色图鉴', key: 'characters' },
  { href: '/weapons', label: '武器图鉴', key: 'weapons' },
  { href: '/items', label: '道具图鉴', key: 'items' },
  { href: '/guides', label: '攻略中心', key: 'guides' },
  { href: '/news', label: '版本动态', key: 'news' },
];

export const RARITY = {
  1: { label: '普通', en: 'Common', cls: 'r-1' },
  2: { label: '罕见', en: 'Uncommon', cls: 'r-2' },
  3: { label: '稀有', en: 'Rare', cls: 'r-3' },
  4: { label: '传说', en: 'Legendary', cls: 'r-4' },
} as const;

export const TIER_ZH = ['', 'I 阶', 'II 阶', 'III 阶', 'IV 阶'];

export const CATEGORIES = [
  { key: '入门', label: '入门指南', desc: '从第一波活到第一次通关' },
  { key: '机制', label: '机制解析', desc: '属性、商店、合成与隐藏规则' },
  { key: '流派', label: '流派构筑', desc: '近战、远程、元素与工程' },
  { key: '进阶', label: '进阶技巧', desc: '高难度、Boss 与无尽模式' },
  { key: '版本', label: '版本与 DLC', desc: '版本差异与资料说明' },
];

export const DIFFICULTY_LABEL = ['', '轻松', '普通', '有挑战', '困难', '极难'];
