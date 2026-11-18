# 土豆兄弟百科 · Brotato Wiki CN

一个面向中文玩家的《土豆兄弟（Brotato）》游戏百科：角色 / 武器 / 道具数据库 + 原创攻略 + 版本记录。

- 线上地址：**https://brotato-wiki.pages.dev**
- 代码仓库：**https://github.com/axibi/brotato-wiki**
- 静态站点（SSG），无后端、无数据库
- 420 个页面，生产构建约 20 秒
- 深色游戏百科风格，橙色强调，响应式布局
- 数据与内容分离，新增条目不需要改代码

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Astro 5（静态输出） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4（CSS-first） |
| 内容 | Markdown + Content Collections |
| 数据 | JSON（由 wiki 模板解析生成） |
| 部署 | Cloudflare Pages |
| 搜索 | 构建期生成索引 + 浏览器端匹配 |

## 功能

- **首页**：主题 Banner、全站搜索、数据条、热门角色/武器、最新攻略、版本动态
- **角色图鉴**：64 名角色，支持关键词 + 玩法标签 + 阵营（基础/DLC）筛选
- **武器图鉴**：78 把武器，I~IV 阶完整数值（伤害/冷却/DPS/暴击/射程/击退/价格），按职业与最低阶级筛选
- **道具图鉴**：247 件道具，稀有度/特殊效果/DLC 筛选，属性增减中文化
- **攻略中心**：18 篇原创文章，分类筛选、自动目录、上下篇、相关推荐
- **全站搜索**：`/search` 页面 + 全局搜索弹窗（快捷键 `/` 或 `⌘K`），按角色/武器/道具分组
- **SEO**：独立 Title/Description、Canonical、Open Graph、Twitter Card、JSON-LD、面包屑、sitemap、robots、RSS、404
- **性能/无障碍**：纯静态、图片为内联 SVG、跳过导航、焦点可见、`prefers-reduced-motion` 支持

## 目录结构

```
src/
  components/        卡片、页头页脚、搜索弹窗、像素图生成器
  content/
    guides/          18 篇攻略（Markdown）
    news/            版本记录（Markdown）
  data/
    raw/             wiki 模板解析出的原始数据（英文）
    i18n/            中文内容层（名称、能力、点评）
    characters.json  最终数据（构建产物，已提交）
    weapons.json
    items.json
    stats.json       18 个属性定义
    patches.json     版本时间线与资料来源
  layouts/           BaseLayout（SEO/OG/JSON-LD）
  lib/               数据访问与站点配置
  pages/             路由
  scripts/           列表筛选脚本
  styles/            global.css（设计系统）
scripts/
  parse-wiki.mjs     解析 MediaWiki 模板 → raw JSON
  build-data.mjs     合并中文层 → 最终 JSON
public/              favicon、OG 图、_headers
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 生产构建 → dist/
npm run preview    # 预览构建产物
```

要求 Node 22（Astro 5 兼容）。Node 22.22 可用；如需升级 Astro 7，需要 Node ≥ 22.23.4。

## 数据流水线

数据不是手抄的，而是从 Brotato Wiki 的 MediaWiki 数据模板解析而来：

```bash
# 1. 抓取模板原始文本（已放在 .research/，可跳过）
curl -sL "https://brotato.wiki.spellsandguns.com/index.php?title=Template:Weapon_Data&action=raw" -o .research/weapon_data.txt
curl -sL "https://brotato.wiki.spellsandguns.com/index.php?title=Template:Item_Data&action=raw" -o .research/item_data.txt
curl -sL "https://brotato.wiki.spellsandguns.com/index.php?title=Template:Character_Data&action=raw" -o .research/character_data.txt

# 2. 解析 + 合并中文层
npm run data:all
```

- `scripts/parse-wiki.mjs`：处理 `{{#switch}}` 嵌套模板、阶级字段、DLC 标记、HTML/链接清理
- `scripts/build-data.mjs`：合并 `src/data/i18n/*.json`，翻译数值行，输出 `src/data/*.json`
- 中文名称与效果说明在 `src/data/i18n/` 中维护，**不要直接改生成后的 JSON**（会被覆盖）

## 内容维护

### 新增一篇攻略

在 `src/content/guides/` 新建 `.md`，frontmatter 必填：

```yaml
---
title: 标题
description: 摘要（用于列表与 SEO）
category: 入门 | 机制 | 流派 | 进阶 | 版本
tags: [标签]
date: 2026-11-20
updated: 2026-11-20
order: 19          # 列表排序
difficulty: 2      # 1-5
reading: 10        # 预计阅读分钟
---
```

正文用标准 Markdown，`##` / `###` 会自动生成目录锚点。

### 新增/修改角色、武器、道具

1. 在 `src/data/i18n/characters.json` 或 `weapons.json` / `items.json` 中按 slug 补充中文；
2. 若 wiki 数据有更新，重新执行 `npm run data:all`；
3. `npm run build` 验证。

### 更新版本信息

修改 `src/data/patches.json`（时间线、资料来源、核对日期），并在 `src/content/news/` 新增一条记录。

## 部署到 Cloudflare Pages

### 方式 A：GitHub 集成（本项目已在用，push 即自动部署）

当前状态：`axibi/brotato-wiki` 已对接 Cloudflare Pages 项目 `brotato-wiki`，生产分支 `main`，自动部署已启用。**只需 `git push` 到 `main`，Cloudflare 会自动构建并发布。**

从零配置的步骤：

1. 推送仓库到 GitHub；
2. Cloudflare Dashboard → **Workers & Pages** → 选择 Pages 项目 → **设置** → **Git 存储库** → **连接**；
3. 授权 GitHub（安装 Cloudflare Workers and Pages App，选择该仓库），构建配置：
   - Framework preset：`Astro`（会自动填入下面两项）
   - Build command：`npm run build`
   - Build output directory：`dist`
   - Node version：`22`（环境变量 `NODE_VERSION=22`，Astro 5 需要 ≥18.17）
4. 生产分支选 `main`，保存；
5. 之后每次 push 到 `main` 自动重新构建，PR 会生成预览地址。

### 方式 B：Wrangler CLI

```bash
npm i -g wrangler
wrangler login
npm run build
wrangler pages project create brotato-wiki --production-branch main
wrangler pages deploy dist --project-name brotato-wiki
```

`wrangler.toml` 已配置 `pages_build_output_dir = "dist"`，也可直接 `wrangler pages deploy`。

### 绑定自定义域名

1. Pages 项目 → **Custom domains** → **Set up a domain**；
2. 输入域名（如 `brotato.example.com`），Cloudflare 托管域名会自动添加 CNAME；
3. 若域名不在 Cloudflare，按提示在 DNS 添加 CNAME 指向 `<project>.pages.dev`；
4. 等待证书签发（通常几分钟），然后在 `astro.config.mjs` 中把 `SITE` 或环境变量 `PUBLIC_SITE_URL` 改为新域名并重新部署，保证 canonical / sitemap 正确。

### 环境变量

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | 站点绝对地址，用于 canonical、OG、sitemap、RSS | `https://brotato-wiki.pages.dev` |

**不要把任何 Token、密码写进仓库。** 部署凭证由 Cloudflare 侧管理。

## SEO 清单

- [x] 每页独立 title / description
- [x] canonical（基于 `site` 配置）
- [x] Open Graph + Twitter Card（`/og.svg`）
- [x] JSON-LD：WebSite / VideoGame / Article / BreadcrumbList / CollectionPage
- [x] `sitemap-index.xml`（@astrojs/sitemap 自动生成）
- [x] `robots.txt`（含 sitemap 地址）
- [x] RSS（`/rss.xml`）
- [x] 语义化标题层级与面包屑
- [x] 图片 alt（像素图为装饰性时 `aria-hidden`）
- [x] 404 页面

## 数据与版权说明

- 数值来自 Brotato Wiki 的结构化数据模板（页面标注 Patch 1.1.6.3），按 1.1.x 整理；
- 攻略、点评、优劣势分析为本站原创；
- 所有像素图标由 `PixelSprite.astro` 程序生成，不使用游戏原始素材或其他站点图片；
- Brotato © Blobfish，本站为非官方粉丝站点。

## 已知缺口

- 10 名角色在 wiki 数据模板中缺少条目，暂未收录（名单见 `/about`）；
- 2026 年的 1.1.13~1.1.15 平衡补丁未逐条同步，相关条目已标注「待核实」。
