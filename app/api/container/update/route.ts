import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { itemId, quantity } = await req.json();
  const item = await prisma.containerItem.findUnique({
    where: { id: itemId },
    include: { container: true },
  });
  if (!item || item.container.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await prisma.containerItem.update({
    where: { id: itemId },
    data: { quantity: Math.max(5, Math.min(999, quantity)) },
  });
  return NextResponse.json({ success: true });
}
