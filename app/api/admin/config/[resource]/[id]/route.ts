// Config single item CRUD: PATCH, DELETE
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

type Resource = 'container-types' | 'service-fee-tiers' | 'overbox-rules' | 'factories';

function pickModel(resource: Resource) {
  switch (resource) {
    case 'container-types': return prisma.containerType;
    case 'service-fee-tiers': return prisma.serviceFeeTier;
    case 'overbox-rules': return prisma.overboxRule;
    case 'factories': return prisma.partnerFactory;
  }
}

function allowedFields(resource: Resource): string[] {
  switch (resource) {
    case 'container-types': return ['code', 'name', 'internalLengthCm', 'internalWidthCm', 'internalHeightCm', 'nominalCbm', 'safetyUtilization', 'maxPayloadKg', 'sortOrder', 'active'];
    case 'service-fee-tiers': return ['name', 'minProductValue', 'maxProductValue', 'rate', 'note', 'effectiveFrom', 'active'];
    case 'overbox-rules': return ['threshold', 'feePerCarton', 'note', 'active'];
    case 'factories': return ['name', 'slug', 'location', 'specialty', 'established', 'area', 'employees', 'productionLines', 'monthlyCapacity', 'certifications', 'images', 'videoUrl', 'description', 'active'];
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { resource, id } = await ctx.params;
  const model = pickModel(resource as Resource);
  if (!model) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of allowedFields(resource as Resource)) if (k in body) data[k] = body[k];
  try {
    // @ts-expect-error generic update
    const updated = await model.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { resource, id } = await ctx.params;
  const model = pickModel(resource as Resource);
  if (!model) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  try {
    // @ts-expect-error generic delete
    await model.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
