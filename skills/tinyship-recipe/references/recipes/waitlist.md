# Recipe: waitlist

Pre-launch site. Collect accounts now; hide pay and demo tools until you flip a later recipe.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Launch` when `config.app.name` is still `TinyShip` |
| `{pitch}` | Get in before the product opens. |
| `{pitch-zh}` | 产品开放前先占一个位置。 |
| `{cta}` | Join the list |

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- Payment: **later**. Do not block setup on Stripe keys
- Pricing mode: static is enough
- AI keys: not required

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Keep routes | `/signup`, `/signin`, home, (optional) `/blog` as updates |
| Hide from header | Entire Demos dropdown, `/pricing` |
| Hide Blog | Yes, unless the user wants an updates log |
| Promote | Nothing extra — header auth buttons (`Get Started` / `Sign In`) are the product |
| Do not delete | Pricing, payment APIs, or demo routes |

Rewrite `header.auth.getStarted` to `{cta}` if you want the header button to match the hero.

## Landing

- Primary CTA → `/signup`
- Secondary → `/signin` (use "I already have an account") **or** `#features`
- `techStack.items` = `[]` and do not render the chip row
- No new tables, no waitlist-specific schema (Better Auth signup **is** the list)

## Pricing / credits

Leave plan config in the repo. Do not link it from home or header.

## Out of scope

Referral positions, invite codes, separate email-capture table, countdown widgets, SMS blast.

## Apply order

1. Slots → 2. Landing contract (primary `/signup`) → 3. Hide pricing + demos in header **and footer** → 4. i18n packs (see paste shape) → 5. Auth chrome + `header.auth.getStarted` → 6. Verify `/`, `/en`, `/signup` click, `/signin` title → 7. Tell the user a later recipe can turn this into image / chat / membership

## Example copy — `en.ts` `home`

**Paste shape:** indent every line of this pack by two spaces. Keep `  home: {` nested in the locale export. End with `  },` (comma + newline) before the next top-level key.

```ts
home: {
  metadata: {
    title: "{product} — join the list",
    description: "{pitch}",
    keywords: "waitlist, early access, {product}"
  },
  hero: {
    title: "Be on the list when it opens",
    titlePrefix: "Be on the list when it ",
    titleHighlight: "opens",
    titleSuffix: "",
    subtitle: "{pitch} Create an account now. Billing stays off this page.",
    buttons: { purchase: "{cta}", demo: "I already have an account" },
    features: {
      lifetime: "One account is enough to hold your place",
      earlyBird: "No card required to join"
    }
  },
  features: {
    title: "A front door, not a catalog",
    subtitle: "{product} is collecting people first.",
    items: [
      { title: "Account as the list", description: "Signup writes a real user. There is no second spreadsheet.", className: "col-span-1 row-span-1" },
      { title: "No checkout here", description: "Pricing and pay links stay off the public header.", className: "col-span-1 row-span-1" },
      { title: "Short promise", description: "Say what is coming in one line; do not demo unused tools.", className: "col-span-2 row-span-1" },
      { title: "Sign in later", description: "People who already joined can come back through Sign In.", className: "col-span-1 row-span-1" },
      { title: "Dashboard stays quiet", description: "After login they see an account, not a generator.", className: "col-span-2 row-span-1" },
      { title: "Flip later", description: "A later recipe can expose generate, chat, or membership without a new repo.", className: "col-span-1 row-span-1" },
      { title: "Email is the channel", description: "You already have the address on the user record.", className: "col-span-1 row-span-1" },
      { title: "Staff can see who joined", description: "Admin users list is the waitlist roster.", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "How it works",
    subtitle: "Four steps from a stranger to a stored account.",
    items: [
      {
        title: "Read the promise",
        subtitle: "Home says what is coming",
        description: "The landing is the pitch. It does not open unused product tools.",
        highlights: ["One hero sentence", "No pricing link", "No demo menu", "CTA is join"],
        imageTitle: "Home"
      },
      {
        title: "Create an account",
        subtitle: "Signup is the waitlist",
        description: "The primary button goes to signup. That row is the list you will email later.",
        highlights: ["Email and password or configured OAuth", "No card", "Confirmation uses existing auth mail", "Duplicate email is just sign-in"],
        imageTitle: "Signup"
      },
      {
        title: "Come back",
        subtitle: "Sign in still works",
        description: "Secondary CTA can point at sign-in so returning people are not asked to register twice.",
        highlights: ["Header Sign In", "Forgot-password stays available", "Session cookie as usual", "No new waitlist table"],
        imageTitle: "Return"
      },
      {
        title: "Open the product later",
        subtitle: "Do not rebuild the repo",
        description: "When you are ready to charge or generate, run another recipe. Hidden routes are still in the tree.",
        highlights: ["Routes were hidden, not deleted", "Payment skill when you need keys", "AI skill when you need models", "Same users keep their accounts"],
        imageTitle: "Next"
      }
    ]
  },
  stats: {
    title: "Simple loop",
    items: [
      { value: "1", suffix: "", label: "Landing" },
      { value: "1", suffix: "", label: "Signup form" },
      { value: "1", suffix: "", label: "User row" },
      { value: "0", suffix: "", label: "Checkout links" }
    ]
  },
  testimonials: {
    title: "What this is for",
    items: [
      { quote: "I needed emails before I needed checkout.", author: "Rae", role: "Founder" },
      { quote: "The list is just users. I can count them in admin.", author: "Ken", role: "Builder" },
      { quote: "We can turn on pricing later without exporting a CSV.", author: "Val", role: "PM" }
    ]
  },
  finalCta: {
    title: "Hold a place",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "I already have an account" }
  },
  footer: {
    copyright: "© {year} {product}. All rights reserved.",
    description: "{product}"
  },
  common: {
    demoInterface: "Waitlist",
    techArchitecture: "Pitch, signup, wait",
    learnMore: "Learn more"
  }
}
```

## Example copy — `zh-CN.ts` `home`

```ts
home: {
  metadata: {
    title: "{product} — 加入名单",
    description: "{pitch}",
    keywords: "等待名单, 内测, {product}"
  },
  hero: {
    title: "开放前，先占一个位置",
    titlePrefix: "开放前，先占一个",
    titleHighlight: "位置",
    titleSuffix: "",
    subtitle: "{pitch} 现在注册即可。这页不收款。",
    buttons: { purchase: "{cta}", demo: "我已有账号" },
    features: {
      lifetime: "一个账号就够占位",
      earlyBird: "加入不必绑卡"
    }
  },
  features: {
    title: "先做门口，不做目录",
    subtitle: "{product} 现在只收人。",
    items: [
      { title: "账号就是名单", description: "注册写入真实用户，不再另做表格。", className: "col-span-1 row-span-1" },
      { title: "这里没有结账", description: "定价和支付入口不出现在公开导航。", className: "col-span-1 row-span-1" },
      { title: "一句话承诺", description: "说清楚要上线什么，不演示还没用的工具。", className: "col-span-2 row-span-1" },
      { title: "回来就登录", description: "已经加入的人走登录，不必再注册。", className: "col-span-1 row-span-1" },
      { title: "登录后保持安静", description: "进控制台只看到账号，不是生成器。", className: "col-span-2 row-span-1" },
      { title: "以后再展开", description: "之后可以用另一份菜谱打开生图、对话或会员，不用新仓库。", className: "col-span-1 row-span-1" },
      { title: "邮件就能触达", description: "地址已经在用户记录上。", className: "col-span-1 row-span-1" },
      { title: "后台能数人", description: "管理端用户列表就是名单。", className: "col-span-1 row-span-1" }
    ],
    techStack: { title: "", items: [] }
  },
  applicationFeatures: {
    title: "怎么用",
    subtitle: "从陌生人到一条用户记录，四步。",
    items: [
      {
        title: "看承诺",
        subtitle: "首页只说即将上线什么",
        description: "落地页是卖点，不打开还没用的产品工具。",
        highlights: ["一句主标题", "没有定价链接", "没有演示菜单", "主按钮是加入"],
        imageTitle: "首页"
      },
      {
        title: "注册",
        subtitle: "注册页就是名单",
        description: "主按钮进入注册。这条记录以后用来发信。",
        highlights: ["邮箱密码或已配置的 OAuth", "不绑卡", "沿用现有认证邮件", "重复邮箱就去登录"],
        imageTitle: "注册"
      },
      {
        title: "回来",
        subtitle: "登录仍然可用",
        description: "次按钮可以指向登录，避免回来的人再注册一次。",
        highlights: ["导航里的登录", "找回密码仍在", "会话和原来一样", "不新增 waitlist 表"],
        imageTitle: "回访"
      },
      {
        title: "以后再打开产品",
        subtitle: "不必重建仓库",
        description: "要收费或生成时，跑另一份菜谱。被藏起的路由还在。",
        highlights: ["路由是隐藏不是删除", "需要密钥再走支付 skill", "需要模型再走 AI skill", "老用户账号还在"],
        imageTitle: "下一步"
      }
    ]
  },
  stats: {
    title: "固定闭环",
    items: [
      { value: "1", suffix: "", label: "落地页" },
      { value: "1", suffix: "", label: "注册表单" },
      { value: "1", suffix: "", label: "用户行" },
      { value: "0", suffix: "", label: "结账入口" }
    ]
  },
  testimonials: {
    title: "适用场景",
    items: [
      { quote: "先要名单，还不到收款的时候。", author: "Rae", role: "创始人" },
      { quote: "名单就是用户表，后台能数。", author: "Ken", role: "开发者" },
      { quote: "以后开定价，不用导出 CSV。", author: "Val", role: "产品" }
    ]
  },
  finalCta: {
    title: "先占一个位置",
    subtitle: "{pitch}",
    buttons: { purchase: "{cta}", demo: "我已有账号" }
  },
  footer: {
    copyright: "© {year} {product}. 保留所有权利。",
    description: "{product}"
  },
  common: {
    demoInterface: "等待名单",
    techArchitecture: "卖点、注册、等待",
    learnMore: "了解更多"
  }
}
```

Default `{cta}` in zh-CN: `加入名单`.

For waitlist secondary buttons, point hero + final CTA **demo** links at `/signin` (not `#features`) so "I already have an account" works.
