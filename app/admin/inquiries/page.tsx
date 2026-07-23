// Admin Inquiries page · list + status update
'use client';
import { useEffect, useState } from 'react';

interface Inquiry { id: string; name: string; email: string; phone: string;
  company: string; country: string; destinationPort: string | null;
  message: string | null; urgency: string; status: string; createdAt: string; }

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inquiries');
      const json = await res.json();
      setItems(json.inquiries ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: Partial<Inquiry>) {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Patch failed'); return; }
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-4">Inquiries</h1>
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="bg-white border border-gray-200 rounded p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-600 text-sm">{i.company}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{i.country}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">{i.email} · {i.phone}{i.destinationPort ? ` → ${i.destinationPort}` : ''}</div>
                {i.message && <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">{i.message}</div>}
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <select className="border rounded px-2 py-1" value={i.status} onChange={(e) => patch(i.id, { status: e.target.value })}>
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="quoted">quoted</option>
                  <option value="closed">closed</option>
                </select>
                <select className="border rounded px-2 py-1" value={i.urgency} onChange={(e) => patch(i.id, { urgency: e.target.value })}>
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No inquiries yet.</div>}
        </div>
      )}
    </div>
  );
}
