// GET single, PATCH update, DELETE
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  const body = await req.json();
  // Whitelist fields to prevent overposting
  const allowed: Record<string, true> = {
    name: true, slug: true, categoryId: true, productType: true, application: true,
    fobPrice: true, moq: true, cbmPerPiece: true, description: true, shortDescription: true,
    specs: true, colors: true, images: true, imageUrl: true, gallery: true, videoUrl: true,
    material: true, style: true, modelNo: true, dimensionsIn: true, dimensionsCm: true,
    seatWidth: true, seatDepth: true, seatHeight: true, armHeight: true, backHeight: true,
    fabric: true, frame: true, filling: true, legMaterial: true, assembly: true,
    hasStorage: true, recline: true, seating: true, weightCapacity: true, foamDensity: true,
    certifications: true, packingDimensions: true, leadTime: true, cartonCbm: true,
    unitsPerCarton: true, cartonsPerUnit: true, cartonLengthCm: true, cartonWidthCm: true,
    cartonHeightCm: true, grossWeightKg: true, stackable: true, maxStackLayers: true,
    rotatable: true, fragile: true, loadingColor: true, featured: true, active: true,
  };
  const data: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (allowed[k]) data[k] = body[k];
  }
  try {
    const updated = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Product deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
