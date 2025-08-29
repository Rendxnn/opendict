'use client';

import { useEffect, useMemo, useState } from 'react';
import { listEntries } from '@/lib/client/store';
import type { DictEntryDTO } from '@/lib/types/rae';
import ResetHomeLink from '@/components/ResetHomeLink';

type Option = { text: string; correct: boolean };
type Question = { word: string; options: Option[] };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isPlayableText(t?: string | null) {
  if (!t) return false;
  const s = t.trim();
  return s.length > 0 && !s.startsWith(':');
}

function pickSenseText(entry: { data: DictEntryDTO }): string | null {
  const senses = (entry.data?.senses || []).filter((s) => isPlayableText(s.text));
  if (!senses.length) return null;
  const i = Math.floor(Math.random() * Math.min(3, senses.length));
  const text = senses[i]?.text?.trim();
  return isPlayableText(text) ? (text as string) : null;
}

function hasPlayableSense(entry: { data: DictEntryDTO }) {
  return (entry.data?.senses || []).some((s) => isPlayableText(s.text));
}

function buildQuestion(entries: { word: string; data: DictEntryDTO }[], optionCount = 4): Question | null {
  const usable = entries.filter((e) => hasPlayableSense(e));
  if (usable.length < optionCount) return null;
  const target = usable[Math.floor(Math.random() * usable.length)];
  const correctText = pickSenseText(target as any);
  if (!correctText) return null;
  const distractPool = usable.filter((e) => e.word !== target.word);
  const options: Option[] = [{ text: correctText, correct: true }];
  const seen = new Set([correctText]);
  while (options.length < optionCount && distractPool.length) {
    const candidate = distractPool[Math.floor(Math.random() * distractPool.length)];
    const txt = pickSenseText(candidate as any);
    if (txt && !seen.has(txt)) {
      options.push({ text: txt, correct: false });
      seen.add(txt);
    }
    if (seen.size > 1000) break;
  }
  if (options.length < Math.min(optionCount, usable.length)) return null;
  return { word: target.word, options: shuffle(options) };
}

export default function PlayPage() {
  const [eligible, setEligible] = useState(false);
  const [entries, setEntries] = useState<Array<{ word: string; data: DictEntryDTO }>>([]);
  const [streak, setStreak] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState(0);

  useEffect(() => {
    const list = listEntries();
    const usable = list.filter((e) => hasPlayableSense(e as any)) as any;
    setEntries(usable);
    setEligible(usable.length >= 10);
    // Load stats
    try {
      const raw = localStorage.getItem('opendict:play');
      const obj = raw ? JSON.parse(raw) : {};
      setBest(Number(obj.bestStreak || 0));
      setAnswered(Number(obj.answered || 0));
    } catch {}
  }, []);

  useEffect(() => {
    if (!eligible) return;
    setQ(buildQuestion(entries as any));
    setPicked(null);
  }, [eligible, entries]);

  const correctIndex = useMemo(() => q?.options.findIndex((o) => o.correct) ?? -1, [q]);

  function next() {
    const nq = buildQuestion(entries as any);
    setQ(nq);
    setPicked(null);
  }

  function onPick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = q && q.options[i]?.correct;
    setAnswered((n) => {
      const next = n + 1;
      try {
        const raw = localStorage.getItem('opendict:play');
        const obj = raw ? JSON.parse(raw) : {};
        obj.answered = next;
        localStorage.setItem('opendict:play', JSON.stringify(obj));
      } catch {}
      return next;
    });
    if (ok) {
      setStreak((s) => {
        const next = s + 1;
        try {
          const raw = localStorage.getItem('opendict:play');
          const obj = raw ? JSON.parse(raw) : {};
          if (!obj.bestStreak || next > obj.bestStreak) {
            obj.bestStreak = next;
            localStorage.setItem('opendict:play', JSON.stringify(obj));
            setBest(next);
          }
        } catch {}
        return next;
      });
    } else {
      setStreak(0);
    }
  }

  if (!eligible) {
    return (
      <main className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Minijuego</h1>
          <ResetHomeLink className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 hover:bg-slate-700">Inicio</ResetHomeLink>
        </div>
        <p className="mt-3 text-slate-300">
          Necesitas al menos 10 palabras con definición en tu historial para jugar. Realiza más búsquedas y vuelve aquí.
        </p>
      </main>
    );
  }

  if (!q) {
    return (
      <main className="mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-semibold">Minijuego</h1>
        <p className="mt-3 text-slate-300">Preparando pregunta…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ResetHomeLink className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm hover:bg-slate-700">← Inicio</ResetHomeLink>
          <h1 className="text-2xl font-semibold">Minijuego</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1">Racha: {streak}</div>
          <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1">Mejor: {best}</div>
          <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1">Respondidas: {answered}</div>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <p className="text-sm text-slate-300">¿Cuál es la definición de:</p>
        <h2 className="mt-1 text-xl font-semibold break-words">{q.word}</h2>

        <div className="mt-4 space-y-2">
          {q.options.map((o, i) => {
            const isPicked = picked === i;
            const isCorrect = o.correct;
            const show = picked !== null;
            const base = 'w-full rounded-md border px-3 py-2 text-left transition-colors';
            const idle = 'border-slate-700 bg-slate-800 hover:bg-slate-700';
            const correct = 'border-green-700 bg-green-800/30';
            const wrong = 'border-red-700 bg-red-800/30';
            const cls = base + ' ' + (show ? (isCorrect ? correct : isPicked ? wrong : idle) : idle);
            return (
              <button key={i} className={cls} onClick={() => onPick(i)} disabled={picked !== null}>
                {o.text}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {q.options[picked].correct ? '¡Correcto!' : 'Incorrecto'}
            </p>
            <button onClick={next} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Siguiente
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
