'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(221, 214, 254, 0.5)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(250, 245, 255, 0.85) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '24px 16px 20px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '750px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Brand & Minimal Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="Festy Logo"
              style={{
                width: '28px',
                height: '28px',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.22rem',
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #7E49F6 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Festy
            </span>
          </Link>

          <span style={{ color: 'rgba(221, 214, 254, 0.9)' }}>•</span>

          <Link
            href="/"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Calendario
          </Link>

          <span style={{ color: 'rgba(221, 214, 254, 0.9)' }}>•</span>

          <Link
            href="/circles"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Círculos
          </Link>

          <span style={{ color: 'rgba(221, 214, 254, 0.9)' }}>•</span>

          <Link
            href="/info"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#7E49F6')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ¿Qué es Festy?
          </Link>
        </div>

        {/* Minimal Copyright and Credit */}
        <p
          style={{
            margin: 0,
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            lineHeight: 1.5,
          }}
        >
          © {new Date().getFullYear()} Festy · Creado por{' '}
          <strong style={{ color: '#7E49F6', fontWeight: 700 }}>Design Develops</strong> ❤️
        </p>
      </div>
    </footer>
  );
}
