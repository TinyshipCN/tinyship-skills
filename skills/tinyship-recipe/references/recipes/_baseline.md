# Complex recipe baseline

Applies to every recipe whose file says `New tables: Yes` or adds pages
("complex recipe"; see `catalog.md`). The recipe file adds only its own
specifics (tables, pages, functions, assertions). Where they conflict, this
baseline wins unless the recipe names the exception explicitly.

## 1. Page scope

- Targeted apps = the answer to `SKILL.md` Step 3 (Scope). Each targeted app
  gets **every** page the recipe lists plus an admin sidebar entry; untargeted
  apps get none. "Keep Next + Nuxt + TanStack in sync" = all three;
  tinyship-cf = TanStack only.
- A `libs/<recipe>` implementation without the pages is **incomplete**.
- Admin sidebar files: Next `apps/next-app/components/app-sidebar.tsx`,
  TanStack `apps/tanstack-app/src/components/admin/app-sidebar.tsx`, Nuxt
  `apps/nuxt-app/components/AppSidebar.vue`.
- Route roots: Next `apps/next-app/app/[lang]/(root)/...` and
  `.../[lang]/admin/...`; TanStack `apps/tanstack-app/src/routes/$lang/(root)/...`
  and `.../$lang/admin/...`; Nuxt `apps/nuxt-app/pages/...` (locale via the
  i18n module), admin pages under `pages/admin/` with
  `definePageMeta({ layout: 'admin' })`.

## 2. UI

- Only the starter's theme components: React (Next, TanStack)
  `libs/react-shared/ui/*` (`card`, `button` + `buttonVariants`, `badge`,
  `input`, `label`, `select`, `switch`, `textarea`, `alert`, `avatar`,
  `table`, `separator`, `dialog`, `pagination`); Nuxt
  `apps/nuxt-app/components/ui/*` (same set).
- Colors only via theme tokens from `libs/ui/styles/themes/*.css`
  (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `text-primary`,
  `text-destructive`, ...). No hard-coded colors (`bg-red-*`, `text-white`,
  hex, `rgb()`). Pages must follow the theme switcher and dark mode.
- Layout mirrors existing starter pages: public pages inside the `(root)`
  layout like the blog list (`min-h-screen bg-background`, `max-w-7xl`
  container, centered `text-4xl` title + muted subtitle, card grid); admin
  pages inside the admin layout like `admin/users` (`container mx-auto py-10
  px-5`, `text-2xl` title, `Card` + `Table`).
- Images that may be missing (logos, avatars) use `Avatar` / `AvatarImage` with
  an `AvatarFallback` initial letter.
- **All copy** (page text, buttons, sidebar label, empty / error states) goes
  into the starter i18n packs for **every** locale the starter has
  (`libs/i18n/locales/*`), following `apply.md` Copy rules. No literal UI
  strings in page files.

## 3. Database

The recipe file fixes the schema and migration name; do not rename or
simplify while building UI.

1. Schema in both trees: `libs/database/schema/pg/<recipe>.ts` and
   `libs/database/schema/sqlite/<recipe>.ts`, a proxy
   `libs/database/schema/<recipe>.ts`, exported from the schema barrels.
   Supported dialects: PG, SQLite, D1 (D1 uses the SQLite schema).
2. Generate in the user project with the recipe's exact name
   (`recipe_<id>_v1`); let Drizzle pick the `00NN_` number:
   `npx drizzle-kit generate --name <name>` and
   `npx drizzle-kit generate --config=drizzle.config.sqlite.ts --name <name>`
   (`drizzle.config.ts` needs `DATABASE_URL` even for generate). PG →
   `libs/database/drizzle`; SQLite / D1 → `libs/database/drizzle-sqlite`.
3. Idempotent SQL: every `CREATE TABLE` / `CREATE INDEX` uses
   `IF NOT EXISTS`; wrap each PG `ALTER TABLE ... ADD CONSTRAINT` in
   `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`. Keep
   keys, unique and partial unique indexes intact.
4. Upstream journal conflict: keep upstream, delete the local recipe migration,
   regenerate with the same name, re-apply. Later changes: new name
   (`..._v2`) with `ALTER` only; never edit v1.
5. Do not modify starter tables.

## 4. Transactions and credits

- Multi-statement writes use only the starter helpers from `@libs/database`:
  PG `runTransaction(async (tx) => ...)`; SQLite
  `runSqliteTransaction((tx) => ...)` (synchronous, `.run()` / `.get()` /
  `.all()`, no `await`); D1 `runD1Batch` / `runNativeD1Batch`. Never call
  `db.transaction()` directly and never hand-roll `BEGIN` / `await` /
  `COMMIT`.
- Credits only through `creditService` (`libs/credits`): `consumeCredits`,
  `addCredits`. Credits are integers. Do not touch payment fulfillment.
- Starter prerequisite: the starter must export `runSqliteTransaction` and
  compare balances with `CAST(credit_balance AS REAL)` on SQLite / D1
  (`STARTER_CREDITS_FIX`: branch `fix/credits-sqlite-d1`, not merged upstream
  yet; replace with the merged commit / tag once it lands). If missing, stop
  and tell the user to update the starter; do not patch it in the recipe.
- Paid flows: **pending → consume → complete**.
  1. Insert the recipe's purchase row `status = "pending"`, no ledger id.
  2. `consumeCredits({ ..., metadata: { <recipe>PurchaseId } })`. Only on
     `error === "Insufficient credits"` delete the pending row and throw
     `INSUFFICIENT_CREDITS`; any other error keeps it for reconciliation.
  3. One atomic write (helper per dialect above) sets `status = "active"`,
     the ledger id and the domain change. Derived values (e.g. stacked
     expiry) are computed in SQL inside that UPDATE, never read-then-write.
     If it throws, refund with `addCredits({ type: "refund" })`.
  - Reconciliation: stale `pending` rows are matched to the ledger by
    metadata id (SQLite / D1 `json_extract(metadata, '$.<key>')`, PG
    `metadata->>'<key>'`); found → finish step 3, not found → delete. A
    one-off admin script is enough.

## 5. Acceptance

All must pass before calling the recipe done. The recipe supplies
`scripts/recipes/<id>/verify.ts` (PASS / FAIL per check, non-zero exit on
failure) and its assertions.

1. Three DB rounds, each from a clean clone + `pnpm install`:

   | Round | `DB_DIALECT` | Build database with |
   |-------|--------------|---------------------|
   | SQLite | `sqlite` | `mkdir -p data && pnpm db:push:sqlite` |
   | PG | `pg` | `pnpm db:push` on a fresh database |
   | D1 | `d1` | fresh `apps/tanstack-app/.wrangler/state`, `.dev.vars` from `.dev.vars.example`, `npx wrangler d1 migrations apply tinyship-db --local` in `apps/tanstack-app` |

   In each: `pnpm db:generate` and `pnpm db:generate:sqlite` report no schema
   changes; the recipe SQL passes the idempotent-DDL grep and re-applies
   cleanly (SQLite / PG: re-run its statements; D1: copy / rename the file and
   apply again); typecheck and build of the targeted apps pass; `verify.ts`
   passes. D1 has no Node driver: `verify.ts` uses `getPlatformProxy` from
   `wrangler` and runs inside `withD1(proxy.env.DB, fn)`.
2. Migrations-only (PG, SQLite): on a new empty DB apply only migration SQL in
   journal order (no `db:push`) and compare the recipe tables' columns and
   indexes with the recipe snapshot. PG: if the starter journal has an entry
   without SQL, build the base with `db:push` of the pre-recipe schema, then
   apply only the recipe file.
3. Pages: with demo data seeded, every recipe page returns HTTP 200 in each
   targeted app (admin: 200 signed in as admin, signed-out may redirect), plus
   the recipe's own content checks.
4. Hard-coded color grep over the new page files fails on
   `(bg|text|border)-(red|green|blue|amber|yellow|gray|white|black)`, hex or
   `rgb(` colors.
5. Visual: screenshot (e.g. Playwright, 1280x900) the recipe's home and admin
   pages next to `/[lang]/blog` and `/[lang]/admin/users` under the same
   theme; header / sidebar, background, card radius / border, type scale and
   primary color must match, and image fallbacks must show. Switch the theme
   once and confirm the recipe pages follow it.
