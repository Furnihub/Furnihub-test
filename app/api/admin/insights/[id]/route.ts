// Insights single CRUD: PATCH, DELETE
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ['title', 'slug', 'excerpt', 'body', 'heroImage', 'categoryId', 'publishedAt',
    'readTime', 'author', 'authorCredentials', 'sources', 'featured', 'active'];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  if (data.publishedAt) data.publishedAt = new Date(data.publishedAt as string);
  try {
    const updated = await prisma.insight.update({ where: { id }, data });
    return NextResponse.json({ insight: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  try {
    await prisma.insight.delete({ where: { id } });
    return NextResponse.json({ message: 'Insight deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
