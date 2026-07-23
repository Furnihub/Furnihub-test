// Products Hub · /products
import Link from 'next/link';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function ProductsHubPage() {
  const [categories, featured, scenes] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.product.findMany({ where: { featured: true, active: true }, take: 8, include: { category: true } }),
    Promise.resolve([
      { name: 'Living Room', slug: 'sofa' },
      { name: 'Bedroom', slug: 'bed' },
      { name: 'Dining Room', slug: 'table-chair' },
      { name: 'Office', slug: 'table-chair' },
      { name: 'Hotel', slug: 'mattress' },
    ]),
  ]);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-50 to-brand-100 py-16">
        <div className="container-x">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-brand-900 mb-3">
            All Furniture Categories
          </h1>
          <p className="text-gray-700">Browse our complete catalog · 5-piece MOQ · FOB pricing</p>
        </div>
      </section>

      <section className="container-x py-16">
        <h2 className="font-display text-2xl font-semibold text-brand-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products/${c.slug}`}
              className="card overflow-hidden group"
            >
              <div className="aspect-square bg-brand-100 flex items-center justify-center text-brand-700 font-semibold group-hover:bg-brand-500 group-hover:text-white transition">
                {c.name}
              </div>
              <div className="p-4">
                <div className="font-semibold text-brand-900">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1">{c.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <h2 className="font-display text-2xl font-semibold text-brand-900 mb-6">Featured Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container-x pb-20">
        <h2 className="font-display text-2xl font-semibold text-brand-900 mb-6">Shop by Scene</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {scenes.map((s) => (
            <Link
              key={s.slug + s.name}
              href={`/products/${s.slug}`}
              className="card p-5 text-center hover:border-brand-500 transition"
            >
              <div className="text-3xl mb-2">🏠</div>
              <div className="font-medium text-brand-900">{s.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
