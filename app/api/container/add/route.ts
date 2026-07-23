import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const qty = Math.max(product.moq, quantity);

  let container = await prisma.container.findFirst({
    where: { userId: user.id, status: 'active' },
  });
  if (!container) {
    container = await prisma.container.create({ data: { userId: user.id } });
  }

  await prisma.containerItem.upsert({
    where: { containerId_productId: { containerId: container.id, productId } },
    update: { quantity: { increment: qty - 0 /* will be set below */ } },
    create: {
      containerId: container.id,
      productId,
      quantity: qty,
      unitFob: product.fobPrice,
      cbmPerPiece: product.cbmPerPiece,
    },
  });

  // If existed, set quantity to max of existing+qty and the qty passed
  const existing = await prisma.containerItem.findUnique({
    where: { containerId_productId: { containerId: container.id, productId } },
  });
  if (existing) {
    await prisma.containerItem.update({
      where: { id: existing.id },
      data: { quantity: qty, unitFob: product.fobPrice, cbmPerPiece: product.cbmPerPiece },
    });
  }

  return NextResponse.json({ success: true });
}
