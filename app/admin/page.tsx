// Admin dashboard
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [userCount, productCount, inquiryCount, newInquiries] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: 'new' } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-3xl font-bold text-brand-700 mt-1">{userCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-3xl font-bold text-brand-700 mt-1">{productCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">Total Inquiries</div>
          <div className="text-3xl font-bold text-brand-700 mt-1">{inquiryCount}</div>
        </div>
        <div className="card p-5 bg-orange-50 border-orange-200">
          <div className="text-sm text-orange-700">New Inquiries</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{newInquiries}</div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Link href="/admin/inquiries" className="btn-secondary text-center">Review Inquiries</Link>
          <Link href="/admin/products" className="btn-secondary text-center">Manage Products</Link>
          <Link href="/" className="btn-secondary text-center">View Live Site</Link>
        </div>
      </div>
    </div>
  );
}
