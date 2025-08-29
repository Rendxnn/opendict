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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
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
