# Recipe: directory

Directory / navigation site. Visitors browse approved entries; signed-in users
submit entries; admins approve, reject, and manually manage ads.

This recipe is intentionally small. It fixes only the data contract, migration
rules, domain function signatures, and verification script. Pages, route shapes,
admin UI, copy, and business wiring are left to the applying agent.

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
| Keep routes | directory home, submit entry, entry detail, category / tag / search pages, auth, dashboard, admin |
| Hide from header | Demos dropdown (`/ai`, `/image-generate`, `/video-generate`, `/premium-features`, `/upload`) |
| Promote | Top-level nav link to the directory home, plus a submit CTA when the chosen app has room |
| Keep in header | Pricing only if the site sells credit packages publicly |
| Footer | Same as header; do not keep hidden demo links |
| Do not delete | Any route files from the starter |

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

Export it from the main config barrel used by the project.

## Landing

- Primary CTA -> the submit page, normally `/submit`.
- Secondary -> directory browse / search, normally `/directory` or `#features`.
- `techStack.items` = `[]` and do not render the chip row.
- Do not invent extra product features while applying the recipe.

## Database contract

New tables: Yes.

Create the schema files exactly here:

- `libs/database/schema/pg/directory.ts`
- `libs/database/schema/sqlite/directory.ts`
- `libs/database/schema/directory.ts` proxy, using the project's existing
  `DB_DIALECT` selection pattern (`pg`, `sqlite`, `d1`)
- schema barrel export so Drizzle sees the files

The finalized spec describes five domain tables plus one join table:
`dir_category`, `dir_tag`, `dir_entry`, `dir_purchase`, `dir_ad`, and
`dir_entry_tag`. Do not modify existing tables. `dir_entry.submitter_id`
references `user`; `dir_purchase.credit_transaction_id` references
`credit_transaction`; nothing references `order`.

### PG schema

Use `timestamp(..., { withTimezone: true })` for time and `jsonb` for JSON.
Adjust only the import paths for existing `user` and `creditTransaction`
symbols to match the target repo; keep table names, column names, constraints,
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
import { user } from "./auth";
import { creditTransaction } from "./credits";

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
import { user } from "./auth";
import { creditTransaction } from "./credits";

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

The recipe does not ship fixed-number SQL files. Generate migrations inside the
user project after the schema files are added:

```bash
npx drizzle-kit generate --name recipe_directory_v1
npx drizzle-kit generate --config=drizzle.config.sqlite.ts --name recipe_directory_v1
```

Rules:

1. Generated filenames must end in `recipe_directory_v1.sql`; the `00NN_`
   number is whatever comes next in the local journal.
2. PG migrations live in `libs/database/drizzle`.
3. SQLite and D1 migrations live in `libs/database/drizzle-sqlite`.
4. Edit the generated recipe SQL so every `CREATE TABLE` and `CREATE INDEX`
   uses `IF NOT EXISTS`. The verification script must grep for missing
   `IF NOT EXISTS`.
5. If upstream migration journals conflict later, keep upstream, delete the
   local recipe migration, regenerate with the same name, and re-apply. The SQL
   is idempotent so existing tables and indexes must not fail.
6. Projects that only use `db:push` are unaffected by migration journals.
7. Future table changes use a new migration name such as `recipe_directory_v2`
   and write only `ALTER` statements. Do not mutate v1.
8. For a fresh PG verification database, use `pnpm db:push`, not `db:migrate`,
   because the referenced template state has a PG journal entry without a
   matching historical SQL file.

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

- `status` values are only `pending`, `approved`, `rejected`.
- `listing_type` values are only `free`, `paid`.
- `dir_purchase.kind` values are only `listing`, `featured`.
- `dir_purchase.status` values are only `active`, `refunded`.
- Search only approved entries. Keyword search matches `name` and `tagline`
  (`ILIKE` on PG, `LIKE` on SQLite / D1). Category and tag filters are allowed.
- Sort active featured entries first, then the rest by `published_at`
  descending. Active means `featured_until` is later than now.
- `custom_fields` is display-only JSON validated from
  `config/directory.ts.customFields`. Do not create a custom-field table in v1.

## Credits and purchases

Use only credits. Do not add direct item checkout and do not touch payment
fulfillment code.

Paid listing:

1. If the user chooses paid submission, call the existing
   `creditService.consumeCredits` first.
2. On success, create `dir_entry` with `listing_type = "paid"` and
   `status = "pending"`, then create one `dir_purchase` with
   `kind = "listing"` and the returned `credit_transaction_id`.
3. If the entry is rejected, always call `addCredits({ type: "refund" })` and
   mark that purchase `refunded`.

Featured listing:

1. Only `approved` entries can be featured.
2. Call `creditService.consumeCredits` first.
3. New expiry is `max(now, featured_until) + days`, so repeated purchases stack.
4. Write one `dir_purchase` with `kind = "featured"`.

Compensation rule: credit debit and directory writes may not be in one
cross-dialect transaction. Debit credits first; if the directory write fails,
refund with `addCredits({ type: "refund" })`. The partial unique index on
`credit_transaction_id` prevents recording the same debit twice.

Known gap inherited from credits: if a user later refunds a credit package,
credits may only be clawed back to zero and already-active featured placement is
not revoked.

## Ads

Ads are manual admin records only. Do not build self-serve ad purchase or
payment wiring.

- `slot_key` must be one of `config/directory.ts.adSlots`.
- Show ads only when `starts_at <= now < ends_at`.
- To take down an ad, admins set `ends_at` to now.

## Verification script

Create `scripts/recipes/directory/verify.ts` and run it with `tsx`. The script
must exercise the public `libs/directory` functions above plus direct test setup
queries where needed.

Run three rounds:

| Round | `DB_DIALECT` | Build database with |
|-------|--------------|---------------------|
| SQLite | `sqlite` | `pnpm db:push:sqlite` |
| PG | `pg` | `pnpm db:push` on a fresh database |
| D1 | `d1` | `npx wrangler d1 migrations apply tinyship-db --local` from `apps/tanstack-app` |

Script / verification steps:

1. Start from a clean clone, `pnpm install`, configure `.env`; for D1 configure
   `apps/tanstack-app/.dev.vars`.
2. Apply this recipe.
3. Build the database for the current round using the table above.
4. Run `pnpm db:generate` and `pnpm db:generate:sqlite`; both must report no
   schema changes after the recipe migrations are generated.
5. Grep recipe migration SQL and fail if any `CREATE TABLE` or `CREATE INDEX`
   lacks `IF NOT EXISTS`.
6. Idempotency:
   - SQLite: execute the generated recipe SQL again against the already-built
     database and require success.
   - D1: copy / rename the recipe migration to simulate regeneration after an
     upstream merge, then apply again and require success.
7. Run `pnpm typecheck`.
8. Run the selected app build command, for example `pnpm build:tanstack` when
   the user scoped TanStack.
9. Seed one admin, one normal user, two categories, and three tags.
10. Execute the assertions below.

Required assertions:

| # | Action | Assertion |
|---|--------|-----------|
| 1 | User A submits free E1 | Status is `pending`; search cannot find it |
| 2 | Admin approves E1 | Status is `approved`; `published_at` is set; keyword, category, and tag searches can find it |
| 3 | Admin rejects E2 with a reason | Status is `rejected`; `reject_reason` is set; search cannot find it |
| 4 | A has zero credits and tries to feature E1 | Insufficient balance error; `featured_until` unchanged; no new purchase |
| 5 | Add 200 credits to A, then feature E1 for 7 days | Expiry is about now + 7 days; one new purchase; one credit debit; balance is correct |
| 6 | Feature E1 for another 7 days | Expiry is about now + 14 days, proving stacking |
| 7 | Create an approved, unfeatured E3 and search | E1 ranks before E3 while E1 is featured |
| 8 | Move E1 `featured_until` into the past | E1 no longer receives featured ranking |
| 9 | A pays to submit E4, then admin rejects it | Credits are fully refunded; purchase status becomes `refunded` |
| 10 | Insert one active ad and one expired ad | Query by `slot_key` returns only the active ad |
| 11 | Delete user A | E1 still exists with `submitter_id = NULL`; A's purchases are cascade-deleted |

Passing line: steps 3-10 and all assertions must pass for SQLite, PG, and D1.

## Free implementation area

The applying agent decides:

- Public pages: home, category, tag, detail, search results, submit form,
  "my submissions".
- Admin pages: review queue, category / tag CRUD, manual ad CRUD.
- API route shape and form UX.
- SEO metadata and sitemap, reusing `libs/seo`.
- Homepage copy in both locales, following `apply.md` locked-key rules.
- Which app to modify, using `SKILL.md` Step 3 scope question.

## Out of scope

Direct per-item payment, order linkage, self-serve ad buying, view / click
counts, nested categories, i18n category names, draft / archived entries, full
text search, email notifications, website metadata scraping, Turnstile, and
custom-field filtering.

## Apply order

1. Slots -> 2. Landing contract -> 3. Header **and footer** hide/promote ->
4. `config/directory.ts` -> 5. database schema + barrel exports ->
6. migrations named `recipe_directory_v1` and made idempotent ->
7. `libs/directory/index.ts` public contract -> 8. chosen app pages / admin ->
9. i18n packs + auth chrome -> 10. `scripts/recipes/directory/verify.ts` ->
11. verify SQLite, PG, and D1.
