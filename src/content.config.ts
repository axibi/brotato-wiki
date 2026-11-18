import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['入门', '机制', '流派', '进阶', '版本']),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    order: z.number().default(99),
    difficulty: z.number().min(1).max(5).default(2),
    reading: z.number().default(8),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    version: z.string(),
    date: z.coerce.date(),
    status: z.enum(['已确认', '部分待核实', '待核实']).default('已确认'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { guides, news };
