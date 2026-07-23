'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Item = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  modelNo: string;
  image: string;
  unitFob: number;
  qty: number;
  cbmPerPiece: number;
  categorySlug: string;
};

type Props = {
  containerId: string;
  items: Item[];
  serviceRate: number;
  overboxThreshold: number;
  overboxAmount: number;
};

const CABINETS: Record<string, { name: string; maxCbm: number }> = {
  '20GP': { name: '20GP', maxCbm: 28 },
  '40GP': { name: '40GP', maxCbm: 58 },
  '40HQ': { name: '40HQ', maxCbm: 68 },
};

export default function ContainerView(props: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(props.items);
  const [cabinet, setCabinet] = useState<keyof typeof CABINETS>('40HQ');
  const [showInquiry, setShowInquiry] = useState(false);

  const stats = useMemo(() => {
    const totalPcs = items.reduce((s, i) => s + i.qty, 0);
    const totalCbm = items.reduce((s, i) => s + i.qty * i.cbmPerPiece, 0);
    const fobTotal = items.reduce((s, i) => s + i.qty * i.unitFob, 0);
    const cab = CABINETS[cabinet];
    const loadRate = Math.min(100, (totalCbm / cab.maxCbm) * 100);
    const serviceFee = fobTotal * props.serviceRate;
    const overbox = totalPcs > props.overboxThreshold
      ? (totalPcs - props.overboxThreshold) * props.overboxAmount
      : 0;
    let level: 'low' | 'good' | 'recommended' | 'premium' = 'low';
    let suggestion = 'Add more pieces to optimize · Save on shipping';
    if (loadRate >= 60 && loadRate < 80) { level = 'good'; suggestion = 'Good load rate · Ready to ship'; }
    else if (loadRate >= 80 && loadRate < 90) { level = 'recommended'; suggestion = 'Excellent load rate · Best value'; }
    else if (loadRate >= 90) { level = 'premium'; suggestion = 'Premium load · Try 40HQ for more space'; }
    return { totalPcs, totalCbm, fobTotal, loadRate, serviceFee, overbox, level, suggestion, cab };
  }, [items, cabinet, props.serviceRate, props.overboxThreshold, props.overboxAmount]);

  const colorByLevel = {
    low: 'bg-orange-200',
    good: 'bg-green-300',
    recommended: 'bg-blue-400',
    premium: 'bg-purple-500',
  }[stats.level];

  const updateQty = async (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(5, Math.min(999, item.qty + delta));
    setItems((arr) => arr.map((i) => (i.id === itemId ? { ...i, qty: newQty } : i)));
    await fetch('/api/container/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity: newQty }),
    });
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this product from your container?')) return;
    setItems((arr) => arr.filter((i) => i.id !== itemId));
    await fetch('/api/container/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Cabinet switcher + stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            {(Object.keys(CABINETS) as Array<keyof typeof CABINETS>).map((k) => (
              <button
                key={k}
                onClick={() => setCabinet(k)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  cabinet === k ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {CABINETS[k].name}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-brand-900">{stats.totalPcs}</span> pieces ·
            <span className="font-semibold text-brand-900"> {stats.totalCbm.toFixed(2)}</span> / {stats.cab.maxCbm} m³
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className={`h-full ${colorByLevel} transition-all`} style={{ width: `${stats.loadRate}%` }} />
        </div>
        <div className="mt-2 text-sm flex justify-between">
          <span className="text-gray-600">Load rate: <strong>{stats.loadRate.toFixed(0)}%</strong></span>
          <span className="text-brand-700">{stats.suggestion}</span>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-display text-xl font-semibold text-brand-900">Items in Container</h2>
        </div>
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📦</div>
            <div className="mb-4">Your container is empty</div>
            <Link href="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((i) => (
              <div key={i.id} className="p-5 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${i.categorySlug}/${i.sku}`} className="font-semibold text-brand-900 hover:underline block truncate">
                    {i.name}
                  </Link>
                  <div className="text-xs text-gray-500">{i.modelNo} · ${i.unitFob.toFixed(0)}/pc · {i.cbmPerPiece.toFixed(2)} m³/pc</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(i.id, -1)} className="w-8 h-8 border rounded">−</button>
                  <input
                    type="number"
                    value={i.qty}
                    onChange={async (e) => {
                      const v = parseInt(e.target.value) || 5;
                      const clamped = Math.max(5, Math.min(999, v));
                      setItems((arr) => arr.map((x) => (x.id === i.id ? { ...x, qty: clamped } : x)));
                      await fetch('/api/container/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId: i.id, quantity: clamped }),
                      });
                    }}
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <button onClick={() => updateQty(i.id, +1)} className="w-8 h-8 border rounded">+</button>
                </div>
                <div className="w-24 text-right font-semibold text-brand-700">
                  ${(i.qty * i.unitFob).toFixed(0)}
                </div>
                <button onClick={() => removeItem(i.id)} className="text-red-500 hover:text-red-700 ml-2" title="Remove">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service fee + overbox */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">FOB total</span>
            <span className="font-semibold">${stats.fobTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm" title="Includes sourcing · consolidation · quality control">
            <span className="text-gray-600">
              Furnihub Service Fee ({(props.serviceRate * 100).toFixed(0)}%)
              <span className="ml-1 text-xs text-gray-400 cursor-help">ⓘ</span>
            </span>
            <span className="font-semibold">${stats.serviceFee.toFixed(0)}</span>
          </div>
          {stats.overbox > 0 && (
            <div className="flex justify-between text-sm text-orange-700">
              <span>Bulk discount: +${props.overboxAmount}/box for &gt;{props.overboxThreshold} boxes ({stats.totalPcs - props.overboxThreshold} extra)</span>
              <span className="font-semibold">+${stats.overbox.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-3 text-lg font-semibold">
            <span className="text-brand-900">Estimated Total</span>
            <span className="text-brand-700">${(stats.fobTotal + stats.serviceFee + stats.overbox).toFixed(0)}</span>
          </div>
          <p className="text-xs text-gray-500">FOB excludes ocean shipping · Booking assistance available as added service</p>
        </div>
      )}

      {/* Inquiry CTA */}
      {items.length > 0 && (
        <div className="bg-brand-900 text-white rounded-lg p-8 text-center">
          <h2 className="font-display text-2xl mb-2">Ready to Source?</h2>
          <p className="text-brand-100 mb-6">
            {stats.loadRate >= 95
              ? 'Full container detected · Special pricing'
              : 'Less than full container · We\'ll find the best solution'}
          </p>
          <button onClick={() => setShowInquiry(true)} className="px-8 py-3 bg-white text-brand-700 font-semibold rounded hover:bg-brand-50">
            Request Quote for This Container
          </button>
        </div>
      )}

      {showInquiry && (
        <InquiryModal
          containerId={props.containerId}
          totalPcs={stats.totalPcs}
          totalCbm={stats.totalCbm}
          fobTotal={stats.fobTotal}
          serviceFee={stats.serviceFee}
          onClose={() => setShowInquiry(false)}
        />
      )}
    </div>
  );
}

function InquiryModal({ containerId, totalPcs, totalCbm, fobTotal, serviceFee, onClose }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, containerId, totalPcs, totalCbm, fobTotal, serviceFee }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else alert('Submission failed. Please try again.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-display text-xl font-semibold text-brand-900">Request a Quote</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        {done ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="text-xl font-semibold text-brand-900 mb-2">Quote Request Sent</h4>
            <p className="text-gray-600 mb-6">Our team will contact you within 24 hours.</p>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name *</label><input name="name" required className="input" /></div>
              <div><label className="label">Company *</label><input name="company" required className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Email *</label><input name="email" type="email" required className="input" /></div>
              <div><label className="label">Phone *</label><input name="phone" type="tel" required className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Country *</label><input name="country" required className="input" /></div>
              <div><label className="label">WhatsApp</label><input name="whatsapp" type="tel" className="input" /></div>
            </div>
            <div>
              <label className="label">Destination Port</label>
              <input name="destinationPort" className="input" placeholder="Los Angeles, USA (optional)" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea name="message" rows={3} className="input" maxLength={500} placeholder="Any specific requirements..."></textarea>
            </div>
            <div>
              <label className="label">Urgency</label>
              <select name="urgency" className="input" defaultValue="normal">
                <option value="urgent">Urgent (within 2 weeks)</option>
                <option value="normal">Normal (1-2 months)</option>
                <option value="planning">Planning (3+ months)</option>
              </select>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" required className="mt-1" />
              <span>I consent to Furnihub contacting me about this quote request.</span>
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Sending...' : 'Send Quote Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
