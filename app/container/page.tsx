// MY Container · /container
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import ContainerView from '@/components/ContainerView';

export const dynamic = 'force-dynamic';

export default async function ContainerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/container');

  // Get or create the user's active container
  let container = await prisma.container.findFirst({
    where: { userId: user.id, status: 'active' },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!container) {
    container = await prisma.container.create({
      data: { userId: user.id },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
  }

  const config = await prisma.serviceConfig.findFirst();
  const serviceRate = config?.serviceFeeRate ?? 0.07;
  const overboxThreshold = config?.overboxThreshold ?? 300;
  const overboxAmount = config?.overboxAmountPerBox ?? 2.0;

  return (
    <div className="container-x py-10">
      <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded text-sm text-brand-900">
        📦 Minimum Order: 5 pieces per SKU · FOB pricing excludes ocean shipping
      </div>

      <ContainerView
        containerId={container.id}
        items={container.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          sku: i.product.sku,
          name: i.product.name,
          modelNo: i.product.modelNo,
          image: (JSON.parse(i.product.images || '[]')[0]) as string,
          unitFob: i.unitFob,
          qty: i.quantity,
          cbmPerPiece: i.cbmPerPiece,
          categorySlug: i.product.category.slug,
        }))}
        serviceRate={serviceRate}
        overboxThreshold={overboxThreshold}
        overboxAmount={overboxAmount}
      />
    </div>
  );
}
