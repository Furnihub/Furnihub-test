// Admin Config page · ContainerTypes + ServiceFeeTiers + OverboxRules (3 tabs in one page)
'use client';
import { useEffect, useState } from 'react';

type ContainerType = { id: string; code: string; name: string; internalLengthCm: number; internalWidthCm: number; internalHeightCm: number; nominalCbm: number; safetyUtilization: number; maxPayloadKg: number; sortOrder: number; active: boolean; };
type ServiceFeeTier = { id: string; name: string; minProductValue: number; maxProductValue: number | null; rate: number; note: string | null; active: boolean; };
type OverboxRule = { id: string; threshold: number; feePerCarton: number; note: string | null; active: boolean; };

type Tab = 'containers' | 'service-fees' | 'overbox';

export default function AdminConfigPage() {
  const [tab, setTab] = useState<Tab>('containers');
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-4">Config</h1>
      <div className="flex gap-2 border-b mb-4">
        <TabBtn current={tab} value="containers" setTab={setTab} label="Container types" />
        <TabBtn current={tab} value="service-fees" setTab={setTab} label="Service fee tiers" />
        <TabBtn current={tab} value="overbox" setTab={setTab} label="Overbox rule" />
      </div>
      {tab === 'containers' && <ContainerTypesPanel />}
      {tab === 'service-fees' && <ServiceFeesPanel />}
      {tab === 'overbox' && <OverboxPanel />}
    </div>
  );
}

function TabBtn({ current, value, setTab, label }: { current: Tab; value: Tab; setTab: (t: Tab) => void; label: string }) {
  const active = current === value;
  return (
    <button onClick={() => setTab(value)} className={`px-3 py-2 text-sm ${active ? 'border-b-2 border-brand-600 text-brand-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
      {label}
    </button>
  );
}

function ContainerTypesPanel() {
  const [items, setItems] = useState<ContainerType[]>([]);
  const [editing, setEditing] = useState<Partial<ContainerType> | null>(null);
  async function load() {
    const r = await fetch('/api/admin/config/container-types');
    const j = await r.json();
    setItems(j.items ?? []);
  }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    await fetch(isNew ? '/api/admin/config/container-types' : `/api/admin/config/container-types/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Delete?')) return;
    await fetch(`/api/admin/config/container-types/${id}`, { method: 'DELETE' });
    load();
  }
  const blank: Partial<ContainerType> = { code: '', name: '', internalLengthCm: 590, internalWidthCm: 235, internalHeightCm: 239, nominalCbm: 33, safetyUtilization: 90, maxPayloadKg: 26500, sortOrder: 0, active: true };
  return (
    <CrudPanel
      items={items} editing={editing} setEditing={setEditing}
      save={save} del={del} blank={blank}
      renderRow={(c) => (
        <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
          <td className="px-3 py-2 font-mono">{c.code}</td>
          <td className="px-3 py-2">{c.name}</td>
          <td className="px-3 py-2">{c.internalLengthCm}×{c.internalWidthCm}×{c.internalHeightCm} cm</td>
          <td className="px-3 py-2">{c.nominalCbm} CBM</td>
          <td className="px-3 py-2">{c.safetyUtilization}%</td>
          <td className="px-3 py-2">{c.maxPayloadKg} kg</td>
          <td className="px-3 py-2">{c.active ? '✓' : '—'}</td>
          <td className="px-3 py-2 text-right"><button onClick={() => setEditing({ ...c })} className="text-brand-700 hover:underline text-xs">Edit</button> <button onClick={() => del(c.id)} className="text-red-600 hover:underline text-xs ml-2">Delete</button></td>
        </tr>
      )}
      renderForm={() => editing && (
        <div className="p-6 grid grid-cols-2 gap-3 text-sm">
          <Field label="Code (unique)" required><input className="input" value={editing.code ?? ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></Field>
          <Field label="Name" required><input className="input" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Internal length (cm)" required><input type="number" className="input" value={editing.internalLengthCm ?? 0} onChange={(e) => setEditing({ ...editing, internalLengthCm: Number(e.target.value) })} /></Field>
          <Field label="Internal width (cm)" required><input type="number" className="input" value={editing.internalWidthCm ?? 0} onChange={(e) => setEditing({ ...editing, internalWidthCm: Number(e.target.value) })} /></Field>
          <Field label="Internal height (cm)" required><input type="number" className="input" value={editing.internalHeightCm ?? 0} onChange={(e) => setEditing({ ...editing, internalHeightCm: Number(e.target.value) })} /></Field>
          <Field label="Nominal CBM" required><input type="number" step="0.01" className="input" value={editing.nominalCbm ?? 0} onChange={(e) => setEditing({ ...editing, nominalCbm: Number(e.target.value) })} /></Field>
          <Field label="Safety utilization (%)"><input type="number" step="0.1" className="input" value={editing.safetyUtilization ?? 90} onChange={(e) => setEditing({ ...editing, safetyUtilization: Number(e.target.value) })} /></Field>
          <Field label="Max payload (kg)" required><input type="number" className="input" value={editing.maxPayloadKg ?? 0} onChange={(e) => setEditing({ ...editing, maxPayloadKg: Number(e.target.value) })} /></Field>
          <Field label="Sort order"><input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
          <Field label="Active"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.active ?? false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> active</label></Field>
        </div>
      )}
    />
  );
}

function ServiceFeesPanel() {
  const [items, setItems] = useState<ServiceFeeTier[]>([]);
  const [editing, setEditing] = useState<Partial<ServiceFeeTier> | null>(null);
  async function load() {
    const r = await fetch('/api/admin/config/service-fee-tiers');
    const j = await r.json();
    setItems(j.items ?? []);
  }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    await fetch(isNew ? '/api/admin/config/service-fee-tiers' : `/api/admin/config/service-fee-tiers/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
    });
    setEditing(null); load();
  }
  async function del(id: string) { if (!confirm('Delete?')) return; await fetch(`/api/admin/config/service-fee-tiers/${id}`, { method: 'DELETE' }); load(); }
  const blank: Partial<ServiceFeeTier> = { name: '', minProductValue: 0, maxProductValue: null, rate: 7, note: '', active: true };
  return (
    <CrudPanel
      items={items} editing={editing} setEditing={setEditing} save={save} del={del} blank={blank}
      renderRow={(t) => (
        <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
          <td className="px-3 py-2">{t.name}</td>
          <td className="px-3 py-2">${t.minProductValue}{t.maxProductValue != null ? ` - $${t.maxProductValue}` : ' +'}</td>
          <td className="px-3 py-2 font-medium">{t.rate}%</td>
          <td className="px-3 py-2 text-gray-600 text-xs">{t.note ?? ''}</td>
          <td className="px-3 py-2">{t.active ? '✓' : '—'}</td>
          <td className="px-3 py-2 text-right"><button onClick={() => setEditing({ ...t })} className="text-brand-700 hover:underline text-xs">Edit</button> <button onClick={() => del(t.id)} className="text-red-600 hover:underline text-xs ml-2">Delete</button></td>
        </tr>
      )}
      renderForm={() => editing && (
        <div className="p-6 grid grid-cols-2 gap-3 text-sm">
          <Field label="Tier name" required><input className="input" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Rate (%)" required><input type="number" step="0.01" className="input" value={editing.rate ?? 0} onChange={(e) => setEditing({ ...editing, rate: Number(e.target.value) })} /></Field>
          <Field label="Min product value ($)"><input type="number" className="input" value={editing.minProductValue ?? 0} onChange={(e) => setEditing({ ...editing, minProductValue: Number(e.target.value) })} /></Field>
          <Field label="Max product value ($) (blank = no upper limit)"><input type="number" className="input" value={editing.maxProductValue ?? ''} onChange={(e) => setEditing({ ...editing, maxProductValue: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
          <Field label="Note" colSpan={2}><input className="input" value={editing.note ?? ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></Field>
          <Field label="Active"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.active ?? false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> active</label></Field>
        </div>
      )}
    />
  );
}

function OverboxPanel() {
  const [items, setItems] = useState<OverboxRule[]>([]);
  const [editing, setEditing] = useState<Partial<OverboxRule> | null>(null);
  async function load() {
    const r = await fetch('/api/admin/config/overbox-rules');
    const j = await r.json();
    setItems(j.items ?? []);
  }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    await fetch(isNew ? '/api/admin/config/overbox-rules' : `/api/admin/config/overbox-rules/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
    });
    setEditing(null); load();
  }
  async function del(id: string) { if (!confirm('Delete?')) return; await fetch(`/api/admin/config/overbox-rules/${id}`, { method: 'DELETE' }); load(); }
  const blank: Partial<OverboxRule> = { threshold: 300, feePerCarton: 2, note: '', active: true };
  return (
    <CrudPanel
      items={items} editing={editing} setEditing={setEditing} save={save} del={del} blank={blank}
      renderRow={(o) => (
        <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
          <td className="px-3 py-2">{o.threshold} cartons</td>
          <td className="px-3 py-2 font-medium">${o.feePerCarton}/carton</td>
          <td className="px-3 py-2 text-gray-600 text-xs">{o.note ?? ''}</td>
          <td className="px-3 py-2">{o.active ? '✓' : '—'}</td>
          <td className="px-3 py-2 text-right"><button onClick={() => setEditing({ ...o })} className="text-brand-700 hover:underline text-xs">Edit</button> <button onClick={() => del(o.id)} className="text-red-600 hover:underline text-xs ml-2">Delete</button></td>
        </tr>
      )}
      renderForm={() => editing && (
        <div className="p-6 grid grid-cols-2 gap-3 text-sm">
          <Field label="Threshold (cartons)" required><input type="number" className="input" value={editing.threshold ?? 0} onChange={(e) => setEditing({ ...editing, threshold: Number(e.target.value) })} /></Field>
          <Field label="Fee per extra carton ($)" required><input type="number" step="0.01" className="input" value={editing.feePerCarton ?? 0} onChange={(e) => setEditing({ ...editing, feePerCarton: Number(e.target.value) })} /></Field>
          <Field label="Note" colSpan={2}><input className="input" value={editing.note ?? ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></Field>
          <Field label="Active"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.active ?? false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> active</label></Field>
        </div>
      )}
    />
  );
}

function CrudPanel<T>({ items, editing, setEditing, save, del, blank, renderRow, renderForm }: {
  items: T[]; editing: Partial<T> | null; setEditing: (e: Partial<T> | null) => void;
  save: () => Promise<void>; del: (id: string) => Promise<void>; blank: Partial<T>;
  renderRow: (item: T) => React.ReactNode; renderForm: () => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">{items.length} items</div>
        <button onClick={() => setEditing({ ...blank })} className="btn-primary text-sm">+ New</button>
      </div>
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
            <tr><th className="px-3 py-2">Info</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>{items.map(renderRow)}</tbody>
        </table>
        {items.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No items.</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 mb-12">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-display text-lg font-semibold">{(editing as { id?: string }).id ? 'Edit' : 'New'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500">✕</button>
            </div>
            {renderForm()}
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded border">Cancel</button>
              <button onClick={save} className="btn-primary text-sm">{(editing as { id?: string }).id ? 'Save' : 'Create'}</button>
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
