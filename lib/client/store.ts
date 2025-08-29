export type RecentSearch = { q: string; at: number };
export type Entry = { word: string; at: number; data: any };

const KEY_RECENTS = 'opendict:recents';
const KEY_ENTRIES = 'opendict:entries';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getRecentSearches(limit = 10): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  const arr = safeParse<RecentSearch[]>(localStorage.getItem(KEY_RECENTS), []);
  return arr.slice(0, limit);
}

export function addRecentSearch(q: string, limit = 10) {
  if (typeof window === 'undefined') return;
  const trimmed = q.trim();
  if (!trimmed) return;
  const now = Date.now();
  const current = safeParse<RecentSearch[]>(localStorage.getItem(KEY_RECENTS), []);
  const filtered = current.filter((r) => r.q.toLowerCase() !== trimmed.toLowerCase());
  const next = [{ q: trimmed, at: now }, ...filtered].slice(0, limit);
  localStorage.setItem(KEY_RECENTS, JSON.stringify(next));
}

export function upsertEntry(word: string, data: any, limit = 50) {
  if (typeof window === 'undefined') return;
  const key = word.trim().toLowerCase();
  const map: Record<string, Entry> = safeParse(localStorage.getItem(KEY_ENTRIES), {} as Record<string, Entry>);
  map[key] = { word: key, at: Date.now(), data };
  // Trim by most recent
  const sorted = Object.values(map).sort((a, b) => b.at - a.at).slice(0, limit);
  const next: Record<string, Entry> = {};
  for (const e of sorted) next[e.word] = e;
  localStorage.setItem(KEY_ENTRIES, JSON.stringify(next));
}

export function getEntry(word: string): Entry | null {
  if (typeof window === 'undefined') return null;
  const key = word.trim().toLowerCase();
  const map: Record<string, Entry> = safeParse(localStorage.getItem(KEY_ENTRIES), {} as Record<string, Entry>);
  return map[key] || null;
}

export function listEntries(): Entry[] {
  if (typeof window === 'undefined') return [];
  const map: Record<string, Entry> = safeParse(localStorage.getItem(KEY_ENTRIES), {} as Record<string, Entry>);
  return Object.values(map).sort((a, b) => b.at - a.at);
}
