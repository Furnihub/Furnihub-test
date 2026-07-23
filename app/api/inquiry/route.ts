import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  containerId: z.string().optional(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(2),
  whatsapp: z.string().optional(),
  company: z.string().min(2).max(100),
  country: z.string().min(2).max(50),
  destinationPort: z.string().optional(),
  message: z.string().max(500).optional(),
  urgency: z.enum(['urgent', 'normal', 'planning']).default('normal'),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }
  const data = parsed.data;

  // Verify container belongs to user if provided
  if (data.containerId && user) {
    const c = await prisma.container.findUnique({ where: { id: data.containerId } });
    if (!c || c.userId !== user.id) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      userId: user?.id || null,
      containerId: data.containerId || null,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      company: data.company,
      country: data.country,
      destinationPort: data.destinationPort || null,
      message: data.message || null,
      urgency: data.urgency,
      status: 'new',
    },
  });

  return NextResponse.json({ success: true, inquiryId: inquiry.id });
}
