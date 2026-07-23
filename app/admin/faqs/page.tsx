// Admin FAQs page · list + create + edit + delete (with category support)
'use client';
import { useEffect, useState } from 'react';

interface Faq { id: string; question: string; answer: string; categoryId: string; category: { name: string; slug: string }; order: number; active: boolean; }
interface FaqCategory { id: string; slug: string; name: string; order: number; }

export default function AdminFaqsPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [cats, setCats] = useState<FaqCategory[]>([]);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faqs');
      const json = await res.json();
      setItems(json.faqs ?? []);
      setCats(json.categories ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const res = await fetch(isNew ? '/api/admin/faqs' : `/api/admin/faqs/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Save failed'); return; }
    setEditing(null);
    load();
  }
  async function del(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Delete failed'); return; }
    load();
  }

  const isNew = editing && !editing.id;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-brand-900">FAQs</h1>
        <button onClick={() => setEditing({ question: '', answer: '', categoryId: cats[0]?.id ?? '', order: 0, active: true })} className="btn-primary text-sm">+ New FAQ</button>
      </div>
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="space-y-2">
          {cats.map((cat) => {
            const catFaqs = items.filter((f) => f.categoryId === cat.id);
            return (
              <details key={cat.id} className="bg-white border border-gray-200 rounded" open>
                <summary className="px-4 py-2 font-medium cursor-pointer text-sm flex items-center justify-between">
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-500">{catFaqs.length} questions</span>
                </summary>
                <div className="border-t">
                  {catFaqs.map((f) => (
                    <div key={f.id} className="border-t border-gray-100 px-4 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{f.question}</div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{f.answer}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${f.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{f.active ? 'active' : 'off'}</span>
                        <button onClick={() => setEditing({ ...f })} className="text-brand-700 hover:underline">Edit</button>
                        <button onClick={() => del(f.id)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 mb-12">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-display text-lg font-semibold">{isNew ? 'New FAQ' : 'Edit FAQ'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-6 grid gap-4 text-sm">
              <Field label="Category" required>
                <select className="input" value={editing.categoryId ?? ''} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  <option value="">-- choose --</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Question" required><input className="input" value={editing.question ?? ''} onChange={(e) => setEditing({ ...editing, question: e.target.value })} /></Field>
              <Field label="Answer (Markdown)" required><textarea rows={6} className="input font-mono text-xs" value={editing.answer ?? ''} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Order"><input type="number" className="input" value={editing.order ?? 0} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
                <Field label="Status">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.active ?? false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
                </Field>
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded border">Cancel</button>
              <button onClick={save} className="btn-primary text-sm">{isNew ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</span>
      {children}
    </label>
  );
}
