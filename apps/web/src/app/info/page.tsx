'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Camera,
  Heart,
  ShieldCheck,
  Bell,
  Users,
  Sparkles,
  ArrowRight,
  Gift,
  Cake,
  CheckCircle2,
  Smile,
  PartyPopper,
  Image as ImageIcon,
  Star,
} from 'lucide-react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

export default function InfoPage() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [activeTabPreview, setActiveTabPreview] = useState<'calendar' | 'photos'>('calendar');
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  useEffect(() => {
    setIsAuth(Boolean(getToken()));
  }, []);

  const triggerConfetti = () => {
    const colors = ['#9061F9', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#F472B6'];
    const newPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() * 40 - 20),
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.floor(Math.random() * 10) + 6,
      angle: Math.random() * 360,
      speed: Math.random() * 3 + 2,
    }));
    setConfetti(newPieces);
    setTimeout(() => setConfetti([]), 2500);
  };

  return (
    <div className="main-container" style={{ maxWidth: '1140px', paddingBottom: '70px', position: 'relative' }}>
      {/* Background Animated Floating Blobs */}
      <div className="bg-floating-blobs" aria-hidden="true">
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />
        <div className="floating-blob blob-3" />
      </div>

      {/* Hero Section */}
      <section
        className="hero-glass-container"
        style={{
          padding: '60px 32px 54px',
          textAlign: 'center',
          marginBottom: '56px',
          position: 'relative',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 243, 255, 0.92) 100%)',
          border: '1px solid rgba(221, 214, 254, 0.7)',
          boxShadow: '0 25px 60px -15px rgba(144, 97, 249, 0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Floating Celebration Particles in Hero */}
        <div className="floating-particle particle-balloon">🎈</div>
        <div className="floating-particle particle-cake">🎂</div>
        <div className="floating-particle particle-gift">🎁</div>
        <div className="floating-particle particle-star">⭐</div>
        <div className="floating-particle particle-heart">💖</div>
        <div className="floating-particle particle-sparkle">✨</div>

        {/* Hero Interactive Mini-Card (Left) */}
        <div className="hero-sticker hero-sticker-left">
          <div className="hero-sticker-avatar">🎉</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Próximo Festejo</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>¡Mamá cumple 50!</div>
          </div>
          <span className="badge badge-pink" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>En 4 días</span>
        </div>

        {/* Hero Interactive Mini-Card (Right) */}
        <div className="hero-sticker hero-sticker-right">
          <div className="hero-sticker-avatar" style={{ background: '#EDE9FE', color: '#7E49F6' }}>📸</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Álbum Familiar</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>14 fotos nuevas</div>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>Cloudinary</span>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 3 }}>
          {/* Logo Showcase with Pulsing Glow */}
          <div className="logo-halo-wrapper">
            <div className="logo-halo" />
            <img
              src="/logo.png"
              alt="Festy Logo"
              className="festy-main-hero-logo"
            />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-purple animate-badge-pulse" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
              <Sparkles size={15} /> Calendario & Recuerdos Familiares
            </span>
            <span className="badge badge-pink" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
              <Heart size={15} /> Álbumes en la Nube
            </span>
          </div>

          <h1
            className="hero-headline"
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}
          >
            Celebra, recuerda y comparte <br />
            <span className="gradient-text animated-shimmer-text">cada cumpleaños especial</span>.
          </h1>

          <p
            style={{
              fontSize: '1.18rem',
              color: 'var(--text-muted)',
              lineHeight: 1.65,
              marginBottom: '34px',
              maxWidth: '660px',
              margin: '0 auto 34px',
            }}
          >
            Festy reúne a toda tu familia en un calendario sincronizado con álbumes fotográficos colaborativos. Sube fotos en alta resolución y nunca más olvides una fecha importante.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {isAuth ? (
              <button
                onClick={() => router.push('/')}
                className="btn-primary animate-btn-bounce"
                style={{ padding: '16px 36px', fontSize: '1.08rem' }}
              >
                <CalendarIcon size={20} /> Ir a mi Calendario Familiar <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary animate-btn-bounce"
                  style={{ padding: '16px 36px', fontSize: '1.08rem' }}
                >
                  <Sparkles size={20} /> Empezar Gratis <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-secondary"
                  style={{ padding: '16px 30px', fontSize: '1.08rem' }}
                >
                  Iniciar Sesión
                </button>
              </>
            )}

            {/* Fun Confetti Button */}
            <button
              onClick={triggerConfetti}
              title="¡Lanzar confeti festivo!"
              className="confetti-btn"
              aria-label="Lanzar confeti"
            >
              <PartyPopper size={20} /> ¡Celebrar!
            </button>
          </div>

          {/* Confetti Render */}
          {confetti.length > 0 && (
            <div className="confetti-container" aria-hidden="true">
              {confetti.map((p) => (
                <span
                  key={p.id}
                  className="confetti-dot"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    backgroundColor: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    transform: `rotate(${p.angle}deg)`,
                    animationDuration: `${p.speed}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4 Pillars of Festy with Interactive Hover Animations */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-mint" style={{ marginBottom: '10px' }}>
            <Star size={14} /> Todo lo que tu familia necesita
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px' }}>
            ¿Por qué todos aman <span className="gradient-text">Festy</span>?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto' }}>
            Diseñado para ser acogedor, súper visual y accesible para todas las edades, desde los abuelos hasta los más pequeños.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1 */}
          <div
            className={`pillar-card ${hoveredPillar === 1 ? 'pillar-card-active' : ''}`}
            onMouseEnter={() => setHoveredPillar(1)}
            onMouseLeave={() => setHoveredPillar(null)}
            style={{
              borderTop: '4px solid #9061F9',
            }}
          >
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, #DDD6FE 0%, #EDE9FE 100%)' }}>
              <CalendarIcon size={28} color="#7E49F6" className="pillar-icon" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
              Calendario Compartido
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Ingresa tu fecha con el selector de calendario nativo y sincronízala al instante con tu círculo familiar. Siempre sabrás con precisión cuántos días faltan.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className={`pillar-card ${hoveredPillar === 2 ? 'pillar-card-active' : ''}`}
            onMouseEnter={() => setHoveredPillar(2)}
            onMouseLeave={() => setHoveredPillar(null)}
            style={{
              borderTop: '4px solid #EC4899',
            }}
          >
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, #FBCFE8 0%, #FCE7F3 100%)' }}>
              <Camera size={28} color="#BE185D" className="pillar-icon" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
              Álbumes Colaborativos
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Toca a cualquier cumpleañero para explorar su fiesta o subir fotos familiares directas a Cloudinary con visor Lightbox en pantalla completa.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className={`pillar-card ${hoveredPillar === 3 ? 'pillar-card-active' : ''}`}
            onMouseEnter={() => setHoveredPillar(3)}
            onMouseLeave={() => setHoveredPillar(null)}
            style={{
              borderTop: '4px solid #10B981',
            }}
          >
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, #A7F3D0 0%, #D1FAE5 100%)' }}>
              <Bell size={28} color="#047857" className="pillar-icon" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
              Alertas Oportunas
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Recibe notificaciones anticipadas para preparar el regalo, la reunión o ese saludo con cariño que tanto alegra el corazón.
            </p>
          </div>

          {/* Card 4 */}
          <div
            className={`pillar-card ${hoveredPillar === 4 ? 'pillar-card-active' : ''}`}
            onMouseEnter={() => setHoveredPillar(4)}
            onMouseLeave={() => setHoveredPillar(null)}
            style={{
              borderTop: '4px solid #F59E0B',
            }}
          >
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, #FED7AA 0%, #FFEDD5 100%)' }}>
              <ShieldCheck size={28} color="#C2410C" className="pillar-icon" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
              Círculos Privados
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Solo las personas que invites mediante tu código seguro (ej. <code>FESTY-XXXXXXXX</code>) pueden ver las fechas y las fotos de tu grupo.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo Widget */}
      <section
        className="glass-panel demo-interactive-panel"
        style={{
          padding: '44px 32px',
          borderRadius: '28px',
          marginBottom: '64px',
          background: 'rgba(255, 255, 255, 0.92)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
            <Sparkles size={14} /> Vista Previa Interactiva
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Descubre cómo se vive un cumpleaños en Festy
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
            Cambia de pestaña para experimentar el calendario y la galería fotográfica
          </p>

          <div style={{ display: 'inline-flex', gap: '8px', background: '#EDE9FE', padding: '6px', borderRadius: '999px', marginTop: '18px' }}>
            <button
              onClick={() => setActiveTabPreview('calendar')}
              style={{
                border: 'none',
                background: activeTabPreview === 'calendar' ? '#7E49F6' : 'transparent',
                color: activeTabPreview === 'calendar' ? '#fff' : '#5C5272',
                padding: '8px 20px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <CalendarIcon size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              Vista Calendario
            </button>
            <button
              onClick={() => setActiveTabPreview('photos')}
              style={{
                border: 'none',
                background: activeTabPreview === 'photos' ? '#EC4899' : 'transparent',
                color: activeTabPreview === 'photos' ? '#fff' : '#5C5272',
                padding: '8px 20px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Camera size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              Galería de Recuerdos
            </button>
          </div>
        </div>

        {activeTabPreview === 'calendar' ? (
          <div className="demo-preview-card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #9061F9 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem' }}>
                  🎂
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Cumpleaños de Diego Gurumendi</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Círculo: Familia Gurumendi • Faltan 14 días</p>
                </div>
              </div>
              <span className="badge badge-mint" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                ¡Confirmados para el pastel! 🎉
              </span>
            </div>
            <div style={{ background: 'rgba(245, 243, 255, 0.7)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                🎁 <strong>Regalos sugeridos:</strong> Libros de ciencia, café de especialidad y postres.
              </div>
              <button
                onClick={() => router.push(isAuth ? '/' : '/login')}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Ver Festejo Completo
              </button>
            </div>
          </div>
        ) : (
          <div className="demo-preview-card animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
              <div className="demo-photo-item">
                <div className="demo-photo-box" style={{ background: 'linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%)' }}>
                  🎈
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>Foto de Fiesta 2025</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Por Sofía • ❤️ 8</div>
              </div>
              <div className="demo-photo-item">
                <div className="demo-photo-box" style={{ background: 'linear-gradient(135deg, #FBCFE8 0%, #F472B6 100%)' }}>
                  🎂
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>Momento del Pastel</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Por Carlos • ❤️ 12</div>
              </div>
              <div className="demo-photo-item">
                <div className="demo-photo-box" style={{ background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)' }}>
                  🎉
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>Abrazos Familiares</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Por Mamá • ❤️ 19</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* How it works steps with Hover Pulse */}
      <section
        className="glass-panel"
        style={{
          padding: '44px 32px',
          borderRadius: '28px',
          background: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '64px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-mint" style={{ marginBottom: '8px' }}>
            Paso a Paso
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800 }}>¿Cómo empezar en 3 pasos sencillos?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Estarás conectado en menos de 2 minutos</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          <div className="step-card">
            <div className="step-number" style={{ background: '#9061F9', boxShadow: '0 8px 18px rgba(144, 97, 249, 0.35)' }}>
              1
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
                Regístrate y pon tu fecha
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Crea tu cuenta en segundos y escoge tu fecha de nacimiento con el selector de calendario directo.
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: '#EC4899', boxShadow: '0 8px 18px rgba(236, 72, 153, 0.35)' }}>
              2
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
                Invita a tu familia
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Comparte tu código de invitación seguro (ej. <code>FESTY-XXXXXXXX</code>) por WhatsApp para armar tu círculo.
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: '#10B981', boxShadow: '0 8px 18px rgba(16, 185, 129, 0.35)' }}>
              3
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
                ¡A celebrar y subir recuerdos!
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Toca a cada persona en el calendario, mira fotos de fiestas pasadas y sube los nuevos recuerdos familiares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        className="cta-banner-animated"
        style={{
          background: 'linear-gradient(135deg, #7E49F6 0%, #EC4899 50%, #F59E0B 100%)',
          borderRadius: '28px',
          padding: '54px 32px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 25px 60px rgba(144, 97, 249, 0.38)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '14px', color: '#fff' }}>
            Únete a Festy y crea momentos inolvidables
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.92)', maxWidth: '620px', margin: '0 auto 30px' }}>
            Totalmente gratis para toda tu familia. Tu calendario y tus fotos protegidas en un solo lugar.
          </p>
          <button
            onClick={() => router.push(isAuth ? '/' : '/login')}
            className="cta-action-btn"
          >
            {isAuth ? 'Ver mi Calendario Familiar' : 'Comenzar Ahora'} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Inline styles for rich animations and micro-interactions */}
      <style jsx>{`
        /* Floating background blobs */
        .bg-floating-blobs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .floating-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.45;
          animation: floatBlob 12s ease-in-out infinite alternate;
        }

        .blob-1 {
          width: 320px;
          height: 320px;
          background: #DDD6FE;
          top: -40px;
          left: -80px;
          animation-delay: 0s;
        }

        .blob-2 {
          width: 280px;
          height: 280px;
          background: #FBCFE8;
          top: 30%;
          right: -60px;
          animation-delay: -4s;
        }

        .blob-3 {
          width: 300px;
          height: 300px;
          background: #FEF08A;
          bottom: 10%;
          left: 10%;
          animation-delay: -8s;
        }

        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -25px) scale(1.08); }
          100% { transform: translate(-25px, 20px) scale(0.95); }
        }

        /* Logo and Halo Glow */
        .logo-halo-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 22px;
        }

        .logo-halo {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(144, 97, 249, 0.4) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%);
          transform: translate(-50%, -50%);
          filter: blur(14px);
          animation: pulseHalo 3s ease-in-out infinite alternate;
        }

        @keyframes pulseHalo {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
        }

        .festy-main-hero-logo {
          width: 175px;
          height: 175px;
          object-fit: contain;
          filter: drop-shadow(0 14px 28px rgba(144, 97, 249, 0.35));
          animation: floatHeroLogo 4.5s ease-in-out infinite alternate;
          position: relative;
          z-index: 2;
          transition: transform 0.3s ease;
        }

        .festy-main-hero-logo:hover {
          transform: scale(1.06) rotate(3deg);
        }

        @keyframes floatHeroLogo {
          0% { transform: translateY(0) rotate(-1.5deg); }
          100% { transform: translateY(-10px) rotate(1.5deg); }
        }

        /* Floating Festive Particles */
        .floating-particle {
          position: absolute;
          font-size: 1.8rem;
          pointer-events: none;
          z-index: 1;
          opacity: 0.85;
          animation: floatParticle 6s ease-in-out infinite alternate;
        }

        .particle-balloon {
          top: 15%;
          left: 6%;
          font-size: 2.2rem;
          animation-duration: 5s;
          animation-delay: 0s;
        }

        .particle-cake {
          top: 70%;
          left: 8%;
          font-size: 2rem;
          animation-duration: 6.5s;
          animation-delay: -2s;
        }

        .particle-gift {
          top: 18%;
          right: 7%;
          font-size: 2.1rem;
          animation-duration: 5.8s;
          animation-delay: -1s;
        }

        .particle-star {
          top: 75%;
          right: 9%;
          font-size: 1.8rem;
          animation-duration: 4.8s;
          animation-delay: -3s;
        }

        .particle-heart {
          top: 45%;
          left: 3%;
          font-size: 1.6rem;
          animation-duration: 7s;
          animation-delay: -1.5s;
        }

        .particle-sparkle {
          top: 48%;
          right: 4%;
          font-size: 1.7rem;
          animation-duration: 5.2s;
          animation-delay: -2.5s;
        }

        @keyframes floatParticle {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(8deg); }
          100% { transform: translateY(8px) rotate(-8deg); }
        }

        /* Hero Floating Stickers / Badges */
        .hero-sticker {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(221, 214, 254, 0.8);
          padding: 10px 16px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(144, 97, 249, 0.14);
          z-index: 2;
          transition: transform 0.3s ease;
        }

        .hero-sticker:hover {
          transform: translateY(-4px) scale(1.04);
        }

        .hero-sticker-left {
          left: 32px;
          top: 42%;
          animation: floatStickerLeft 6s ease-in-out infinite alternate;
        }

        .hero-sticker-right {
          right: 32px;
          top: 45%;
          animation: floatStickerRight 6.5s ease-in-out infinite alternate;
        }

        @media (max-width: 900px) {
          .hero-sticker {
            display: none;
          }
        }

        @keyframes floatStickerLeft {
          0% { transform: translateY(0) rotate(-2deg); }
          100% { transform: translateY(-12px) rotate(1deg); }
        }

        @keyframes floatStickerRight {
          0% { transform: translateY(0) rotate(2deg); }
          100% { transform: translateY(-14px) rotate(-1deg); }
        }

        .hero-sticker-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FCE7F3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        /* Animated Shimmer Text */
        .animated-shimmer-text {
          background-size: 200% auto;
          animation: shimmerText 5s linear infinite;
        }

        @keyframes shimmerText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Button micro bounce */
        .animate-btn-bounce:hover {
          transform: translateY(-3px) scale(1.02);
        }

        /* Confetti Trigger Button */
        .confetti-btn {
          border: 1px solid rgba(221, 214, 254, 0.8);
          background: rgba(255, 255, 255, 0.9);
          color: #7E49F6;
          padding: 14px 22px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(144, 97, 249, 0.1);
          transition: all 0.25s ease;
        }

        .confetti-btn:hover {
          background: #EDE9FE;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 20px rgba(144, 97, 249, 0.2);
        }

        /* Confetti Particles Animation */
        .confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }

        .confetti-dot {
          position: absolute;
          border-radius: 3px;
          animation: confettiFall linear forwards;
        }

        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(260px) rotate(720deg);
          }
        }

        /* Pillar Cards Hover Animation */
        .pillar-card {
          padding: 30px 26px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.88);
          border-left: 1px solid rgba(221, 214, 254, 0.6);
          border-right: 1px solid rgba(221, 214, 254, 0.6);
          border-bottom: 1px solid rgba(221, 214, 254, 0.6);
          box-shadow: 0 8px 24px rgba(160, 140, 190, 0.08);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .pillar-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 36px rgba(144, 97, 249, 0.18);
          background: #ffffff;
        }

        .pillar-icon-box {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.3s ease;
        }

        .pillar-card:hover .pillar-icon-box {
          transform: scale(1.1) rotate(6deg);
        }

        /* Interactive Demo Panel */
        .demo-interactive-panel {
          border: 1px solid rgba(221, 214, 254, 0.8);
          box-shadow: 0 16px 40px rgba(144, 97, 249, 0.1);
        }

        .demo-preview-card {
          background: #ffffff;
          border: 1px solid rgba(221, 214, 254, 0.6);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        .demo-photo-box {
          height: 110px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          transition: transform 0.25s ease;
        }

        .demo-photo-box:hover {
          transform: scale(1.05);
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Steps cards */
        .step-card {
          display: flex;
          gap: 18px;
          padding: 16px;
          border-radius: 18px;
          transition: transform 0.25s ease, background 0.25s ease;
        }

        .step-card:hover {
          background: rgba(245, 243, 255, 0.5);
          transform: translateY(-3px);
        }

        .step-number {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        .step-card:hover .step-number {
          transform: scale(1.15) rotate(-5deg);
        }

        /* Bottom CTA Button */
        .cta-action-btn {
          background: #ffffff;
          color: #7E49F6;
          border: none;
          padding: 16px 40px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .cta-action-btn:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 16px 35px rgba(0, 0, 0, 0.25);
          background: #faf5ff;
        }
      `}</style>
    </div>
  );
}
