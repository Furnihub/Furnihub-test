// Admin Inquiries list endpoint
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const inquiries = await prisma.inquiry.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ inquiries });
}
