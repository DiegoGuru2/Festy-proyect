'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles, Code, Calendar, Users, Shield, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(221, 214, 254, 0.5)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(245, 243, 255, 0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '48px 24px 28px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Brand Col */}
          <div style={{ maxWidth: '340px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                marginBottom: '14px',
              }}
            >
              <img
                src="/logo.png"
                alt="Festy Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(144, 97, 249, 0.25))',
                }}
              />
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, #7E49F6 0%, #EC4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Festy
              </span>
            </Link>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}
            >
              El calendario familiar colaborativo para nunca olvidar un cumpleaños y revivir tus mejores recuerdos fotográficos en la nube.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#7E49F6', fontWeight: 600 }}>
              <Sparkles size={14} /> Momentos que unen familias
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-main)',
                marginBottom: '16px',
              }}
            >
              Navegación
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link
                  href="/"
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Calendar size={15} /> Calendario de Cumpleaños
                </Link>
              </li>
              <li>
                <Link
                  href="/info"
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Sparkles size={15} /> ¿Qué es Festy?
                </Link>
              </li>
              <li>
                <Link
                  href="/circles"
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Users size={15} /> Mis Círculos
                </Link>
              </li>
            </ul>
          </div>

          {/* Features Column */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-main)',
                marginBottom: '16px',
              }}
            >
              Características
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🎉 Álbumes Colaborativos
              </li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                ☁️ Fotos en Cloudinary HD
              </li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🔔 Recordatorios Automáticos
              </li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🔒 Círculos Privados y Seguros
              </li>
            </ul>
          </div>

          {/* Creator Badge Box */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-main)',
                marginBottom: '16px',
              }}
            >
              Desarrollo
            </h4>
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(221, 214, 254, 0.8)',
                boxShadow: '0 8px 20px rgba(144, 97, 249, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7E49F6 0%, #EC4899 100%)',
                    color: '#fff',
                  }}
                >
                  <Code size={16} />
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Autoría & Diseño
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#231936',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.3px',
                }}
              >
                Design Develops
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', lineHeight: 1.4 }}>
                Soluciones digitales creativas & desarrollo web moderno.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(221, 214, 254, 0.6)',
            paddingTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} <strong style={{ color: 'var(--text-main)' }}>Festy</strong>. Todos los derechos reservados.
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(221, 214, 254, 0.9)',
              boxShadow: '0 2px 8px rgba(144, 97, 249, 0.08)',
            }}
          >
            <span>Creado por</span>
            <span
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7E49F6 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Design Develops
            </span>
            <Heart size={14} color="#EC4899" fill="#EC4899" style={{ marginLeft: '2px' }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
