'use server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '/container';

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Please enter email and password')}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'active') {
    redirect(`/login?error=${encodeURIComponent('Invalid email or password')}`);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect(`/login?error=${encodeURIComponent('Invalid email or password')}`);
  }

  await createSession(user.id);
  redirect(redirectTo);
}
