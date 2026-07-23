// Home page · 3 板块（H1 Hero / H2 品类 / H3 工厂+GEO）
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const [categories, user] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    getCurrentUser(),
  ]);
  const ctaPrimaryHref = user ? '/products' : '/signup';

  return (
    <>
      {/* H1 · Hero */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
        <div className="container-x py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs tracking-wider mb-5">
              INTEGRATED SOURCING · CHINA FACTORY DIRECT
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              5-Seat MOQ · Factory Direct FOB Pricing
            </h1>
            <p className="text-lg md:text-xl text-brand-50/90 mb-8 leading-relaxed max-w-xl">
              China furniture sourcing, streamlined. One partner · 5-piece minimum · FOB pricing ·
              no middlemen — just integrated service value.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={ctaPrimaryHref} className="px-8 py-4 bg-white text-brand-700 font-semibold rounded hover:bg-brand-50 transition">
                Start Sourcing
              </Link>
              <Link href="/products" className="px-8 py-4 border-2 border-white text-white font-semibold rounded hover:bg-white/10 transition">
                Explore Products
              </Link>
            </div>
            <div className="mt-10 flex gap-8 text-sm text-brand-50/80">
              <div><div className="text-2xl font-bold text-white">15+</div><div>Years OEM/ODM</div></div>
              <div><div className="text-2xl font-bold text-white">200+</div><div>SKUs</div></div>
              <div><div className="text-2xl font-bold text-white">5-pc</div><div>MOQ</div></div>
              <div><div className="text-2xl font-bold text-white">FOB</div><div>Pricing</div></div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-square bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/40 text-sm">
              Hero image · factory · 16:9
            </div>
          </div>
        </div>
      </section>

      {/* H2 · 品类展示引导区 */}
      <section className="container-x py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-brand-900 mb-3">
            Browse by Category
          </h2>
          <p className="text-gray-600">5 Furniture Categories · Direct from Factories</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products/${c.slug}`}
              className="card p-5 text-center group"
            >
              <div className="aspect-square bg-brand-100 rounded-lg mb-4 flex items-center justify-center text-brand-700 font-semibold group-hover:bg-brand-500 group-hover:text-white transition">
                {c.name}
              </div>
              <div className="font-semibold text-brand-900 mb-1">{c.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{c.description}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* H3 · 工厂展示 + GEO 文字 */}
      <section className="bg-white py-20">
        <div className="container-x">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-brand-900 mb-3">
            Our Manufacturing Capabilities
          </h2>
          <h3 className="text-xl text-brand-600 mb-8">
            China Furniture Factory · 15 Years OEM/ODM Experience
          </h3>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p>
                Furnihub partners with verified Chinese furniture factories spanning 15+ years of OEM/ODM
                manufacturing experience. Our integrated sourcing service consolidates production across
                multiple categories — modular sofas, upholstered beds, hybrid mattresses, cabinetry, and
                dining sets — delivering consistent quality with FOB pricing.
              </p>
              <p>
                Every factory in our network maintains ISO 9001 quality management, BSCI social compliance,
                and FSC-certified material sourcing. We perform in-line inspections at 30%, 70%, and 100%
                production stages, with third-party SGS testing available on request.
              </p>
              <p>
                Our consolidation service lets you mix SKUs across categories in a single 20GP / 40GP / 40HQ
                container — without the operational overhead of managing multiple suppliers. That's
                integrated service value, not just a middleman.
              </p>
              <p className="text-sm">
                <Link href="/about" className="text-brand-700 hover:underline">Learn more about our factories →</Link>
                {' · '}
                <Link href="/insights" className="text-brand-700 hover:underline">Read our sourcing insights →</Link>
                {' · '}
                <Link href="/products" className="text-brand-700 hover:underline">Browse the catalog →</Link>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CNC Cutting', type: 'machine' },
                { label: 'Upholstery Line', type: 'production' },
                { label: 'Foam Molding', type: 'production' },
                { label: 'Final QC', type: 'qc' },
              ].map((m, i) => (
                <div key={i} className="aspect-video bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 text-sm font-medium">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
