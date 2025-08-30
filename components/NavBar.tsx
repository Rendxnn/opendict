"use client";

import ResetHomeLink from '@/components/ResetHomeLink';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listEntries } from '@/lib/client/store';

export default function NavBar() {
  const [canPlay, setCanPlay] = useState(false);
  useEffect(() => {
    const update = () => {
      const entries = listEntries();
      const usable = entries.filter((e) => (e.data?.senses || []).some((s: any) => typeof s?.text === 'string' && !s.text.trim().startsWith(':')));
      setCanPlay(usable.length >= 10);
    };
    update();
    window.addEventListener('opendict:entries-changed' as any, update);
    return () => window.removeEventListener('opendict:entries-changed' as any, update);
  }, []);
  return (
    <header className="flex items-center justify-between gap-3">
      <ResetHomeLink className="font-semibold tracking-tight cursor-pointer select-none">
        OpenDict
      </ResetHomeLink>
      <nav className="flex items-center gap-3 text-sm text-slate-300">
        {canPlay ? (
          <Link href="/play" className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 hover:bg-slate-700">
            Jugar
          </Link>
        ) : (
          <span className="hidden sm:inline">Aprende jugando</span>
        )}
      </nav>
    </header>
  );
}
