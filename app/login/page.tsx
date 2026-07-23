import { login } from './actions';

export const dynamic = 'force-dynamic';

export default function LoginPage({ searchParams }: { searchParams: { error?: string; redirect?: string } }) {
  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-2">Sign In</h1>
      <p className="text-gray-600 mb-8">Access your MY Container and FOB pricing</p>

      {searchParams.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={login} className="space-y-4 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <input type="hidden" name="redirect" value={searchParams.redirect || '/container'} />
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" required className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">Sign In</button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        No account yet? <a href="/signup" className="text-brand-700 underline">Sign up free</a>
      </p>

      <div className="mt-10 p-4 bg-gray-50 rounded text-xs text-gray-600">
        <div className="font-semibold text-gray-800 mb-2">Demo accounts (V1.0 testing):</div>
        <div>Customer: <code>demo@buyer.com</code> / <code>demo1234</code></div>
        <div>Admin: <code>admin@furnihub.local</code> / <code>admin123</code></div>
      </div>
    </div>
  );
}
