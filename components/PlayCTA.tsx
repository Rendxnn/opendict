'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listEntries } from '@/lib/client/store';

export default function PlayCTA() {
  const [canPlay, setCanPlay] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      const e = listEntries();
      const usable = e.filter((x) => (x.data?.senses || []).some((s: any) => typeof s?.text === 'string' && !s.text.trim().startsWith(':')));
      setCount(usable.length);
      setCanPlay(usable.length >= 10);
    };
    update();
    window.addEventListener('opendict:entries-changed' as any, update);
    return () => window.removeEventListener('opendict:entries-changed' as any, update);
  }, []);
  return (
    <div className="mt-6 text-center">
      {canPlay ? (
        <Link href="/play" className="inline-block rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow hover:bg-sky-700">
          Jugar ahora
        </Link>
      ) : (
        <p className="text-sm text-slate-400">
          Busca al menos 10 palabras para desbloquear el modo de juego. ({count}/10)
        </p>
      )}
    </div>
  );
}
