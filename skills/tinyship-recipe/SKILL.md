---
name: tinyship-recipe
description: >-
  Shape a TinyShip starter into a specific SaaS product using playbook recipes
  (AI image, AI chat, membership, waitlist). Orchestrates setup when needed,
  then hides demo nav, rewrites landing copy, and points CTAs at the product.
  Use when the user asks to "use a recipe", "SaaS template", "make an AI image
  app", "GPT wrapper", "membership site", "waitlist", "用 TinyShip 做",
  or "快速创建模版".
---

# TinyShip Recipe

Turn the TinyShip starter into one product. This skill **composes** existing
modules. It does not pick the database, choose the framework, or paste API keys.

**Conversational wizard. Ask at each stop. Do not invent a new homepage layout.**

## Other skills (do not duplicate them)

| Need | Skill |
|------|--------|
| Env, database, framework, cleanup | `tinyship-setup` |
| App name, logo, theme | `tinyship-brand` |
| OAuth / SMS | `tinyship-auth` |
| Stripe and other providers | `tinyship-payment` |
| Provider API keys for chat / image / video | `tinyship-ai` |
| New tables or pages | `tinyship-feature` |
| shipeasy vs tinyship-cf paths | `references/template-detection.md` (repo root) |

## Step 0: Detect the project

1. Read [../../references/template-detection.md](../../references/template-detection.md).
2. Decide whether **setup is already done**:

| Template | Setup looks done when |
|----------|------------------------|
| shipeasy | Root `.env` has a non-empty `BETTER_AUTH_SECRET` and `node_modules` exists |
| tinyship-cf | `apps/tanstack-app/.dev.vars` has a non-empty `BETTER_AUTH_SECRET` |

If unsure, ask: **Is the app already running locally?**

## Step 1: Pick a recipe

**⛔ STOP — ask unless the user already named the product.**

Read [references/catalog.md](references/catalog.md) and present the first-batch
options. If they said "AI 生图站", confirm `ai-image` and continue.

Then read **only** that recipe file under `references/recipes/`.

## Step 2: Setup (only if Step 0 said not done)

Give a **setup briefing** from the recipe (payment later? AI keys later?).
Do **not** choose SQLite vs Postgres or Next vs Nuxt vs TanStack.

Then follow `tinyship-setup` in full. Come back here after it finishes.

If port **7001 is already taken**, start the chosen app on a free port and set
`APP_BASE_URL` + `BETTER_AUTH_URL` to that origin before verifying. Setup does
not mention this; do it anyway.

## Step 3: Apply questions

**⛔ STOP — ask these, then wait:**

1. **Scope** — Change the app that is running, or keep Next + Nuxt + TanStack in sync? (tinyship-cf: TanStack only.)
2. **Brand** — Change the app name / logo now? If yes, run `tinyship-brand` first.
3. **Copy slots** (max three; skip any they leave blank and use recipe defaults):
   - Product name
   - One-line pitch
   - Primary CTA label

## Step 4: Apply the recipe

Follow [references/apply.md](references/apply.md), then the recipe's Keep / Hide /
CTA / example copy sections.

Order:

1. Landing contract (CTA hrefs + hide empty tech stack) — once per app
2. Hide unused header **and footer** links (desktop **and** mobile). Do not delete route files
3. Promote the product link to top-level nav when the recipe says so
4. Rewrite `home.*` (and `home.footer`) in `libs/i18n/locales/en.ts` **and** `zh-CN.ts`
5. Rewrite auth chrome (`common.siteName`, `auth.metadata.signin` / `signup`, `auth.signup.title`) so those pages do not say TinyShip. Fill zh-CN `{pitch}` from `{pitch-zh}`. Do **not** edit `config.app.name` or logo files
6. Hand off to `tinyship-ai` / `tinyship-payment` / `tinyship-feature` only if the recipe says so

Copy rules are in apply.md. Keys stay locked. Use the recipe example pack as the draft.

## Step 5: Verify

On the running app, check **`/`** (Chinese default) **and `/en`**:

1. Hero title is the product pitch, not the starter boat line
2. Home body has no TinyShip / three-framework / starter-kit wording
3. Click the primary CTA — it must land on the recipe target
4. Hidden demo / blog / pricing links are gone from **header and footer**
5. The product page still opens if the recipe kept it
6. `/signin` and `/signup` document titles use `{product}`, not TinyShip
7. Logo text may still say TinyShip until `tinyship-brand` — report it, do not treat it as a recipe failure

If the locale splice produced `}  validators:` on one line, fix that before verifying.

Tell the user what was shaped, what was only hidden, that the logo is brand's job, and which skill to run next (brand, AI keys, payment, deploy).
