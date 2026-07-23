// Admin layout · 鉴权 + 侧边栏 (V2.0: 补全 modules)
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/admin');
  if (user.role !== 'admin') redirect('/');
  return (
    <div className="container-x py-8 grid md:grid-cols-[240px_1fr] gap-8">
      <aside className="space-y-1">
        <div className="font-display text-lg font-semibold text-brand-900 mb-3">Admin</div>
        <NavLink href="/admin" label="📊 Dashboard" />
        <NavLink href="/admin/products" label="📦 Products" />
        <NavLink href="/admin/categories" label="🗂 Categories" />
        <NavLink href="/admin/insights" label="💡 Insights" />
        <NavLink href="/admin/faqs" label="❓ FAQs" />
        <NavLink href="/admin/users" label="👥 Users" />
        <NavLink href="/admin/inquiries" label="📨 Inquiries" />
        <NavLink href="/admin/quotes" label="📋 Quotes" />
        <NavLink href="/admin/containers" label="📐 Containers" />
        <NavLink href="/admin/config" label="⚙️ Config" />
        <NavLink href="/admin/factories" label="🏭 Factories" />
        <Link href="/" className="block px-3 py-2 rounded text-xs text-gray-500 mt-4">← Back to site</Link>
      </aside>
      <main>{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-3 py-2 rounded hover:bg-brand-50 text-sm text-gray-700">
      {label}
    </Link>
  );
}
