'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken, setUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState<string>('1995-09-15');
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(9);
  const [birthYear, setBirthYear] = useState<string>('1995');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Guayaquil'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        let d = birthDay;
        let m = birthMonth;
        let y = birthYear ? Number(birthYear) : undefined;
        if (birthDate) {
          const parts = birthDate.split('-');
          if (parts.length === 3) {
            y = Number(parts[0]);
            m = Number(parts[1]);
            d = Number(parts[2]);
          }
        }

        const body: any = {
          email,
          password,
          fullName,
          timezone,
          birthDay: d,
          birthMonth: m,
        };
        if (y) body.birthYear = y;
        if (inviteCode) body.inviteCode = inviteCode.trim().toUpperCase();

        const data = await apiFetch('/api/auth/register', {
          method: 'POST',
          body,
        });
        setToken(data.token);
        setUser(data.user);
      } else {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        setToken(data.token);
        setUser(data.user);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '48px 40px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="Festy Logo"
            style={{
              width: '95px',
              height: '95px',
              objectFit: 'contain',
              margin: '0 auto 8px',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(144, 97, 249, 0.25))',
            }}
          />
          <h1
            className="gradient-text"
            style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}
          >
            Festy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            {isRegister
              ? 'Crea tu cuenta y nunca olvides un cumpleaños'
              : 'Inicia sesión en tu calendario de cumpleaños'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(254, 226, 226, 0.85)',
              border: '1px solid rgba(248, 113, 113, 0.5)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#B91C1C',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label
                htmlFor="fullName"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Ej: Diego Gurumendi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
            />
          </div>

          {isRegister && (
            <>
              {/* Fecha de Cumpleaños */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  marginTop: '4px',
                }}
              >
                <label
                  htmlFor="regBirthDate"
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                  }}
                >
                  🎂 Tu Fecha de Cumpleaños
                </label>
                <input
                  id="regBirthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setBirthYear(String(y));
                      setBirthMonth(m);
                      setBirthDay(d);
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#ffffff',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                  ✨ Se agregará automáticamente a tu calendario y se sincronizará con tu familia.
                </p>
              </div>

              {/* Código de Invitación Opcional */}
              <div>
                <label
                  htmlFor="inviteCode"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
                >
                  🔗 Código de invitación familiar (opcional)
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  placeholder="Ej: FESTY-9D36EEC6"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Si tu familia te compartió un código, ingrésalo aquí para unirte directo a su círculo.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '1rem',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Procesando...' : isRegister ? '✨ Crear Cuenta' : '🔑 Iniciar Sesión'}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 600,
                marginLeft: '6px',
                fontSize: '0.9rem',
                textDecoration: 'underline',
              }}
            >
              {isRegister ? 'Iniciar sesión' : 'Regístrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
