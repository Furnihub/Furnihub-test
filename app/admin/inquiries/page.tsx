// Admin · Inquiries list
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-orange-100 text-orange-700',
  contacted: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true, container: { include: { items: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">Inquiries ({inquiries.length})</h1>
      {inquiries.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No inquiries yet.</div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((i) => (
            <div key={i.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold text-brand-900">{i.name} · {i.company}</div>
                  <div className="text-sm text-gray-600">{i.email} · {i.phone} · {i.country}</div>
                </div>
                <span className={`badge ${STATUS_BADGE[i.status] || 'bg-gray-100'}`}>{i.status}</span>
              </div>
              {i.destinationPort && (
                <div className="text-sm text-gray-600">📍 Destination: {i.destinationPort}</div>
              )}
              {i.container && (
                <div className="text-sm text-gray-600">
                  📦 Container: {i.container.items.length} items · {i.container.items.reduce((s, x) => s + x.quantity, 0)} pieces
                </div>
              )}
              {i.message && (
                <div className="mt-2 text-sm text-gray-700 italic border-l-2 border-brand-200 pl-3">"{i.message}"</div>
              )}
              <div className="mt-3 text-xs text-gray-400">
                Submitted {i.createdAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
