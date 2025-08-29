import SearchForm from '../components/SearchForm';
import PlayCTA from '@/components/PlayCTA';
import ResetHomeLink from '@/components/ResetHomeLink';

export default function HomePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="text-center">
        <ResetHomeLink className="inline-block cursor-pointer select-none">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">OpenDict</h1>
        </ResetHomeLink>
        <p className="mt-2 text-slate-300">Busca definiciones y aprende jugando.</p>
      </div>

      <div className="mt-8 w-full">
        <SearchForm />
      </div>

      <PlayCTA />
    </main>
  );
}
