// Admin Products page · list + create + edit + delete
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: string; sku: string; name: string; slug: string | null;
  categoryId: string; category: { name: string; slug: string };
  productType: string; fobPrice: number; moq: number; cbmPerPiece: number;
  featured: boolean; active: boolean; imageUrl: string | null;
  cartonCbm: number; cartonLengthCm: number; cartonWidthCm: number; cartonHeightCm: number;
  grossWeightKg: number; unitsPerCarton: number; cartonsPerUnit: number;
  stackable: boolean; maxStackLayers: number; rotatable: boolean; fragile: boolean;
  description: string; shortDescription: string | null;
  material: string | null; style: string | null; leadTime: string | null;
  assembly: string | null; seating: number; weightCapacity: string | null;
}
interface Category { id: string; name: string; slug: string; }

const blankProduct: Partial<Product> = {
  sku: '', name: '', slug: '', productType: 'Sofa', fobPrice: 0, moq: 5, cbmPerPiece: 0.35,
  featured: false, active: true, cartonCbm: 0.35, cartonLengthCm: 100, cartonWidthCm: 70, cartonHeightCm: 50,
  grossWeightKg: 25, unitsPerCarton: 1, cartonsPerUnit: 1, stackable: true, maxStackLayers: 2,
  rotatable: true, fragile: false, description: '', shortDescription: '', material: '',
  style: '', leadTime: '30-45 days', assembly: 'KD', seating: 1, weightCapacity: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(search)}`);
      const json = await res.json();
      setProducts(json.products ?? []);
      const catsRes = await fetch('/api/categories');
      const catsJson = await catsRes.json();
      setCategories(catsJson.categories ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/products' : `/api/admin/products/${editing.id}`;
    const method = isNew ? 'POST' : 'PATCH';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Save failed'); return; }
    setEditing(null);
    load();
  }
  async function del(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Delete failed'); return; }
    load();
  }

  const editingIsNew = editing && !editing.id;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-brand-900">Products</h1>
        <button onClick={() => setEditing({ ...blankProduct })} className="btn-primary text-sm">+ New product</button>
      </div>
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        onBlur={load} placeholder="Search SKU / name / model"
        className="input mb-3 w-full max-w-md"
      />
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
              <tr><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">FOB $</th><th className="px-3 py-2">MOQ</th><th className="px-3 py-2">CBM</th>
                <th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-gray-600">{p.category?.name}</td>
                  <td className="px-3 py-2 text-right">${p.fobPrice}</td>
                  <td className="px-3 py-2">{p.moq}</td>
                  <td className="px-3 py-2">{p.cbmPerPiece.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {p.active ? 'active' : 'off'}
                    </span>
                    {p.featured && <span className="ml-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">featured</span>}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button onClick={() => setEditing({ ...p })} className="text-brand-700 hover:underline text-xs">Edit</button>
                    <Link href={`/products/${p.category?.slug ?? 'sofa'}/${p.slug ?? p.sku}`} target="_blank" className="text-gray-500 hover:underline text-xs">View</Link>
                    <button onClick={() => del(p.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No products found.</div>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 mb-12">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-display text-lg font-semibold">{editingIsNew ? 'New product' : 'Edit product'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <Field label="SKU" required><input className="input" value={editing.sku ?? ''} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} /></Field>
              <Field label="Slug" ><input className="input" value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Name" required><input className="input col-span-1" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Category" required>
                <select className="input" value={editing.categoryId ?? ''} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  <option value="">-- choose --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Short description"><input className="input" value={editing.shortDescription ?? ''} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} /></Field>
              <Field label="Product type"><input className="input" value={editing.productType ?? ''} onChange={(e) => setEditing({ ...editing, productType: e.target.value })} /></Field>
              <Field label="FOB price (USD)" required><input type="number" className="input" value={editing.fobPrice ?? 0} onChange={(e) => setEditing({ ...editing, fobPrice: Number(e.target.value) })} /></Field>
              <Field label="MOQ (≥5)"><input type="number" min={5} className="input" value={editing.moq ?? 5} onChange={(e) => setEditing({ ...editing, moq: Number(e.target.value) })} /></Field>
              <Field label="CBM per piece"><input type="number" step="0.001" className="input" value={editing.cbmPerPiece ?? 0} onChange={(e) => setEditing({ ...editing, cbmPerPiece: Number(e.target.value) })} /></Field>
              <Field label="Material"><input className="input" value={editing.material ?? ''} onChange={(e) => setEditing({ ...editing, material: e.target.value })} /></Field>
              <Field label="Style"><input className="input" value={editing.style ?? ''} onChange={(e) => setEditing({ ...editing, style: e.target.value })} /></Field>
              <Field label="Lead time"><input className="input" value={editing.leadTime ?? ''} onChange={(e) => setEditing({ ...editing, leadTime: e.target.value })} /></Field>
              <Field label="Description" colSpan={2}>
                <textarea rows={3} className="input" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>

              <div className="col-span-2 mt-2 text-xs text-gray-500 font-medium">Carton / packing</div>
              <Field label="Carton CBM"><input type="number" step="0.001" className="input" value={editing.cartonCbm ?? 0} onChange={(e) => setEditing({ ...editing, cartonCbm: Number(e.target.value) })} /></Field>
              <Field label="Units / carton"><input type="number" className="input" value={editing.unitsPerCarton ?? 1} onChange={(e) => setEditing({ ...editing, unitsPerCarton: Number(e.target.value) })} /></Field>
              <Field label="Cartons / unit"><input type="number" className="input" value={editing.cartonsPerUnit ?? 1} onChange={(e) => setEditing({ ...editing, cartonsPerUnit: Number(e.target.value) })} /></Field>
              <Field label="Length (cm)"><input type="number" step="0.1" className="input" value={editing.cartonLengthCm ?? 0} onChange={(e) => setEditing({ ...editing, cartonLengthCm: Number(e.target.value) })} /></Field>
              <Field label="Width (cm)"><input type="number" step="0.1" className="input" value={editing.cartonWidthCm ?? 0} onChange={(e) => setEditing({ ...editing, cartonWidthCm: Number(e.target.value) })} /></Field>
              <Field label="Height (cm)"><input type="number" step="0.1" className="input" value={editing.cartonHeightCm ?? 0} onChange={(e) => setEditing({ ...editing, cartonHeightCm: Number(e.target.value) })} /></Field>
              <Field label="Gross weight (kg)"><input type="number" step="0.1" className="input" value={editing.grossWeightKg ?? 0} onChange={(e) => setEditing({ ...editing, grossWeightKg: Number(e.target.value) })} /></Field>
              <Field label="Max stack layers"><input type="number" className="input" value={editing.maxStackLayers ?? 2} onChange={(e) => setEditing({ ...editing, maxStackLayers: Number(e.target.value) })} /></Field>
              <Field label="Seating"><input type="number" className="input" value={editing.seating ?? 1} onChange={(e) => setEditing({ ...editing, seating: Number(e.target.value) })} /></Field>
              <Field label="Weight capacity"><input className="input" value={editing.weightCapacity ?? ''} onChange={(e) => setEditing({ ...editing, weightCapacity: e.target.value })} /></Field>
              <Field label="Assembly"><input className="input" value={editing.assembly ?? ''} onChange={(e) => setEditing({ ...editing, assembly: e.target.value })} /></Field>

              <Field label="Image URL"><input className="input col-span-1" value={editing.imageUrl ?? ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} /></Field>
              <Field label="Hero image preview">
                {editing.imageUrl ? <img src={editing.imageUrl} alt="" className="h-16 object-contain border rounded" /> : <div className="text-gray-400 text-xs">no image</div>}
              </Field>

              <div className="col-span-2 flex flex-wrap gap-4 text-sm mt-2">
                <Toggle label="Active" value={editing.active ?? false} onChange={(v) => setEditing({ ...editing, active: v })} />
                <Toggle label="Featured" value={editing.featured ?? false} onChange={(v) => setEditing({ ...editing, featured: v })} />
                <Toggle label="Stackable" value={editing.stackable ?? false} onChange={(v) => setEditing({ ...editing, stackable: v })} />
                <Toggle label="Rotatable" value={editing.rotatable ?? false} onChange={(v) => setEditing({ ...editing, rotatable: v })} />
                <Toggle label="Fragile" value={editing.fragile ?? false} onChange={(v) => setEditing({ ...editing, fragile: v })} />
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded border">Cancel</button>
              <button onClick={save} className="btn-primary text-sm">{editingIsNew ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, colSpan, children }: { label: string; required?: boolean; colSpan?: number; children: React.ReactNode }) {
  return (
    <label className={`block ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <span className="block text-xs text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</span>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      <span>{label}</span>
    </label>
  );
}
