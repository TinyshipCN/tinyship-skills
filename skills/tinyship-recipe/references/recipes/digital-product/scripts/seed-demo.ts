/**
 * Demo data for the digital-product pages (idempotent). Run after the starter seed
 * (`pnpm db:seed` / `db:seed:sqlite`, which creates admin@example.com and user@example.com):
 *   DB_DIALECT=<pg|sqlite> npx tsx scripts/recipes/digital-product/seed-demo.ts
 * Creates: 2 active one_time pricing_plan rows, 2 active products (Starter Kit,
 * Icon Pack) + 1 inactive product, each active product one file via external_url.
 * Prefers PRICING_MODE=dynamic so plans are inserted into pricing_plan.
 */
import "dotenv/config";

async function main() {
  const {
    db,
    user,
    pricingPlan,
    dpProduct,
    dpFile,
  } = await import("@libs/database");
  const { eq } = await import("drizzle-orm");
  const d = db as any;
  const [admin] = await d.select().from(user).where(eq(user.email, "admin@example.com"));
  const [u] = await d.select().from(user).where(eq(user.email, "user@example.com"));
  if (!admin || !u) throw new Error("run db:seed first");
  const now = new Date();

  const plans: {
    id: string;
    amount: string;
    currency: string;
    nameEn: string;
    nameZh: string;
  }[] = [
    {
      id: "demo_dp_plan_starter",
      amount: "29.00",
      currency: "USD",
      nameEn: "Starter Kit",
      nameZh: "入门套件",
    },
    {
      id: "demo_dp_plan_icons",
      amount: "19.00",
      currency: "USD",
      nameEn: "Icon Pack",
      nameZh: "图标包",
    },
    {
      id: "demo_dp_plan_inactive",
      amount: "9.00",
      currency: "USD",
      nameEn: "Retired Pack",
      nameZh: "已下架包",
    },
  ];

  for (const [i, p] of plans.entries()) {
    await d
      .insert(pricingPlan)
      .values({
        id: p.id,
        provider: "stripe",
        amount: p.amount,
        currency: p.currency,
        durationType: "one_time",
        durationMonths: 9999,
        credits: null,
        recommended: false,
        sortOrder: i,
        isActive: true,
        locales: null,
        i18n: {
          en: { name: p.nameEn, description: `One-time unlock: ${p.nameEn}` },
          "zh-CN": { name: p.nameZh, description: `一次解锁：${p.nameZh}` },
        },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  const products: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    planId: string;
    active: boolean;
    sort: number;
    fileId: string;
    fileName: string;
    fileUrl: string;
  }[] = [
    {
      id: "demo_dp_prod_starter",
      slug: "starter-kit",
      name: "Starter Kit",
      tagline: "Templates + checklist · 模板与清单",
      description: "A zip of boilerplate templates and a ship checklist.",
      planId: "demo_dp_plan_starter",
      active: true,
      sort: 0,
      fileId: "demo_dp_file_starter",
      fileName: "starter-kit.zip",
      fileUrl: "https://example.com/demo/starter-kit.zip",
    },
    {
      id: "demo_dp_prod_icons",
      slug: "icon-pack",
      name: "Icon Pack",
      tagline: "200 outline icons · 200 个线性图标",
      description: "SVG icon pack for dashboards and landing pages.",
      planId: "demo_dp_plan_icons",
      active: true,
      sort: 1,
      fileId: "demo_dp_file_icons",
      fileName: "icon-pack.zip",
      fileUrl: "https://example.com/demo/icon-pack.zip",
    },
    {
      id: "demo_dp_prod_inactive",
      slug: "retired-pack",
      name: "Retired Pack",
      tagline: "Hidden from catalog",
      description: "Should not appear on the home catalog.",
      planId: "demo_dp_plan_inactive",
      active: false,
      sort: 99,
      fileId: "demo_dp_file_inactive",
      fileName: "retired.zip",
      fileUrl: "https://example.com/demo/retired.zip",
    },
  ];

  for (const p of products) {
    await d
      .insert(dpProduct)
      .values({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        coverUrl: null,
        pricingPlanId: p.planId,
        isActive: p.active,
        sortOrder: p.sort,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
    await d
      .insert(dpFile)
      .values({
        id: p.fileId,
        productId: p.id,
        version: "1.0.0",
        fileName: p.fileName,
        fileSize: 1024,
        storageKey: null,
        externalUrl: p.fileUrl,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  console.log("demo seeded");
}
main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
