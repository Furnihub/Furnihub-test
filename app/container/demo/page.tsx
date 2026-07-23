// /container/demo · Dev-only preview (no auth required)
import { prisma } from '@/lib/db';
import ContainerView from '@/components/ContainerView';

export const dynamic = 'force-dynamic';

export default async function ContainerDemoPage() {
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@buyer.com' } });
  if (!demoUser) {
    return <div className="container-x py-16">Demo user not seeded. Run: npm run db:seed</div>;
  }

  // Seed a few demo items if container empty
  let container = await prisma.container.findFirst({
    where: { userId: demoUser.id, status: 'active' },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!container) {
    container = await prisma.container.create({
      data: { userId: demoUser.id },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
  }
  if (container.items.length === 0) {
    const products = await prisma.product.findMany({ take: 4 });
    for (const p of products) {
      await prisma.containerItem.create({
        data: {
          containerId: container.id,
          productId: p.id,
          quantity: p.moq,
          unitFob: p.fobPrice,
          cbmPerPiece: p.cbmPerPiece,
        },
      });
    }
    container = await prisma.container.findUnique({
      where: { id: container.id },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
  }

  const config = await prisma.serviceConfig.findFirst();

  return (
    <div className="container-x py-10">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        🛠 Dev preview mode · no auth required · seed data only
      </div>
      <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded text-sm text-brand-900">
        📦 Minimum Order: 5 pieces per SKU · FOB pricing excludes ocean shipping
      </div>

      <ContainerView
        containerId={container!.id}
        items={container!.items.map((i) => ({
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
        serviceRate={config?.serviceFeeRate ?? 0.07}
        overboxThreshold={config?.overboxThreshold ?? 300}
        overboxAmount={config?.overboxAmountPerBox ?? 2.0}
      />
    </div>
  );
}
