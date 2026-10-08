# Recipe: membership-content

Paid membership around posts. Public blog teaser, paid plans, a gated premium page.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Members` when `config.app.name` is still `TinyShip` |
| `{pitch}` | Posts for everyone, extras for members. |
| `{pitch-zh}` | 文章公开读，会员看更多。 |
| `{cta}` | See plans |

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- Payment: this product needs a provider; mention `tinyship-payment` after apply
- AI keys: not required

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Keep routes | `/blog`, `/pricing`, `/premium-features`, auth, dashboard, admin blog |
| Hide from header | Entire Demos dropdown (`/ai`, `/image-generate`, `/video-generate`, `/upload`) |
| Promote | Top-level `/premium-features` using rewritten `header.demos.premium.title` (e.g. "Members") **or** keep only Blog + Pricing if the user wants a quieter nav |
| Keep in header | Blog, Pricing |
| Footer | Same as header: keep Blog + Pricing; add the promoted Members link; do not add hidden demos |
| Do not delete | Any route files |

Rewrite `header.navigation.blog`, `header.demos.premium` so they read as the product, not a demo.

## Landing

- Primary CTA → `/pricing`
- Secondary → `/blog` (change the `#features` secondary only on hero/final CTA **secondary** to `/blog`)
- `techStack.items` = `[]` and do not render the chip row
- No new tables

## Pricing / credits

Keep existing plans. Credits can stay in the dashboard; do not put AI credit language on the home page.

## Out of scope

Paywalled individual posts (needs post-level access), comments, email newsletter sending, courses, DRM.

## Apply order

1. Slots → 2. Landing contract (secondary → `/blog`) → 3. Header **and footer** hide/promote → 4. i18n packs (see paste shape) → 5. Auth chrome (`common.siteName`, `auth.metadata.signin` / `signup`) → 6. Offer `tinyship-payment` → 7. Verify `/`, `/en`, `/blog`, `/pricing`, `/premium-features`, `/signin` title

## Example copy — `en.ts` `home`

**Paste shape:** indent every line of this pack by two spaces. Keep `  home: {` nested in the locale export. End with `  },` (comma + newline) before the next top-level key.

```ts
home: {
  metadata: {
    title: "{product} — membership",
    description: "{pitch}",
    keywords: "membership, posts, subscription, {product}"
  },
  hero: {
    title: "Read freely. Join when you want more.",
    titlePrefix: "Read freely. Join when you want ",
    titleHighlight: "more",
    titleSuffix: ".",
    subtitle: "{pitch} The index is public. Member tools sit behind a plan.",
    buttons: { purchase: "{cta}", demo: "Read the latest" },
    features: {
      lifetime: "Cancel at period end and keep access until it lapses",
      earlyBird: "Start on a monthly plan"
    }
  },
  features: {
    title: "A library with a door",
    subtitle: "{product} publishes in the open and sells the extra room.",
    items: [
      { title: "Public index", description: "Anyone can browse posts without creating an account.", className: "col-span-1 row-span-1" },
      { title: "Member room", description: "Premium Features stays reserved for an active plan.", className: "col-span-1 row-span-1" },
      { title: "Plans in one place", description: "Monthly, yearly, or one-time options use the existing pricing page.", className: "col-span-2 row-span-1" },
      { title: "Editor in admin", description: "Staff write and publish from the admin blog screens.", className: "col-span-1 row-span-1" },
      { title: "Account dashboard", description: "Members manage subscription and receipts after login.", className: "col-span-2 row-span-1" },
      { title: "No AI pitch", description: "This product is writing and access, not a model playground.", className: "col-span-1 row-span-1" },
      { title: "Shareable URLs", description: "Each post keeps a stable slug you can send to readers.", className: "col-span-1 row-span-1" },
      { title: "Staff controls", description: "Users, orders, and posts stay in the existing admin.", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "How it works",
    subtitle: "Four steps from a public post to a member session.",
    items: [
      {
        title: "Publish",
        subtitle: "Write in admin, list on /blog",
        description: "Create a post in the admin blog UI. The public index updates without a deploy.",
        highlights: ["Admin blog editor", "Public /blog list", "Per-post slug", "Draft until you publish"],
        imageTitle: "Posts"
      },
      {
        title: "Let people read",
        subtitle: "No account required for the index",
        description: "Share the blog URL. Readers who only want the public pieces never see checkout.",
        highlights: ["Open index", "Open post pages", "Header link labeled Blog", "Sign-in is optional here"],
        imageTitle: "Readers"
      },
      {
        title: "Offer a plan",
        subtitle: "Pricing is the upgrade",
        description: "Members buy a plan, then open the gated page. Access follows the existing subscription rules.",
        highlights: ["Header link to Pricing", "Configured payment provider", "Active or canceled-until-period-end still gets in", "Refunds revoke access"],
        imageTitle: "Plans"
      },
      {
        title: "Use the member page",
        subtitle: "One gated surface to start",
        description: "Premium Features is the first locked room. Add more gated pages later with tinyship-feature.",
        highlights: ["Login required", "Plan required", "Same account as billing", "Admin can see subscribers"],
        imageTitle: "Members"
      }
    ]
  },
  stats: {
    title: "Simple loop",
    items: [
      { value: "1", suffix: "", label: "Public index" },
      { value: "1", suffix: "", label: "Gated room" },
      { value: "1", suffix: "", label: "Pricing page" },
      { value: "0", suffix: "", label: "AI upsell on home" }
    ]
  },
  testimonials: {
    title: "What this is for",
    items: [
      { quote: "I can publish weekly and charge for the extras.", author: "Hana", role: "Writer" },
      { quote: "Readers are not forced through signup to skim.", author: "Jules", role: "Editor" },
      { quote: "Billing and the gated page share one account.", author: "Priya", role: "Operator" }
    ]
  },
  finalCta: {
    title: "Pick a plan, or just read",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "Read the latest" }
  },
  footer: {
    copyright: "© {year} {product}. All rights reserved.",
    description: "{product}"
  },
  common: {
    demoInterface: "Library",
    techArchitecture: "Public posts, paid door",
    learnMore: "Learn more"
  }
}
```

## Example copy — `zh-CN.ts` `home`

**Paste shape:** same as English — two-space indent, trailing comma after `home`.

```ts
home: {
  metadata: {
    title: "{product} — 会员内容",
    description: "{pitch}",
    keywords: "会员, 专栏, 订阅, {product}"
  },
  hero: {
    title: "先免费读，想看更多再加入",
    titlePrefix: "先免费读，想看更多再",
    titleHighlight: "加入",
    titleSuffix: "",
    subtitle: "{pitch} 目录公开。会员能力走套餐。",
    buttons: { purchase: "{cta}", demo: "读最新文章" },
    features: {
      lifetime: "期末取消，当期仍可用",
      earlyBird: "先从月付开始"
    }
  },
  features: {
    title: "带门的内容库",
    subtitle: "{product} 公开更新，另售多出来的那一间。",
    items: [
      { title: "公开目录", description: "不注册也能浏览文章列表。", className: "col-span-1 row-span-1" },
      { title: "会员页", description: "高级功能页只给有效套餐打开。", className: "col-span-1 row-span-1" },
      { title: "定价集中一页", description: "月付、年付或一次买断都走现有定价页。", className: "col-span-2 row-span-1" },
      { title: "后台编辑", description: "工作人员在后台写稿和发布。", className: "col-span-1 row-span-1" },
      { title: "会员控制台", description: "登录后管理订阅和收据。", className: "col-span-2 row-span-1" },
      { title: "不推 AI", description: "这是写作和权限，不是模型演示。", className: "col-span-1 row-span-1" },
      { title: "可分享链接", description: "每篇文章有稳定 slug。", className: "col-span-1 row-span-1" },
      { title: "员工后台", description: "用户、订单、文章仍在现有管理端。", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "怎么用",
    subtitle: "从一篇公开文章到一次会员访问，四步。",
    items: [
      {
        title: "发布",
        subtitle: "后台写，前台 /blog 列出",
        description: "在后台博客里创建文章。公开目录会更新，不用重新部署。",
        highlights: ["后台编辑器", "公开列表", "每篇一个 slug", "未发布就是草稿"],
        imageTitle: "文章"
      },
      {
        title: "让人先读",
        subtitle: "看目录不必注册",
        description: "把博客地址发出去。只看公开内容的人不会碰到结账。",
        highlights: ["开放目录", "开放文章页", "导航里的博客", "这里登录是可选的"],
        imageTitle: "读者"
      },
      {
        title: "提供套餐",
        subtitle: "升级走定价页",
        description: "会员买套餐后再进门槛页。访问规则沿用现有订阅。",
        highlights: ["导航进定价", "使用已配置的支付", "有效或期末取消仍可进入", "退款会收回访问"],
        imageTitle: "套餐"
      },
      {
        title: "使用会员页",
        subtitle: "先锁这一间",
        description: "高级功能页是第一间上锁的房间。更多门槛页以后再用 tinyship-feature 加。",
        highlights: ["需要登录", "需要套餐", "和账单同一个账号", "后台能看到订阅者"],
        imageTitle: "会员"
      }
    ]
  },
  stats: {
    title: "固定闭环",
    items: [
      { value: "1", suffix: "", label: "公开目录" },
      { value: "1", suffix: "", label: "门槛页" },
      { value: "1", suffix: "", label: "定价页" },
      { value: "0", suffix: "", label: "首页 AI 推销" }
    ]
  },
  testimonials: {
    title: "适用场景",
    items: [
      { quote: "每周更新，额外内容再收费。", author: "Hana", role: "写作者" },
      { quote: "读者扫一眼不必先注册。", author: "Jules", role: "编辑" },
      { quote: "账单和门槛页共用一个账号。", author: "Priya", role: "运营" }
    ]
  },
  finalCta: {
    title: "先看套餐，或先读文章",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "读最新文章" }
  },
  footer: {
    copyright: "© {year} {product}. 保留所有权利。",
    description: "{product}"
  },
  common: {
    demoInterface: "内容库",
    techArchitecture: "公开文章，付费进门",
    learnMore: "了解更多"
  }
}
```

Default `{cta}` in zh-CN: `查看套餐`.
