import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Festy | Calendario de Cumpleaños & Galería Colaborativa',
  description: 'Celebra y recuerda cada cumpleaños especial. Comparte recuerdos, fotos y momentos inolvidables en tus círculos más cercanos.',
  keywords: ['cumpleaños', 'calendario', 'fotos', 'galería', 'celebración', 'festy'],
  authors: [{ name: 'Festy Team' }],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main id="app-root" style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
