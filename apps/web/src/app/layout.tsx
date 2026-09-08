import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Festy | Calendario de Cumpleaños & Galería Colaborativa',
  description: 'Celebra y recuerda cada cumpleaños especial. Comparte recuerdos, fotos y momentos inolvidables en tus círculos más cercanos.',
  keywords: ['cumpleaños', 'calendario', 'fotos', 'galería', 'celebración', 'festy'],
  authors: [{ name: 'Festy Team' }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header className="navbar" id="main-navbar">
          <div className="nav-brand">
            <span style={{ fontSize: '1.8rem' }}>🎂</span>
            <span className="gradient-text">Festy</span>
            <span className="nav-badge">v2.3</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="btn-secondary" id="btn-circles">
              👥 Círculos
            </button>
            <button className="btn-primary" id="btn-new-birthday">
              ✨ Nuevo Cumpleaños
            </button>
          </nav>
        </header>

        <main id="app-root">
          {children}
        </main>
      </body>
    </html>
  );
}
