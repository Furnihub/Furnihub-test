// Admin · Products list (read-only for V1.0 MVP)
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">Products ({products.length})</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50">
            <tr className="text-left">
              <th className="p-3">SKU</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">FOB</th>
              <th className="p-3">MOQ</th>
              <th className="p-3">CBM</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-gray-600">{p.category.name}</td>
                <td className="p-3 font-semibold">${p.fobPrice}</td>
                <td className="p-3">{p.moq}</td>
                <td className="p-3">{p.cbmPerPiece}</td>
                <td className="p-3">
                  {p.active ? <span className="badge bg-green-100 text-green-700">Active</span>
                            : <span className="badge bg-gray-100 text-gray-600">Inactive</span>}
                  {p.featured && <span className="badge bg-brand-100 text-brand-700 ml-1">Featured</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        V1.0 MVP: Read-only view · CRUD UI coming in V1.1
      </p>
    </div>
  );
}
