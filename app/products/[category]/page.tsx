// Category page · /products/[category]
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.category },
    include: { products: { where: { active: true }, include: { category: true } } },
  });
  if (!category) return notFound();

  return (
    <>
      <section
        className="py-20 text-white relative"
        style={{
          backgroundImage: `linear-gradient(rgba(61, 40, 20, 0.65), rgba(61, 40, 20, 0.65)), url(${category.bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container-x">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3">
            {category.name} Collection
          </h1>
          <p className="max-w-2xl text-white/90">{category.description}</p>
          <div className="mt-4 text-sm text-white/80">{category.products.length} products</div>
        </div>
      </section>

      <section className="container-x py-12 grid md:grid-cols-[240px_1fr] gap-8">
        {/* Filters (basic) */}
        <aside className="space-y-6">
          <div>
            <h3 className="font-semibold text-brand-900 mb-3">Price Range</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><label className="flex items-center gap-2"><input type="checkbox" />&lt; $500</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />$500 - $1000</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />$1000 - $2000</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />&gt; $2000</label></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-brand-900 mb-3">Material</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><label className="flex items-center gap-2"><input type="checkbox" />Fabric</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />Velvet</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />Leather / PU</label></li>
              <li><label className="flex items-center gap-2"><input type="checkbox" />Wood</label></li>
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {category.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </>
  );
}
