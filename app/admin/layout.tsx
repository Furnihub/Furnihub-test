// Admin layout · 鉴权 + 侧边栏
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/admin');
  if (user.role !== 'admin') redirect('/');
  return (
    <div className="container-x py-8 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1">
        <div className="font-display text-lg font-semibold text-brand-900 mb-3">Admin</div>
        <Link href="/admin" className="block px-3 py-2 rounded hover:bg-brand-50">📊 Dashboard</Link>
        <Link href="/admin/inquiries" className="block px-3 py-2 rounded hover:bg-brand-50">📨 Inquiries</Link>
        <Link href="/admin/products" className="block px-3 py-2 rounded hover:bg-brand-50">📦 Products</Link>
        <Link href="/admin/users" className="block px-3 py-2 rounded hover:bg-brand-50">👥 Users</Link>
      </aside>
      <main>{children}</main>
    </div>
  );
}
