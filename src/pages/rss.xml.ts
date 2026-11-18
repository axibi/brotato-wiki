import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@/lib/site';

export async function GET(context: APIContext) {
  const guides = await getCollection('guides', ({ data }) => !data.draft);
  const news = await getCollection('news');

  const items = [
    ...guides.map((g) => ({
      title: g.data.title,
      description: g.data.description,
      pubDate: g.data.updated ?? g.data.date,
      link: `/guides/${g.id}/`,
      categories: [g.data.category, ...g.data.tags],
    })),
    ...news.map((n) => ({
      title: `[${n.data.version}] ${n.data.title}`,
      description: n.data.description,
      pubDate: n.data.date,
      link: `/news/${n.id}/`,
      categories: ['版本', ...n.data.tags],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE.name} · 攻略与版本记录`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: '<language>zh-cn</language>',
  });
}
