import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'OpenDict',
  description: 'Busca definiciones y aprende jugando.',
  themeColor: '#0ea5e9',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0b1220] text-slate-100">
        <div className="mx-auto w-full max-w-screen-md px-4 py-6 sm:py-8">
          <NavBar />
          <div className="pt-4 sm:pt-6">{children}</div>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
