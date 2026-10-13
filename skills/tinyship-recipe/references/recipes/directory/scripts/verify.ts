/**
 * Directory recipe verification.
 *   DB_DIALECT=<pg|sqlite|d1> npx tsx scripts/recipes/directory/verify.ts
 *   DB_DIALECT=<pg|sqlite> npx tsx scripts/recipes/directory/verify.ts --migrations-only
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
const RECIPE_TABLES = ["dir_category", "dir_tag", "dir_entry", "dir_entry_tag", "dir_purchase", "dir_ad"];

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`PASS ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name}${detail !== undefined ? ` :: ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400_000;
const near = (a: Date, b: number, tolMs = 120_000) => Math.abs(a.getTime() - b) < tolMs;

function migDir(kind: "pg" | "sqlite") {
  return join(ROOT, "libs/database", kind === "pg" ? "drizzle" : "drizzle-sqlite");
}
function recipeSqlFile(kind: "pg" | "sqlite") {
  const f = readdirSync(migDir(kind)).find((n) => /^\d{4}_recipe_directory_v1\.sql$/.test(n));
  if (!f) throw new Error(`recipe_directory_v1 migration missing for ${kind}`);
  return join(migDir(kind), f);
}
function splitSql(text: string) {
  return text.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
}

function idempotentDdlCheck() {
  for (const kind of ["pg", "sqlite"] as const) {
    const stmts = splitSql(readFileSync(recipeSqlFile(kind), "utf8"));
    const bad = stmts.filter((s) => {
      if (/^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)\b/i.test(s) && !/^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)\s+IF NOT EXISTS/i.test(s)) return true;
      if (/ADD CONSTRAINT/i.test(s) && !(/^DO \$\$/i.test(s) && /duplicate_object/i.test(s))) return true;
      return false;
    });
    check(`idempotent DDL (${kind})`, bad.length === 0, bad.map((s) => s.slice(0, 80)));
  }
}

type Shape = Record<string, { columns: string[]; indexes: string[] }>;
function snapshotShape(kind: "pg" | "sqlite"): Shape {
  const meta = join(migDir(kind), "meta");
  const journal = JSON.parse(readFileSync(join(meta, "_journal.json"), "utf8"));
  const entry = journal.entries.find((e: any) => /recipe_directory_v1$/.test(e.tag));
  const snap = JSON.parse(readFileSync(join(meta, `${String(entry.idx).padStart(4, "0")}_snapshot.json`), "utf8"));
  const out: Shape = {};
  for (const t of Object.values<any>(snap.tables)) {
    if (!RECIPE_TABLES.includes(t.name)) continue;
    out[t.name] = { columns: Object.keys(t.columns).sort(), indexes: Object.keys(t.indexes).sort() };
  }
  return out;
}

async function runMigrationsOnly() {
  if (dialect === "sqlite") {
    const Database = (await import("better-sqlite3")).default;
    const file = join(mkdtempSync(join(tmpdir(), "dirmig-")), "m.sqlite");
    const sdb = new Database(file);
    const journal = JSON.parse(readFileSync(join(migDir("sqlite"), "meta/_journal.json"), "utf8"));
    for (const e of journal.entries) {
      for (const s of splitSql(readFileSync(join(migDir("sqlite"), `${e.tag}.sql`), "utf8"))) sdb.exec(s);
    }
    const shape: Shape = {};
    for (const t of RECIPE_TABLES) {
      shape[t] = {
        columns: (sdb.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name).sort(),
        indexes: (sdb.prepare(`PRAGMA index_list(${t})`).all() as any[]).filter((i) => i.origin === "c").map((i) => i.name).sort(),
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
    const before = await c.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_name = ANY($1)`, [RECIPE_TABLES]);
    check("pg base has no recipe tables before apply", before.rows[0].n === 0, before.rows[0]);
    for (const s of splitSql(readFileSync(recipeSqlFile("pg"), "utf8"))) await c.query(s);
    const shape: Shape = {};
    for (const t of RECIPE_TABLES) {
      const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [t]);
      const idx = await c.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename=$1 AND indexname NOT LIKE '%_pkey' AND indexname <> 'dir_entry_tag_pk'`, [t]);
      shape[t] = { columns: cols.rows.map((r) => r.column_name).sort(), indexes: idx.rows.map((r) => r.indexname).sort() };
    }
    compareShape("pg", shape, snapshotShape("pg"));
    const fks = await c.query(`SELECT count(*)::int n FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_name = ANY($1)`, [RECIPE_TABLES]);
    check("pg migrations-only: 7 foreign keys", fks.rows[0].n === 7, fks.rows[0]);
    for (const s of splitSql(readFileSync(recipeSqlFile("pg"), "utf8"))) await c.query(s);
    check("pg migrations-only: recipe SQL re-applies", true);
    await c.end();
  } else {
    throw new Error("--migrations-only supports pg and sqlite");
  }
}
function compareShape(kind: string, got: Shape, want: Shape) {
  for (const t of RECIPE_TABLES) {
    check(`${kind} migrations-only: ${t} columns`, JSON.stringify(got[t]?.columns) === JSON.stringify(want[t]?.columns), { got: got[t]?.columns, want: want[t]?.columns });
    check(`${kind} migrations-only: ${t} indexes`, JSON.stringify(got[t]?.indexes) === JSON.stringify(want[t]?.indexes), { got: got[t]?.indexes, want: want[t]?.indexes });
  }
}

async function main() {
  idempotentDdlCheck();
  if (migrationsOnly) return runMigrationsOnly();

  const dbm = await import("@libs/database");
  const dir = await import("@libs/directory");
  const { creditService } = await import("@libs/credits");
  const { config } = await import("@config");
  const P = config.directory.pricing;
  const F7 = (P.featured.find((f: { days: number }) => f.days === 7) ?? P.featured[0]).credits;
  const LIST = P.listingCredits;
  const START = F7 * 2 + LIST + 10; // enough for two 7-day features + one paid listing
  const { db, user, dirCategory, dirTag, dirEntry, dirEntryTag, dirPurchase, dirAd, creditTransaction } = dbm;
  const { eq, and, inArray } = await import("drizzle-orm");
  const d = db as any;

  const run = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date();
  const admin = `vadm_${run}`;
  const ua = `vua_${run}`;
  const cats = [`vc1_${run}`, `vc2_${run}`];
  const tags = [`vt1_${run}`, `vt2_${run}`, `vt3_${run}`];
  const ads = [`vad1_${run}`, `vad2_${run}`];
  const entryIds: string[] = [];

  async function cleanup() {
    if (entryIds.length) await d.delete(dirEntry).where(inArray(dirEntry.id, entryIds));
    await d.delete(dirAd).where(inArray(dirAd.id, ads));
    await d.delete(dirTag).where(inArray(dirTag.id, tags));
    await d.delete(dirCategory).where(inArray(dirCategory.id, cats));
    await d.delete(creditTransaction).where(inArray(creditTransaction.userId, [ua, admin]));
    await d.delete(user).where(inArray(user.id, [ua, admin]));
  }

  async function body() {
    // seed
    await d.insert(user).values([
      { id: admin, name: "Verify Admin", email: `${admin}@example.test`, emailVerified: true, role: "admin", createdAt: now, updatedAt: now },
      { id: ua, name: "Verify User", email: `${ua}@example.test`, emailVerified: true, role: "user", createdAt: now, updatedAt: now },
    ]);
    await d.insert(dirCategory).values(cats.map((id, i) => ({ id, slug: id, name: `Cat ${i}`, sortOrder: i, createdAt: now })));
    await d.insert(dirTag).values(tags.map((id, i) => ({ id, slug: id, name: `Tag ${i}`, createdAt: now })));
    const getEntry = async (id: string) => (await d.select().from(dirEntry).where(eq(dirEntry.id, id)).limit(1))[0];
    const searchIds = async (p: any) => ((await dir.searchEntries({ pageSize: 100, ...p })).items as any[]).map((i) => i.id);
    const kw = `zq${run}`;

    // 1
    const e1 = await dir.submitEntry({ userId: ua, name: `E1 ${kw}`, url: "https://e1.example.com", tagline: "first", categoryId: cats[0], tagIds: [tags[0], tags[1]] });
    entryIds.push(e1.entryId);
    check("1 submit free E1 -> pending", e1.status === "pending" && (await getEntry(e1.entryId)).status === "pending");
    check("1 search cannot find pending E1", !(await searchIds({ q: kw })).includes(e1.entryId));

    // 2
    await dir.reviewEntry({ entryId: e1.entryId, reviewerId: admin, action: "approve" });
    const e1a = await getEntry(e1.entryId);
    check("2 approve E1 -> approved + published_at", e1a.status === "approved" && !!e1a.publishedAt);
    check("2 keyword search finds E1", (await searchIds({ q: kw })).includes(e1.entryId));
    check("2 category search finds E1", (await searchIds({ categorySlug: cats[0] })).includes(e1.entryId));
    check("2 category search excludes other category", !(await searchIds({ categorySlug: cats[1] })).includes(e1.entryId));
    check("2 tag search finds E1", (await searchIds({ tagSlugs: [tags[1]] })).includes(e1.entryId));

    // 3
    const e2 = await dir.submitEntry({ userId: ua, name: `E2 ${kw}`, url: "https://e2.example.com" });
    entryIds.push(e2.entryId);
    await dir.reviewEntry({ entryId: e2.entryId, reviewerId: admin, action: "reject", reason: "spam" });
    const e2r = await getEntry(e2.entryId);
    check("3 reject E2 -> rejected + reason", e2r.status === "rejected" && e2r.rejectReason === "spam");
    check("3 search cannot find E2", !(await searchIds({ q: kw })).includes(e2.entryId));

    // 4
    const purchasesOf = async (entryId: string) => d.select().from(dirPurchase).where(eq(dirPurchase.entryId, entryId));
    const debitsOf = async () => (await d.select().from(creditTransaction).where(and(eq(creditTransaction.userId, ua), eq(creditTransaction.type, "consumption"))));
    const err4 = await expectThrow(() => dir.purchaseFeatured({ entryId: e1.entryId, userId: ua, days: 7 }));
    check("4 zero credits -> INSUFFICIENT_CREDITS", err4?.code === dir.INSUFFICIENT_CREDITS, err4?.message);
    check("4 featured_until unchanged", (await getEntry(e1.entryId)).featuredUntil == null);
    check("4 no purchase row left", (await purchasesOf(e1.entryId)).length === 0);
    check("4 no debit ledger row", (await debitsOf()).length === 0);

    // 5
    await creditService.addCredits({ userId: ua, amount: START, type: "adjustment", description: "verify" });
    const f1 = await dir.purchaseFeatured({ entryId: e1.entryId, userId: ua, days: 7 });
    check("5 expiry ~ now+7d", near(f1.featuredUntil, Date.now() + 7 * DAY), f1.featuredUntil);
    const p5 = await purchasesOf(e1.entryId);
    const debits5 = await debitsOf();
    check("5 one active purchase", p5.length === 1 && p5[0].status === "active", p5.map((p: any) => p.status));
    check("5 purchase linked to debit", debits5.length === 1 && p5[0].creditTransactionId === debits5[0].id);
    check("5 no pending purchase", !p5.some((p: any) => p.status === "pending"));
    check("5 balance START-F7", (await creditService.getBalance(ua)) === START - F7, await creditService.getBalance(ua));

    // 6
    const f2 = await dir.purchaseFeatured({ entryId: e1.entryId, userId: ua, days: 7 });
    check("6 stacking ~ now+14d", near(f2.featuredUntil, Date.now() + 14 * DAY), f2.featuredUntil);
    check("6 balance START-2*F7", (await creditService.getBalance(ua)) === START - 2 * F7);

    // 7
    await sleep(1100);
    const e3 = await dir.submitEntry({ userId: ua, name: `E3 ${kw}`, url: "https://e3.example.com" });
    entryIds.push(e3.entryId);
    await dir.reviewEntry({ entryId: e3.entryId, reviewerId: admin, action: "approve" });
    let order = await searchIds({ q: kw });
    check("7 featured E1 ranks before newer E3", order.indexOf(e1.entryId) >= 0 && order.indexOf(e1.entryId) < order.indexOf(e3.entryId), order);

    // 8
    await d.update(dirEntry).set({ featuredUntil: new Date(Date.now() - DAY) }).where(eq(dirEntry.id, e1.entryId));
    order = await searchIds({ q: kw });
    check("8 expired E1 loses featured rank (E3 newer first)", order.indexOf(e3.entryId) < order.indexOf(e1.entryId), order);

    // 9
    const before9 = await creditService.getBalance(ua);
    const e4 = await dir.submitEntry({ userId: ua, name: `E4 ${kw}`, url: "https://e4.example.com", paid: true });
    entryIds.push(e4.entryId);
    const mid9 = await creditService.getBalance(ua);
    check("9 paid listing debits listingCredits", before9 - mid9 === LIST, { before9, mid9 });
    const p9a = await purchasesOf(e4.entryId);
    check("9 listing purchase active", p9a.length === 1 && p9a[0].status === "active" && p9a[0].kind === "listing");
    check("9 entry listing_type paid", (await getEntry(e4.entryId)).listingType === "paid");
    await dir.reviewEntry({ entryId: e4.entryId, reviewerId: admin, action: "reject", reason: "no" });
    check("9 credits fully refunded", (await creditService.getBalance(ua)) === before9);
    check("9 purchase refunded", (await purchasesOf(e4.entryId))[0].status === "refunded");
    // insufficient paid listing removes both rows
    await creditService.consumeCredits({ userId: ua, amount: await creditService.getBalance(ua), description: "drain" });
    const err9 = await expectThrow(() => dir.submitEntry({ userId: ua, name: `E5 ${kw}`, url: "https://e5.example.com", paid: true }));
    check("9b paid listing with 0 credits -> INSUFFICIENT_CREDITS", err9?.code === dir.INSUFFICIENT_CREDITS, err9?.message);
    const e5rows = await d.select().from(dirEntry).where(eq(dirEntry.name, `E5 ${kw}`));
    check("9b no E5 entry left", e5rows.length === 0);

    // 10
    await d.insert(dirAd).values([
      { id: ads[0], slotKey: "home_top", title: `Active ${run}`, targetUrl: "https://ad.example.com", startsAt: new Date(Date.now() - DAY), endsAt: new Date(Date.now() + DAY), createdAt: now },
      { id: ads[1], slotKey: "home_top", title: `Expired ${run}`, targetUrl: "https://ad.example.com", startsAt: new Date(Date.now() - 3 * DAY), endsAt: new Date(Date.now() - DAY), createdAt: now },
    ]);
    const active = ((await dir.getActiveAds("home_top")) as any[]).map((a) => a.id);
    check("10 only active ad returned", active.includes(ads[0]) && !active.includes(ads[1]), active);
    await dir.endAd(ads[0]);
    await sleep(1100);
    check("10b ended ad no longer active", !((await dir.getActiveAds("home_top")) as any[]).some((a) => a.id === ads[0]));

    // 11
    const tagRows = await d.select().from(dirEntryTag).where(eq(dirEntryTag.entryId, e1.entryId));
    check("11 precondition E1 has tags", tagRows.length === 2);
    await d.delete(user).where(eq(user.id, ua));
    const e1after = await getEntry(e1.entryId);
    check("11 E1 kept with submitter_id NULL", !!e1after && e1after.submitterId === null);
    const left = await d.select().from(dirPurchase).where(eq(dirPurchase.userId, ua));
    check("11 A's purchases cascade-deleted", left.length === 0, left.length);
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
