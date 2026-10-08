# Recipe apply contract

Shared rules for every recipe. Do this in the user's TinyShip project, not in
the skills repo.

## Apps and files

After template detection:

**shipeasy** (only the apps the user asked to change):

| Surface | Next | Nuxt | TanStack |
|---------|------|------|----------|
| Home | `apps/next-app/app/[lang]/(root)/page.tsx` | `apps/nuxt-app/pages/index.vue` | `apps/tanstack-app/src/routes/$lang/(root)/index.tsx` |
| Header | `apps/next-app/components/global-header.tsx` | `apps/nuxt-app/components/GlobalHeader.vue` | `apps/tanstack-app/src/components/global-header.tsx` |
| Footer | `apps/next-app/components/site-footer.tsx` | `apps/nuxt-app/components/SiteFooter.vue` | `apps/tanstack-app/src/components/site-footer.tsx` |

**tinyship-cf:** TanStack paths only.

i18n is shared: `libs/i18n/locales/en.ts` and `libs/i18n/locales/zh-CN.ts`.
Changing `home.*` updates every app's homepage text. CTA hrefs and header
links are per-app. If the user scoped one framework, still rewrite i18n
(there is only one locale tree), but only retarget CTAs/nav in that app.
Default public locale is Chinese at `/`; `/zh-CN` redirects. Verify `/` and `/en`.

## Landing contract (once per home file)

1. **Primary CTA href** is hardcoded to `/pricing` today (hero + final CTA).
   Change both to the recipe target (`/image-generate`, `/ai`, `/pricing`, `/signup`).
   Keep the secondary button on `#features` unless the recipe says otherwise.
2. **Tech stack chips** are starter marketing. If `home.features.techStack.items`
   is empty, **do not render** the tech-stack heading or chip row.
3. Do not add sections. Do not remove hero / features / applicationFeatures / final CTA.
4. `iconMap` on the home page expects **8** feature items. Keep 8 cards.
5. `applicationFeatures.items` must stay **4** entries (same shape:
   `title`, `subtitle`, `description`, `highlights`, `imageTitle`).

## Hide vs delete

- Hide = comment out or remove the **header link** (desktop and mobile) **and**
  the matching links in `site-footer` / `SiteFooter`. Footer currently has Blog
  + Pricing; apply the same keep/hide/promote as the header.
- If every footer link is hidden, **omit the `<nav>` element**. Do not leave
  an empty `<nav />`.
- Never delete `page.tsx` / `pages/*.vue` / TanStack route files for unused demos.
- If the Demos dropdown would have 0–1 items, hide the whole dropdown and
  put the kept product on a top-level nav link (same style as Blog / Pricing).
- Leave dashboard tabs alone unless the recipe explicitly changes them.
- Affiliate stays behind `AFFILIATE_ENABLED`; do not add it to the public header.

Current header demos (all three apps): `/ai`, `/image-generate`, `/video-generate`,
`/premium-features`, `/upload`, plus top-level `/blog` and `/pricing`.

## Copy: locked keys, slotted sentences

**Do not add or remove `home.*` keys.** Rewrite values only.

Also rewrite `home.footer.copyright` / `description` so the footer does not say TinyShip.
Rewrite `home.stats` and `home.testimonials` even if the current home does not
render them — leftover starter copy must not leak later.

### Slots

Replace in the example pack:

| Token | Source |
|-------|--------|
| `{product}` | User name, else recipe default if `config.app.name` is `TinyShip` / `ShipEasy` / empty, else `config.app.name` |
| `{pitch}` | User one-liner (use that in both locales unless they gave a Chinese line). Else recipe `{pitch}` in `en.ts` and recipe `{pitch-zh}` in `zh-CN.ts`. **Never paste the English pitch into zh-CN.** |
| `{cta}` | User CTA, else recipe default / zh-CN default |

If the user says "use defaults", paste the example pack with tokens already filled
by the recipe defaults. Do not wait for inspiration.

### Length

- `titlePrefix` + `titleHighlight` + `titleSuffix` = one short sentence
- `hero.subtitle` = 1–2 sentences (include `{pitch}` when it adds information)
- Each feature `description` = one sentence
- Each applicationFeature `description` = 2–3 sentences

### Banned wording

Unless the user is selling the starter itself:

TinyShip, monorepo, starter kit, three frameworks, Next.js / Nuxt.js /
TanStack as a **product pitch**, dual-market boilerplate, "one purchase lifetime
source code".

Framework names may appear in docs or admin, not on the public home page.

### Locales

Write English first in `en.ts`, then the same tree in `zh-CN.ts`.
`{product}` stays as given in both locales unless the user provided a Chinese name.

When splicing an example pack into the locale files:

The files look like this (two-space indent, comma after `home`):

```
  home: {
    ...starter copy...
  },
  <next top-level key>: {
```

The next sibling is **not always** `validators:`. In current `en.ts` it is often `ai:`; in `zh-CN.ts` it is often `validators:`. Match braces; do not search for a fixed key name.

1. Replace the **entire** current `home` object: from the line `  home: {` through the closing `  },` that sits immediately before the next top-level key.
2. The recipe fence starts at column 0. Prefix **every line** of the pack with two spaces so it stays a nested key of the locale export.
3. After the pack's closing `}`, keep a comma and a newline: `  },` then the next key on its own line.
4. Never join them (`}  ai:` or `}  validators:`). That is a TypeScript syntax error.

If a first replace leaves leftover starter `hero` / `features` keys, the splice missed the old closing brace — undo and replace the whole object.

## Auth and chrome (not brand)

This skill does **not** edit `config.app.name` or logo files. The header logo
text stays `TinyShip` until `tinyship-brand`. That is expected; tell the user.

Do rewrite these i18n strings so public auth pages do not say TinyShip:

| Key | EN example | ZH example |
|-----|------------|------------|
| `common.siteName` | `{product}` | `{product}` |
| `auth.metadata.signin.title` | `{product} - Sign In` | `{product} - 登录` |
| `auth.metadata.signin.description` | drop TinyShip / starter kit | same |
| `auth.metadata.signup.title` | `{product} - Create Account` | `{product} - 创建账户` |
| `auth.metadata.signup.description` | drop TinyShip / starter kit | same |
| `auth.signup.title` | `Sign up for {product}` (was TinyShip) | `注册 {product}` |

Optional: the other `auth.metadata.*` titles (forgot / reset / phone / wechat) — replace the word TinyShip with `{product}`.

A kept product route that **redirects guests to `/signin`** (e.g. `/premium-features`) still counts as “the page opens”. The route must remain linked; a login wall is not a failure.

If the recipe rewrites `header.auth.getStarted`, do it in **both** locales.

## Hand-offs

- Missing image / chat / video keys → `tinyship-ai`
- User wants Stripe (or another provider) configured now → `tinyship-payment`
- Recipe needs a new table or page → `tinyship-feature` and both pg + sqlite schemas
- Do not run deploy from this skill
