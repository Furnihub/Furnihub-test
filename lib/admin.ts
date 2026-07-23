// Furnihub V2.0 · Admin auth helpers
// Pitfall log:
//   - requireAdmin must throw NextResponse (or be used in try/catch by caller)
//   - Admin role check: V1.0 used role='admin' string; V2.0 keeps same
//   - DO NOT cache getCurrentUser across requests — sessions change

import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { prisma } from './db';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  if (user.status !== 'active') return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required. Please sign in as admin.' }, { status: 401 });
  }
  return admin;
}

export function isAdminResponse(value: AdminUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

// Bootstrapping: ensure at least one admin user exists with a known email
// Called by startup script + seed
export async function ensureAdminExists(email = 'admin@furnihub.local', password = 'admin123', name = 'Furnihub Admin') {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'admin' || existing.status !== 'active') {
      await prisma.user.update({
        where: { email },
        data: { role: 'admin', status: 'active' },
      });
    }
    return existing;
  }
  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      username: 'admin',
      country: 'CN',
      role: 'admin',
      status: 'active',
      privacyAccepted: true,
    },
  });
}
