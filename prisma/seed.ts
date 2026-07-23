// Furnihub V2.0 · Seed data
// V1.0 base + V2.0 enrichment (ContainerType / ServiceFeeTier / OverboxRule / Insight etc.)
// All upserts are idempotent (safe on every restart)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const img = (sku: string, idx = 0) =>
  `https://placehold.co/1200x1200/a37547/ffffff?text=${encodeURIComponent(sku + '-' + idx)}`;

async function main() {
  console.log('🌱 Seeding Furnihub V2.0 database...');

  // 1. ServiceConfig singleton (v1.0 back-compat)
  await prisma.serviceConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      serviceFeeRate: 0.07,
      overboxThreshold: 300,
      overboxAmountPerBox: 2.0,
    },
  });
  console.log('  ✓ ServiceConfig');

  // 2. Container types (V2.0 configurable)
  const containers = [
    { code: '20GP', name: "20' General Purpose",
      internalLengthCm: 590, internalWidthCm: 235, internalHeightCm: 239,
      nominalCbm: 33, safetyUtilization: 90, maxPayloadKg: 26500, sortOrder: 1, active: true },
    { code: '40GP', name: "40' General Purpose",
      internalLengthCm: 1200, internalWidthCm: 235, internalHeightCm: 239,
      nominalCbm: 67, safetyUtilization: 90, maxPayloadKg: 26500, sortOrder: 2, active: true },
    { code: '40HQ', name: "40' High Cube",
      internalLengthCm: 1200, internalWidthCm: 235, internalHeightCm: 269,
      nominalCbm: 76, safetyUtilization: 90, maxPayloadKg: 26500, sortOrder: 3, active: true },
  ];
  for (const c of containers) {
    await prisma.containerType.upsert({
      where: { code: c.code },
      update: { name: c.name, internalLengthCm: c.internalLengthCm, internalWidthCm: c.internalWidthCm, internalHeightCm: c.internalHeightCm, nominalCbm: c.nominalCbm, safetyUtilization: c.safetyUtilization, maxPayloadKg: c.maxPayloadKg, sortOrder: c.sortOrder, active: c.active },
      create: c,
    });
  }
  console.log(`  ✓ ContainerTypes (${containers.length})`);

  // 3. Service fee tiers (V2.0 tiered model: 5-10%)
  const tiers = [
    { name: 'Small order (≤$300/pc)', minProductValue: 0,    maxProductValue: 300,  rate: 8.0,  effectiveFrom: new Date(), active: true, note: 'Higher fee for small per-unit value orders.' },
    { name: 'Mid-tier ($300-$800/pc)', minProductValue: 300,  maxProductValue: 800,  rate: 7.0,  effectiveFrom: new Date(), active: true, note: 'Standard rate.' },
    { name: 'Large order (>$800/pc)', minProductValue: 800,  maxProductValue: null, rate: 5.0,  effectiveFrom: new Date(), active: true, note: 'Lower fee for premium / large-ticket items.' },
  ];
  for (const t of tiers) {
    // Use minProductValue + name as natural key (since we don't have unique constraint)
    const existing = await prisma.serviceFeeTier.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.serviceFeeTier.update({ where: { id: existing.id }, data: t });
    } else {
      await prisma.serviceFeeTier.create({ data: t });
    }
  }
  console.log(`  ✓ ServiceFeeTiers (${tiers.length})`);

  // 4. Overbox rule (V2.0 single active rule)
  await prisma.overboxRule.upsert({
    where: { id: 'singleton-overbox' },
    update: { threshold: 300, feePerCarton: 2.0, note: 'Cartons exceeding this threshold incur an extra fee per carton.', active: true },
    create: { id: 'singleton-overbox', threshold: 300, feePerCarton: 2.0, note: 'Cartons exceeding this threshold incur an extra fee per carton.', active: true },
  }).catch(() => {
    // If id isn't unique-constraint safe, fall back to findFirst
    return prisma.overboxRule.findFirst({ where: { active: true } })
      .then((existing) => existing
        ? prisma.overboxRule.update({ where: { id: existing.id }, data: { threshold: 300, feePerCarton: 2.0 } })
        : prisma.overboxRule.create({ data: { threshold: 300, feePerCarton: 2.0, note: 'Default overbox rule.', active: true } })
      );
  });
  console.log('  ✓ OverboxRule');

  // 5. Categories (5 大品类)
  const categories = [
    { slug: 'sofa', name: 'Sofa', order: 1, description: 'Modular sofas · KD · 5-seat MOQ · FOB pricing', bannerImage: 'https://placehold.co/1920x480/8a5e34/ffffff?text=Sofa+Collection' },
    { slug: 'bed', name: 'Bed', order: 2, description: 'Upholstered beds · Platform · Storage · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/6f4824/ffffff?text=Bed+Collection' },
    { slug: 'mattress', name: 'Mattress', order: 3, description: 'Memory foam · Pocket spring · Hybrid · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/3d2814/ffffff?text=Mattress+Collection' },
    { slug: 'cabinet', name: 'Cabinet', order: 4, description: 'Sideboards · TV units · Wardrobes · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/a37547/ffffff?text=Cabinet+Collection' },
    { slug: 'table-chair', name: 'Table & Chair', order: 5, description: 'Dining sets · Accent chairs · Bar stools · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/8a5e34/ffffff?text=Table+%26+Chair' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug }, update: { name: c.name, description: c.description, bannerImage: c.bannerImage, order: c.order }, create: c,
    });
  }
  console.log('  ✓ Categories (5)');

  // 6. Products (v1.0 10 mock products, with v2.0 carton fields)
  const sofaCat = await prisma.category.findUnique({ where: { slug: 'sofa' } });
  const bedCat = await prisma.category.findUnique({ where: { slug: 'bed' } });
  const mattressCat = await prisma.category.findUnique({ where: { slug: 'mattress' } });
  const cabinetCat = await prisma.category.findUnique({ where: { slug: 'cabinet' } });
  const tableCat = await prisma.category.findUnique({ where: { slug: 'table-chair' } });

  const products = [
    { sku: 'SF-2401', modelNo: 'SF-2401', name: 'Modular 3-Seat Sofa · Linen Blend', categoryId: sofaCat!.id, productType: 'Sofa',
      application: JSON.stringify(['Living Room', 'Hotel']), fobPrice: 320, moq: 5, cbmPerPiece: 1.2,
      description: '3-seat modular sofa with KD frame. Linen-blend upholstery over high-resilience foam.',
      specs: JSON.stringify({ 'Overall Size (in)': 'W84" × D36" × H34"', 'Material': 'Linen blend', 'Frame': 'Solid wood + plywood' }),
      colors: JSON.stringify([{ name: 'Beige', hex: '#d4c5a9' }, { name: 'Gray', hex: '#8a8a8a' }, { name: 'Olive', hex: '#6b7250' }]),
      images: JSON.stringify([img('SF-2401', 1), img('SF-2401', 2), img('SF-2401', 3)]),
      imageUrl: img('SF-2401', 1),
      material: 'Linen blend', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.45, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 215, cartonWidthCm: 95, cartonHeightCm: 90, grossWeightKg: 38,
      stackable: true, maxStackLayers: 2, rotatable: true, fragile: false, featured: true },
    { sku: 'SF-2415', modelNo: 'SF-2415', name: 'Sectional L-Shape · Velvet', categoryId: sofaCat!.id, productType: 'Sectional',
      application: JSON.stringify(['Living Room', 'Hotel', 'Office']), fobPrice: 580, moq: 5, cbmPerPiece: 2.1,
      description: 'L-shape sectional with reversible chaise. Velvet upholstery, solid wood frame.',
      specs: JSON.stringify({ 'Overall Size (in)': 'W110" × D84" × H33"', 'Seats': '5', 'Material': 'Velvet' }),
      colors: JSON.stringify([{ name: 'Emerald', hex: '#0e6b4a' }, { name: 'Navy', hex: '#1a2440' }]),
      images: JSON.stringify([img('SF-2415', 1), img('SF-2415', 2)]),
      imageUrl: img('SF-2415', 1),
      material: 'Velvet', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.85, unitsPerCarton: 1, cartonsPerUnit: 2,
      cartonLengthCm: 280, cartonWidthCm: 110, cartonHeightCm: 85, grossWeightKg: 55,
      stackable: true, maxStackLayers: 2, rotatable: true, fragile: false, featured: true },
    { sku: 'SF-2408', modelNo: 'SF-2408', name: 'Recliner Sofa · 3-Seat · PU', categoryId: sofaCat!.id, productType: 'Recliner',
      application: JSON.stringify(['Living Room', 'Home Theater']), fobPrice: 460, moq: 5, cbmPerPiece: 1.8,
      description: 'Power reclining 3-seat sofa. PU upholstery, USB ports in armrest.',
      specs: JSON.stringify({ 'Seats': '3', 'Material': 'PU', 'Recline': 'Power' }),
      colors: JSON.stringify([{ name: 'Black', hex: '#1a1a1a' }, { name: 'Brown', hex: '#5c3a1e' }]),
      images: JSON.stringify([img('SF-2408', 1), img('SF-2408', 2)]),
      imageUrl: img('SF-2408', 1),
      material: 'PU', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.78, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 215, cartonWidthCm: 95, cartonHeightCm: 90, grossWeightKg: 65,
      stackable: true, maxStackLayers: 2, rotatable: false, fragile: false, featured: true },
    { sku: 'BD-1302', modelNo: 'BD-1302', name: 'Upholstered Platform Bed · Queen', categoryId: bedCat!.id, productType: 'Bed',
      application: JSON.stringify(['Bedroom', 'Hotel']), fobPrice: 380, moq: 5, cbmPerPiece: 1.5,
      description: 'Queen-size upholstered platform bed with tufted headboard.',
      specs: JSON.stringify({ 'Size': 'Queen (160×200cm)', 'Material': 'Linen blend' }),
      colors: JSON.stringify([{ name: 'Light Gray', hex: '#c8c8c8' }, { name: 'Beige', hex: '#d4c5a9' }]),
      images: JSON.stringify([img('BD-1302', 1), img('BD-1302', 2)]),
      imageUrl: img('BD-1302', 1),
      material: 'Linen blend', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.55, unitsPerCarton: 1, cartonsPerUnit: 2,
      cartonLengthCm: 210, cartonWidthCm: 30, cartonHeightCm: 35, grossWeightKg: 28,
      stackable: true, maxStackLayers: 3, rotatable: true, fragile: false, featured: true },
    { sku: 'BD-1310', modelNo: 'BD-1310', name: 'Storage Bed · King · Hydraulic', categoryId: bedCat!.id, productType: 'Bed',
      application: JSON.stringify(['Bedroom']), fobPrice: 520, moq: 5, cbmPerPiece: 2.0,
      description: 'King-size storage bed with hydraulic lift mechanism. 350L under-bed storage.',
      specs: JSON.stringify({ 'Size': 'King (180×200cm)', 'Storage': 'Yes' }),
      colors: JSON.stringify([{ name: 'Charcoal', hex: '#3a3a3a' }]),
      images: JSON.stringify([img('BD-1310', 1)]),
      imageUrl: img('BD-1310', 1),
      material: 'Linen blend', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.75, unitsPerCarton: 1, cartonsPerUnit: 2,
      cartonLengthCm: 230, cartonWidthCm: 35, cartonHeightCm: 35, grossWeightKg: 42,
      stackable: true, maxStackLayers: 3, rotatable: true, fragile: false, featured: true },
    { sku: 'MT-0901', modelNo: 'MT-0901', name: 'Memory Foam Mattress · Queen', categoryId: mattressCat!.id, productType: 'Mattress',
      application: JSON.stringify(['Bedroom', 'Hotel']), fobPrice: 180, moq: 5, cbmPerPiece: 0.65,
      description: 'Queen memory foam mattress · 25cm height · 30D density · CertiPUR-US.',
      specs: JSON.stringify({ 'Size': 'Queen', 'Thickness': '25cm', 'Density': '30D' }),
      colors: JSON.stringify([{ name: 'White', hex: '#ffffff' }]),
      images: JSON.stringify([img('MT-0901', 1)]),
      imageUrl: img('MT-0901', 1),
      material: 'Memory foam', style: 'Standard', leadTime: '15-25 days',
      cartonCbm: 0.65, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 165, cartonWidthCm: 30, cartonHeightCm: 30, grossWeightKg: 22,
      stackable: true, maxStackLayers: 3, rotatable: true, fragile: false, featured: true },
    { sku: 'MT-0905', modelNo: 'MT-0905', name: 'Hybrid Pocket Spring · King', categoryId: mattressCat!.id, productType: 'Mattress',
      application: JSON.stringify(['Bedroom']), fobPrice: 280, moq: 5, cbmPerPiece: 0.85,
      description: 'King hybrid mattress with pocket springs + memory foam.',
      specs: JSON.stringify({ 'Size': 'King', 'Thickness': '28cm' }),
      colors: JSON.stringify([{ name: 'White', hex: '#ffffff' }]),
      images: JSON.stringify([img('MT-0905', 1)]),
      imageUrl: img('MT-0905', 1),
      material: 'Hybrid', style: 'Premium', leadTime: '15-25 days',
      cartonCbm: 0.85, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 195, cartonWidthCm: 30, cartonHeightCm: 30, grossWeightKg: 32,
      stackable: true, maxStackLayers: 3, rotatable: true, fragile: false, featured: false },
    { sku: 'CB-0702', modelNo: 'CB-0702', name: 'TV Cabinet · 180cm · 3 Drawer', categoryId: cabinetCat!.id, productType: 'Cabinet',
      application: JSON.stringify(['Living Room']), fobPrice: 220, moq: 5, cbmPerPiece: 0.9,
      description: '180cm TV cabinet with 3 drawers + open shelf.',
      specs: JSON.stringify({ 'Size': '180×40×45cm', 'Material': 'MDF + solid wood' }),
      colors: JSON.stringify([{ name: 'Walnut', hex: '#5c3a1e' }, { name: 'Oak', hex: '#c8a878' }]),
      images: JSON.stringify([img('CB-0702', 1)]),
      imageUrl: img('CB-0702', 1),
      material: 'MDF + solid wood', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.35, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 185, cartonWidthCm: 45, cartonHeightCm: 25, grossWeightKg: 45,
      stackable: true, maxStackLayers: 4, rotatable: true, fragile: false, featured: true },
    { sku: 'TC-0501', modelNo: 'TC-0501', name: 'Dining Set · 6-Seat · Marble Top', categoryId: tableCat!.id, productType: 'Table & Chair',
      application: JSON.stringify(['Dining Room']), fobPrice: 680, moq: 5, cbmPerPiece: 2.4,
      description: '6-seat dining set · marble-look top table + 6 upholstered chairs.',
      specs: JSON.stringify({ 'Seats': '6', 'Table Size': '180×90×75cm' }),
      colors: JSON.stringify([{ name: 'White/Gold', hex: '#f0e8d8' }]),
      images: JSON.stringify([img('TC-0501', 1)]),
      imageUrl: img('TC-0501', 1),
      material: 'Marble + metal', style: 'Modern', leadTime: '30-45 days',
      cartonCbm: 0.42, unitsPerCarton: 1, cartonsPerUnit: 7,
      cartonLengthCm: 185, cartonWidthCm: 95, cartonHeightCm: 35, grossWeightKg: 85,
      stackable: true, maxStackLayers: 3, rotatable: true, fragile: true, featured: true },
    { sku: 'TC-0512', modelNo: 'TC-0512', name: 'Accent Chair · Velvet · Brass Leg', categoryId: tableCat!.id, productType: 'Chair',
      application: JSON.stringify(['Living Room', 'Bedroom', 'Hotel']), fobPrice: 95, moq: 10, cbmPerPiece: 0.35,
      description: 'Velvet accent chair with brass-finish metal legs.',
      specs: JSON.stringify({ 'Material': 'Velvet + metal', 'MOQ': '10' }),
      colors: JSON.stringify([{ name: 'Mustard', hex: '#c89849' }, { name: 'Teal', hex: '#1f6b6b' }, { name: 'Pink', hex: '#d9a397' }]),
      images: JSON.stringify([img('TC-0512', 1)]),
      imageUrl: img('TC-0512', 1),
      material: 'Velvet + metal', style: 'Modern', leadTime: '25-40 days',
      cartonCbm: 0.30, unitsPerCarton: 1, cartonsPerUnit: 1,
      cartonLengthCm: 75, cartonWidthCm: 70, cartonHeightCm: 90, grossWeightKg: 12,
      stackable: true, maxStackLayers: 4, rotatable: true, fragile: false, featured: true },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku }, update: p, create: p,
    });
  }
  console.log(`  ✓ Products (${products.length})`);

  // 7. Admin user (V1.0 keep credentials)
  const adminPwd = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@furnihub.local' },
    update: { passwordHash: adminPwd, role: 'admin', status: 'active' },
    create: {
      email: 'admin@furnihub.local', passwordHash: adminPwd, name: 'Furnihub Admin',
      username: 'admin', country: 'CN', role: 'admin', status: 'active',
    },
  });
  console.log('  ✓ Admin user (admin@furnihub.local / admin123)');

  // 8. Demo customer
  const demoPwd = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { email: 'demo@buyer.com' },
    update: { passwordHash: demoPwd, status: 'active' },
    create: {
      email: 'demo@buyer.com', passwordHash: demoPwd, name: 'Demo Buyer',
      company: 'Demo Furniture Co.', country: 'US', phone: '+1-555-0100',
      role: 'customer', status: 'active',
    },
  });
  console.log('  ✓ Demo customer (demo@buyer.com / demo1234)');

  // 9. FAQ categories (V2.0 enrich to 7 categories, nangong-spec)
  const faqCats = [
    { slug: 'pricing', name: 'Pricing & FOB', order: 1 },
    { slug: 'service_fee', name: 'Service Fee & MOQ', order: 2 },
    { slug: 'consolidation', name: 'Consolidation & Shipping', order: 3 },
    { slug: 'booking', name: 'Booking & Shipping', order: 4 },
    { slug: 'tariff', name: 'Tariffs & Duties', order: 5 },
    { slug: 'warranty', name: 'Warranty & Quality', order: 6 },
    { slug: 'account', name: 'Account & Registration', order: 7 },
  ];
  for (const c of faqCats) {
    await prisma.faqCategory.upsert({
      where: { slug: c.slug }, update: { name: c.name, order: c.order }, create: c,
    });
  }
  console.log(`  ✓ FAQ categories (${faqCats.length})`);

  // 10. FAQ content (5 baseline FAQs across categories)
  const pricingCat = await prisma.faqCategory.findUnique({ where: { slug: 'pricing' } });
  const serviceCat = await prisma.faqCategory.findUnique({ where: { slug: 'service_fee' } });
  const consolCat = await prisma.faqCategory.findUnique({ where: { slug: 'consolidation' } });
  const tariffCat = await prisma.faqCategory.findUnique({ where: { slug: 'tariff' } });
  const accountCat = await prisma.faqCategory.findUnique({ where: { slug: 'account' } });

  const faqs = [
    { categoryId: pricingCat!.id, question: 'What does FOB price include?',
      answer: 'FOB China port prices include the product, inner packaging and China-side loading. They do NOT include ocean freight, destination port charges, customs duties or import tariffs.', order: 1 },
    { categoryId: pricingCat!.id, question: 'Are prices negotiable for large orders?',
      answer: 'We offer volume-based pricing tiers that auto-apply through your MY CONTAINER. For orders exceeding 1 full HQ container of a single SKU, please contact sourcing@furnihub.com directly.', order: 2 },
    { categoryId: serviceCat!.id, question: 'What is the service fee?',
      answer: 'Furnihub charges a transparent 5-10% service fee (calculated per SKU based on FOB price tier). The fee covers sourcing coordination, QC, container planning, documentation and export handling. It is shown separately in MY CONTAINER.', order: 1 },
    { categoryId: serviceCat!.id, question: 'What is the minimum order quantity?',
      answer: 'Standard MOQ is 5 pieces per SKU. Eligible SKUs can be consolidated across categories into one full container to share fixed costs.', order: 2 },
    { categoryId: consolCat!.id, question: 'Can I consolidate different SKUs into one container?',
      answer: 'Yes — that is the core of our service. MY CONTAINER lets you mix sofas, beds, mattresses and case goods up to the safe usable capacity of 20GP / 40GP / 40HQ. We auto-recommend the smallest container that fits your plan.', order: 1 },
    { categoryId: consolCat!.id, question: 'What is the overbox fee?',
      answer: 'When total cartons exceed 300, additional cartons are charged $2 USD each to cover extra loading and documentation work. The threshold and fee are configurable per market.', order: 2 },
    { categoryId: tariffCat!.id, question: 'Who pays import duties?',
      answer: 'Import duties and tariffs are paid by the buyer in the destination country. Furnihub can provide HS code suggestions and customs documentation, but the final rate depends on classification by your customs broker.', order: 1 },
    { categoryId: accountCat!.id, question: 'How do I register?',
      answer: 'Click Sign Up Free, fill in your company and contact details. V1.0 auto-approves registrations; manual approval can be enabled in admin.', order: 1 },
  ];
  for (const f of faqs) {
    // Match by (categoryId, question)
    const existing = await prisma.faq.findFirst({ where: { categoryId: f.categoryId, question: f.question } });
    if (existing) await prisma.faq.update({ where: { id: existing.id }, data: f });
    else await prisma.faq.create({ data: f });
  }
  console.log(`  ✓ FAQs (${faqs.length})`);

  // 11. Insights (V2.0: 3 baseline GEO articles)
  const insights = [
    {
      title: '5-Piece MOQ · Mixed-SKU Consolidation · A New Way to Source from China',
      slug: 'mixed-sku-consolidation',
      excerpt: 'Independent furniture retailers no longer need to fill a full container of one SKU. Furnihub consolidates mixed orders with transparent fees and full-container planning.',
      body: `# The Traditional Container Sourcing Model\n\nFor decades, container-load (CL) sourcing from China meant committing to 1,500+ identical pieces of a single SKU. That worked for big-box buyers; it did not work for independent retailers and home-staging businesses that needed variety but not volume.\n\n## What 5-Piece MOQ + Mixed-SKU Consolidation Unlocks\n\nFurnihub operates on two simple principles:\n\n1. **5-piece MOQ per SKU** — small enough to test, large enough to manufacture.\n2. **Mixed-SKU full-container planning** — you can put sofas, beds, mattresses and case goods into a single 40HQ container, paying only the proportional FOB + service fee per line.\n\n## How We Price Transparently\n\nEvery order shows you, in MY CONTAINER:\n\n- **Per-line FOB price** (5-10% service fee applies on top, calculated per SKU based on unit price tier)\n- **Carton count + total CBM** (real packing math, not estimates)\n- **Auto-recommended container** (20GP / 40GP / 40HQ)\n- **Overbox handling** (cartons beyond the 300-carton threshold add USD 2 each)\n- **Grand total** (FOB + service fee + overbox, no hidden costs)\n\n## Who This Works For\n\n- Independent furniture retailers that need variety, not volume.\n- Home staging companies furnishing multiple properties at once.\n- Small importers testing a new product line before committing to deep inventory.\n- Interior designers building custom orders for residential projects.\n\n## What's Next\n\nIn Part 2 we walk through container packing — how MY CONTAINER's 2D bin-packing engine tells you exactly which products fit in which container, and how to read the carton utilization map.\n`,
      heroImage: 'https://placehold.co/1200x600/8a5e34/ffffff?text=Mixed+SKU+Consolidation',
      publishedAt: new Date('2026-06-15'), readTime: 6,
      author: 'Furnihub Sourcing Team', authorCredentials: '20+ years combined experience in China furniture export.',
      sources: JSON.stringify(['Container Shipping Statistics 2024 · Maersk Market Update', 'Independent Retailer Sourcing Survey 2025']),
      featured: true, active: true,
    },
    {
      title: 'Reading Container Loading Plans · CBM, Cartons, and Utilization',
      slug: 'reading-container-plans',
      excerpt: 'A practical guide to reading MY CONTAINER loading plans — what CBM utilization means, how carton stacking affects container height, and how to spot under-utilized space.',
      body: `# Understanding Container Loading Math\n\nContainer shipping is priced by the box, but loaded by the carton. Two orders with the same total CBM can have very different shipping costs depending on how efficiently the cartons stack.\n\n## The Three Constraints That Matter\n\n### 1. Floor Area\n\n20GP internal dimensions are roughly 5.9m × 2.35m = 13.9 m² of floor. 40GP doubles the length to 11.9m. 40HQ adds 30cm of height (2.69m vs 2.39m).\n\nFurnihub's MY CONTAINER packs cartons using a 2D bin-packing algorithm — the same approach used by warehouse management systems — to maximize floor utilization while respecting each carton's longest-side orientation.\n\n### 2. Stack Height\n\nCartons can be stacked up to the container's internal height (2.69m for 40HQ), but only if the product is **stackable** (most case goods are) and the cartons are **not fragile** (most mattresses and glass-top tables are not).\n\nOur engine respects both constraints — a fragile item is treated as a 1-layer stack regardless of its height.\n\n### 3. Weight\n\n40HQ has a max payload of roughly 26,500 kg. Most consolidated mixed orders come in well below this, but if you are loading heavy case goods (TV cabinets at 45+ kg per carton), weight can become the binding constraint before volume.\n\n## Reading the Loading Plan\n\nMY CONTAINER shows you:\n\n- **Floor utilization %** — how much of the container's floor area is occupied.\n- **Height utilization %** — how much of the container's internal height is reached by the tallest stack.\n- **Volume utilization %** — total carton CBM / usable CBM (nominal × safety utilization, typically 90%).\n- **Warnings** — unplaced cartons (didn't fit), volume exceedance, payload exceedance, placement collisions.\n\nIf a plan shows <70% floor utilization with a 40HQ recommendation, you probably have a few bulky low-stacked items. The **filler suggestions** panel recommends small stackable SKUs to fill the remaining space.\n`,
      heroImage: 'https://placehold.co/1200x600/6f4824/ffffff?text=Container+Plans',
      publishedAt: new Date('2026-06-25'), readTime: 8,
      author: 'Furnihub Sourcing Team', authorCredentials: 'Container loading planning specialists.',
      sources: JSON.stringify(['ISO 668 Container Specifications', 'Maersk 40HQ Technical Spec Sheet']),
      featured: true, active: true,
    },
    {
      title: 'Service Fees Explained · Why 5-10% and What You Get',
      slug: 'service-fees-explained',
      excerpt: 'A breakdown of Furnihub\'s 5-10% service fee structure by FOB price tier, and exactly what services the fee covers.',
      body: `# Why a Service Fee?\n\nFurnihub is not a trading middleman. We do not buy your products and resell them. We coordinate sourcing, consolidation, quality control and export — and we charge a transparent fee for it.\n\n## The Tiered Structure\n\n| Per-unit FOB price | Service fee |\n|-------------------|-------------|\n| ≤ $300            | 8%          |\n| $300 – $800       | 7%          |\n| > $800            | 5%          |\n\nThe fee is **calculated per SKU** based on each product's FOB price, not as a flat percentage of the order total.\n\n## What's Included\n\n- **Sourcing coordination** — supplier outreach, sample ordering, factory qualification.\n- **Production follow-up** — milestone checks during manufacturing.\n- **Quality control** — pre-shipment inspection, AQL sampling, defect reporting.\n- **Container planning** — mixed-SKU loading optimization, 2D bin-packing.\n- **Documentation** — commercial invoice, packing list, certificate of origin.\n- **Export handling** — booking with freight forwarder, customs declaration, port delivery.\n\n## What's NOT Included\n\n- Ocean freight (paid by buyer directly or via our freight forwarder).\n- Destination port charges, customs duties, import tariffs.\n- Product customization beyond standard spec sheets.\n- Product liability insurance.\n\n## Why Tiered?\n\nSmall per-unit value orders (≤$300) involve the same fixed cost of coordination as larger ones, so the fee percentage is higher. Premium orders (>$800) benefit from economy of scale in our coordination work, so the fee is lower.\n\n## How to See Your Fee in MY CONTAINER\n\nAdd products to your container, switch between 20GP / 40GP / 40HQ, and the right panel shows your total service fee broken down per SKU with the effective rate.\n`,
      heroImage: 'https://placehold.co/1200x600/3d2814/ffffff?text=Service+Fees',
      publishedAt: new Date('2026-07-05'), readTime: 5,
      author: 'Furnihub Sourcing Team',
      sources: JSON.stringify(['Furnihub Operations Manual v3.0']),
      featured: true, active: true,
    },
  ];
  for (const ins of insights) {
    await prisma.insight.upsert({
      where: { slug: ins.slug }, update: ins, create: ins,
    });
  }
  console.log(`  ✓ Insights (${insights.length})`);

  console.log('✅ V2.0 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
