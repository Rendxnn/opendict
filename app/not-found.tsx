export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl py-20 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-slate-300">La ruta solicitada no existe.</p>
      <a href="/" className="mt-6 inline-block rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Volver al inicio</a>
    </main>
  );
}

