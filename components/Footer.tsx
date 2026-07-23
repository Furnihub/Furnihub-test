import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-50 mt-20">
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display text-lg mb-3">Furnihub</div>
          <p className="text-brand-100/80 leading-relaxed">
            Integrated furniture sourcing · 5-piece MOQ · FOB pricing · Direct from factories
          </p>
        </div>
        <div>
          <div className="font-semibold mb-3">Browse</div>
          <ul className="space-y-2 text-brand-100/80">
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products/sofa">Sofa</Link></li>
            <li><Link href="/products/bed">Bed</Link></li>
            <li><Link href="/products/mattress">Mattress</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Sourcing</div>
          <ul className="space-y-2 text-brand-100/80">
            <li><Link href="/container">MY Container</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/about">About Us</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-brand-100/80">
            <li>WhatsApp: +86-...</li>
            <li>Email: hello@furnihub.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-700 py-4 text-center text-xs text-brand-100/60">
        © 2026 Furnihub · A Kunhe & Co. venture · All rights reserved.
      </div>
    </footer>
  );
}
