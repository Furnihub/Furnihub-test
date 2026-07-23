import { prisma } from '@/lib/db';
import { signup } from './actions';

export const dynamic = 'force-dynamic';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand',
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Poland',
  'United Arab Emirates', 'Saudi Arabia', 'Singapore', 'Japan', 'South Korea',
  'Mexico', 'Brazil', 'Other',
];

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="container-x py-16 max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-2">Create Your Account</h1>
      <p className="text-gray-600 mb-8">Free registration · Instant access to FOB pricing & MY Container</p>

      {searchParams.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={signup} className="space-y-4 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <label className="label">Email *</label>
          <input name="email" type="email" required className="input" placeholder="you@company.com" />
        </div>
        <div>
          <label className="label">Password * <span className="text-gray-400 font-normal">(min 8 chars)</span></label>
          <input name="password" type="password" required minLength={8} className="input" />
        </div>
        <div>
          <label className="label">Your Name *</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Company *</label>
          <input name="company" required className="input" />
        </div>
        <div>
          <label className="label">Country *</label>
          <select name="country" required className="input" defaultValue="">
            <option value="" disabled>Select your country</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
          <input name="phone" type="tel" className="input" placeholder="+1-555-0100" />
        </div>
        <div>
          <label className="label">WhatsApp <span className="text-gray-400 font-normal">(optional)</span></label>
          <input name="whatsapp" type="tel" className="input" placeholder="+1-555-0100" />
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" required className="mt-1" />
          <span>I agree to Furnihub's terms of service and privacy policy.</span>
        </label>
        <button type="submit" className="btn-primary w-full">Create Account · Get FOB Access</button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account? <a href="/login" className="text-brand-700 underline">Sign in</a>
      </p>
    </div>
  );
}
