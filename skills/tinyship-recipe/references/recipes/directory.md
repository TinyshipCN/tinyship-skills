# Recipe: directory

Complex recipe ([_baseline.md](_baseline.md)); replaces the home page. Visitors
browse approved entries, signed-in users submit, admins approve / reject and
enter ads by hand. Credits only: no Stripe or other provider setup.

Defaults: `{product}` `Directory` · `{pitch}` A curated directory of useful
links. · `{pitch-zh}` 一个精选链接目录。 · `{cta}` Submit a link → `/submit`.

## Navigation

- Home (locale root) = the directory list. Header / footer: keep Pricing
  (buy credits), add top-level Submit, hide the Demos dropdown and Blog (routes
  stay). Admin sidebar: Directory entry.

## Config

`config/directory.ts`, wired as `directory` in root `config.ts` (code reads
`config.directory`):

```ts
export const directoryConfig = {
  pricing: { listingCredits: 50, featured: [{ days: 7, credits: 70 }, { days: 30, credits: 200 }] },
  adSlots: ["home_top", "home_sidebar"],
  customFields: [] as { key: string; type: "text" | "url" | "select"; label: string; required?: boolean; options?: string[] }[],
};
```

## Schema (fixed)

Exactly 6 tables; copy verbatim into `libs/database/schema/{pg,sqlite}/directory.ts`
plus the dialect proxy (follow `credit-transaction`). The 6 tables
(`dirCategory`, `dirTag`, `dirEntry`, `dirEntryTag`, `dirPurchase`, `dirAd`)
**must be named exports of `libs/database/index.ts`** — the shipped scripts
import them from `@libs/database` (adding them to `_schema` is optional). Migration name
`recipe_directory_v1` (baseline §3). D1 uses the SQLite schema.

### PG schema

Use `timestamp(..., { withTimezone: true })` for time and `jsonb` for JSON.

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
    status: text("status").notNull().default("pending"),
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
    status: text("status").notNull().default("pending"),
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

## Library contract

`libs/directory/index.ts` must export these (the shipped `verify.ts` calls
them) plus `INSUFFICIENT_CREDITS` and errors carrying `.code`. Also used by
`verify.ts` / `seed-demo.ts`: `getActiveAds(slotKey)`, `endAd(id)`.

```ts
submitEntry({ userId, name, url, tagline?, categoryId?, tagIds?, customFields?, paid? }): Promise<{ entryId; status: "pending" }>
reviewEntry({ entryId, reviewerId, action: "approve" | "reject", reason? }): Promise<void>
purchaseFeatured({ entryId, userId, days }): Promise<{ purchaseId; featuredUntil: Date }>
searchEntries({ q?, categorySlug?, tagSlugs?, page?, pageSize? }): Promise<{ items: unknown[]; total }>
reconcilePurchases({ olderThanMinutes? }): Promise<{ completed; deleted; refundedWithoutRefund }> // baseline §4
```

- Enums: entry `status` pending / approved / rejected; `listing_type` free /
  paid; purchase `kind` listing / featured; purchase `status` pending / active /
  refunded.
- Search: approved only; keyword on name + tagline (PG `ILIKE`, SQLite `LIKE`);
  active featured (`featured_until > now`) first, then `published_at` desc.
- `custom_fields`: display-only JSON validated against `config.customFields`.
- Logos: `logo_url` text only, no upload in v1.
- Ads: manual admin records; `slot_key` in `adSlots`; shown while
  `starts_at <= now < ends_at`; take down = set `ends_at` to now.

## Purchases (baseline §4 flow, `metadata: { dirPurchaseId }`)

- Paid listing (`kind = listing`, `listingCredits`): insert entry
  (`listing_type = paid`, pending) then the pending purchase; insufficient →
  delete both. Admin reject → mark purchase `refunded`, refund. Step-3 failure →
  baseline rule, then entry `status = rejected` (never delete: cascades the
  purchase).
- Featured (`kind = featured`, plan from `pricing.featured`, approved entries
  only): step 3 stacks in SQL, PG `GREATEST(now(), COALESCE(featured_until,
  now())) + make_interval(days => ?)`, SQLite / D1 `max(CAST(strftime('%s','now')
  AS INTEGER), COALESCE(featured_until, 0)) + ? * 86400`.

## Pages (paths after the locale root)

| Page | Path | Next file (`apps/next-app/app/[lang]/`) |
|------|------|------|
| List: search, categories, featured first, active `home_top` ad | `/` | `(root)/page.tsx` |
| Category | `/c/:slug` | `(root)/c/[slug]/page.tsx` |
| Entry | `/e/:slug` | `(root)/e/[slug]/page.tsx` |
| Submit (paid toggle; signed out = sign-in prompt) | `/submit` | `(root)/submit/page.tsx` |
| Admin: review + manual ads | `/admin/directory` | `admin/directory/page.tsx` |

Nuxt / TanStack: same paths under their route roots. Badges: featured
`default`, pending `secondary`, rejected `destructive`, tags `outline`.

## Scripts (copy `directory/scripts/*` to `scripts/recipes/directory/`)

| Script | Use |
|--------|-----|
| `verify.ts` | 11 library assertions (submit / review / insufficient / featured + stacking / ranking / paid refund / ads / user delete) + idempotent-DDL check; `--migrations-only` for SQLite |
| `seed-demo.ts` | run after the starter `pnpm db:seed` / `db:seed:sqlite` (needs its admin + user); demo data for page checks (featured ChatPilot, pending FormDrop, active + expired ad) |
| `acceptance.sh` | one full round per dialect on a clean clone |
| `pg-migrations-only.sh` | PG migrations-only on an empty DB |
| `d1-reapply.sh` | re-run the recipe SQL on local D1 |
| `round.env.template` | minimal `.env` per round |

PG scripts need a user-supplied URL of an **empty** database (`PGURL` / first argument).

Page content check: with demo data, `/` and `/en` show ChatPilot with the
featured badge and the active ad title, not the expired ad or FormDrop.

Out of scope: per-item checkout, order linkage, self-serve ads, view counts,
nested or translated categories, logo upload, email, scraping, captcha.
