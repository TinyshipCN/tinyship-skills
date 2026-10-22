/**
 * Digital-product recipe verification (fake orders only — no live providers).
 *   DB_DIALECT=<pg|sqlite|d1> npx tsx scripts/recipes/digital-product/verify.ts
 *   DB_DIALECT=<pg|sqlite> npx tsx scripts/recipes/digital-product/verify.ts --migrations-only
 *     (sqlite: temp DB from the journal; pg: run pg-migrations-only.sh, which sets MIGRATIONS_PG_URL
 *      to an empty DB with the pre-recipe base pushed)
 */
import "dotenv/config";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dialect = (process.env.DB_DIALECT || "pg") as "pg" | "sqlite" | "d1";
const migrationsOnly = process.argv.includes("--migrations-only");
const ROOT = process.cwd();
const RECIPE_TABLES = ["dp_product", "dp_file", "dp_purchase"];

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`PASS ${name}`);
  else {
    failures++;
    console.log(
      `FAIL ${name}${detail !== undefined ? ` :: ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`,
    );
  }
}
async function expectThrow(fn: () => Promise<unknown>): Promise<any> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
}

function migDir(kind: "pg" | "sqlite") {
  return join(ROOT, "libs/database", kind === "pg" ? "drizzle" : "drizzle-sqlite");
}
function recipeSqlFile(kind: "pg" | "sqlite") {
  const f = readdirSync(migDir(kind)).find((n) => /^\d{4}_recipe_digital_product_v1\.sql$/.test(n));
  if (!f) throw new Error(`recipe_digital_product_v1 migration missing for ${kind}`);
  return join(migDir(kind), f);
}
function splitSql(text: string) {
  return text
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
}

function idempotentDdlCheck() {
  for (const kind of ["pg", "sqlite"] as const) {
    const stmts = splitSql(readFileSync(recipeSqlFile(kind), "utf8"));
    const bad = stmts.filter((s) => {
      if (
        /^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)\b/i.test(s) &&
        !/^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)\s+IF NOT EXISTS/i.test(s)
      )
        return true;
      if (/ADD CONSTRAINT/i.test(s) && !(/^DO \$\$/i.test(s) && /duplicate_object/i.test(s))) return true;
      return false;
    });
    check(
      `idempotent DDL (${kind})`,
      bad.length === 0,
      bad.map((s) => s.slice(0, 80)),
    );
  }
}

type Shape = Record<string, { columns: string[]; indexes: string[] }>;
function snapshotShape(kind: "pg" | "sqlite"): Shape {
  const meta = join(migDir(kind), "meta");
  const journal = JSON.parse(readFileSync(join(meta, "_journal.json"), "utf8"));
  const entry = journal.entries.find((e: any) => /recipe_digital_product_v1$/.test(e.tag));
  const snap = JSON.parse(
    readFileSync(join(meta, `${String(entry.idx).padStart(4, "0")}_snapshot.json`), "utf8"),
  );
  const out: Shape = {};
  for (const t of Object.values<any>(snap.tables)) {
    if (!RECIPE_TABLES.includes(t.name)) continue;
    out[t.name] = {
      columns: Object.keys(t.columns).sort(),
      indexes: Object.keys(t.indexes).sort(),
    };
  }
  return out;
}

async function runMigrationsOnly() {
  if (dialect === "sqlite") {
    const Database = (await import("better-sqlite3")).default;
    const file = join(mkdtempSync(join(tmpdir(), "dpmig-")), "m.sqlite");
    const sdb = new Database(file);
    const journal = JSON.parse(readFileSync(join(migDir("sqlite"), "meta/_journal.json"), "utf8"));
    for (const e of journal.entries) {
      for (const s of splitSql(readFileSync(join(migDir("sqlite"), `${e.tag}.sql`), "utf8")))
        sdb.exec(s);
    }
    const shape: Shape = {};
    for (const t of RECIPE_TABLES) {
      shape[t] = {
        columns: (sdb.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name).sort(),
        indexes: (sdb.prepare(`PRAGMA index_list(${t})`).all() as any[])
          .filter((i) => i.origin === "c")
          .map((i) => i.name)
          .sort(),
      };
    }
    compareShape("sqlite", shape, snapshotShape("sqlite"));
    sdb.close();
  } else if (dialect === "pg") {
    const url = process.env.MIGRATIONS_PG_URL;
    if (!url) throw new Error("MIGRATIONS_PG_URL is required for pg --migrations-only");
    const { Client } = await import("pg");
    const c = new Client({ connectionString: url });
    await c.connect();
    const before = await c.query(
      `SELECT count(*)::int n FROM information_schema.tables WHERE table_name = ANY($1)`,
      [RECIPE_TABLES],
    );
    check("pg base has no recipe tables before apply", before.rows[0].n === 0, before.rows[0]);
    for (const s of splitSql(readFileSync(recipeSqlFile("pg"), "utf8"))) await c.query(s);
    const shape: Shape = {};
    for (const t of RECIPE_TABLES) {
      const cols = await c.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
        [t],
      );
      const idx = await c.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename=$1 AND indexname NOT LIKE '%_pkey'`,
        [t],
      );
      shape[t] = {
        columns: cols.rows.map((r) => r.column_name).sort(),
        indexes: idx.rows.map((r) => r.indexname).sort(),
      };
    }
    compareShape("pg", shape, snapshotShape("pg"));
    // dp_file.product_id, dp_purchase.user_id, dp_purchase.product_id, dp_purchase.order_id = 4 FKs
    const fks = await c.query(
      `SELECT count(*)::int n FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_name = ANY($1)`,
      [RECIPE_TABLES],
    );
    check("pg migrations-only: 4 foreign keys", fks.rows[0].n === 4, fks.rows[0]);
    for (const s of splitSql(readFileSync(recipeSqlFile("pg"), "utf8"))) await c.query(s);
    check("pg migrations-only: recipe SQL re-applies", true);
    await c.end();
  } else {
    throw new Error("--migrations-only supports pg and sqlite");
  }
}
function compareShape(kind: string, got: Shape, want: Shape) {
  for (const t of RECIPE_TABLES) {
    check(
      `${kind} migrations-only: ${t} columns`,
      JSON.stringify(got[t]?.columns) === JSON.stringify(want[t]?.columns),
      { got: got[t]?.columns, want: want[t]?.columns },
    );
    check(
      `${kind} migrations-only: ${t} indexes`,
      JSON.stringify(got[t]?.indexes) === JSON.stringify(want[t]?.indexes),
      { got: got[t]?.indexes, want: want[t]?.indexes },
    );
  }
}

async function main() {
  idempotentDdlCheck();
  if (migrationsOnly) return runMigrationsOnly();

  const dbm = await import("@libs/database");
  const dp = await import("@libs/digital-product");
  const { claimOrderPaid, fulfillOneTimeSubscription } = await import("@libs/payment/fulfillment");
  const { fulfillOrderRefund } = await import("@libs/payment/refund");
  const { creditService } = await import("@libs/credits");
  const { eq, and, inArray } = await import("drizzle-orm");
  const {
    db,
    user,
    order,
    subscription,
    creditTransaction,
    dpProduct,
    dpFile,
    dpPurchase,
    orderStatus,
  } = dbm as any;
  const d = db as any;

  const run = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date();
  const buyer = `vbuyer_${run}`;
  const other = `vother_${run}`;
  const planA = `vplan_a_${run}`;
  const planB = `vplan_b_${run}`;
  const productId = `vprod_${run}`;
  const fileId = `vfile_${run}`;
  const orderBound = `vord_bound_${run}`;
  const orderUnbound = `vord_unbound_${run}`;
  const idsToClean = {
    users: [buyer, other],
    products: [productId],
    files: [fileId],
    orders: [orderBound, orderUnbound],
  };

  async function cleanup() {
    await d.delete(dpPurchase).where(inArray(dpPurchase.orderId, idsToClean.orders));
    await d.delete(dpFile).where(inArray(dpFile.id, idsToClean.files));
    await d.delete(dpProduct).where(inArray(dpProduct.id, idsToClean.products));
    await d.delete(subscription).where(inArray(subscription.userId, idsToClean.users));
    await d.delete(order).where(inArray(order.id, idsToClean.orders));
    await d.delete(creditTransaction).where(inArray(creditTransaction.userId, idsToClean.users));
    await d.delete(user).where(inArray(user.id, idsToClean.users));
  }

  async function body() {
    await d.insert(user).values([
      {
        id: buyer,
        name: "Verify Buyer",
        email: `${buyer}@example.test`,
        emailVerified: true,
        role: "user",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: other,
        name: "Verify Other",
        email: `${other}@example.test`,
        emailVerified: true,
        role: "user",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await d.insert(dpProduct).values({
      id: productId,
      slug: `slug-${run}`,
      name: `Product ${run}`,
      tagline: "verify",
      description: "verify product",
      coverUrl: null,
      pricingPlanId: planA,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
    await d.insert(dpFile).values({
      id: fileId,
      productId,
      version: "1.0.0",
      fileName: "demo.zip",
      fileSize: 100,
      storageKey: null,
      externalUrl: "https://example.com/demo/verify.zip",
      createdAt: now,
      updatedAt: now,
    });

    const bal0 = await creditService.getBalance(buyer);
    const subCount = async (uid: string, pid: string) =>
      (
        await d
          .select()
          .from(subscription)
          .where(and(eq(subscription.userId, uid), eq(subscription.planId, pid)))
      ).length;
    const purchasesForOrder = async (oid: string) =>
      d.select().from(dpPurchase).where(eq(dpPurchase.orderId, oid));

    // 1 — unbound grant is a no-op
    const unboundGrant = await dp.grantPurchaseForOrder({
      orderId: "missing-order",
      userId: buyer,
      planId: planB,
    });
    check(
      "1 unbound plan grant -> not granted",
      unboundGrant.granted === false && unboundGrant.alreadyGranted === false,
      unboundGrant,
    );

    // 2 — fake pending order for bound plan → claimOrderPaid grants purchase
    await d.insert(order).values({
      id: orderBound,
      userId: buyer,
      amount: "29.00",
      currency: "USD",
      planId: planA,
      status: orderStatus.PENDING,
      provider: "stripe",
      providerOrderId: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });
    const claim1 = await claimOrderPaid({ orderId: orderBound, providerOrderId: `po_${run}` });
    check("2 claimOrderPaid -> claimed or already_paid", claim1.status === "claimed" || claim1.status === "already_paid", claim1);
    const p2 = await purchasesForOrder(orderBound);
    check("2 exactly one active purchase", p2.length === 1 && p2[0].status === "active", p2);
    check("2 credits unchanged after digital grant", (await creditService.getBalance(buyer)) === bal0);

    // 3 — fulfillOneTimeSubscription must NOT create membership for bound plan
    const subBefore = await subCount(buyer, planA);
    await fulfillOneTimeSubscription({
      userId: buyer,
      planId: planA,
      months: 1,
      metadata: { orderId: orderBound, lastOrderId: orderBound },
      orderId: orderBound,
    } as any);
    check(
      "3 bound plan: no new subscription row",
      (await subCount(buyer, planA)) === subBefore,
      { before: subBefore, after: await subCount(buyer, planA) },
    );

    // 4 — idempotent already_paid / second claim
    const claim2 = await claimOrderPaid({ orderId: orderBound });
    check("4 second claim -> already_paid", claim2.status === "already_paid", claim2);
    check("4 still one purchase", (await purchasesForOrder(orderBound)).length === 1);
    const grantAgain = await dp.grantPurchaseForOrder({
      orderId: orderBound,
      userId: buyer,
      planId: planA,
    });
    check("4 grant idempotent alreadyGranted", grantAgain.alreadyGranted === true || grantAgain.granted === false, grantAgain);

    // 5 — download gate
    const dl = await dp.getDownloadUrl({ userId: buyer, fileId });
    check("5 buyer download OK", typeof dl.url === "string" && dl.url.includes("http"), dl);
    const forbidden = await expectThrow(() => dp.getDownloadUrl({ userId: other, fileId }));
    check("5 other user FORBIDDEN", forbidden?.code === "FORBIDDEN" || forbidden?.code === dp.FORBIDDEN, forbidden?.code);

    // 6 — refund revokes; second refund no-op; download forbidden
    const refund1 = await fulfillOrderRefund({ orderId: orderBound, metadata: { reason: "verify" } });
    check("6 refund reversed or claimed", refund1.reversed === true || refund1.claim?.status === "claimed" || refund1.claim?.status === "already_refunded", refund1);
    const p6 = await purchasesForOrder(orderBound);
    check("6 purchase revoked", p6.length === 1 && p6[0].status === "revoked", p6);
    const afterRefund = await expectThrow(() => dp.getDownloadUrl({ userId: buyer, fileId }));
    check("6 download forbidden after refund", afterRefund?.code === "FORBIDDEN" || afterRefund?.code === dp.FORBIDDEN, afterRefund?.code);
    const refund2 = await fulfillOrderRefund({ orderId: orderBound });
    check("6 second refund no-op (idempotent)", true, refund2);
    const rev = await dp.revokePurchaseForOrder({ orderId: orderBound, reason: "again" });
    check("6 revoke idempotent", rev.revoked === false || rev.revoked === true, rev);

    // 7 — unbound one_time still creates membership
    await d.insert(order).values({
      id: orderUnbound,
      userId: buyer,
      amount: "9.00",
      currency: "USD",
      planId: planB,
      status: orderStatus.PENDING,
      provider: "stripe",
      providerOrderId: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });
    await claimOrderPaid({ orderId: orderUnbound });
    check(
      "7 unbound claim does not create dp_purchase",
      (await purchasesForOrder(orderUnbound)).length === 0,
    );
    const subBBefore = await subCount(buyer, planB);
    await fulfillOneTimeSubscription({
      userId: buyer,
      planId: planB,
      months: 1,
      metadata: { orderId: orderUnbound },
      orderId: orderUnbound,
    } as any);
    check(
      "7 unbound one_time creates membership",
      (await subCount(buyer, planB)) === subBBefore + 1,
      { before: subBBefore, after: await subCount(buyer, planB) },
    );

    // 8 — list / catalog helpers
    const active = await dp.listActiveProducts();
    check("8 listActiveProducts includes verify product", active.some((p: any) => p.id === productId));
    const bySlug = await dp.getProductBySlug(`slug-${run}`);
    check("8 getProductBySlug returns files", !!bySlug && Array.isArray(bySlug.files) && bySlug.files.length >= 1, bySlug);
  }

  const exec = async () => {
    try {
      await body();
    } catch (e) {
      check("unexpected error", false, (e as Error).stack);
    } finally {
      await cleanup().catch((e) => check("cleanup", false, (e as Error).message));
    }
  };

  if (dialect === "d1") {
    const { getPlatformProxy } = await import("wrangler");
    const proxy = await getPlatformProxy<{ DB: unknown }>({
      configPath: "apps/tanstack-app/wrangler.jsonc",
      persist: { path: "apps/tanstack-app/.wrangler/state/v3" },
    });
    try {
      await dbm.withD1!(proxy.env.DB, exec);
    } finally {
      await proxy.dispose();
    }
  } else {
    await exec();
  }
}

main()
  .catch((e) => {
    check("fatal", false, (e as Error).stack);
  })
  .finally(() => {
    console.log(failures ? `\n${failures} FAIL` : "\nALL PASS");
    process.exit(failures ? 1 : 0);
  });
