# TinyShip Agent Skills

[![skills.sh](https://skills.sh/b/TinyshipCN/tinyship-skills)](https://skills.sh/TinyshipCN/tinyship-skills)

Agent skills for [TinyShip](https://github.com/TinyshipCN/tinyship) — the modern SaaS starter monorepo supporting Next.js, Nuxt.js, and TanStack Start.

These skills help you set up, customize, and extend your TinyShip project through interactive AI-guided workflows. They work with **67+ AI coding agents** including Cursor, Claude Code, Codex, OpenCode, Gemini CLI, Windsurf, and more.

## Install

```bash
# Install all skills (auto-detects your AI agent)
npx skills add TinyshipCN/tinyship-skills

# Install a specific skill
npx skills add TinyshipCN/tinyship-skills --skill tinyship-setup

# List available skills
npx skills add TinyshipCN/tinyship-skills --list
```

> **Prerequisite**: Run this from inside your cloned TinyShip project directory.

## Available Skills

| Skill | Description |
|-------|-------------|
| **tinyship-recipe** | Product playbooks — AI image / video / chat, membership, waitlist, directory, digital product store |
| **tinyship-setup** | Project initialization wizard — env config, database, framework selection, and cleanup of unused frameworks |
| **tinyship-brand** | Brand customization — app name, logo, color theme, i18n defaults |
| **tinyship-auth** | Auth provider setup — Google, GitHub, WeChat, SMS, email/password |
| **tinyship-payment** | Payment integration — Stripe, PayPal, WeChat Pay, Alipay, Creem, Dodo Payments |
| **tinyship-feature** | New feature development — guided monorepo feature workflow with libs, config, i18n, permissions |
| **tinyship-deploy** | Deployment guide — Docker, Vercel, Cloudflare Workers, VPS/PM2 |
| **tinyship-ai** | AI feature integration — chat, image generation, video generation with credit system |
| **tinyship-cloudflare** | All-in Cloudflare setup — Workers + D1/Hyperdrive + R2 + Email Sending + Turnstile |


## Recipes (`tinyship-recipe`)

First-batch product playbooks. Ask naturally (e.g. *"Make an AI image SaaS"*) and the agent applies one of these:

### `ai-image`
AI image SaaS. Users sign in, spend credits on `/image-generate`, and buy more via plans. Other demo links are hidden; Generate is promoted in the nav. After apply, configure an image provider key with `tinyship-ai`.

### `ai-video`
AI video SaaS on `/video-generate` + credits + plans. Needs a starter with persisted video tasks (`ai_video_task`) so a failed generation returns its credits. Minimal ship: one generate page; optional extensions (My videos, task detail, admin list) only if you ask.

### `ai-chat`
AI chat / GPT wrapper. Reuses `/ai` with credits and plans. Promotes Chat in the nav and hides image/video demos.

### `membership-content`
Paid membership around posts. Public blog teasers, pricing plans, and a gated premium page. Primary CTA goes to `/pricing`; Blog and Pricing stay in the nav.

### `waitlist`
Pre-launch signup. Auth is the product: hide pricing and demos, collect accounts via Better Auth signup (no extra waitlist schema). Flip to another recipe later when you open the product.

### `directory`
Curated directory / navigation site (complex). Home becomes the listing; signed-in users submit, admins approve, credits pay for listings and featured slots, plus hand-entered ads. New tables, migration, and acceptance scripts.

### `digital-product`
Digital product store (complex). Multi-product catalog, real-money `one_time` checkout on the product page, purchase entitlement + file download — **no license key in v1**. Hides Pricing, Demos, and Blog from the nav. New tables plus payment fulfillment hooks (providers untouched).

Full contracts live under [`skills/tinyship-recipe/references/`](skills/tinyship-recipe/references/) ([catalog](skills/tinyship-recipe/references/catalog.md) + each `recipes/<id>.md`).

## Usage

After installation, just ask your AI agent naturally:

- *"Make an AI image SaaS"* / *"用 TinyShip 做等待名单"* / *"做数字产品售卖站"* → triggers `tinyship-recipe`
- *"Help me set up TinyShip"* → triggers `tinyship-setup`
- *"Change the app name and logo"* → triggers `tinyship-brand`
- *"Add Stripe payment"* → triggers `tinyship-payment`
- *"Deploy to Docker"* → triggers `tinyship-deploy`
- *"Add a new feature for user profiles"* → triggers `tinyship-feature`
- *"Set up Cloudflare for my project"* → triggers `tinyship-cloudflare`

## Supported Agents

These skills work with any agent supported by the [skills CLI](https://github.com/vercel-labs/skills), including:

Cursor, Claude Code, Codex, OpenCode, OpenClaw, Gemini CLI, GitHub Copilot, Windsurf, Cline, Amp, Roo Code, Kiro CLI, Junie, Trae, and [60+ more](https://github.com/vercel-labs/skills#supported-agents).

## Links

- [TinyShip Repository](https://github.com/TinyshipCN/tinyship)
- [TinyShip Documentation](https://docs.tinyship.cn/)
- [Skills CLI](https://github.com/vercel-labs/skills)
- [Skills Directory](https://skills.sh)

## License

MIT
