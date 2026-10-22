# Recipe: digital-product

Complex recipe ([_baseline.md](_baseline.md)); replaces the home page. Visitors
browse a multi-product catalog, buy with real-money `one_time` plans (dynamic
pricing), and download files after payment. Delivery is a purchase entitlement
plus download — **no license key in v1**.

Defaults: `{product}` `Digital Store` · `{pitch}` Buy once, download forever. ·
`{pitch-zh}` 一次购买，长期下载。 · `{cta}` Browse products → `/`.

## Prerequisite

Starter must already have:

- `claimOrderPaid` / `fulfillOneTimeSubscription` / `fulfillOrderRefund` in
  `libs/payment`
- Dynamic pricing (`pricing_plan` table + `getPlanById` / `getPurchasablePlanById`)
- Auth + `/api/payment/initiate`

Missing → stop and tell the user to update the starter.

## Setup briefing

- Database and framework: still ask in `tinyship-setup`
- **Pricing mode:** prefer `PRICING_MODE=dynamic` so product plans live in
  `pricing_plan` and admin can edit prices. If the project stays on `static`,
  also add matching `one_time` entries under `config.payment.plans` with the
  **same ids** as `dp_product.pricing_plan_id`.
- Payment provider keys: configure later via `tinyship-payment` (verify uses
  **fake orders only** — never call live Stripe / Creem / etc.)
- Storage: cold-start demo files may use `external_url`. Production should set
  a storage provider and fill `storage_key`; signed download uses
  `storage.generateSignedUrl`. **Cloudflare R2 Workers binding cannot
  presign** — use OSS / S3 / COS / R2-with-S3-API, or keep `external_url` /
  a public custom domain.

## Navigation

- Home (locale root) = product catalog.
- Header / footer: **hide Pricing**, hide the Demos dropdown and Blog (routes
  stay). Add top-level **My purchases** → `/dashboard/purchases` (signed-in).
  Logo → locale root.
- Admin sidebar: Digital products entry → `/admin/digital-product`.

## Payment hook exception (baseline §4)

Baseline says never touch payment fulfillment. **This recipe is the documented
exception.** Edit **only**:

1. New `libs/payment/recipe-hooks.ts`
2. `claimOrderPaid` in `libs/payment/fulfillment.ts`
3. `fulfillOneTimeSubscription` in `libs/payment/fulfillment.ts`
4. `fulfillOrderRefund` in `libs/payment/refund.ts`

**Do not edit** any file under `libs/payment/providers/*`. Do not scatter
per-provider patches.

### Why

A bound `one_time` plan otherwise becomes membership (`subscription` row) on
every provider path that calls `fulfillOneTimeSubscription`. Refunds would also
leave download access open. Central hooks fix both without touching 7 providers.

### Hook contract (`libs/payment/recipe-hooks.ts`)

Dynamic-import the recipe lib so payment does not hard-load it at module init:

```ts
export async function onDigitalProductOrderPaid(input: {
  orderId: string;
  userId: string;
  planId: string;
}): Promise<boolean> {
  const dp = await import("@libs/digital-product");
  const result = await dp.grantPurchaseForOrder(input);
  return result.granted || result.alreadyGranted;
}

export async function onDigitalProductOrderRefunded(input: {
  orderId: string;
}): Promise<void> {
  const dp = await import("@libs/digital-product");
  await dp.revokePurchaseForOrder({ orderId: input.orderId, reason: "refund" });
}
```

Return `false` from `onDigitalProductOrderPaid` when no product is bound to
`planId` (membership path continues).

**Bound = a `dp_product` row has this `pricing_plan_id`, whether `is_active`
or not.** `is_active` only hides a product from the catalog / detail page; a
paid order for a deactivated product still grants and still skips membership.

**Injected deps:** these three functions take an optional `deps` argument that
starter unit tests fill with in-memory fixtures. Call the hooks **only when
`deps` is undefined** (the real-DB path), so existing unit tests stay green
without recipe tables. `verify.ts` uses the real path and covers the hooks.

### Wire points

**`claimOrderPaid`** — after the function resolves to `claimed` **or**
`already_paid` (and has an `order`), call:

```ts
await onDigitalProductOrderPaid({
  orderId: order.id,
  userId: order.userId,
  planId: order.planId,
});
```

Do **not** call it for `not_found` / `ignored`. This covers webhook retries
(`already_paid`) so a crash after mark-paid still grants on retry.

**`fulfillOneTimeSubscription`** — at **entry**, before any `subscription`
write:

1. Resolve `orderId` from `input.orderId` (add optional field) **or**
   `input.metadata?.orderId` / `input.metadata?.lastOrderId` (string).
2. Look up product by `planId` with `findProductByPlanId` (ignores
   `is_active`). If unbound → existing membership logic unchanged.
3. If bound: call `onDigitalProductOrderPaid` when `orderId` is known; if
   `orderId` is missing, still **skip membership** (never insert/extend
   `subscription` for a bound plan) and return a non-membership result, e.g.
   `{ action: "digital_product" }` (extend the local result type as needed so
   callers that ignore the return stay fine).
4. Never write `subscription` for a bound plan.

This is the safety net for PayPal **return** routes that mark the order paid
with a raw `db.update` and call `fulfillOneTimeSubscription` without
`claimOrderPaid`.

**`fulfillOrderRefund`** — after `shouldReverseRefundEntitlements(claim)` is
true (same gate as credits / membership clawback), call
`onDigitalProductOrderRefunded({ orderId: orderRecord.id })` (idempotent).

### PayPal return hardening (Optional, not required for verify)

When already-paid early-redirects skip fulfill, entitlement may be missing if
the first attempt crashed mid-way. Prefer teaching agents that touch PayPal
return to route through `claimOrderPaid` + shared fulfill, or call
`onDigitalProductOrderPaid` on the already-paid branch. Not part of the 4
must-build steps.

## Config

`config/digital-product.ts`, wired as `digitalProduct` in root `config.ts`
(code reads `config.digitalProduct`):

```ts
export const digitalProductConfig = {
  /** Signed URL lifetime for storage_key downloads (seconds). */
  signedUrlExpiresIn: 3600,
};
```

## Schema (fixed)

Exactly **3** tables; copy verbatim into
`libs/database/schema/{pg,sqlite}/digital-product.ts` plus the dialect proxy
(follow `credit-transaction`). The 3 tables (`dpProduct`, `dpFile`,
`dpPurchase`) **must be named exports of `libs/database/index.ts`** — the
shipped scripts import them from `@libs/database`. Migration name
`recipe_digital_product_v1` (baseline §3). D1 uses the SQLite schema.

`pricing_plan_id` is a **soft** reference (text, unique) — no FK to
`pricing_plan` (static plans may live only in config).

Enums: purchase `status` = `active` | `revoked`. A file row must have
**at least one** of `storage_key` / `external_url` (enforce in lib, not DB).
v1 = **one plan per product** (`pricing_plan_id` unique). Multi-tier → Optional.

### PG schema

Use `timestamp(..., { withTimezone: true })` for time and `boolean` for flags
(same style as `pricing_plan`).

```ts
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { order } from "./order";

export const dpProduct = pgTable(
  "dp_product",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    coverUrl: text("cover_url"),
    pricingPlanId: text("pricing_plan_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dp_product_slug_unique").on(table.slug),
    planUnique: uniqueIndex("dp_product_pricing_plan_id_unique").on(
      table.pricingPlanId,
    ),
    activeSortIdx: index("dp_product_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const dpFile = pgTable(
  "dp_file",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => dpProduct.id, { onDelete: "cascade" }),
    version: text("version").notNull().default("1.0.0"),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    storageKey: text("storage_key"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    productIdx: index("dp_file_product_idx").on(table.productId),
  }),
);

export const dpPurchase = pgTable(
  "dp_purchase",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => dpProduct.id, { onDelete: "restrict" }),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    revokedReason: text("revoked_reason"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    orderUnique: uniqueIndex("dp_purchase_order_id_unique").on(table.orderId),
    userProductIdx: index("dp_purchase_user_product_idx").on(
      table.userId,
      table.productId,
    ),
    productIdx: index("dp_purchase_product_idx").on(table.productId),
  }),
);
```

### SQLite / D1 schema

Use `integer(..., { mode: "timestamp" })` for time and
`integer("is_active", { mode: "boolean" })` for the flag. D1 uses the same
schema and migration directory as SQLite.

```ts
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { order } from "./order";

export const dpProduct = sqliteTable(
  "dp_product",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    coverUrl: text("cover_url"),
    pricingPlanId: text("pricing_plan_id").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("dp_product_slug_unique").on(table.slug),
    planUnique: uniqueIndex("dp_product_pricing_plan_id_unique").on(
      table.pricingPlanId,
    ),
    activeSortIdx: index("dp_product_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const dpFile = sqliteTable(
  "dp_file",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => dpProduct.id, { onDelete: "cascade" }),
    version: text("version").notNull().default("1.0.0"),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    storageKey: text("storage_key"),
    externalUrl: text("external_url"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    productIdx: index("dp_file_product_idx").on(table.productId),
  }),
);

export const dpPurchase = sqliteTable(
  "dp_purchase",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => dpProduct.id, { onDelete: "restrict" }),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    revokedReason: text("revoked_reason"),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    orderUnique: uniqueIndex("dp_purchase_order_id_unique").on(table.orderId),
    userProductIdx: index("dp_purchase_user_product_idx").on(
      table.userId,
      table.productId,
    ),
    productIdx: index("dp_purchase_product_idx").on(table.productId),
  }),
);
```

## Library contract

`libs/digital-product/index.ts` must export these (the shipped `verify.ts`
calls them) plus errors carrying `.code` (`FORBIDDEN`, `NOT_FOUND`,
`INVALID_FILE`):

```ts
grantPurchaseForOrder({ orderId, userId, planId }): Promise<{
  granted: boolean;
  alreadyGranted: boolean;
  purchaseId?: string;
  productId?: string;
}>
// Look up product by pricing_plan_id, IGNORING is_active. Unbound → { granted:false, alreadyGranted:false }.
// Bound → INSERT purchase status=active ON CONFLICT (order_id) DO NOTHING (idempotent).
// Do not touch credits or subscription.

revokePurchaseForOrder({ orderId, reason? }): Promise<{ revoked: boolean }>
// Set status=revoked, revoked_at=now, revoked_reason. Idempotent if already revoked / missing.

findProductByPlanId(planId): Promise<DpProduct | null>  // ignores is_active
listBoundPlanIds(): Promise<string[]>  // every dp_product.pricing_plan_id (for /pricing filter)
listActiveProducts(): Promise<DpProduct[]>  // is_active, sort_order asc
getProductBySlug(slug): Promise<(DpProduct & { files: DpFile[] }) | null>  // active only (public); else null
listFilesForProduct(productId): Promise<DpFile[]>
listPurchasesForUser(userId): Promise<Array<{ purchase: DpPurchase; product: DpProduct }>>
hasActivePurchase({ userId, productId }): Promise<boolean>
getDownloadUrl({ userId, fileId }): Promise<{ url: string; fileName: string }>
// Active purchase for file's product required; else throw FORBIDDEN.
// Prefer external_url when set; else storage.generateSignedUrl({ key: storageKey, expiresIn: config.digitalProduct.signedUrlExpiresIn }).
// Neither key nor url → throw INVALID_FILE.

// Admin (session.role===admin checked in routes, not necessarily here):
createProduct / updateProduct / setProductActive
addFile / removeFile
```

## Pages (paths after the locale root)

| Page | Path | Next file (`apps/next-app/app/[lang]/`) |
|------|------|------|
| Catalog (active products) | `/` | `(root)/page.tsx` (replace marketing home) |
| Product detail + Buy | `/p/:slug` | `(root)/p/[slug]/page.tsx` |
| My purchases + download links | `/dashboard/purchases` | `dashboard/purchases/page.tsx` |
| Admin: products + files | `/admin/digital-product` | `admin/digital-product/page.tsx` |

Nuxt / TanStack: same paths under their route roots.

**Data loading per framework:**

- Next: server components call `@libs/digital-product` directly.
- TanStack: `createServerFn` loaders (server-only module).
- **Nuxt: pages and components never import `@libs/database` or
  `@libs/digital-product`** (they leak into the client bundle and `build:nuxt`
  fails). Add `server/api/digital-product/*` routes (catalog, product by slug,
  purchases) and read them with `useFetch`, like the admin pages do.

**Unknown or inactive slug → real HTTP 404** in all three, following each
app's `blog/[slug]` page: Next `notFound()`, Nuxt
`throw createError({ statusCode: 404, fatal: true })`, TanStack
`throw notFound()` in the loader. A 200 with "not available" copy fails.

**Buy button:** signed-out → sign-in prompt. Signed-in → call existing
`POST /api/payment/initiate` with `{ planId: product.pricingPlanId, provider }`
(same client pattern as the pricing page). Do **not** invent a new checkout
API. After return, buyer should see the product under My purchases (webhook /
claim path grants entitlement).

**Download:** prefer a small API route
`GET /api/digital-product/download?fileId=` that calls `getDownloadUrl` and
redirects (or returns `{ url }`). Do not expose raw `storage_key` to the
client.

**Pricing page (required):** leave the route file; it is hidden from nav. In
every targeted app's pricing plans API (`apps/next-app/app/api/pricing/plans/route.ts`,
`apps/nuxt-app/server/api/pricing/plans.get.ts`,
`apps/tanstack-app/src/routes/api/pricing/plans.ts`) drop plans whose id is in
`listBoundPlanIds()`, so product plans never show as membership on `/pricing`.
Do **not** change `libs/pricing` core. `acceptance.sh` checks this.

## Apply order (~4 steps)

Follow `SKILL.md` Step 4 / `_baseline.md`. Recipe specifics:

1. **Home + nav** — replace locale-root home with catalog; header/footer hide
   Pricing + Demos + Blog; add My purchases; admin sidebar entry; rewrite
   `home.metadata` + `home.footer` only among `home.*`.
2. **Config + schema + migration** — `config/digital-product.ts`; 3 tables;
   `recipe_digital_product_v1`; export from `@libs/database`; idempotent SQL
   (baseline §3).
3. **Library + payment hooks + pages** — `libs/digital-product`;
   `libs/payment/recipe-hooks.ts` + 3 wire points; catalog / detail / purchases /
   admin / download API; `/pricing` filter.
4. **i18n + scripts** — en + zh-CN (enum labels, empty/error states); auth
   chrome renames **only** `common.siteName`, `auth.metadata.signin`,
   `auth.metadata.signup`, `auth.signup.title` (leave forgot / reset / phone /
   WeChat titles); copy `digital-product/scripts/*` →
   `scripts/recipes/digital-product/`.

## Scripts (copy `digital-product/scripts/*` to `scripts/recipes/digital-product/`)

| Script | Use |
|--------|-----|
| `verify.ts` | Library + payment-hook assertions with **fake orders** (no live providers) + idempotent-DDL; `--migrations-only` for SQLite |
| `seed-demo.ts` | After starter `pnpm db:seed` / `db:seed:sqlite`; demo products + `external_url` files + `pricing_plan` rows + one paid fake order (user@example.com → Starter Kit) through `claimOrderPaid`, so it needs the hooks wired |
| `acceptance.sh` | One full round per dialect on a clean clone |
| `pg-migrations-only.sh` | PG migrations-only on an empty DB |
| `d1-reapply.sh` | Re-run the recipe SQL on local D1 |
| `round.env.template` | Minimal `.env` per round |

PG scripts need a user-supplied URL of an **empty** database (`PGURL` / first argument).

### verify.ts must assert (fixed)

1. Idempotent DDL for pg + sqlite migrations.
2. Bound plan A: insert pending `order` → `claimOrderPaid` → exactly one
   `dp_purchase` with `status=active`; credits unchanged.
3. `fulfillOneTimeSubscription` for plan A → **no new `subscription` row** for
   that user+plan.
4. Second `claimOrderPaid` / already_paid path → still one purchase (idempotent).
5. Buyer `getDownloadUrl` OK; other user → `FORBIDDEN`.
6. `fulfillOrderRefund` → purchase `revoked`; download `FORBIDDEN`; second
   refund no-op.
7. Unbound `one_time` plan B → grant returns unbound; `fulfillOneTimeSubscription`
   **does** create/extend membership (starter membership path unbroken).
8. Catalog helpers; `listBoundPlanIds` includes plan A.
9. Deactivated product: hidden from catalog / slug, but a new paid order still
   grants and still creates no `subscription`.
10. Migrations-only shape + dual `db:generate` "No schema changes" (via
   acceptance); acceptance also greps the `/pricing` filter and (Nuxt) that
   pages / components do not import `@libs/database` / `@libs/digital-product`.

### Page content check (with demo seed)

`/` and `/en` show demo product names (e.g. **Starter Kit**, **Icon Pack**);
inactive products hidden and `/en/p/retired-pack` returns **404**;
`/p/starter-kit` shows Buy; `user@example.com` / `user123456` (purchase seeded
by `seed-demo.ts`) sees Starter Kit + Download on `/dashboard/purchases`, the
download API redirects for that file and returns 403 for Icon Pack.

## Optional extensions

Do **not** build these during apply. List them in the Step 5 closing report;
build one only if the user asks.

- **License key + `POST /api/licenses/verify`** — key per purchase, public
  verify, admin revoke-by-key, rate limit.
- **Multi-tier plans per product** (`dp_plan` Personal/Team) — drops the
  one-plan-per-product unique constraint.
- **Purchase email** — send download link after grant (starter email).
- **Guest checkout / email recovery** — buy without account.
- **Cart / coupons / invoices**
- **Per-tier or versioned file sets** with changelog UI.
- **PayPal return → `claimOrderPaid`** hardening (see above).
- **Live Playwright** against Stripe test mode (manual / later).
- **Admin hard-delete** (v1 = soft deactivate only).

## Out of scope

Credits-unlock flow, license server, editing 7 payment providers, live provider
calls inside `verify.ts`, nested categories, reviews, wishlist.
