---
name: tinyship-feature
description: >-
  Guide for building new features in the TinyShip monorepo following established
  patterns: shared libs first, then config, app wiring, i18n, and permissions.
  Use when the user asks to "add a new feature", "create new page", "add API
  endpoint", "build a feature", "add new functionality", or "develop a module".
---

# TinyShip Feature Development

Step-by-step guide for adding new features to a TinyShip project, following the
monorepo architecture patterns.

## Step 0: Scope the Feature

Ask the user to clarify:

1. **What type?** UI only / API only / full-stack
2. **What does it do?** Brief description of the feature
3. **Does it need auth?** Should it be protected?
4. **Does it consume credits?** If AI-related, should it charge credits?

## Step 1: Shared Logic (libs/)

Put domain/business logic in `libs/` — never duplicate it across apps.

Read the root `AGENTS.md` for the full feature checklist and `libs/*/AGENTS.md`
for existing library patterns.

**When to create a new lib vs extend existing**:
- Payment-related → extend `libs/payment/`
- Auth-related → extend `libs/auth/`
- AI-related → extend `libs/ai/`
- New domain → create `libs/your-domain/` with an `AGENTS.md`

## Step 2: Configuration (config/)

If the feature needs configurable options:

1. Add a new config file `config/yourFeature.ts` or extend an existing one
2. Export it from `config.ts`
3. Add any new env vars to `env.example` with descriptions

## Step 3: API Route

Create the API endpoint in the active app:

**Next.js**: `apps/next-app/app/api/your-feature/route.ts`
```typescript
import { yourLogic } from '@libs/your-domain';

export async function POST(req: Request) {
  // Auth check, input validation, call shared logic, return response
}
```

**Nuxt.js**: `apps/nuxt-app/server/api/your-feature.post.ts`
```typescript
import { yourLogic } from '@libs/your-domain';

export default defineEventHandler(async (event) => {
  // Auth check, input validation, call shared logic, return response
});
```

**TanStack Start**: Use `createServerFn` or traditional API route.

## Step 4: Page/UI

Create the frontend page:

**Next.js**: `apps/next-app/app/[lang]/your-feature/page.tsx`
**Nuxt.js**: `apps/nuxt-app/pages/your-feature.vue`
**TanStack Start**: `apps/tanstack-app/src/routes/[lang]/your-feature.tsx`

Use shared React components from `libs/react-shared/` (Next + TanStack).

## Step 5: i18n

Add translation keys in both language files:

1. `libs/i18n/locales/en.ts` — English (source of truth)
2. `libs/i18n/locales/zh-CN.ts` — Chinese (mirror same structure)

```typescript
// In en.ts
yourFeature: {
  title: 'Your Feature',
  description: 'Feature description',
  // ... all user-facing strings
}
```

Never hardcode user-facing strings in components.

## Step 6: Auth & Permissions

If the feature requires authentication:

**Next.js**: Add route to middleware protection in `apps/next-app/middleware.ts`
**Nuxt.js**: Configure in `apps/nuxt-app/server/middleware/permissions.ts`
**TanStack Start**: Add `beforeLoad` guard in the route definition

For role-based access, use the CASL permissions system in `libs/permissions/`.

## Step 7: Credits (if applicable)

If the feature consumes credits:

1. Define cost in `config/credits.ts`
2. Use `creditService.consumeCredits()` from `libs/credits`
3. Add transaction type code in `libs/credits/utils.ts`
4. Add credit description translations in `libs/i18n/locales/`

## Step 8: Verify

```bash
# Typecheck
pnpm --filter @tinyship/next-app typecheck  # adjust for your app

# Build
pnpm --filter @tinyship/next-app build
```

Test the feature manually:
1. Navigate to the new page
2. Test the API endpoint
3. Verify auth protection works
4. Test i18n by switching languages

## Reference Files in TinyShip Repo

- `AGENTS.md` — root feature checklist (the definitive reference)
- `libs/*/AGENTS.md` — per-library patterns and architecture
- `.cursor/rules/project-structure.mdc` — monorepo layout guide
- `libs/i18n/AGENTS.md` — i18n conventions
- `libs/permissions/AGENTS.md` — permission system guide
