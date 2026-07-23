'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToContainer({ productId, moq, isAuthed }: { productId: string; moq: number; isAuthed: boolean }) {
  const router = useRouter();
  const [qty, setQty] = useState(moq);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const valid = qty >= moq;

  const handleAdd = async () => {
    if (!isAuthed) { router.push('/signup'); return; }
    if (!valid) { setMsg(`Minimum ${moq} pieces`); return; }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch('/api/container/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg('✓ Added to MY Container');
      setTimeout(() => router.push('/container'), 600);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <label className="label mb-0">Quantity</label>
        <button onClick={() => setQty(q => Math.max(moq, q - 1))} className="w-9 h-9 border rounded">−</button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value) || moq)}
          min={moq}
          className="w-20 px-3 py-2 border rounded text-center"
        />
        <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 border rounded">+</button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="btn-primary w-full text-base"
      >
        {loading ? 'Adding...' : isAuthed ? 'Add to MY Container' : 'Sign in to Add'}
      </button>
      {msg && <div className="mt-2 text-sm text-brand-700">{msg}</div>}
    </div>
  );
}
