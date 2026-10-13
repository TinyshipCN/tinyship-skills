/**
 * Demo data for the directory pages (idempotent). Run after the starter seed
 * (`pnpm db:seed` / `db:seed:sqlite`, which creates admin@example.com and user@example.com):
 *   DB_DIALECT=<pg|sqlite> npx tsx scripts/recipes/directory/seed-demo.ts
 * Creates: 3 categories, 3 tags, 6 approved entries (ChatPilot featured 7d, slug `chatpilot`),
 * 1 pending entry (FormDrop), 1 active + 1 expired `home_top` ad.
 */
import "dotenv/config";

async function main() {
  const { db, user, dirCategory, dirTag, dirEntry, dirAd } = await import("@libs/database");
  const dir = await import("@libs/directory");
  const { creditService } = await import("@libs/credits");
  const { eq } = await import("drizzle-orm");
  const d = db as any;
  const [admin] = await d.select().from(user).where(eq(user.email, "admin@example.com"));
  const [u] = await d.select().from(user).where(eq(user.email, "user@example.com"));
  if (!admin || !u) throw new Error("run db:seed first");
  const now = new Date();
  const cats = [["ai-tools", "AI 工具 · AI Tools"], ["dev-tools", "开发工具 · Dev Tools"], ["design", "设计 · Design"]];
  for (const [i, [slug, name]] of cats.entries())
    await d.insert(dirCategory).values({ id: `demo_cat_${slug}`, slug, name, sortOrder: i, createdAt: now }).onConflictDoNothing();
  for (const [slug, name] of [["free", "免费 · Free"], ["open-source", "开源 · Open source"], ["saas", "SaaS"]])
    await d.insert(dirTag).values({ id: `demo_tag_${slug}`, slug, name, createdAt: now }).onConflictDoNothing();
  const entries: [string, string, string, string, string[]][] = [
    ["ChatPilot", "https://chatpilot.example.com", "AI 邮件助手 · AI assistant for your inbox", "ai-tools", ["saas"]],
    ["PromptBox", "https://promptbox.example.com", "分享提示词 · Share and remix prompts", "ai-tools", ["free"]],
    ["CodeLens", "https://codelens.example.com", "几分钟读懂代码库 · Explain any codebase", "dev-tools", ["open-source"]],
    ["ShipLog", "https://shiplog.example.com", "用户爱看的更新日志 · Changelogs users read", "dev-tools", ["saas"]],
    ["Palette AI", "https://palette.example.com", "生成品牌配色 · Generate brand palettes", "design", ["free"]],
    ["IconForge", "https://iconforge.example.com", "3000 个开源图标 · 3,000 open icons", "design", ["open-source", "free"]],
  ];
  const ids: Record<string, string> = {};
  for (const [name, url, tagline, cat, tags] of entries) {
    const exists = await d.select().from(dirEntry).where(eq(dirEntry.name, name));
    if (exists.length) { ids[name] = exists[0].id; continue; }
    const { entryId } = await dir.submitEntry({ userId: u.id, name, url, tagline, categoryId: `demo_cat_${cat}`, tagIds: tags.map((t) => `demo_tag_${t}`) });
    await dir.reviewEntry({ entryId, reviewerId: admin.id, action: "approve" });
    ids[name] = entryId;
  }
  await d.update(dirEntry).set({ slug: "chatpilot", description: "ChatPilot drafts replies, summarizes threads and keeps your inbox at zero." }).where(eq(dirEntry.id, ids.ChatPilot));
  if (!(await d.select().from(dirEntry).where(eq(dirEntry.name, "FormDrop"))).length)
    await dir.submitEntry({ userId: u.id, name: "FormDrop", url: "https://formdrop.example.com", tagline: "一行代码的表单后端 · Form backend in one line" });
  const [e] = await d.select().from(dirEntry).where(eq(dirEntry.id, ids.ChatPilot));
  if (!e.featuredUntil || new Date(e.featuredUntil) < now) {
    await creditService.addCredits({ userId: u.id, amount: 200, type: "adjustment", description: "demo" });
    await dir.purchaseFeatured({ entryId: ids.ChatPilot, userId: u.id, days: 7 });
  }
  await d.insert(dirAd).values([
    { id: "demo_ad_active", slotKey: "home_top", title: "DemoSponsor — ship faster", targetUrl: "https://sponsor.example.com", startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 30 * 86400000), createdAt: now },
    { id: "demo_ad_expired", slotKey: "home_top", title: "OldSponsor expired", targetUrl: "https://old.example.com", startsAt: new Date(Date.now() - 9 * 86400000), endsAt: new Date(Date.now() - 86400000), createdAt: now },
  ]).onConflictDoNothing();
  console.log("demo seeded");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
