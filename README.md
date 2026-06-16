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
| **tinyship-setup** | Project initialization wizard — env config, database, framework selection, and cleanup of unused frameworks |
| **tinyship-brand** | Brand customization — app name, logo, color theme, i18n defaults |
| **tinyship-auth** | Auth provider setup — Google, GitHub, WeChat, SMS, email/password |
| **tinyship-payment** | Payment integration — Stripe, PayPal, WeChat Pay, Alipay, Creem, Dodo Payments |
| **tinyship-feature** | New feature development — guided monorepo feature workflow with libs, config, i18n, permissions |
| **tinyship-deploy** | Deployment guide — Docker, Vercel, Cloudflare Workers, VPS/PM2 |
| **tinyship-ai** | AI feature integration — chat, image generation, video generation with credit system |
| **tinyship-cloudflare** | All-in Cloudflare setup — Workers + D1/Hyperdrive + R2 + Email Sending + Turnstile |

## Usage

After installation, just ask your AI agent naturally:

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
