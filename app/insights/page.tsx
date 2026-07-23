// Insights · GEO-friendly articles list
export default function InsightsPage() {
  const articles = [
    { slug: 'china-furniture-sourcing-guide', title: 'China Furniture Sourcing Guide for Overseas Buyers · 2026 Edition', date: '2026-07-15', excerpt: 'A complete walkthrough of sourcing furniture from China — factory selection, QC, consolidation, FOB vs EXW, payment terms, and common pitfalls.' },
    { slug: 'fob-vs-exw-explained', title: 'FOB vs EXW Pricing · What US/EU Buyers Need to Know', date: '2026-07-08', excerpt: 'Understanding the difference between FOB and EXW, who pays for what, and how to compare quotes from different Chinese suppliers.' },
    { slug: 'modular-sofa-oem-guide', title: 'Modular Sofa OEM · A Factory Owner\'s Perspective', date: '2026-06-30', excerpt: 'What modular sofa OEM really involves — frame construction, foam density, fabric sourcing, KD packaging, and the 5-piece MOQ rationale.' },
  ];

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-4xl font-semibold text-brand-900 mb-3">Insights & Guides</h1>
      <p className="text-gray-600 mb-10 max-w-2xl">
        Practical knowledge for furniture retailers sourcing from China. Written by people who\'ve spent
        years on the factory floor and in shipping containers.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((a) => (
          <article key={a.slug} className="card overflow-hidden hover:border-brand-500 transition cursor-pointer">
            <div className="aspect-video bg-brand-100 flex items-center justify-center text-brand-700 font-display text-lg">
              {a.title.split(' ').slice(0, 3).join(' ')}
            </div>
            <div className="p-5">
              <div className="text-xs text-gray-500 mb-2">{a.date}</div>
              <h2 className="font-display text-lg font-semibold text-brand-900 mb-2 line-clamp-2">{a.title}</h2>
              <p className="text-sm text-gray-600 line-clamp-3">{a.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
