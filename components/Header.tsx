import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container-x flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-600 rounded text-white font-bold flex items-center justify-center">F</div>
          <span className="font-display text-xl font-semibold text-brand-900">Furnihub</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <Link href="/products" className="hover:text-brand-700">Products</Link>
          <Link href="/container" className="hover:text-brand-700">MY Container</Link>
          <Link href="/about" className="hover:text-brand-700">About</Link>
          <Link href="/faq" className="hover:text-brand-700">FAQ</Link>
          <Link href="/insights" className="hover:text-brand-700">Insights</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm text-brand-700 hover:underline">Admin</Link>
              )}
              <Link href="/container" className="text-sm text-gray-700 hover:text-brand-700">MY Container</Link>
              <span className="text-sm text-gray-500 hidden sm:inline">{user.email}</span>
              <form action="/api/auth/logout" method="POST">
                <button className="text-sm text-gray-500 hover:text-red-600">Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-700 hover:text-brand-700">Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm py-2">Sign Up Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
