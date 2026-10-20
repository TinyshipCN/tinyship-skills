# Recipe: ai-video

AI video product. Users sign in, spend credits, generate short videos, pay for more credits.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Video Studio` when `config.app.name` is still `TinyShip` |
| `{pitch}` | Turn a prompt into a short video. |
| `{pitch-zh}` | 一句话生成一段短视频。 |
| `{cta}` | Start generating |

## Prerequisite

The starter must be tinyship `b105336` or later (video tasks persisted in the
`ai_video_task` table, `libs/ai/video-task-service.ts` present), so a failed
video returns its credits. Missing → stop and tell the user to update the starter.

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- Payment: keep plans; configure a provider later via `tinyship-payment`
- After apply: `tinyship-ai` for the video provider key (`FAL_API_KEY`, `QWEN_API_KEY` or `VOLCENGINE_ACCESS_KEY_ID`)

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Keep routes | `/video-generate`, `/pricing`, auth, dashboard, admin |
| Hide from header | Demos dropdown (`/ai`, `/image-generate`, `/premium-features`, `/upload`), `/blog` |
| Promote | Top-level nav link to `/video-generate` (label = rewritten `header.demos.aiVideo.title`, e.g. "Generate") |
| Keep in header | Pricing |
| Do not delete | Any route files |

Rewrite these in both locales. Leave other `header.demos.*` strings; they are unused once hidden.

| Key | `en.ts` | `zh-CN.ts` |
|-----|---------|------------|
| `header.demos.aiVideo.title` | `Generate` | `生成视频` |
| `header.demos.aiVideo.description` | `Turn a prompt into a short video. Sign in required.` | `一句话生成短视频，需要登录。` |
| `ai.video.metadata.title` | `{product} - Generate video` | `{product} - 生成视频` |
| `ai.video.title` | `Generate a video` | `生成视频` |
| `ai.video.description` | `Pick a model, write a prompt. Failed videos return their credits.` | `选模型，写提示词。生成失败会退回积分。` |

Footer: replace the Blog link with the same `/video-generate` link (label
`header.demos.aiVideo.title`); keep Pricing and the About / Contact / Privacy /
Terms links.

## Landing

- Primary CTA → `/video-generate`
- Secondary → `#features`
- `techStack.items` = `[]` and do not render the chip row
- No new tables, no new pages, no new API routes

## Pricing / credits

Do not invent plans. Existing per-model costs in `config/credits.ts`
`fixedConsumption.aiVideo` and the models in `config/aiVideo.ts` stay.
Optional: `pricing.metadata.title` → `{product} - Pricing` / `{product} - 定价`,
`description` → `Buy credits for AI video generation.` / `购买积分，用于 AI 视频生成。`

## Out of scope

Public gallery, image-to-video upload UI, new models, deleting tasks, teams.

## Optional extensions

Do **not** build these during apply. List them in the Step 5 closing report;
build one only if the user asks.

- **My videos** (`/videos`) — list from existing `GET /api/video-generate/tasks`
  (status, cost, created time; play `resultUrl` inline when succeeded).
- **Task detail** (`/videos/:id`) — poll `GET /api/video-generate/status?taskId=`;
  show error and「已退回积分」/ "Credits returned" when `refunded`.
- **Admin video list** — read `ai_video_task` (join user), follow an existing
  admin page pattern.
- **Failure copy on generate page** — when status is failed, say credits were
  returned (the balance already comes back; the page just does not say so).

## Apply order

Follow `SKILL.md` Step 4 / Step 5. Recipe specifics: offer `tinyship-ai` if keys are missing.

## Example copy — `en.ts` `home`

Fill tokens, then write the same tree in `zh-CN.ts` (Chinese pack below).

**Paste shape:** indent every line of this pack by two spaces. Keep `  home: {` nested in the locale export. End with `  },` (comma + newline) before the next top-level key.

```ts
home: {
  metadata: {
    title: "{product} — AI video generation",
    description: "{pitch}",
    keywords: "AI video, text to video, credits, {product}"
  },
  hero: {
    title: "Turn a sentence into a video",
    titlePrefix: "Turn a sentence into a ",
    titleHighlight: "video",
    titleSuffix: "",
    subtitle: "{pitch} Sign in, spend credits, watch and download the clip.",
    buttons: { purchase: "{cta}", demo: "See how it works" },
    features: {
      lifetime: "Pay for credits, keep every clip you generate",
      earlyBird: "Start with the included credit grant"
    }
  },
  features: {
    title: "Built for shipping clips, not demos",
    subtitle: "{product} takes a prompt and returns a video you can use.",
    items: [
      { title: "Text to video", description: "Describe the shot; the model returns a short clip.", className: "col-span-1 row-span-1" },
      { title: "Credit metering", description: "Each model has a fixed cost, shown before you run.", className: "col-span-1 row-span-1" },
      { title: "Model choice", description: "Pick a configured video model, size, and duration on one page.", className: "col-span-2 row-span-1" },
      { title: "Credits come back on failure", description: "If the provider fails, the credits for that video are returned.", className: "col-span-1 row-span-1" },
      { title: "Plans that refill credits", description: "Subscribe or buy a pack when the balance runs out.", className: "col-span-2 row-span-1" },
      { title: "Runs in the background", description: "Videos take a while; the job keeps going while the page polls.", className: "col-span-1 row-span-1" },
      { title: "Downloadable output", description: "Take the file into your own editor; nothing is locked in.", className: "col-span-1 row-span-1" },
      { title: "Admin visibility", description: "Orders and credit ledgers stay in the existing admin console.", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "How it works",
    subtitle: "Four steps from prompt to clip.",
    items: [
      {
        title: "Write a prompt",
        subtitle: "Say what should happen",
        description: "Open Generate and describe the subject, motion, and camera. Pick a model, size, and duration.",
        highlights: ["Subject and motion in one box", "Model, size, and duration pickers", "English or Chinese prompts", "Run as many times as your balance allows"],
        imageTitle: "Prompt"
      },
      {
        title: "Spend credits",
        subtitle: "One video, one fixed cost",
        description: "Credits are reserved when the job starts. If the video fails, they are returned to your balance.",
        highlights: ["Balance shown before you run", "Cost depends on the selected model", "Failed videos return credits", "Ledger in the dashboard"],
        imageTitle: "Credits"
      },
      {
        title: "Get the video",
        subtitle: "Watch then download",
        description: "Generation takes a minute or more. When it finishes, play it on the page and save the file.",
        highlights: ["Progress while it renders", "On-page player", "Download the clip", "Iterate the same prompt"],
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
      { value: "1", suffix: "", label: "Video per successful run" },
      { value: "0", suffix: "", label: "Credits lost on failure" }
    ]
  },
  testimonials: {
    title: "What this is for",
    items: [
      { quote: "I needed short clips for product pages without a separate video tool.", author: "Ada", role: "Founder" },
      { quote: "A fixed cost per model makes each experiment easy to budget.", author: "Lin", role: "Marketer" },
      { quote: "When a render failed, the credits were back right away.", author: "Omar", role: "Creator" }
    ]
  },
  finalCta: {
    title: "Generate the first video",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "See how it works" }
  },
  footer: {
    copyright: "© {year} {product}. All rights reserved.",
    description: "{product}"
  },
  common: {
    demoInterface: "Generator",
    techArchitecture: "Prompt in, video out, credits in between",
    learnMore: "Learn more"
  }
}
```

## Example copy — `zh-CN.ts` `home`

```ts
home: {
  metadata: {
    title: "{product} — AI 视频生成",
    description: "{pitch}",
    keywords: "AI 视频, 文生视频, 积分, {product}"
  },
  hero: {
    title: "一句话生成一段视频",
    titlePrefix: "一句话生成一段",
    titleHighlight: "视频",
    titleSuffix: "",
    subtitle: "{pitch}登录后消耗积分，在线播放并下载。",
    buttons: { purchase: "{cta}", demo: "看看怎么用" },
    features: {
      lifetime: "按积分付费，生成的视频归你",
      earlyBird: "可用赠送积分先跑通"
    }
  },
  features: {
    title: "为出片准备，而不是为演示",
    subtitle: "{product} 接收提示词，返回可用的视频。",
    items: [
      { title: "文生视频", description: "描述画面，模型返回一段短视频。", className: "col-span-1 row-span-1" },
      { title: "积分计量", description: "每个模型固定价格，生成前就能看到。", className: "col-span-1 row-span-1" },
      { title: "可选模型", description: "在同一页选择模型、尺寸和时长。", className: "col-span-2 row-span-1" },
      { title: "失败退回积分", description: "供应商生成失败时，这次扣的积分会退回。", className: "col-span-1 row-span-1" },
      { title: "套餐补充积分", description: "余额不足时订阅或购买积分包。", className: "col-span-2 row-span-1" },
      { title: "后台生成", description: "视频需要一些时间，页面会自动查询进度。", className: "col-span-1 row-span-1" },
      { title: "可下载结果", description: "把文件带进你自己的剪辑流程。", className: "col-span-1 row-span-1" },
      { title: "后台可查", description: "订单和积分流水仍在现有管理后台。", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "怎么用",
    subtitle: "从提示词到视频，四步。",
    items: [
      {
        title: "写提示词",
        subtitle: "说明画面和动作",
        description: "打开生成页，写主体、动作和镜头。再选模型、尺寸和时长。",
        highlights: ["一个输入框写主体和动作", "可选模型、尺寸、时长", "中英文提示词都可以", "余额够就能反复生成"],
        imageTitle: "提示词"
      },
      {
        title: "消耗积分",
        subtitle: "一个视频，一个固定价",
        description: "开始生成时预扣积分。视频生成失败，积分退回余额。",
        highlights: ["生成前能看到余额", "费用随模型变化", "失败退回积分", "控制台可查流水"],
        imageTitle: "积分"
      },
      {
        title: "拿到视频",
        subtitle: "播放再下载",
        description: "生成通常要一分钟以上。完成后在页内播放并保存。",
        highlights: ["生成中显示进度", "页内播放", "下载视频", "同一提示词可迭代"],
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
      { value: "1", suffix: "", label: "成功一次出一段视频" },
      { value: "0", suffix: "", label: "失败损失的积分" }
    ]
  },
  testimonials: {
    title: "适用场景",
    items: [
      { quote: "给产品页做短视频，不用再开另一个工具。", author: "Ada", role: "创始人" },
      { quote: "每个模型固定价格，试错成本好估算。", author: "Lin", role: "运营" },
      { quote: "有一次生成失败，积分马上就退回了。", author: "Omar", role: "创作者" }
    ]
  },
  finalCta: {
    title: "生成第一段视频",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "看看怎么用" }
  },
  footer: {
    copyright: "© {year} {product}. 保留所有权利。",
    description: "{product}"
  },
  common: {
    demoInterface: "生成器",
    techArchitecture: "提示词进，视频出，中间扣积分",
    learnMore: "了解更多"
  }
}
```

Default `{cta}` in zh-CN when the user did not provide one: `开始生成`.
If they provided an English CTA, keep it in `en.ts` and write a short Chinese equivalent in `zh-CN.ts`.
