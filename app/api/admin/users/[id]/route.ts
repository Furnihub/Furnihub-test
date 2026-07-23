// User admin: PATCH status/role (no DELETE for safety)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (isAdminResponse(admin)) return admin;
  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ['status', 'role', 'name', 'company', 'phone', 'whatsapp', 'country'];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  try {
    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({
      user: {
        id: updated.id, email: updated.email, name: updated.name,
        role: updated.role, status: updated.status, company: updated.company,
        country: updated.country, createdAt: updated.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
