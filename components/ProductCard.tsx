import Link from 'next/link';
import type { Product, Category } from '@prisma/client';

type ProductWithCat = Product & { category: Category };

export default function ProductCard({ product }: { product: ProductWithCat }) {
  const images: string[] = JSON.parse(product.images || '[]');
  const cover = images[0] || `https://placehold.co/600x450/a37547/ffffff?text=${product.sku}`;
  return (
    <Link
      href={`/products/${product.category.slug}/${product.sku}`}
      className="card overflow-hidden group"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={cover}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.modelNo}</div>
        <div className="font-semibold text-brand-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">MOQ {product.moq} pcs</span>
          <span className="badge bg-brand-100 text-brand-700">FOB</span>
        </div>
      </div>
    </Link>
  );
}
