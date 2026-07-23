// PDP · /products/[category]/[sku]
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import AddToContainer from '@/components/AddToContainer';

export const dynamic = 'force-dynamic';

export default async function PDPPage({ params }: { params: { category: string; sku: string } }) {
  const [product, user] = await Promise.all([
    prisma.product.findUnique({
      where: { sku: params.sku },
      include: { category: true },
    }),
    getCurrentUser(),
  ]);

  if (!product || product.category.slug !== params.category) return notFound();

  const images: string[] = JSON.parse(product.images || '[]');
  const colors: { name: string; hex: string }[] = JSON.parse(product.colors || '[]');
  const specs: Record<string, string> = JSON.parse(product.specs || '{}');
  const application: string[] = JSON.parse(product.application || '[]');

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, active: true, id: { not: product.id } },
    take: 4,
    include: { category: true },
  });

  return (
    <div className="container-x py-10">
      <div className="text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-brand-700">Home</a> /
        <a href="/products" className="hover:text-brand-700"> Products</a> /
        <a href={`/products/${product.category.slug}`} className="hover:text-brand-700"> {product.category.name}</a> /
        <span className="text-gray-700"> {product.modelNo}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
            {images[0] && <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((src, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                  <img src={src} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-sm text-gray-500 mb-1">{product.productType} · {product.modelNo}</div>
          <h1 className="font-display text-3xl font-semibold text-brand-900 mb-3">{product.name}</h1>

          <div className="flex flex-wrap gap-2 mb-5">
            {application.map((a) => (
              <span key={a} className="badge bg-brand-50 text-brand-700">{a}</span>
            ))}
          </div>

          {/* Price · 注册前不显示 */}
          {user ? (
            <div className="mb-5">
              <div className="text-3xl font-bold text-brand-700">${product.fobPrice.toFixed(0)}</div>
              <div className="text-xs text-gray-500 mt-1">FOB price · excludes ocean shipping</div>
            </div>
          ) : (
            <div className="mb-5 p-4 bg-brand-50 rounded border border-brand-100">
              <div className="text-brand-700 font-medium">Sign in to see price</div>
              <div className="text-xs text-gray-600 mt-1">FOB pricing available to registered buyers · <a href="/signup" className="text-brand-700 underline">Sign up free</a></div>
            </div>
          )}

          <div className="mb-5 text-sm">
            <span className="font-semibold text-brand-900">Minimum Order: {product.moq} pieces</span>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-6">
              <div className="label">Available Colors</div>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <div key={c.name} title={c.name} className="w-9 h-9 rounded-full border-2 border-gray-200" style={{ background: c.hex }} />
                ))}
              </div>
            </div>
          )}

          <AddToContainer productId={product.id} moq={product.moq} isAuthed={!!user} />
        </div>
      </div>

      {/* Tabs (simplified) */}
      <div className="border-t border-gray-200 pt-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900 mb-3">Specifications</h2>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(specs).map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-2 text-gray-500 w-1/2">{k}</td>
                    <td className="py-2 text-gray-800">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 p-6 bg-brand-50 rounded-lg text-center">
          <div className="text-lg font-semibold text-brand-900 mb-1">Need bulk pricing? Contact us</div>
          <div className="text-sm text-gray-600 mb-3">Our team replies within 24 hours · WhatsApp / email available</div>
          <a href="/container" className="btn-primary">Go to MY Container</a>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-brand-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <a key={p.id} href={`/products/${p.category.slug}/${p.sku}`} className="card overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  <img src={(JSON.parse(p.images || '[]')[0])} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="font-medium text-brand-900 text-sm line-clamp-2">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.modelNo}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
