// GET list, POST create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') ?? '';
  const products = await prisma.product.findMany({
    where: {
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { modelNo: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: [{ featured: 'desc' }, { sku: 'asc' }],
    take: 200,
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const body = await req.json();
  if (!body.sku || !body.name || !body.categoryId || body.fobPrice == null) {
    return NextResponse.json({ error: 'sku, name, categoryId, fobPrice are required' }, { status: 400 });
  }
  try {
    const created = await prisma.product.create({
      data: {
        sku: body.sku,
        modelNo: body.modelNo ?? body.sku,
        name: body.name,
        slug: body.slug ?? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId: body.categoryId,
        productType: body.productType ?? 'Sofa',
        application: body.application ?? '[]',
        fobPrice: Number(body.fobPrice),
        moq: Number(body.moq ?? 5),
        cbmPerPiece: Number(body.cbmPerPiece ?? 0.35),
        description: body.description ?? '',
        shortDescription: body.shortDescription ?? null,
        specs: body.specs ?? '{}',
        colors: body.colors ?? '[]',
        images: body.images ?? '[]',
        imageUrl: body.imageUrl ?? null,
        gallery: body.gallery ?? null,
        videoUrl: body.videoUrl ?? null,
        material: body.material ?? null,
        style: body.style ?? null,
        dimensionsIn: body.dimensionsIn ?? null,
        dimensionsCm: body.dimensionsCm ?? null,
        seatWidth: body.seatWidth ?? null,
        seatDepth: body.seatDepth ?? null,
        seatHeight: body.seatHeight ?? null,
        armHeight: body.armHeight ?? null,
        backHeight: body.backHeight ?? null,
        fabric: body.fabric ?? null,
        frame: body.frame ?? null,
        filling: body.filling ?? null,
        legMaterial: body.legMaterial ?? null,
        assembly: body.assembly ?? 'KD',
        hasStorage: Boolean(body.hasStorage),
        recline: Boolean(body.recline),
        seating: Number(body.seating ?? 1),
        weightCapacity: body.weightCapacity ?? null,
        foamDensity: body.foamDensity ?? null,
        certifications: body.certifications ?? null,
        packingDimensions: body.packingDimensions ?? null,
        leadTime: body.leadTime ?? '30-45 days',
        cartonCbm: Number(body.cartonCbm ?? 0.35),
        unitsPerCarton: Number(body.unitsPerCarton ?? 1),
        cartonsPerUnit: Number(body.cartonsPerUnit ?? 1),
        cartonLengthCm: Number(body.cartonLengthCm ?? 100),
        cartonWidthCm: Number(body.cartonWidthCm ?? 70),
        cartonHeightCm: Number(body.cartonHeightCm ?? 50),
        grossWeightKg: Number(body.grossWeightKg ?? 25),
        stackable: body.stackable !== false,
        maxStackLayers: Number(body.maxStackLayers ?? 2),
        rotatable: body.rotatable !== false,
        fragile: Boolean(body.fragile),
        loadingColor: body.loadingColor ?? null,
        featured: Boolean(body.featured),
        active: body.active !== false,
      },
    });
    return NextResponse.json({ product: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
