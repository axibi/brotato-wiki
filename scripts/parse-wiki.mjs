// 解析 Brotato Wiki 的 MediaWiki 模板原始文本，输出结构化 JSON 原始数据。
// 用法: node scripts/parse-wiki.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RESEARCH = path.join(ROOT, '.research');

const STAT_MAP = {
  MeleeDamage: '近战伤害',
  RangedDamage: '远程伤害',
  ElementalDamage: '元素伤害',
  Armor: '护甲',
  Engineering: '工程',
  Range: '射程',
  AttackSpeed: '攻速',
  MaxHP: '最大生命',
  'Max HP': '最大生命',
  Melee: '近战',
};

// 解析 {{...}} 模板，支持嵌套；返回纯文本
function renderTemplates(input) {
  let s = input;
  let guard = 0;
  while (s.includes('{{') && guard++ < 40) {
    const start = s.indexOf('{{');
    let depth = 0;
    let end = -1;
    for (let i = start; i < s.length - 1; i++) {
      if (s[i] === '{' && s[i + 1] === '{') {
        depth++;
        i++;
      } else if (s[i] === '}' && s[i + 1] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
        i++;
      }
    }
    if (end === -1) break;
    const inner = s.slice(start + 2, end);
    const parts = splitTopLevel(inner);
    const fn = (parts[0] || '').trim().toLowerCase();
    let replacement = '';
    if (fn === 'color' || fn === 'colour') {
      replacement = parts.slice(2).join('|');
    } else if (fn === 'statIcon'.toLowerCase()) {
      const key = (parts[1] || '').trim();
      replacement = STAT_MAP[key] ?? key;
    } else if (fn === 'meleeicon') {
      replacement = '近战';
    } else if (fn === 'rangedicon') {
      replacement = '远程';
    } else if (fn === 'elementalicon') {
      replacement = '元素';
    } else if (fn === 'version') {
      replacement = (parts[1] || '').trim();
    } else {
      replacement = '';
    }
    s = s.slice(0, start) + replacement + s.slice(end + 2);
  }
  return s;
}

function splitTopLevel(inner) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '{' && inner[i + 1] === '{') {
      depth++;
      cur += '{{';
      i++;
    } else if (c === '}' && inner[i + 1] === '}') {
      depth--;
      cur += '}}';
      i++;
    } else if (c === '|' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function stripMarkup(input = '') {
  let s = renderTemplates(input);
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/'''?/g, '');
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/ *\n */g, '\n');
  return s.trim();
}

// 将模板拆分为 name -> { field: value }
function parseTemplate(text) {
  const lines = text.split(/\r?\n/);
  const entries = {};
  let current = null;
  let field = null;

  for (const line of lines) {
    // 顶层：|weapon name = {{#switch:
    const top = line.match(/^\|([^=|{}]+?)\s*=\s*\{\{#switch/i);
    if (top) {
      const name = top[1].trim();
      current = entries[name] = {};
      field = null;
      continue;
    }
    if (!current) continue;
    // 字段层：制表符 + |field=
    const f = line.match(/^\t\|([a-zA-Z]+)\s*=(.*)$/);
    if (f) {
      field = f[1].toLowerCase();
      current[field] = f[2].trim();
      continue;
    }
    // 值层：制表符 + 制表符 + |key=value
    const v = line.match(/^\t\t\|([^=]+?)\s*=(.*)$/);
    if (v && field) {
      // 形如 "1|common" 的键，取最后一段作为有效键
      const key = v[1].trim().toLowerCase().split('|').filter(Boolean).pop() ?? '';
      const val = v[2].trim();
      if (!current[field] || typeof current[field] !== 'object') current[field] = {};
      current[field][key] = val;
    }
  }
  return entries;
}

function tiers(field) {
  if (!field) return {};
  if (typeof field === 'string') return { 1: stripMarkup(field) };
  const out = {};
  for (const [k, v] of Object.entries(field)) {
    const tier = { '1': 1, common: 1, '2': 2, uncommon: 2, rare: 2, '3': 3, epic: 3, '4': 4, legendary: 4 }[k];
    if (!tier || v === '-' || v === '') continue;
    if (!out[tier]) out[tier] = stripMarkup(v);
  }
  return out;
}

function num(v) {
  if (v == null) return null;
  const m = String(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseWeapons() {
  const raw = parseTemplate(fs.readFileSync(path.join(RESEARCH, 'weapon_data.txt'), 'utf8'));
  const out = [];
  for (const [name, d] of Object.entries(raw)) {
    const types = stripMarkup(d.types || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const damage = tiers(d.damage);
    const cooldown = tiers(d.attackspeed);
    const dps = tiers(d.dps);
    const crit = tiers(d.crit);
    const range = tiers(d.range);
    const knockback = tiers(d.knockback);
    const price = tiers(d.price);
    const lifesteal = tiers(d.lifesteal);
    const tierList = [1, 2, 3, 4].filter((t) => damage[t]);
    if (!tierList.length) continue;
    out.push({
      id: name,
      slug: name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      types,
      rarity: Number(d.rarity) || tierList[0],
      attackType: stripMarkup(d.attacktype || '') || null,
      special: stripMarkup(d.special || ''),
      unlock: stripMarkup(d.unlockedby || ''),
      isDlc: ['1','true','yes'].includes(String(d.isdlc || '').trim().toLowerCase()),
      tiers: tierList.map((t) => ({
        tier: t,
        damage: damage[t],
        cooldown: cooldown[t],
        dps: dps[t],
        crit: crit[t],
        range: num(range[t]),
        knockback: num(knockback[t]),
        lifesteal: num(lifesteal[t]),
        price: num(price[t]),
      })),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function parseItems() {
  const raw = parseTemplate(fs.readFileSync(path.join(RESEARCH, 'item_data.txt'), 'utf8'));
  const out = [];
  for (const [name, d] of Object.entries(raw)) {
    const stats = stripMarkup(d.stats || '');
    if (!stats) continue;
    out.push({
      id: name,
      slug: name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      rarity: Number(d.rarity) || 1,
      price: num(d.price),
      stats,
      tags: stripMarkup(d.tags || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      limit: num(d.limit),
      unique: String(d.unique || '').trim() === 'true',
      isDlc: ['1','true','yes'].includes(String(d.isdlc || '').trim().toLowerCase()),
    });
  }
  return out.sort((a, b) => a.rarity - b.rarity || a.name.localeCompare(b.name));
}

function parseCharacters() {
  const raw = parseTemplate(fs.readFileSync(path.join(RESEARCH, 'character_data.txt'), 'utf8'));
  const out = [];
  for (const [name, d] of Object.entries(raw)) {
    const stats = stripMarkup(d.stats || '');
    if (!stats) continue;
    out.push({
      id: name,
      slug: name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      stats,
      unlock: stripMarkup(d.unlockedby || '').replace(/^Unlocked by /i, ''),
      unlocks: stripMarkup(d.unlocks || ''),
      unlockType: stripMarkup(d.unlocktype || ''),
      startingWeapons: stripMarkup(d.startingwpns || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isDlc: ['1','true','yes'].includes(String(d.isdlc || '').trim().toLowerCase()),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

fs.mkdirSync(path.join(ROOT, 'src/data/raw'), { recursive: true });
const weapons = parseWeapons();
const items = parseItems();
const characters = parseCharacters();
fs.writeFileSync(path.join(ROOT, 'src/data/raw/weapons.raw.json'), JSON.stringify(weapons, null, 2));
fs.writeFileSync(path.join(ROOT, 'src/data/raw/items.raw.json'), JSON.stringify(items, null, 2));
fs.writeFileSync(path.join(ROOT, 'src/data/raw/characters.raw.json'), JSON.stringify(characters, null, 2));

console.log('weapons:', weapons.length, 'items:', items.length, 'characters:', characters.length);
console.log('sample weapon:', JSON.stringify(weapons[0], null, 2));
console.log('sample item:', JSON.stringify(items[0], null, 2));
