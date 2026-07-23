// API login endpoint (also used by curl/automated tests)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: 'email & password required' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'active') return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}
