# Recipe: ai-image

AI image product. Users sign in, spend credits, generate images, pay for more credits.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Image Studio` when `config.app.name` is still `TinyShip` |
| `{pitch}` | Generate production-ready images from a text prompt. |
| `{pitch-zh}` | 用一句话生成能直接用的图片。 |
| `{cta}` | Start generating |

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- Payment: keep plans; configure a provider later via `tinyship-payment`
- After apply: `tinyship-ai` for the image provider key (`FAL_API_KEY` or equivalent)

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Keep routes | `/image-generate`, `/pricing`, auth, dashboard, admin |
| Hide from header | Demos dropdown (`/ai`, `/video-generate`, `/premium-features`, `/upload`), `/blog` |
| Promote | Top-level nav link to `/image-generate` (label = rewritten `header.demos.aiImage.title`, e.g. "Generate") |
| Keep in header | Pricing |
| Do not delete | Any route files |

Rewrite `header.demos.aiImage` so it no longer says "demo". Leave other `header.demos.*` strings; they are unused once hidden.

## Landing

- Primary CTA → `/image-generate`
- Secondary → `#features`
- `techStack.items` = `[]` and do not render the chip row
- No new tables

## Pricing / credits

Do not invent plans. Existing credit costs in `config/credits.ts` / `config/aiImage.ts` stay.
Optional: soften pricing page metadata so it talks about image credits, not "starter kit".

## Out of scope

Persistent public gallery, community feed, new models, inpainting UI, teams.

## Apply order

1. Slots → 2. Landing contract → 3. Header **and footer** hide/promote → 4. i18n packs (see paste shape) → 5. Auth chrome (`common.siteName`, `auth.metadata.signin` / `signup`) → 6. `tinyship-ai` if keys missing → 7. Verify `/`, `/en`, CTA click, footer, `/signin` title

## Example copy — `en.ts` `home`

Fill tokens, then write the same tree in `zh-CN.ts` (Chinese pack below).

**Paste shape:** indent every line of this pack by two spaces. Keep `  home: {` nested in the locale export. End with `  },` (comma + newline) before the next top-level key.

```ts
home: {
  metadata: {
    title: "{product} — AI image generation",
    description: "{pitch}",
    keywords: "AI image, text to image, credits, {product}"
  },
  hero: {
    title: "Turn a sentence into an image",
    titlePrefix: "Turn a sentence into an ",
    titleHighlight: "image",
    titleSuffix: "",
    subtitle: "{pitch} Sign in, spend credits, download the result.",
    buttons: { purchase: "{cta}", demo: "See how it works" },
    features: {
      lifetime: "Pay for credits, keep every image you generate",
      earlyBird: "Start with the included credit grant"
    }
  },
  features: {
    title: "Built for shipping images, not demos",
    subtitle: "{product} takes a prompt and returns a file you can use.",
    items: [
      { title: "Text to image", description: "Describe the scene; the model returns a still you can download.", className: "col-span-1 row-span-1" },
      { title: "Credit metering", description: "Each run deducts credits so usage stays predictable.", className: "col-span-1 row-span-1" },
      { title: "Model choice", description: "Pick a configured image model without leaving the page.", className: "col-span-2 row-span-1" },
      { title: "Signed-in workspace", description: "Generation sits behind an account so history and billing stay attached to a user.", className: "col-span-1 row-span-1" },
      { title: "Plans that refill credits", description: "Subscribe or buy a pack when the balance runs out.", className: "col-span-2 row-span-1" },
      { title: "Prompt iteration", description: "Tweak the prompt and run again without changing tools.", className: "col-span-1 row-span-1" },
      { title: "Downloadable output", description: "Take the file into your own stack; nothing is locked in a canvas.", className: "col-span-1 row-span-1" },
      { title: "Admin visibility", description: "Orders and credit ledgers stay in the existing admin console.", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "How it works",
    subtitle: "Four steps from prompt to file.",
    items: [
      {
        title: "Write a prompt",
        subtitle: "Say what should appear",
        description: "Open Generate and describe the subject, style, and framing. You do not need a design file to start.",
        highlights: ["Subject and style in one box", "No upload required", "English or Chinese prompts", "Run as many times as your balance allows"],
        imageTitle: "Prompt"
      },
      {
        title: "Spend credits",
        subtitle: "One run, one debit",
        description: "The job starts only after credits are reserved. Failed provider calls should not silently drain the balance.",
        highlights: ["Balance shown before you run", "Cost depends on the selected model", "Buy more on Pricing", "Ledger in the dashboard"],
        imageTitle: "Credits"
      },
      {
        title: "Get the image",
        subtitle: "Preview then download",
        description: "When the job finishes, preview it on the page and save the file. Run again with a tighter prompt if needed.",
        highlights: ["On-page preview", "Download the asset", "Iterate the same prompt", "Stay on one screen"],
        imageTitle: "Output"
      },
      {
        title: "Refill when empty",
        subtitle: "Plans sit one click away",
        description: "Pricing stays in the header. Pick a plan, return to Generate, and keep working.",
        highlights: ["Header link to Pricing", "Checkout uses your configured provider", "Credits appear on the next login", "Cancel later without losing the current period"],
        imageTitle: "Plans"
      }
    ]
  },
  stats: {
    title: "Simple loop",
    items: [
      { value: "1", suffix: "", label: "Prompt box" },
      { value: "1", suffix: "", label: "Credit ledger" },
      { value: "1", suffix: "", label: "Image per successful run" },
      { value: "0", suffix: "", label: "Extra tools required" }
    ]
  },
  testimonials: {
    title: "What this is for",
    items: [
      { quote: "I needed stills for landing pages without opening a separate generator.", author: "Ada", role: "Founder" },
      { quote: "Credits make it obvious what each experiment costs.", author: "Lin", role: "Marketer" },
      { quote: "I stay in one account for generate, pay, and receipts.", author: "Omar", role: "Designer" }
    ]
  },
  finalCta: {
    title: "Generate the first image",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "See how it works" }
  },
  footer: {
    copyright: "© {year} {product}. All rights reserved.",
    description: "{product}"
  },
  common: {
    demoInterface: "Generator",
    techArchitecture: "Prompt in, image out, credits in between",
    learnMore: "Learn more"
  }
}
```

## Example copy — `zh-CN.ts` `home`

```ts
home: {
  metadata: {
    title: "{product} — AI 文生图",
    description: "{pitch}",
    keywords: "AI 生图, 文生图, 积分, {product}"
  },
  hero: {
    title: "一句话生成一张图",
    titlePrefix: "一句话生成一张",
    titleHighlight: "图",
    titleSuffix: "",
    subtitle: "{pitch} 登录后消耗积分，下载结果。",
    buttons: { purchase: "{cta}", demo: "看看怎么用" },
    features: {
      lifetime: "按积分付费，生成的图片归你",
      earlyBird: "可用赠送积分先跑通"
    }
  },
  features: {
    title: "为出图准备，而不是为演示",
    subtitle: "{product} 接收提示词，返回可下载的文件。",
    items: [
      { title: "文生图", description: "描述场景，模型返回可下载的静帧。", className: "col-span-1 row-span-1" },
      { title: "积分计量", description: "每次生成扣除积分，用量可预期。", className: "col-span-1 row-span-1" },
      { title: "可选模型", description: "在同一页切换已配置的生图模型。", className: "col-span-2 row-span-1" },
      { title: "登录后使用", description: "生成挂在账户上，方便对账和记录。", className: "col-span-1 row-span-1" },
      { title: "套餐补充积分", description: "余额不足时订阅或购买积分包。", className: "col-span-2 row-span-1" },
      { title: "反复改提示词", description: "不用换工具，改完再跑一次。", className: "col-span-1 row-span-1" },
      { title: "可下载结果", description: "把文件带到你自己的流程里，不锁在画布中。", className: "col-span-1 row-span-1" },
      { title: "后台可查", description: "订单和积分流水仍在现有管理后台。", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "怎么用",
    subtitle: "从提示词到文件，四步。",
    items: [
      {
        title: "写提示词",
        subtitle: "说明要出现什么",
        description: "打开生成页，写主体、风格和构图。不需要先上传设计稿。",
        highlights: ["一个输入框写主体和风格", "不必上传参考图", "中英文提示词都可以", "余额够就能反复生成"],
        imageTitle: "提示词"
      },
      {
        title: "消耗积分",
        subtitle: "一次生成，一次扣费",
        description: "先预留积分再开工。供应商失败时不应悄悄扣光余额。",
        highlights: ["生成前能看到余额", "费用随模型变化", "在定价页补充", "控制台可查流水"],
        imageTitle: "积分"
      },
      {
        title: "拿到图片",
        subtitle: "预览再下载",
        description: "任务完成后在页内预览并保存。提示词不够准就改完再跑。",
        highlights: ["页内预览", "下载文件", "同一提示词可迭代", "不用跳转"],
        imageTitle: "结果"
      },
      {
        title: "余额不足就充值",
        subtitle: "定价页在导航里",
        description: "选套餐，回到生成页继续用。",
        highlights: ["导航可进定价", "使用你已配置的支付", "积分在下次登录可见", "到期前取消仍可用完当期"],
        imageTitle: "套餐"
      }
    ]
  },
  stats: {
    title: "固定闭环",
    items: [
      { value: "1", suffix: "", label: "提示词输入" },
      { value: "1", suffix: "", label: "积分账本" },
      { value: "1", suffix: "", label: "成功一次出一张图" },
      { value: "0", suffix: "", label: "额外工具" }
    ]
  },
  testimonials: {
    title: "适用场景",
    items: [
      { quote: "做落地页配图时不用再开另一个生成器。", author: "Ada", role: "创始人" },
      { quote: "积分让每次试错的成本一眼能看清。", author: "Lin", role: "运营" },
      { quote: "生成、付费、收据都在同一个账号里。", author: "Omar", role: "设计师" }
    ]
  },
  finalCta: {
    title: "生成第一张图",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "看看怎么用" }
  },
  footer: {
    copyright: "© {year} {product}. 保留所有权利。",
    description: "{product}"
  },
  common: {
    demoInterface: "生成器",
    techArchitecture: "提示词进，图片出，中间扣积分",
    learnMore: "了解更多"
  }
}
```

Default `{cta}` in zh-CN when the user did not provide one: `开始生图`.
If they provided an English CTA, keep it in `en.ts` and write a short Chinese equivalent in `zh-CN.ts`.
