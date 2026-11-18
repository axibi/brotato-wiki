import type { APIRoute } from 'astro';
import { SITE } from '@/lib/site';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(SITE.url)).href.replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

# 不索引搜索索引文件
Disallow: /search-index.json

Sitemap: ${base}/sitemap-index.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
