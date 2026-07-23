// Insights CRUD: GET list, POST create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const insights = await prisma.insight.findMany({
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ insights });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const body = await req.json();
  if (!body.title || !body.body || !body.publishedAt) {
    return NextResponse.json({ error: 'title, body, publishedAt are required' }, { status: 400 });
  }
  const slug = body.slug ?? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  try {
    const created = await prisma.insight.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt ?? '',
        body: body.body,
        heroImage: body.heroImage ?? null,
        categoryId: body.categoryId ?? null,
        publishedAt: new Date(body.publishedAt),
        readTime: Number(body.readTime ?? 6),
        author: body.author ?? 'Furnihub Sourcing Team',
        authorCredentials: body.authorCredentials ?? null,
        sources: body.sources ?? null,
        featured: Boolean(body.featured),
        active: body.active !== false,
      },
    });
    return NextResponse.json({ insight: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
