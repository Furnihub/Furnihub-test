// FAQ · 简化版 — 显示 5 个分类 + 折叠
import { prisma } from '@/lib/db';
import FaqAccordion from '@/components/FaqAccordion';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const cats = await prisma.faqCategory.findMany({
    orderBy: { order: 'asc' },
    include: { faqs: { orderBy: { order: 'asc' } } },
  });

  // Default placeholder content for V1.0
  const defaultFaqs: Record<string, { q: string; a: string }[]> = {
    'pricing': [
      { q: 'What does FOB price include?', a: 'FOB price includes the product cost, our consolidation service, and QC. It excludes ocean shipping, destination port charges, and import duties.' },
      { q: 'Why is FOB price hidden until I sign in?', a: 'Pricing is reserved for registered business buyers to keep our B2B integrity and protect factory-direct relationships.' },
      { q: 'Can I get a price for custom specifications?', a: 'Yes. Submit a quote request with your specs and our team will respond within 24 hours.' },
    ],
    'service_fee': [
      { q: 'What is the Furnihub service fee?', a: 'A 5-10% fee on container FOB total, covering sourcing, consolidation, and quality control. Configured in admin · default 7%.' },
      { q: 'What is the minimum order quantity?', a: '5 pieces per SKU. This is enforced across the catalog to keep container utilization viable.' },
      { q: 'Can I order less than a full container?', a: 'Yes — we consolidate mixed SKUs into shared containers. We\'ll find the best available slot.' },
    ],
    'consolidation': [
      { q: 'How does consolidation work?', a: 'You add products from multiple categories to MY Container. We source them from partner factories, consolidate at our warehouse, and load one shared or dedicated container.' },
      { q: 'Can I see what fits in 20GP / 40GP / 40HQ?', a: 'Yes — MY Container shows live load rate based on your items\' CBM and the selected cabinet type.' },
      { q: 'How long does consolidation take?', a: 'Typical 30-45 days from order confirmation to FOB loading.' },
    ],
    'tariff': [
      { q: 'Are import duties included in FOB?', a: 'No. Duties are paid by the buyer in the destination country based on local tariff schedules.' },
      { q: 'Do you provide HS codes?', a: 'Yes — each product listing has HS code information available on request.' },
      { q: 'How does Section 301 / China-US tariff affect pricing?', a: 'FOB is quoted ex-factory. Tariff impact is buyer\'s responsibility — we can advise on mitigation strategies.' },
    ],
    'account': [
      { q: 'How do I create an account?', a: 'Click Sign Up on the top nav · fill email / company / country · instant access.' },
      { q: 'Is my registration auto-approved?', a: 'Yes — V1.0 auto-approves all business buyer registrations. Future versions may add manual review.' },
      { q: 'Can I delete my account?', a: 'Yes — contact support@furnihub.com to request account deletion.' },
    ],
  };

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-4xl font-semibold text-brand-900 mb-3">Frequently Asked Questions</h1>
      <p className="text-gray-600 mb-10">Everything you need to know about sourcing from Furnihub</p>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1 sticky top-20 self-start">
          {cats.map((c) => (
            <a key={c.id} href={`#${c.slug}`} className="block px-3 py-2 rounded hover:bg-brand-50 text-sm text-gray-700 hover:text-brand-700">
              {c.name}
            </a>
          ))}
        </aside>
        <div className="space-y-10">
          {cats.map((c) => {
            const items = c.faqs.length > 0 ? c.faqs.map((f) => ({ id: f.id, q: f.question, a: f.answer })) : (defaultFaqs[c.slug] || []).map((d, i) => ({ id: `default-${c.slug}-${i}`, q: d.q, a: d.a }));
            return (
              <section key={c.id} id={c.slug}>
                <h2 className="font-display text-2xl font-semibold text-brand-900 mb-4">{c.name}</h2>
                <FaqAccordion items={items} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
