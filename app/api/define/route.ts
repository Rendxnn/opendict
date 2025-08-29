import { NextResponse } from 'next/server';
import type { RaeWordResponse, RaeMeaning, DictEntryDTO, DictSenseDTO } from '@/lib/types/rae';

export const dynamic = 'force-dynamic';

function simplify(meaning: RaeMeaning | undefined, fallbackWord: string): DictEntryDTO {
  const word = fallbackWord;
  const senses: DictSenseDTO[] = (meaning?.senses || [])
    .map((s) => ({
      text: s.description || s.raw || '',
      synonyms: Array.isArray(s.synonyms) ? s.synonyms.filter(Boolean) : [],
    }))
    .filter((s) => s.text)
    .slice(0, 3);

  const etymology = meaning?.origin?.raw || null;

  const cj = meaning?.conjugations || null;
  const conjugations = cj
    ? {
        non_personal: cj.non_personal,
        indicative: {
          present: cj.indicative?.present,
          preterite: cj.indicative?.preterite,
        },
        subjunctive: {
          present: cj.subjunctive?.present,
        },
        imperative: cj.imperative as any,
      }
    : null;

  return { word, senses, etymology, conjugations };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const base = process.env.RAE_API_BASE || 'https://rae-api.com/api/words';
  const url = `${base}/${encodeURIComponent(q)}`;

  try {
    console.log('[RAE] GET /api/define q=', q, '→', url);
    console.time(`[RAE] fetch ${q}`);
    const res = await fetch(url, {
      // If you have an API key, add here
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    console.timeEnd(`[RAE] fetch ${q}`);
    console.log('[RAE] upstream status', res.status, 'for', q);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[RAE] upstream error', res.status, text.slice(0, 200));
      return NextResponse.json({ error: 'Upstream error', status: res.status, body: text }, { status: 502 });
    }
    const json = (await res.json()) as RaeWordResponse | any;
    console.log('[RAE] upstream json keys', Object.keys(json || {}));
    const data = (json?.data || {}) as RaeWordResponse['data'];
    const word = (data?.word || q) as string;
    const firstMeaning = Array.isArray(data?.meanings) ? data.meanings[0] : undefined;
    const dto = simplify(firstMeaning, word);
    console.log('[RAE] dto', { word: dto.word, senses: dto.senses.length, hasEtym: !!dto.etymology });
    return NextResponse.json({ ok: true, word, data: dto });
  } catch (e: any) {
    console.error('[RAE] fetch error', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Fetch failed' }, { status: 500 });
  }
}
