# Recipe: ai-chat

AI chat / GPT-wrapper product. Users sign in, spend credits, talk to a configured model.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Chat Studio` when `config.app.name` is still `TinyShip` |
| `{pitch}` | A signed-in chat workspace with metered model usage. |
| `{pitch-zh}` | 登录后按量使用模型对话。 |
| `{cta}` | Start chatting |

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- Payment: keep plans; configure later via `tinyship-payment`
- After apply: `tinyship-ai` for the chat provider key

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Keep routes | `/ai`, `/pricing`, auth, dashboard, admin |
| Hide from header | Demos dropdown (`/image-generate`, `/video-generate`, `/premium-features`, `/upload`), `/blog` |
| Promote | Top-level nav link to `/ai` (label = rewritten `header.demos.ai.title`, e.g. "Chat") |
| Keep in header | Pricing |
| Do not delete | Any route files |

Rewrite `header.demos.ai` so it no longer says "demo".

## Landing

- Primary CTA → `/ai`
- Secondary → `#features`
- `techStack.items` = `[]` and do not render the chip row
- No new tables

## Pricing / credits

Keep existing chat credit costs. Optional: pricing metadata talks about chat credits.

## Out of scope

Custom agents, tool calling UI, shared team workspaces, RAG document stores.

## Apply order

1. Slots → 2. Landing contract → 3. Header **and footer** hide/promote → 4. i18n packs (see paste shape) → 5. Auth chrome (`common.siteName`, `auth.metadata.signin` / `signup`) → 6. `tinyship-ai` if keys missing → 7. Verify `/`, `/en`, CTA click, footer, `/signin` title

## Example copy — `en.ts` `home`

**Paste shape:** indent every line of this pack by two spaces. Keep `  home: {` nested in the locale export. End with `  },` (comma + newline) before the next top-level key.

```ts
home: {
  metadata: {
    title: "{product} — AI chat",
    description: "{pitch}",
    keywords: "AI chat, assistant, credits, {product}"
  },
  hero: {
    title: "A chat box that bills in credits",
    titlePrefix: "A chat box that bills in ",
    titleHighlight: "credits",
    titleSuffix: "",
    subtitle: "{pitch} Sign in, pick a model, keep the thread in your account.",
    buttons: { purchase: "{cta}", demo: "See how it works" },
    features: {
      lifetime: "Usage is metered; the account stays yours",
      earlyBird: "Start with the included credit grant"
    }
  },
  features: {
    title: "Chat as the product",
    subtitle: "{product} is a metered assistant, not a framework tour.",
    items: [
      { title: "Streaming replies", description: "Answers arrive as they are generated so the thread feels live.", className: "col-span-1 row-span-1" },
      { title: "Credit metering", description: "Each turn deducts credits against the signed-in user.", className: "col-span-1 row-span-1" },
      { title: "Model switch", description: "Use the models already configured for chat, without a new app.", className: "col-span-2 row-span-1" },
      { title: "Account-scoped history", description: "Threads belong to the logged-in user, not a shared demo box.", className: "col-span-1 row-span-1" },
      { title: "Plans that refill", description: "When the balance hits zero, Pricing is one header click away.", className: "col-span-2 row-span-1" },
      { title: "Guarded route", description: "Chat sits behind auth so anonymous traffic cannot drain the key.", className: "col-span-1 row-span-1" },
      { title: "One conversation surface", description: "No extra canvases — prompt, reply, repeat.", className: "col-span-1 row-span-1" },
      { title: "Admin ledger", description: "Credit and order history stay in the existing admin console.", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "How it works",
    subtitle: "Four steps from signup to a billed reply.",
    items: [
      {
        title: "Sign in",
        subtitle: "Chat is not a public sandbox",
        description: "Create an account or log in. The key and the balance stay attached to that user.",
        highlights: ["Email or configured OAuth", "No anonymous drain", "Dashboard shows remaining credits", "Sign out from the header"],
        imageTitle: "Account"
      },
      {
        title: "Open Chat",
        subtitle: "One page, one thread",
        description: "The Chat link in the header opens the workspace. Pick a model if more than one is enabled.",
        highlights: ["Header entry", "Model selector when configured", "Prompt box at the bottom", "Streaming output"],
        imageTitle: "Workspace"
      },
      {
        title: "Spend credits",
        subtitle: "Turns are metered",
        description: "A send reserves credits first. If the provider fails, the product should not silently take the whole balance.",
        highlights: ["Cost visible in the product copy", "Balance in the dashboard", "Buy more on Pricing", "Ledger per order"],
        imageTitle: "Credits"
      },
      {
        title: "Refill",
        subtitle: "Keep the same account",
        description: "Buy a plan, wait for the webhook, return to Chat. No second product to learn.",
        highlights: ["Pricing in the header", "Configured payment provider", "Credits after fulfillment", "Cancel at period end if subscribed"],
        imageTitle: "Plans"
      }
    ]
  },
  stats: {
    title: "Simple loop",
    items: [
      { value: "1", suffix: "", label: "Chat page" },
      { value: "1", suffix: "", label: "Credit ledger" },
      { value: "1", suffix: "", label: "Account per user" },
      { value: "0", suffix: "", label: "Extra consoles" }
    ]
  },
  testimonials: {
    title: "What this is for",
    items: [
      { quote: "I needed a billed assistant without building auth again.", author: "Mei", role: "Indie hacker" },
      { quote: "Credits make internal usage honest.", author: "Chris", role: "Ops" },
      { quote: "The chat page is the whole product.", author: "Noor", role: "Writer" }
    ]
  },
  finalCta: {
    title: "Open the first thread",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "See how it works" }
  },
  footer: {
    copyright: "© {year} {product}. All rights reserved.",
    description: "{product}"
  },
  common: {
    demoInterface: "Chat",
    techArchitecture: "Prompt in, tokens out, credits in between",
    learnMore: "Learn more"
  }
}
```

## Example copy — `zh-CN.ts` `home`

```ts
home: {
  metadata: {
    title: "{product} — AI 对话",
    description: "{pitch}",
    keywords: "AI 对话, 助手, 积分, {product}"
  },
  hero: {
    title: "按积分计费的对话框",
    titlePrefix: "按积分计费的",
    titleHighlight: "对话",
    titleSuffix: "",
    subtitle: "{pitch} 登录后选择模型，记录留在自己的账号里。",
    buttons: { purchase: "{cta}", demo: "看看怎么用" },
    features: {
      lifetime: "按量扣积分，账号仍是你的",
      earlyBird: "可用赠送积分先跑通"
    }
  },
  features: {
    title: "对话就是产品",
    subtitle: "{product} 是按量计费的助手，不是框架导览。",
    items: [
      { title: "流式回复", description: "边生成边显示，对话更连贯。", className: "col-span-1 row-span-1" },
      { title: "积分计量", description: "每一轮从登录用户的余额扣除。", className: "col-span-1 row-span-1" },
      { title: "切换模型", description: "使用已配置的对话模型，不用另开应用。", className: "col-span-2 row-span-1" },
      { title: "账号级记录", description: "会话属于当前用户，不是公共演示框。", className: "col-span-1 row-span-1" },
      { title: "套餐补充余额", description: "积分为零时，导航里就能进定价页。", className: "col-span-2 row-span-1" },
      { title: "登录后才能聊", description: "避免未登录流量把密钥打空。", className: "col-span-1 row-span-1" },
      { title: "一个对话面", description: "提问、回复、再提问，没有多余画布。", className: "col-span-1 row-span-1" },
      { title: "后台账本", description: "积分和订单仍在现有管理后台。", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "怎么用",
    subtitle: "从注册到一次计费回复，四步。",
    items: [
      {
        title: "登录",
        subtitle: "对话不是公开沙箱",
        description: "注册或登录。密钥和余额都挂在这个用户上。",
        highlights: ["邮箱或已配置的 OAuth", "避免匿名消耗", "控制台能看剩余积分", "可从导航退出"],
        imageTitle: "账号"
      },
      {
        title: "打开对话",
        subtitle: "一页一个会话",
        description: "导航里的对话入口进入工作区。配置了多个模型就可以切换。",
        highlights: ["导航入口", "可选模型", "底部输入框", "流式输出"],
        imageTitle: "工作区"
      },
      {
        title: "消耗积分",
        subtitle: "按轮计费",
        description: "发送前先预留积分。供应商失败时不应悄悄扣光余额。",
        highlights: ["产品文案说明费用", "控制台看余额", "定价页补充", "按订单记账"],
        imageTitle: "积分"
      },
      {
        title: "充值",
        subtitle: "还用同一个账号",
        description: "买套餐，等支付完成，回到对话页继续。",
        highlights: ["导航可进定价", "使用已配置的支付", "到账后继续聊", "订阅可期末取消"],
        imageTitle: "套餐"
      }
    ]
  },
  stats: {
    title: "固定闭环",
    items: [
      { value: "1", suffix: "", label: "对话页" },
      { value: "1", suffix: "", label: "积分账本" },
      { value: "1", suffix: "", label: "一人一账号" },
      { value: "0", suffix: "", label: "额外控制台" }
    ]
  },
  testimonials: {
    title: "适用场景",
    items: [
      { quote: "只想要一个会计费的助手，不想再做一遍登录。", author: "Mei", role: "独立开发者" },
      { quote: "积分让内部用量说得清。", author: "Chris", role: "运营" },
      { quote: "对话页就是整个产品。", author: "Noor", role: "写作者" }
    ]
  },
  finalCta: {
    title: "开启第一段对话",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "看看怎么用" }
  },
  footer: {
    copyright: "© {year} {product}. 保留所有权利。",
    description: "{product}"
  },
  common: {
    demoInterface: "对话",
    techArchitecture: "提问进，回复出，中间扣积分",
    learnMore: "了解更多"
  }
}
```

Default `{cta}` in zh-CN: `开始对话`.
