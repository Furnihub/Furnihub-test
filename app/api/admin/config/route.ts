// Config (ContainerType, ServiceFeeTier, OverboxRule) CRUD endpoints
// All in one file for compactness. Pattern matches other admin endpoints.
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

function requiredFields(resource: Resource): string[] {
  switch (resource) {
    case 'container-types': return ['code', 'name', 'internalLengthCm', 'internalWidthCm', 'internalHeightCm', 'nominalCbm', 'maxPayloadKg'];
    case 'service-fee-tiers': return ['name', 'rate'];
    case 'overbox-rules': return ['threshold', 'feePerCarton'];
    case 'factories': return ['name', 'location', 'specialty', 'established', 'monthlyCapacity', 'description'];
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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { resource } = await ctx.params;
  const model = pickModel(resource as Resource);
  if (!model) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  // @ts-expect-error generic findMany
  const items = await model.findMany({ orderBy: [{ id: 'asc' }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { resource } = await ctx.params;
  const model = pickModel(resource as Resource);
  if (!model) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  const body = await req.json();
  for (const f of requiredFields(resource as Resource)) {
    if (body[f] == null || body[f] === '') return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
  }
  try {
    // @ts-expect-error generic create
    const created = await model.create({ data: body });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
