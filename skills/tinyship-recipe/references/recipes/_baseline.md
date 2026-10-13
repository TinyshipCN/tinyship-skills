# Complex recipe baseline

For recipes that add tables or pages. The recipe adds only its specifics and
ships fixed procedures as scripts under `recipes/<id>/scripts/`. Anything not
stated here or in the recipe is the agent's call, judged by §5.

## 1. Scope and UI

- Every app chosen in `SKILL.md` Step 3 gets every recipe page plus an admin
  sidebar entry; other apps get none. Library code without pages is incomplete.
- Follow existing pages: public ones like `/[lang]/blog`, admin ones like
  `/[lang]/admin/users`. Starter theme components only
  (`libs/react-shared/ui/*`, Nuxt `components/ui/*`), theme tokens only (no
  palette classes, `text-white`, hex, `rgb()`), image fallbacks via `Avatar`.
- All copy in every `libs/i18n/locales/*` pack, including enum labels
  (statuses, kinds) and empty / error states. Symbols and placeholders
  (`←`, `-`, `https://`) are not copy.
- **Admin writes check admin themselves.** Middleware only guards admin
  *pages*; every server action / API route that writes must verify
  `session.user.role === admin`. Public writes (submit) require a session.

## 2. Replacing the home page

When the locale root becomes the product page:

- Skip `apply.md` Landing contract; of `home.*` rewrite only `home.metadata`
  (site title / og / twitter via `app/[lang]/layout.tsx`) and `home.footer`, so
  no TinyShip remains. The old marketing component is removed from that file.
- Header / footer: keep components and theme, change only links (recipe lists
  keep / hide / promote). Logo → locale root. Hide = remove links desktop +
  mobile + footer, keep route files; omit an empty footer `<nav>`.
- Links: home is `/` for the default locale (`config.app.i18n.defaultLocale`),
  `/<locale>` otherwise; subpages always `/${locale}/...` (middleware only
  unprefixes home). Never hard-code `'zh-CN'`; the starter header does
  (`localeHomePath`, language switch) — fix those lines when you touch it.

## 3. Database

- Schema and migration name are fixed by the recipe; never modify starter
  tables. Schema in both `schema/pg/` and `schema/sqlite/` (D1 = SQLite).
- Generate both (`npx drizzle-kit generate --name <name>` and
  `--config=drizzle.config.sqlite.ts`), then make the SQL idempotent:
  `IF NOT EXISTS` on every `CREATE TABLE` / `INDEX`; each PG `ADD CONSTRAINT`
  wrapped in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`.
- Later changes: new migration `..._v2`, never edit v1. Journal conflict with
  upstream: keep upstream, delete and regenerate the recipe migration.

## 4. Transactions and credits

- Starter must have the credits fix (`runSqliteTransaction` exported; tinyship
  main commit `66ab098`, PR #37). Missing → stop, tell the user.
- Multi-statement writes only via `@libs/database` helpers: PG
  `runTransaction(async tx => …)`; SQLite `runSqliteTransaction(tx => …)`
  (sync, `.run()/.get()/.all()`, no `await`); D1 `runD1Batch` /
  `runNativeD1Batch`. Never `db.transaction()` or hand-rolled `BEGIN`.
- Credits only via `creditService.consumeCredits` / `addCredits`; integers;
  never touch payment fulfillment. `consumeCredits` returns `{ success, error }`.
- Paid flow **pending → consume → complete**:
  1. insert purchase `status = pending`;
  2. consume with the purchase id in metadata; only
     `error === "Insufficient credits"` deletes the pending row and throws
     `INSUFFICIENT_CREDITS`; other errors keep it;
  3. one atomic write sets `active`, the ledger id and the domain change,
     derived values computed in SQL. If it throws: set `refunded`
     (`WHERE status = 'pending'`) first, then `addCredits({ type: "refund" })`.
- Reconciliation touches only `pending` rows (ledger matched by metadata id →
  finish, else delete) and reports `refunded` rows lacking a refund entry.

## 5. Acceptance (outcomes; recipe scripts run the fixed parts)

Done only when all hold:

1. `acceptance.sh` passes on a clean clone for SQLite, PG (fresh DB) and D1:
   DB builds, `db:generate` both report "No schema changes", recipe SQL
   re-applies, `verify.ts` passes twice, targeted apps typecheck + build.
   The D1 round runs only DB + `verify.ts` unless TanStack is targeted.
2. Migrations-only (SQLite via `verify.ts --migrations-only`, PG via
   `pg-migrations-only.sh`) matches the recipe snapshot.
3. With the recipe demo seed: every page returns 200: home at `/` and `/en`, subpages at `/zh-CN/…` and `/en/…`
   (admin signed in as admin); signed out, submit shows a sign-in prompt and
   admin redirects; the recipe's content check holds.
4. No hard-coded colors in new page files; no literal UI strings.
5. Screenshots next to `/blog` and `/admin/users` match (header / sidebar,
   background, cards, type scale, primary color); switching theme and dark
   mode keeps every recipe page readable.
6. `SKILL.md` Step 5 (home-replaced variant) passes.
