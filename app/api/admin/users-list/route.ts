// Users list endpoint (used by /admin/users)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, username: true, company: true,
      country: true, role: true, status: true, createdAt: true, phone: true, whatsapp: true,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 500,
  });
  return NextResponse.json({ users });
}
