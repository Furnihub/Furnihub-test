// Admin · Users list
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">Users ({users.length})</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50">
            <tr className="text-left">
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Company</th>
              <th className="p-3">Country</th>
              <th className="p-3">Role</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3">{u.name || '—'}</td>
                <td className="p-3">{u.company || '—'}</td>
                <td className="p-3">{u.country}</td>
                <td className="p-3">
                  {u.role === 'admin' ? <span className="badge bg-brand-100 text-brand-700">Admin</span>
                                       : <span className="badge bg-gray-100 text-gray-600">Customer</span>}
                </td>
                <td className="p-3 text-gray-500 text-xs">{u.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
