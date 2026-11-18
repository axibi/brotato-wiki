import charactersJson from '@/data/characters.json';
import weaponsJson from '@/data/weapons.json';
import itemsJson from '@/data/items.json';
import statsJson from '@/data/stats.json';

export type Character = (typeof charactersJson)[number];
export type Weapon = (typeof weaponsJson)[number];
export type Item = (typeof itemsJson)[number];
export type StatDef = (typeof statsJson)[number];

export const characters = charactersJson as Character[];
export const weapons = weaponsJson as Weapon[];
export const items = itemsJson as Item[];
export const stats = statsJson as StatDef[];

export const bySlug = <T extends { slug: string }>(list: T[], slug: string) =>
  list.find((x) => x.slug === slug);

export const counts = {
  characters: characters.length,
  weapons: weapons.length,
  items: items.length,
  dlcCharacters: characters.filter((c) => c.isDlc).length,
};

export const characterTags = [...new Set(characters.flatMap((c) => c.tags))].sort((a, b) =>
  a.localeCompare(b, 'zh')
);

export const weaponClasses = [...new Set(weapons.flatMap((w) => w.classes))].sort((a, b) =>
  a.localeCompare(b, 'zh')
);

/** 取武器一阶（或最低阶）数据用于卡片展示 */
export const baseTier = (w: Weapon) => w.tiers[0];

/** 全站搜索索引 */
export function searchIndex() {
  return [
    ...characters.map((c) => ({
      type: 'character' as const,
      title: c.nameZh,
      sub: c.name,
      desc: c.tagline,
      url: `/characters/${c.slug}`,
      tags: c.tags,
    })),
    ...weapons.map((w) => ({
      type: 'weapon' as const,
      title: w.nameZh,
      sub: w.name,
      desc: `${w.classes.join(' / ')} · ${w.note}`,
      url: `/weapons/${w.slug}`,
      tags: w.classes,
    })),
    ...items.map((i) => ({
      type: 'item' as const,
      title: i.nameZh,
      sub: i.name,
      desc: i.effects.length
        ? i.effects.join('')
        : i.statsZh.length
          ? i.statsZh[0]
          : i.statLines.map((s) => `${s.term} ${s.value}`).join('，'),
      url: `/items/${i.slug}`,
      tags: [],
    })),
  ];
}
