// Furnihub V1.0 · Seed data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mock product image URLs (use placehold.co so it works offline-ish; next.config already whitelisted)
const img = (sku: string, idx = 0) =>
  `https://placehold.co/1200x1200/a37547/ffffff?text=${encodeURIComponent(sku + '-' + idx)}`;

async function main() {
  console.log('🌱 Seeding Furnihub database...');

  // 1. Service config
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

  // 2. Categories (5 大品类)
  const categories = [
    { slug: 'sofa', name: 'Sofa', order: 1, description: 'Modular sofas · KD · 5-seat MOQ · FOB pricing', bannerImage: 'https://placehold.co/1920x480/8a5e34/ffffff?text=Sofa+Collection' },
    { slug: 'bed', name: 'Bed', order: 2, description: 'Upholstered beds · Platform · Storage · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/6f4824/ffffff?text=Bed+Collection' },
    { slug: 'mattress', name: 'Mattress', order: 3, description: 'Memory foam · Pocket spring · Hybrid · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/3d2814/ffffff?text=Mattress+Collection' },
    { slug: 'cabinet', name: 'Cabinet', order: 4, description: 'Sideboards · TV units · Wardrobes · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/a37547/ffffff?text=Cabinet+Collection' },
    { slug: 'table-chair', name: 'Table & Chair', order: 5, description: 'Dining sets · Accent chairs · Bar stools · 5-piece MOQ', bannerImage: 'https://placehold.co/1920x480/8a5e34/ffffff?text=Table+%26+Chair' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, bannerImage: c.bannerImage, order: c.order },
      create: c,
    });
  }
  console.log('  ✓ Categories (5)');

  // 3. Products (8-16 mock products)
  const sofaCat = await prisma.category.findUnique({ where: { slug: 'sofa' } });
  const bedCat = await prisma.category.findUnique({ where: { slug: 'bed' } });
  const mattressCat = await prisma.category.findUnique({ where: { slug: 'mattress' } });
  const cabinetCat = await prisma.category.findUnique({ where: { slug: 'cabinet' } });
  const tableCat = await prisma.category.findUnique({ where: { slug: 'table-chair' } });

  if (!sofaCat || !bedCat || !mattressCat || !cabinetCat || !tableCat) {
    throw new Error('Categories not seeded');
  }

  const products = [
    // Sofas (3)
    {
      sku: 'SF-2401', modelNo: 'SF-2401', name: 'Modular 3-Seat Sofa · Linen Blend',
      categoryId: sofaCat.id, productType: 'Sofa',
      application: JSON.stringify(['Living Room', 'Hotel']),
      fobPrice: 320, moq: 5, cbmPerPiece: 1.2,
      description: '3-seat modular sofa with KD frame. Linen-blend upholstery over high-resilience foam. Removable cushions for easy shipping.',
      specs: JSON.stringify({ 'Overall Size (in)': 'W84" × D36" × H34"', 'Overall Size (cm)': 'W213 × D91 × H86cm', 'Seat Width': 'W72"', 'Seat Depth': 'D22"', 'Seat Height': 'H18"', 'Arm Height': 'H24"', 'Back Height': 'H16"', 'Material': 'Linen blend', 'Frame': 'Solid wood + plywood', 'Filling': '28D high-resilience foam', 'Legs': 'Solid wood', 'Structure': 'KD', 'Storage': false, 'Recline': 'No', 'Seats': '3', 'Weight Capacity': '750 lbs / 340 kg', 'Foam Density': '28D', 'Colors': ['Beige', 'Gray', 'Olive'] }),
      colors: JSON.stringify([{ name: 'Beige', hex: '#d4c5a9' }, { name: 'Gray', hex: '#8a8a8a' }, { name: 'Olive', hex: '#6b7250' }]),
      images: JSON.stringify([img('SF-2401', 1), img('SF-2401', 2), img('SF-2401', 3)]),
      featured: true,
    },
    {
      sku: 'SF-2415', modelNo: 'SF-2415', name: 'Sectional L-Shape · Velvet',
      categoryId: sofaCat.id, productType: 'Sectional',
      application: JSON.stringify(['Living Room', 'Hotel', 'Office']),
      fobPrice: 580, moq: 5, cbmPerPiece: 2.1,
      description: 'L-shape sectional with reversible chaise. Velvet upholstery, solid wood frame.',
      specs: JSON.stringify({ 'Overall Size (in)': 'W110" × D84" × H33"', 'Seats': '5', 'Material': 'Velvet' }),
      colors: JSON.stringify([{ name: 'Emerald', hex: '#0e6b4a' }, { name: 'Navy', hex: '#1a2440' }, { name: 'Blush', hex: '#d9a397' }]),
      images: JSON.stringify([img('SF-2415', 1), img('SF-2415', 2)]),
      featured: true,
    },
    {
      sku: 'SF-2408', modelNo: 'SF-2408', name: 'Recliner Sofa · 3-Seat · PU',
      categoryId: sofaCat.id, productType: 'Recliner',
      application: JSON.stringify(['Living Room', 'Home Theater']),
      fobPrice: 460, moq: 5, cbmPerPiece: 1.8,
      description: 'Power reclining 3-seat sofa. PU upholstery, USB ports in armrest.',
      specs: JSON.stringify({ 'Seats': '3', 'Material': 'PU', 'Recline': 'Power' }),
      colors: JSON.stringify([{ name: 'Black', hex: '#1a1a1a' }, { name: 'Brown', hex: '#5c3a1e' }]),
      images: JSON.stringify([img('SF-2408', 1), img('SF-2408', 2)]),
      featured: true,
    },
    // Beds (2)
    {
      sku: 'BD-1302', modelNo: 'BD-1302', name: 'Upholstered Platform Bed · Queen',
      categoryId: bedCat.id, productType: 'Bed',
      application: JSON.stringify(['Bedroom', 'Hotel']),
      fobPrice: 380, moq: 5, cbmPerPiece: 1.5,
      description: 'Queen-size upholstered platform bed with tufted headboard. Linen-blend fabric.',
      specs: JSON.stringify({ 'Size': 'Queen (160×200cm)', 'Material': 'Linen blend', 'Storage': false }),
      colors: JSON.stringify([{ name: 'Light Gray', hex: '#c8c8c8' }, { name: 'Beige', hex: '#d4c5a9' }]),
      images: JSON.stringify([img('BD-1302', 1), img('BD-1302', 2)]),
      featured: true,
    },
    {
      sku: 'BD-1310', modelNo: 'BD-1310', name: 'Storage Bed · King · Hydraulic',
      categoryId: bedCat.id, productType: 'Bed',
      application: JSON.stringify(['Bedroom']),
      fobPrice: 520, moq: 5, cbmPerPiece: 2.0,
      description: 'King-size storage bed with hydraulic lift mechanism. 350L under-bed storage.',
      specs: JSON.stringify({ 'Size': 'King (180×200cm)', 'Storage': true }),
      colors: JSON.stringify([{ name: 'Charcoal', hex: '#3a3a3a' }]),
      images: JSON.stringify([img('BD-1310', 1)]),
      featured: true,
    },
    // Mattress (2)
    {
      sku: 'MT-0901', modelNo: 'MT-0901', name: 'Memory Foam Mattress · Queen',
      categoryId: mattressCat.id, productType: 'Mattress',
      application: JSON.stringify(['Bedroom', 'Hotel']),
      fobPrice: 180, moq: 5, cbmPerPiece: 0.65,
      description: 'Queen memory foam mattress · 25cm height · 30D density · CertiPUR-US.',
      specs: JSON.stringify({ 'Size': 'Queen', 'Thickness': '25cm', 'Density': '30D' }),
      colors: JSON.stringify([{ name: 'White', hex: '#ffffff' }]),
      images: JSON.stringify([img('MT-0901', 1)]),
      featured: true,
    },
    {
      sku: 'MT-0905', modelNo: 'MT-0905', name: 'Hybrid Pocket Spring · King',
      categoryId: mattressCat.id, productType: 'Mattress',
      application: JSON.stringify(['Bedroom']),
      fobPrice: 280, moq: 5, cbmPerPiece: 0.85,
      description: 'King hybrid mattress with pocket springs + memory foam. 28cm height.',
      specs: JSON.stringify({ 'Size': 'King', 'Thickness': '28cm' }),
      colors: JSON.stringify([{ name: 'White', hex: '#ffffff' }]),
      images: JSON.stringify([img('MT-0905', 1)]),
      featured: false,
    },
    // Cabinet (1)
    {
      sku: 'CB-0702', modelNo: 'CB-0702', name: 'TV Cabinet · 180cm · 3 Drawer',
      categoryId: cabinetCat.id, productType: 'Cabinet',
      application: JSON.stringify(['Living Room']),
      fobPrice: 220, moq: 5, cbmPerPiece: 0.9,
      description: '180cm TV cabinet with 3 drawers + open shelf. Solid wood legs.',
      specs: JSON.stringify({ 'Size': '180×40×45cm', 'Material': 'MDF + solid wood' }),
      colors: JSON.stringify([{ name: 'Walnut', hex: '#5c3a1e' }, { name: 'Oak', hex: '#c8a878' }]),
      images: JSON.stringify([img('CB-0702', 1)]),
      featured: true,
    },
    // Table & Chair (2)
    {
      sku: 'TC-0501', modelNo: 'TC-0501', name: 'Dining Set · 6-Seat · Marble Top',
      categoryId: tableCat.id, productType: 'Table & Chair',
      application: JSON.stringify(['Dining Room']),
      fobPrice: 680, moq: 5, cbmPerPiece: 2.4,
      description: '6-seat dining set · marble-look top table + 6 upholstered chairs.',
      specs: JSON.stringify({ 'Seats': '6', 'Table Size': '180×90×75cm' }),
      colors: JSON.stringify([{ name: 'White/Gold', hex: '#f0e8d8' }]),
      images: JSON.stringify([img('TC-0501', 1)]),
      featured: true,
    },
    {
      sku: 'TC-0512', modelNo: 'TC-0512', name: 'Accent Chair · Velvet · Brass Leg',
      categoryId: tableCat.id, productType: 'Chair',
      application: JSON.stringify(['Living Room', 'Bedroom', 'Hotel']),
      fobPrice: 95, moq: 10, cbmPerPiece: 0.35,
      description: 'Velvet accent chair with brass-finish metal legs.',
      specs: JSON.stringify({ 'Material': 'Velvet + metal', 'MOQ': '10' }),
      colors: JSON.stringify([{ name: 'Mustard', hex: '#c89849' }, { name: 'Teal', hex: '#1f6b6b' }, { name: 'Pink', hex: '#d9a397' }]),
      images: JSON.stringify([img('TC-0512', 1)]),
      featured: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }
  console.log(`  ✓ Products (${products.length})`);

  // 4. Admin user
  const adminPwd = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@furnihub.local' },
    update: {},
    create: {
      email: 'admin@furnihub.local',
      passwordHash: adminPwd,
      name: 'Furnihub Admin',
      country: 'CN',
      role: 'admin',
      status: 'active',
    },
  });
  console.log('  ✓ Admin user (admin@furnihub.local / admin123)');

  // 5. Demo customer
  const demoPwd = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { email: 'demo@buyer.com' },
    update: {},
    create: {
      email: 'demo@buyer.com',
      passwordHash: demoPwd,
      name: 'Demo Buyer',
      company: 'Demo Furniture Co.',
      country: 'US',
      phone: '+1-555-0100',
      role: 'customer',
      status: 'active',
    },
  });
  console.log('  ✓ Demo customer (demo@buyer.com / demo1234)');

  // 6. FAQ categories
  const faqCats = [
    { slug: 'pricing', name: 'Pricing & FOB', order: 1 },
    { slug: 'service_fee', name: 'Service Fee & MOQ', order: 2 },
    { slug: 'consolidation', name: 'Consolidation & Shipping', order: 3 },
    { slug: 'tariff', name: 'Tariffs & Duties', order: 4 },
    { slug: 'account', name: 'Account & Registration', order: 5 },
  ];
  for (const c of faqCats) {
    await prisma.faqCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: c.order },
      create: c,
    });
  }
  console.log('  ✓ FAQ categories (5)');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
