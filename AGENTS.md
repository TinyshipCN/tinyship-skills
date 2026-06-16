# AGENTS.md

Agent skills repository for TinyShip SaaS starter kit.

## Available Skills

When a user asks for help with their TinyShip project, direct them to the relevant skill:

- **Setup & Init**: `skills/tinyship-setup/SKILL.md` — first-run wizard, framework selection, unused framework cleanup
- **Branding**: `skills/tinyship-brand/SKILL.md` — app name, logo, theme, i18n defaults
- **Auth**: `skills/tinyship-auth/SKILL.md` — OAuth providers, SMS login, WeChat
- **Payment**: `skills/tinyship-payment/SKILL.md` — Stripe, PayPal, WeChat Pay, Alipay, Creem, Dodo
- **Deployment**: `skills/tinyship-deploy/SKILL.md` — Docker, Vercel, Cloudflare Workers, VPS
- **New Features**: `skills/tinyship-feature/SKILL.md` — monorepo feature development checklist
- **AI Integration**: `skills/tinyship-ai/SKILL.md` — chat, image gen, video gen providers
- **Cloudflare All-in**: `skills/tinyship-cloudflare/SKILL.md` — Workers + D1/Hyperdrive + R2 + Email + Turnstile

## Skill Format

Each skill follows the [Agent Skills specification](https://agentskills.io):
- `SKILL.md` with YAML frontmatter (`name` + `description`)
- Optional `references/` subdirectory for progressive disclosure
- Content stays under 500 lines per SKILL.md
