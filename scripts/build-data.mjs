// 合并 wiki 原始数据与中文内容层，产出站点使用的最终 JSON。
// 用法: node scripts/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const D = (...p) => path.join(ROOT, ...p);
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const CLASS_ZH = {
  Blade: '刀刃',
  Blunt: '钝器',
  Elemental: '元素',
  Ethereal: '虚灵',
  Explosive: '爆炸',
  Gun: '枪械',
  Heavy: '重型',
  Legendary: '传说',
  Medical: '医疗',
  Medieval: '中世纪',
  Musical: '音乐',
  Naval: '海军',
  Precise: '精准',
  Primitive: '原始',
  Support: '辅助',
  Tool: '工具',
  Unarmed: '徒手',
  Thrown: '投掷',
  Defense: '防御',
};

const TERMS = [
  ['Max HP', '最大生命'],
  ['HP Regeneration', '生命回复'],
  ['Life Steal', '生命偷取'],
  ['Harvesting', '收获'],
  ['Pickup Range', '拾取范围'],
  ['Pickup range', '拾取范围'],
  ['Attack Speed', '攻速'],
  ['Crit Chance', '暴击率'],
  ['Crit Damage', '暴击伤害'],
  ['Melee Damage', '近战伤害'],
  ['Ranged Damage', '远程伤害'],
  ['Elemental Damage', '元素伤害'],
  ['Explosion Damage', '爆炸伤害'],
  ['Explosion Size', '爆炸范围'],
  ['Piercing Damage', '穿透伤害'],
  ['Structure attack speed', '结构攻速'],
  ['Structure Range', '结构射程'],
  ['Materials', '材料'],
  ['materials', '材料'],
  ['Items Price', '物品价格'],
  ['XP Gain', '经验获取'],
  ['Speed', '速度'],
  ['Dodge', '闪避'],
  ['Armor', '护甲'],
  ['Range', '射程'],
  ['Luck', '幸运'],
  ['Engineering', '工程'],
  ['Curse', '诅咒'],
  ['Knockback', '击退'],
  ['Damage', '伤害'],
  ['Enemies', '敌人数量'],
  ['Accuracy', '精准'],
  ['Life Steal', '生命偷取'],
];

const TAG_ZH = {
  'Max HP': '最大生命',
  'HP Regeneration': '生命回复',
  'Life Steal': '生命偷取',
  Damage: '伤害',
  'Melee Damage': '近战伤害',
  'Ranged Damage': '远程伤害',
  'Elemental Damage': '元素伤害',
  'Attack Speed': '攻速',
  'Crit Chance': '暴击率',
  Range: '射程',
  Armor: '护甲',
  Dodge: '闪避',
  Speed: '速度',
  Luck: '幸运',
  Harvesting: '收获',
  Pickup: '拾取',
  Engineering: '工程',
  Curse: '诅咒',
  Knockback: '击退',
  Explosive: '爆炸',
  Consumable: '消耗品',
  Pet: '宠物',
  Structure: '结构',
  'XP Gain': '经验',
  Economy: '经济',
  Exploration: '探索',
  'Stand Still': '站桩',
  'Number of Enemies': '敌人数量',
  'More Enemies': '增加敌人',
  'Less Enemies': '减少敌人',
  'Less Enemy Speed': '降低敌人速度',
  'Lock (Item Tag)': '锁定',
};

function translateLine(line) {
  const raw = line.trim().replace(/\s+/g, ' ');
  if (!raw) return null;
  // 形如 "+8 Max HP" / "-2 % Dodge" / "+30% pickup range"
  const m = raw.match(/^([+-]\s?\d+(?:\.\d+)?)\s*(%?)\s*(.+)$/);
  if (!m) return null;
  const value = m[1].replace(/\s/g, '');
  const pct = m[2] === '%';
  let term = m[3].trim();
  let hit = null;
  for (const [en, zh] of TERMS) {
    if (term.toLowerCase() === en.toLowerCase()) {
      hit = zh;
      break;
    }
  }
  if (!hit) {
    // 前缀匹配，如 "materials dropped from enemies"
    for (const [en, zh] of TERMS) {
      if (term.toLowerCase().startsWith(en.toLowerCase())) {
        hit = zh + term.slice(en.length).trim();
        break;
      }
    }
  }
  if (!hit) return null;
  const sign = value.startsWith('-') ? '-' : '+';
  const num = value.replace(/^[+-]/, '');
  return { term: hit, value: `${sign}${num}${pct ? '%' : ''}` };
}

function buildCharacters() {
  const raw = read(D('src/data/raw/characters.raw.json'));
  const zh = read(D('src/data/i18n/characters.json'));
  const out = raw.map((c) => {
    const z = zh[c.slug] || {};
    return {
      slug: c.slug,
      name: c.name.replace(/\b\w/g, (s) => s.toUpperCase()),
      nameZh: z.zh || c.name,
      isDlc: c.isDlc,
      tagline: z.tagline || '',
      ability: z.ability || [],
      pros: z.pros || [],
      cons: z.cons || [],
      playstyle: z.playstyle || '',
      difficulty: z.difficulty ?? 3,
      tags: z.tags || [],
      recommendedWeapons: z.weapons || [],
      recommendedItems: z.items || [],
      unlock: c.unlock,
      unlocks: c.unlocks,
      unlockType: c.unlockType,
      startingWeapons: c.startingWeapons,
      statsEn: c.stats,
    };
  });
  out.sort((a, b) => a.difficulty - b.difficulty || a.nameZh.localeCompare(b.nameZh, 'zh'));
  return out;
}

function buildWeapons() {
  const raw = read(D('src/data/raw/weapons.raw.json'));
  const zh = read(D('src/data/i18n/weapons.json'));
  const out = raw.map((w) => {
    const z = zh[w.slug] || {};
    return {
      slug: w.slug,
      name: w.name.replace(/\b\w/g, (s) => s.toUpperCase()),
      nameZh: z.zh || w.name,
      isDlc: w.isDlc,
      classes: w.types.map((t) => CLASS_ZH[t] || t),
      classesEn: w.types,
      minTier: w.tiers[0].tier,
      maxTier: w.tiers[w.tiers.length - 1].tier,
      attackType: w.attackType,
      special: w.special,
      unlock: w.unlock,
      tags: z.tags || w.types.map((t) => CLASS_ZH[t] || t),
      note: z.note || '',
      tiers: w.tiers.map((t) => ({
        tier: t.tier,
        damage: t.damage,
        cooldown: t.cooldown,
        dps: t.dps,
        dpsValue: Number((t.dps || '').match(/[\d.]+/)?.[0] ?? 0),
        crit: t.crit,
        range: t.range,
        knockback: t.knockback,
        lifesteal: t.lifesteal,
        price: t.price,
      })),
    };
  });
  out.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh'));
  return out;
}

function buildItems() {
  const raw = read(D('src/data/raw/items.raw.json'));
  const zh = read(D('src/data/i18n/items.json'));
  const missing = [];
  const out = raw.map((it) => {
    const z = zh[it.slug] || {};
    if (!z.zh) missing.push(it.id);
    const statLines = [];
    const leftovers = [];
    for (const line of it.stats.split('\n')) {
      if (!line.trim()) continue;
      const t = translateLine(line);
      if (t) statLines.push(t);
      else leftovers.push(line.trim());
    }
    const effects = z.desc ? z.desc.split(/(?<=[。；])/).map((s) => s.trim()).filter(Boolean) : [];
    return {
      slug: it.slug,
      name: it.name.replace(/\b\w/g, (s) => s.toUpperCase()),
      nameZh: z.zh || it.name,
      rarity: it.rarity,
      price: it.price,
      isDlc: it.isDlc,
      statLines: z.statsZh ? [] : statLines,
      statsZh: z.statsZh || [],
      effects,
      untranslated: effects.length || z.statsZh ? [] : leftovers,
      tags: it.tags.map((t) => TAG_ZH[t] || t),
    };
  });
  out.sort((a, b) => a.rarity - b.rarity || a.price - b.price);
  return { items: out, missing };
}

const characters = buildCharacters();
const weapons = buildWeapons();
const { items, missing } = buildItems();

fs.mkdirSync(D('src/data'), { recursive: true });
fs.writeFileSync(D('src/data/characters.json'), JSON.stringify(characters, null, 2));
fs.writeFileSync(D('src/data/weapons.json'), JSON.stringify(weapons, null, 2));
fs.writeFileSync(D('src/data/items.json'), JSON.stringify(items, null, 2));

const statsCoverage = items.filter(
  (i) => i.statLines.length + i.effects.length + i.statsZh.length === 0
).length;
console.log(`characters: ${characters.length} (缺中文: ${characters.filter((c) => !c.tagline).length})`);
console.log(`weapons: ${weapons.length} (缺中文: ${weapons.filter((w) => !w.note).length})`);
console.log(`items: ${items.length} (缺中文名: ${missing.length}, 无效果描述: ${statsCoverage})`);
if (missing.length) console.log('missing zh:', missing.join(', '));
