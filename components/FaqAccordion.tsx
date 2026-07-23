'use client';
import { useState } from 'react';

type Item = { id: string; q: string; a: string };

export default function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
      {items.map((i) => {
        const isOpen = open === i.id;
        return (
          <div key={i.id}>
            <button
              onClick={() => setOpen(isOpen ? null : i.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-brand-900">{i.q}</span>
              <span className={`text-brand-700 transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-gray-700 leading-relaxed">{i.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
