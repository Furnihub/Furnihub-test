// FAQ CRUD: GET list, POST create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const faqs = await prisma.faq.findMany({
    include: { category: true },
    orderBy: [{ categoryId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
  });
  const categories = await prisma.faqCategory.findMany({ orderBy: [{ order: 'asc' }, { id: 'asc' }] });
  return NextResponse.json({ faqs, categories });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const body = await req.json();
  if (!body.question || !body.answer || !body.categoryId) {
    return NextResponse.json({ error: 'question, answer, categoryId are required' }, { status: 400 });
  }
  try {
    const created = await prisma.faq.create({
      data: {
        question: body.question,
        answer: body.answer,
        categoryId: body.categoryId,
        relatedLinks: body.relatedLinks ?? null,
        order: Number(body.order ?? 0),
        active: body.active !== false,
      },
    });
    return NextResponse.json({ faq: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
