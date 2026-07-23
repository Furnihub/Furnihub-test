// Admin Insights page · list + create + edit + delete (markdown body)
'use client';
import { useEffect, useState } from 'react';

interface Insight {
  id: string; title: string; slug: string; excerpt: string; body: string;
  heroImage: string | null; categoryId: string | null;
  publishedAt: string; readTime: number; author: string; authorCredentials: string | null;
  featured: boolean; active: boolean;
}
interface Category { id: string; name: string; }

const blank = { title: '', excerpt: '', body: '', heroImage: '', publishedAt: new Date().toISOString().slice(0, 10), readTime: 6, author: 'Furnihub Sourcing Team', featured: false, active: true };

export default function AdminInsightsPage() {
  const [items, setItems] = useState<Insight[]>([]);
  const [editing, setEditing] = useState<Partial<Insight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/insights');
      const json = await res.json();
      setItems(json.insights ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const res = await fetch(isNew ? '/api/admin/insights' : `/api/admin/insights/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Save failed'); return; }
    setEditing(null);
    load();
  }
  async function del(id: string) {
    if (!confirm('Delete this insight?')) return;
    const res = await fetch(`/api/admin/insights/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Delete failed'); return; }
    load();
  }

  const isNew = editing && !editing.id;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-brand-900">Insights</h1>
        <button onClick={() => setEditing({ ...blank })} className="btn-primary text-sm">+ New insight</button>
      </div>
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
              <tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Published</th><th className="px-3 py-2">Read</th>
                <th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">{i.title}</td>
                  <td className="px-3 py-2 text-gray-600">{i.author}</td>
                  <td className="px-3 py-2 text-gray-600">{new Date(i.publishedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{i.readTime}min</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${i.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {i.active ? 'published' : 'draft'}
                    </span>
                    {i.featured && <span className="ml-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">featured</span>}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button onClick={() => setEditing({ ...i, publishedAt: i.publishedAt.slice(0, 10) })} className="text-brand-700 hover:underline text-xs">Edit</button>
                    <button onClick={() => del(i.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No insights yet.</div>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 mb-12">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-display text-lg font-semibold">{isNew ? 'New insight' : 'Edit insight'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-6 grid gap-4 text-sm">
              <Field label="Title" required><input className="input" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="Slug"><input className="input" value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto from title" /></Field>
              <Field label="Excerpt (200-400 char)"><textarea rows={2} className="input" value={editing.excerpt ?? ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
              <Field label="Body (Markdown)"><textarea rows={10} className="input font-mono text-xs" value={editing.body ?? ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Hero image URL"><input className="input" value={editing.heroImage ?? ''} onChange={(e) => setEditing({ ...editing, heroImage: e.target.value })} /></Field>
                <Field label="Author"><input className="input" value={editing.author ?? ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></Field>
                <Field label="Author credentials"><input className="input" value={editing.authorCredentials ?? ''} onChange={(e) => setEditing({ ...editing, authorCredentials: e.target.value })} /></Field>
                <Field label="Publish date" required><input type="date" className="input" value={editing.publishedAt ?? ''} onChange={(e) => setEditing({ ...editing, publishedAt: e.target.value })} /></Field>
                <Field label="Read time (min)"><input type="number" className="input" value={editing.readTime ?? 6} onChange={(e) => setEditing({ ...editing, readTime: Number(e.target.value) })} /></Field>
              </div>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.active ?? false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Published</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.featured ?? false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured</label>
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
