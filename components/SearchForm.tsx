'use client';

import { useEffect, useState } from 'react';
import { addRecentSearch, getRecentSearches, getEntry, upsertEntry, listEntries, type RecentSearch } from '@/lib/client/store';
import type { DictEntryDTO } from '@/lib/types/rae';

export default function SearchForm() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [history, setHistory] = useState<Array<{ word: string; at: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DictEntryDTO | null>(null);

  useEffect(() => {
    setRecents(getRecentSearches());
    setHistory(listEntries().map((e) => ({ word: e.word, at: e.at })));
    const reset = () => {
      console.log('[SearchForm] reset event received');
      setQuery('');
      setSubmitted(null);
      setResult(null);
      setError(null);
      setLoading(false);
    };
    window.addEventListener('opendict:reset' as any, reset);
    return () => window.removeEventListener('opendict:reset' as any, reset);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!query.trim()) return;
    const q = query.trim();
    setSubmitted(q);
    addRecentSearch(q);
    setRecents(getRecentSearches());

    // Use cache first
    const cached = getEntry(q);
    if (cached) {
      console.log('[SearchForm] cache hit for', q);
      setResult(cached.data);
    }

    setLoading(true);
    try {
      console.log('[SearchForm] fetching /api/define?q=', q);
      const t0 = performance.now();
      const res = await fetch(`/api/define?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      console.log('[SearchForm] response status', res.status, 'for', q, 'in', (performance.now() - t0).toFixed(0) + 'ms');
      const data = await res.json();
      console.log('[SearchForm] response body sample', { ok: res.ok, keys: Object.keys(data || {}) });
      if (!res.ok || !data?.data) throw new Error(data?.error || 'Error al consultar');
      const payload = data.data;
      setResult(payload);
      upsertEntry(q, payload);
      setHistory(listEntries().map((e) => ({ word: e.word, at: e.at })));
    } catch (err: any) {
      console.error('[SearchForm] fetch error', err);
      if (!cached) setError(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe una palabra…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar palabra"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-3 font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!query.trim()}
        >
          Buscar
        </button>
      </form>

      <div className="mt-6">
        {!submitted && (
          <p className="text-sm text-slate-300">
            Tip: prueba con “epítome”, “paradoja” o “serendipia”.
          </p>
        )}
        {submitted && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-300">Resultados para</p>
                <h2 className="mt-1 text-xl font-semibold break-words">{submitted}</h2>
              </div>
              {loading && <span className="text-xs text-slate-400">Cargando…</span>}
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {!error && result && (
              <div className="mt-3 space-y-4">
                {result.senses?.length > 0 ? (
                  result.senses.map((s, i) => (
                    <div key={i} className="rounded-md bg-slate-800/60 p-3">
                      <div className="flex gap-2"><span className="text-slate-500">{i + 1}.</span><p className="flex-1">{s.text}</p></div>
                      {s.synonyms?.length > 0 && (
                        <p className="mt-2 text-sm text-slate-300">
                          Sinónimos: <span className="italic">{s.synonyms.slice(0, 8).join(', ')}</span>
                        </p>
                      )}
                      {s.examples && s.examples.length > 0 && (
                        <p className="mt-1 text-xs text-slate-400">Ej.: {s.examples[0]}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">Sin definiciones disponibles.</p>
                )}

                {result.etymology && (
                  <div className="rounded-md border border-slate-800 p-3 text-sm">
                    <p className="font-medium">Origen</p>
                    <p className="mt-1 text-slate-300">{result.etymology}</p>
                  </div>
                )}

                {result.conjugations && (
                  <div className="rounded-md border border-slate-800 p-3 text-sm">
                    <p className="font-medium">Conjugaciones (muestra)</p>
                    {/* No personales */}
                    {result.conjugations.non_personal && (
                      <div className="mt-2">
                        <p className="text-slate-300 mb-1">No personales</p>
                        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {Object.entries(result.conjugations.non_personal).map(([k, v]) => (
                            <li key={k} className="flex gap-2">
                              <span className="min-w-36 text-slate-500 capitalize">{labelNonPersonal(k)}</span>
                              <span className="flex-1">{v as string}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Indicativo */}
                    {(result.conjugations.indicative?.present || result.conjugations.indicative?.preterite) && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {result.conjugations.indicative?.present && (
                          <ConjTable title="Indicativo — Presente" table={result.conjugations.indicative.present} />
                        )}
                        {result.conjugations.indicative?.preterite && (
                          <ConjTable title="Indicativo — Pretérito" table={result.conjugations.indicative.preterite} />
                        )}
                      </div>
                    )}

                    {/* Subjuntivo */}
                    {result.conjugations.subjunctive?.present && (
                      <div className="mt-3">
                        <ConjTable title="Subjuntivo — Presente" table={result.conjugations.subjunctive.present} />
                      </div>
                    )}

                    {/* Imperativo */}
                    {result.conjugations.imperative && (
                      <div className="mt-3">
                        <ImperativeBlock data={result.conjugations.imperative as any} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {recents.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-slate-300">Búsquedas recientes</h3>
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <button
                  key={r.q}
                  type="button"
                  onClick={() => setQuery(r.q)}
                  className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200 shadow-sm hover:bg-slate-700"
                >
                  {r.q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-slate-300">Historial</h3>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 12).map((h) => (
                <button
                  key={h.word}
                  type="button"
                  onClick={() => {
                    setQuery(h.word);
                    setSubmitted(h.word);
                    const cached = getEntry(h.word);
                    if (cached) setResult(cached.data);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200 shadow-sm hover:bg-slate-700"
                >
                  {h.word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function labelNonPersonal(k: string) {
  switch (k) {
    case 'infinitive':
      return 'Infinitivo';
    case 'participle':
      return 'Participio';
    case 'gerund':
      return 'Gerundio';
    case 'compound_infinitive':
      return 'Infinitivo compuesto';
    case 'compound_gerund':
      return 'Gerundio compuesto';
    default:
      return k.replaceAll('_', ' ');
  }
}

function labelPerson(k: string) {
  switch (k) {
    case 'singular_first_person':
      return 'yo';
    case 'singular_second_person':
      return 'tú';
    case 'singular_formal_second_person':
      return 'usted';
    case 'singular_third_person':
      return 'él/ella';
    case 'plural_first_person':
      return 'nosotros';
    case 'plural_second_person':
      return 'vosotros';
    case 'plural_formal_second_person':
      return 'ustedes';
    case 'plural_third_person':
      return 'ellos/ellas';
    default:
      return k.replaceAll('_', ' ');
  }
}

function orderPersons(obj: Record<string, string>) {
  const order = [
    'singular_first_person',
    'singular_second_person',
    'singular_formal_second_person',
    'singular_third_person',
    'plural_first_person',
    'plural_second_person',
    'plural_formal_second_person',
    'plural_third_person',
  ];
  return order.filter((k) => obj[k]).map((k) => [k, obj[k]!] as const);
}

function ConjTable({ title, table }: { title: string; table: Record<string, string | undefined> }) {
  const rows = orderPersons(table as Record<string, string>);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md bg-slate-800/60 p-3">
      <p className="mb-2 font-medium">{title}</p>
      <ul className="space-y-1">
        {rows.map(([k, v]) => (
          <li key={k} className="flex gap-2">
            <span className="min-w-28 text-slate-500">{labelPerson(k)}</span>
            <span className="flex-1">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImperativeBlock({ data }: { data: Record<string, string> }) {
  const rows = orderPersons(data);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md bg-slate-800/60 p-3">
      <p className="mb-2 font-medium">Imperativo</p>
      <ul className="space-y-1">
        {rows.map(([k, v]) => (
          <li key={k} className="flex gap-2">
            <span className="min-w-28 text-slate-500">{labelPerson(k)}</span>
            <span className="flex-1">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
