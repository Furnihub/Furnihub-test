// Admin Users page · list + status toggle + role edit
'use client';
import { useEffect, useState } from 'react';

interface AdminUser { id: string; email: string; name: string | null; username: string | null;
  company: string | null; country: string; role: string; status: string;
  createdAt: string; phone: string | null; whatsapp: string | null; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      // We need a list endpoint; reuse a simple query via fetch
      const res = await fetch('/api/admin/users-list');
      if (!res.ok) throw new Error(`List endpoint not available (HTTP ${res.status})`);
      const json = await res.json();
      setUsers(json.users ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: Partial<AdminUser>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Patch failed'); return; }
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-4">Users</h1>
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
              <tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Company</th><th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Role</th><th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Joined</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2">{u.name ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{u.company ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{u.country}</td>
                  <td className="px-3 py-2">
                    <select className="text-xs border rounded px-1 py-0.5" value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="text-xs border rounded px-1 py-0.5" value={u.status} onChange={(e) => patch(u.id, { status: e.target.value })}>
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right"></td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No users.</div>}
        </div>
      )}
    </div>
  );
}
