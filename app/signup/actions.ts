'use server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  country: z.string().min(1).max(50),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

export async function signup(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent('Invalid input. Please check all fields.')}`);
  }
  const data = parsed.data!;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent('Email already registered. Try signing in.')}`);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      company: data.company,
      country: data.country,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      role: 'customer',
      status: 'active', // V1.0: auto-approve · 接口已预留
    },
  });

  await createSession(user.id);
  redirect('/products');
}
