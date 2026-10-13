# Recipe: directory

Complex recipe: follow [_baseline.md](_baseline.md) (page scope, UI, database,
transactions / credits, acceptance). This file lists only directory specifics.

Directory / navigation site. Visitors browse approved entries; signed-in users
submit entries; admins approve, reject, and manually manage ads.

## Defaults

| Slot | Default |
|------|---------|
| `{product}` | `Directory` when `config.app.name` is still `TinyShip` |
| `{pitch}` | A curated directory of useful links. |
| `{pitch-zh}` | 一个精选链接目录。 |
| `{cta}` | Submit a link |

## Setup briefing

- Database and framework: still ask in `tinyship-setup`.
- Payment: do not configure Stripe / PayPal / WeChat Pay / Alipay / Creem /
  Dodo for this recipe. Directory v1 uses **credits only**.
- Credits: keep the existing credit packages and use the existing credit ledger.
- Storage: entry logos use existing `libs/storage`.
- After apply: run the directory verification script against SQLite, PG, and D1.

## Keep / hide / promote

| Action | Targets |
|--------|---------|
| Replace home | Locale root becomes the directory list (see Pages). Relocate or drop the marketing landing sections from that file; do not leave a second competing home. |
| Keep routes | auth, dashboard, admin, pricing (credits), and all starter demo route **files** (hidden, not deleted) |
| Hide from header / footer | Demos dropdown (`/ai`, `/image-generate`, `/video-generate`, `/premium-features`, `/upload`) and Blog |
| Promote | Logo / Home → locale root (the list). Top-level **Submit** → `/submit`. |
| Keep in header / footer | Pricing (`/pricing`) so users can buy credits |
| Admin sidebar | Directory admin page (baseline §1) |
| Do not delete | Any starter route files (apply.md Hide vs delete) |

Use `config/directory.ts` for directory-specific settings:

```ts
export const directoryConfig = {
  pricing: {
    listingCredits: 50,
    featured: [
      { days: 7, credits: 70 },
      { days: 30, credits: 200 },
    ],
  },
  adSlots: ["home_top", "home_sidebar"],
  customFields: [
    // { key, type: "text" | "url" | "select", label, required, options? }
  ],
};
```

Wire it into the root `config.ts` as `directory: directoryConfig` (`@config`
resolves to `config.ts`, so code reads `config.directory`; there is no
`@config/directory` alias). Also re-export it from `config/index.ts`.

## Landing (home = directory list)

The directory **is** the home page. Do not keep the marketing landing at the
locale root and put the list under `/directory`.

- Replace `(root)/page.tsx` (and Nuxt / TanStack home equivalents) with the
  directory list. The old hero / features / tech-stack / final-CTA blocks go
  away from that file (or move to a non-linked route if you need them later).
- Logo and "Home" always go to locale root.
- Primary public CTA in the header / footer: Submit → `/submit`.
- `apply.md` Landing contract (keep 8 feature cards, CTA → `/pricing`, etc.)
  does **not** apply; this recipe overrides it.

## Database contract

New tables: Yes.

Create the schema files exactly here:

- `libs/database/schema/pg/directory.ts`
- `libs/database/schema/sqlite/directory.ts`
- `libs/database/schema/directory.ts` proxy, using the project's existing
  `DB_DIALECT` selection pattern (`pg`, `sqlite`, `d1`)
- schema barrel export so Drizzle sees the files

The recipe adds exactly 6 tables: `dir_category`, `dir_tag`, `dir_entry`,
`dir_entry_tag`, `dir_purchase`, and `dir_ad`. Do not modify existing tables. `dir_entry.submitter_id`
references `user`; `dir_purchase.credit_transaction_id` references
`credit_transaction`; nothing references `order`.

### PG schema

Use `timestamp(..., { withTimezone: true })` for time and `jsonb` for JSON.
The imports below match the current starter (`./user`, `./credit-transaction`);
if a fork moved those symbols, adjust only the import paths and keep table names, column names, constraints,
and indexes fixed.

```ts
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { creditTransaction } from "./credit-transaction";

export const dirCategory = pgTable(
  "dir_category",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_category_slug_unique").on(table.slug),
  }),
);

export const dirTag = pgTable(
  "dir_tag",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_tag_slug_unique").on(table.slug),
  }),
);

export const dirEntry = pgTable(
  "dir_entry",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    categoryId: text("category_id").references(() => dirCategory.id, {
      onDelete: "set null",
    }),
    submitterId: text("submitter_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"),
    rejectReason: text("reject_reason"),
    listingType: text("listing_type").notNull().default("free"),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    customFields: jsonb("custom_fields").$type<Record<string, unknown> | null>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_entry_slug_unique").on(table.slug),
    statusFeaturedIdx: index("dir_entry_status_featured_idx").on(
      table.status,
      table.featuredUntil,
    ),
    categoryStatusIdx: index("dir_entry_category_status_idx").on(
      table.categoryId,
      table.status,
    ),
    submitterIdx: index("dir_entry_submitter_idx").on(table.submitterId),
  }),
);

export const dirEntryTag = pgTable(
  "dir_entry_tag",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => dirEntry.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => dirTag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      name: "dir_entry_tag_pk",
      columns: [table.entryId, table.tagId],
    }),
    tagIdx: index("dir_entry_tag_tag_idx").on(table.tagId),
  }),
);

export const dirPurchase = pgTable(
  "dir_purchase",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => dirEntry.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    days: integer("days"),
    credits: integer("credits").notNull(),
    creditTransactionId: text("credit_transaction_id").references(
      () => creditTransaction.id,
      { onDelete: "set null" },
    ),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    entryKindIdx: index("dir_purchase_entry_kind_idx").on(
      table.entryId,
      table.kind,
    ),
    creditTransactionUnique: uniqueIndex(
      "dir_purchase_credit_transaction_id_unique",
    )
      .on(table.creditTransactionId)
      .where(sql`${table.creditTransactionId} is not null`),
  }),
);

export const dirAd = pgTable(
  "dir_ad",
  {
    id: text("id").primaryKey(),
    slotKey: text("slot_key").notNull(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    targetUrl: text("target_url").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slotEndsIdx: index("dir_ad_slot_ends_idx").on(table.slotKey, table.endsAt),
  }),
);
```

### SQLite / D1 schema

Use `integer(..., { mode: "timestamp" })` for time and
`text(..., { mode: "json" })` for JSON. D1 uses the same schema and migration
directory as SQLite.

```ts
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { creditTransaction } from "./credit-transaction";

export const dirCategory = sqliteTable(
  "dir_category",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_category_slug_unique").on(table.slug),
  }),
);

export const dirTag = sqliteTable(
  "dir_tag",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_tag_slug_unique").on(table.slug),
  }),
);

export const dirEntry = sqliteTable(
  "dir_entry",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    categoryId: text("category_id").references(() => dirCategory.id, {
      onDelete: "set null",
    }),
    submitterId: text("submitter_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"),
    rejectReason: text("reject_reason"),
    listingType: text("listing_type").notNull().default("free"),
    featuredUntil: integer("featured_until", { mode: "timestamp" }),
    customFields: text("custom_fields", { mode: "json" }).$type<
      Record<string, unknown> | null
    >(),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dir_entry_slug_unique").on(table.slug),
    statusFeaturedIdx: index("dir_entry_status_featured_idx").on(
      table.status,
      table.featuredUntil,
    ),
    categoryStatusIdx: index("dir_entry_category_status_idx").on(
      table.categoryId,
      table.status,
    ),
    submitterIdx: index("dir_entry_submitter_idx").on(table.submitterId),
  }),
);

export const dirEntryTag = sqliteTable(
  "dir_entry_tag",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => dirEntry.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => dirTag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      name: "dir_entry_tag_pk",
      columns: [table.entryId, table.tagId],
    }),
    tagIdx: index("dir_entry_tag_tag_idx").on(table.tagId),
  }),
);

export const dirPurchase = sqliteTable(
  "dir_purchase",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => dirEntry.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    days: integer("days"),
    credits: integer("credits").notNull(),
    creditTransactionId: text("credit_transaction_id").references(
      () => creditTransaction.id,
      { onDelete: "set null" },
    ),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    entryKindIdx: index("dir_purchase_entry_kind_idx").on(
      table.entryId,
      table.kind,
    ),
    creditTransactionUnique: uniqueIndex(
      "dir_purchase_credit_transaction_id_unique",
    )
      .on(table.creditTransactionId)
      .where(sql`${table.creditTransactionId} is not null`),
  }),
);

export const dirAd = sqliteTable(
  "dir_ad",
  {
    id: text("id").primaryKey(),
    slotKey: text("slot_key").notNull(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    targetUrl: text("target_url").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slotEndsIdx: index("dir_ad_slot_ends_idx").on(table.slotKey, table.endsAt),
  }),
);
```

## Migration rules

Follow baseline §3 with migration name `recipe_directory_v1` (PG and SQLite /
D1). `verify.ts` must fail on any `CREATE TABLE` / `CREATE INDEX` without
`IF NOT EXISTS` and on any unwrapped `ADD CONSTRAINT`. Future changes:
`recipe_directory_v2`.

## Directory library contract

Create `libs/directory/index.ts` and keep these public function signatures.
The applying agent may choose internals, validation structure, and page wiring,
but these signatures are fixed because `verify.ts` calls them.

```ts
export async function submitEntry(input: {
  userId: string;
  name: string;
  url: string;
  tagline?: string;
  categoryId?: string;
  tagIds?: string[];
  customFields?: Record<string, unknown>;
  paid?: boolean;
}): Promise<{ entryId: string; status: "pending" }>;

export async function reviewEntry(input: {
  entryId: string;
  reviewerId: string;
  action: "approve" | "reject";
  reason?: string;
}): Promise<void>;

export async function purchaseFeatured(input: {
  entryId: string;
  userId: string;
  days: number;
}): Promise<{ purchaseId: string; featuredUntil: Date }>;

export async function searchEntries(input: {
  q?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  page?: number;
  pageSize?: number;
}): Promise<{ items: unknown[]; total: number }>;
```

Implementation rules:

- Multi-statement writes: baseline §4 helpers only.
- Debit errors: baseline §4 (`INSUFFICIENT_CREDITS` only for
  `error === "Insufficient credits"`).

- `status` values are only `pending`, `approved`, `rejected`.
- `listing_type` values are only `free`, `paid`.
- `dir_purchase.kind` values are only `listing`, `featured`.
- `dir_purchase.status` values are only `pending`, `active`, `refunded`.
- Search only approved entries. Keyword search matches `name` and `tagline`
  (`ILIKE` on PG, `LIKE` on SQLite / D1). Category and tag filters are allowed.
- Sort active featured entries first, then the rest by `published_at`
  descending. Active means `featured_until` is later than now.
- `custom_fields` is display-only JSON validated from
  `config/directory.ts.customFields`. Do not create a custom-field table in v1.

## Credits and purchases

Credits only (baseline §4); no direct item checkout. Both purchases use the
baseline pending → consume → complete flow with `dir_purchase` as the purchase
row and `metadata: { dirPurchaseId }`:

- Paid listing (`kind = "listing"`, `credits = pricing.listingCredits`): insert
  the `dir_entry` (`listing_type = "paid"`, `status = "pending"`) first, then
  the pending purchase; on insufficient credits delete both. Step 3 only
  activates the purchase. Rejected by admin: always
  `addCredits({ type: "refund" })` and mark the purchase `refunded`.
- Featured (`kind = "featured"`, plan from `pricing.featured`): only `approved`
  entries. Step 3 also sets `featured_until = max(now, featured_until) + days`
  in SQL so purchases stack: PG
  `GREATEST(now(), COALESCE(featured_until, now())) + make_interval(days => ?)`,
  SQLite / D1 (seconds) `max(CAST(strftime('%s','now') AS INTEGER),
  COALESCE(featured_until, 0)) + ? * 86400`; read it back for the return value.
- Step-3 failure: baseline rule (mark `refunded`, then refund); for a paid
  listing then also delete the pending entry.
- The partial unique index on `credit_transaction_id` prevents recording one
  debit twice.

Known gap inherited from credits: if a user later refunds a credit package,
credits may only be clawed back to zero and already-active featured placement is
not revoked. Assertions 5, 6 and 9 need the baseline §4 starter prerequisite.

## Ads

Ads are manual admin records only. Do not build self-serve ad purchase or
payment wiring.

- `slot_key` must be one of `config/directory.ts.adSlots`.
- Show ads only when `starts_at <= now < ends_at`.
- To take down an ad, admins set `ends_at` to now.

## Verification script

Create `scripts/recipes/directory/verify.ts` and run it from the repo root with
`DB_DIALECT=<dialect> npx tsx scripts/recipes/directory/verify.ts`. The script
must exercise the public `libs/directory` functions above plus direct test setup
queries where needed, print PASS / FAIL per check, and exit non-zero on any
failure.

- Load `.env` and import `@libs/database` / `@libs/directory` with dynamic
  `import()` after setting `DB_DIALECT`, because the dialect is fixed at module
  load.
- D1 binding: `getPlatformProxy({ configPath: "apps/tanstack-app/wrangler.jsonc",
  persist: { path: "apps/tanstack-app/.wrangler/state/v3" } })` (baseline §5.1).
- SQLite / D1 store timestamps in seconds. In assertion 7, wait at least 1 s
  between approving E1 and E3 so `published_at` really differs.
- Use unique ids / slugs per run and clean up, so the script can run twice.

Run the baseline §5 rounds (SQLite, PG, D1, migrations-only for all 6 tables).
`verify.ts` may implement migrations-only behind `--migrations-only`.
Seed one admin, one normal user, two categories, and three tags, then run the
required assertions:

| # | Action | Assertion |
|---|--------|-----------|
| 1 | User A submits free E1 | Status is `pending`; search cannot find it |
| 2 | Admin approves E1 | Status is `approved`; `published_at` is set; keyword, category, and tag searches can find it |
| 3 | Admin rejects E2 with a reason | Status is `rejected`; `reject_reason` is set; search cannot find it |
| 4 | A has zero credits and tries to feature E1 | Error is specifically insufficient balance (not any failure); `featured_until` unchanged; no new purchase (the pending row is removed) |
| 5 | Add 200 credits to A, then feature E1 for 7 days | Expiry is about now + 7 days; one new `active` purchase linked to the debit; no `pending` purchase left; one credit debit; balance is correct |
| 6 | Feature E1 for another 7 days | Expiry is about now + 14 days, proving stacking |
| 7 | Create an approved, unfeatured E3 and search | E1 ranks before E3 while E1 is featured |
| 8 | Move E1 `featured_until` into the past | E1 no longer receives featured ranking |
| 9 | A pays to submit E4, then admin rejects it | Credits are fully refunded; purchase status becomes `refunded` |
| 10 | Insert one active ad and one expired ad | Query by `slot_key` returns only the active ad |
| 11 | Delete user A | E1 still exists with `submitter_id = NULL`; A's purchases are cascade-deleted |

Passing line: all baseline §5 steps and all assertions for SQLite, PG and D1.
Directory page content check (baseline §5.3): locale-root home HTML contains the featured
entry with its featured badge and the active `home_top` ad title, not the
expired ad. Screenshots: directory home and admin pages (baseline §5.5).

## Pages

Every targeted app ships these 5 pages + an admin sidebar entry (baseline §1,
UI per baseline §2: featured = `Badge` default, status pending / rejected =
`secondary` / `destructive`, tags = `outline`, logos via `Avatar` fallback).
Header / footer: baseline §2b + Keep / hide / promote above.

Public routes use **short paths at the locale root** (preferred). Do not nest
the list under `/directory`.

| Page | Path (after locale) | Next (`apps/next-app/app/[lang]/...`) | Nuxt (`apps/nuxt-app/pages/...`) | TanStack (`apps/tanstack-app/src/routes/$lang/...`) |
|------|---------------------|------|------|------|
| Home / list (search, featured first, active `home_top` ad, category nav) | `/` | `(root)/page.tsx` | `index.vue` | `(root)/index.tsx` |
| Category | `/c/:slug` | `(root)/c/[slug]/page.tsx` | `c/[slug].vue` | `(root)/c/$slug.tsx` |
| Entry detail | `/e/:slug` | `(root)/e/[slug]/page.tsx` | `e/[slug].vue` | `(root)/e/$slug.tsx` |
| Submit (login required; paid toggle) | `/submit` | `(root)/submit/page.tsx` | `submit.vue` | `(root)/submit.tsx` |
| Admin: entry review + manual ads | `/admin/directory` | `admin/directory/page.tsx` | `admin/directory/index.vue` (`layout: "admin"`) | `admin/directory.tsx` |

Shared UI for the public pages may live next to them (e.g. Next
`(root)/_directory-ui.tsx`). Links inside pages must use these short paths
(`/`, `/c/...`, `/e/...`, `/submit`), not `/directory/...`.

## Free implementation area

The applying agent decides:

- API route shape vs. server actions, and form UX details.
- SEO metadata and sitemap, reusing `libs/seo`.
- Homepage copy in both locales, following `apply.md` locked-key rules.

## Out of scope

Direct per-item payment, order linkage, self-serve ad buying, view / click
counts, nested categories, i18n category names, draft / archived entries, full
text search, email notifications, website metadata scraping, Turnstile, and
custom-field filtering.

## Apply order

1. Slots -> 2. Replace locale-root home with the directory list (Landing) ->
3. Header **and footer** keep / hide / promote (baseline §2b) ->
4. `config/directory.ts` -> 5. database schema + barrel exports ->
6. migrations named `recipe_directory_v1` and made idempotent ->
7. `libs/directory/index.ts` public contract -> 8. the 5 pages + admin sidebar
entry in every targeted app (Pages) ->
9. i18n packs + auth chrome -> 10. `scripts/recipes/directory/verify.ts` ->
11. baseline §5 acceptance.
