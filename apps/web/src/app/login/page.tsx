'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, setToken, setUser } from '@/lib/api';
import { Sparkles, Calendar, Lock, Mail, User, Link as LinkIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState<string>('2000-09-15');
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(9);
  const [birthYear, setBirthYear] = useState<string>('2000');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [timezone, setTimezone] = useState(
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Guayaquil'
      : 'America/Guayaquil'
  );

  const [expiredNotice, setExpiredNotice] = useState<boolean>(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register' || searchParams.get('register') === 'true') {
      setIsRegister(true);
    } else if (tab === 'login') {
      setIsRegister(false);
    }

    if (searchParams.get('expired') === '1' || searchParams.get('expired') === 'true') {
      setExpiredNotice(true);
      setIsRegister(false);
    }
  }, [searchParams]);

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
        padding: '32px 16px',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: isRegister ? '880px' : '460px',
          padding: isRegister ? '44px 44px' : '44px 36px',
          borderRadius: '28px',
          transition: 'max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(250, 245, 255, 0.94) 100%)',
          border: '1px solid rgba(221, 214, 254, 0.8)',
          boxShadow: '0 20px 50px -10px rgba(144, 97, 249, 0.18)',
        }}
      >
        {/* Header con Logo y Selector */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/logo.png"
            alt="Festy Logo"
            style={{
              width: isRegister ? '85px' : '95px',
              height: isRegister ? '85px' : '95px',
              objectFit: 'contain',
              margin: '0 auto 10px',
              display: 'block',
              filter: 'drop-shadow(0 6px 16px rgba(144, 97, 249, 0.3))',
              transition: 'all 0.3s ease',
            }}
          />
          <h1
            className="gradient-text"
            style={{ fontSize: isRegister ? '2.1rem' : '2.2rem', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 6px' }}
          >
            Festy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', margin: 0 }}>
            {isRegister
              ? 'Únete a Festy: gestiona cumpleaños y comparte recuerdos inolvidables'
              : 'Inicia sesión en tu calendario de cumpleaños familiar'}
          </p>

          {/* Selector de pestañas suave estilo pastel */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(237, 233, 254, 0.6)',
              padding: '4px',
              borderRadius: '999px',
              marginTop: '18px',
              border: '1px solid rgba(221, 214, 254, 0.7)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              style={{
                border: 'none',
                background: !isRegister ? '#ffffff' : 'transparent',
                color: !isRegister ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '7px 22px',
                borderRadius: '999px',
                cursor: 'pointer',
                boxShadow: !isRegister ? '0 2px 8px rgba(144, 97, 249, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              style={{
                border: 'none',
                background: isRegister ? '#ffffff' : 'transparent',
                color: isRegister ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '7px 22px',
                borderRadius: '999px',
                cursor: 'pointer',
                boxShadow: isRegister ? '0 2px 8px rgba(144, 97, 249, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Crear Cuenta
            </button>
          </div>
        </div>

        {/* Session Expired Notice */}
        {expiredNotice && (
          <div
            style={{
              background: 'rgba(254, 243, 199, 0.95)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              borderRadius: '14px',
              padding: '12px 18px',
              marginBottom: '20px',
              color: '#92400E',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <span>Tu sesión ha caducado por seguridad. Por favor, ingresa tus datos de acceso nuevamente.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(254, 226, 226, 0.9)',
              border: '1px solid rgba(248, 113, 113, 0.6)',
              borderRadius: '14px',
              padding: '12px 18px',
              marginBottom: '22px',
              color: '#B91C1C',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {isRegister ? (
            /* DISEÑO HORIZONTAL EN 2 COLUMNAS PARA REGISTRO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                {/* Columna 1: Información Personal */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.65)',
                    border: '1px solid rgba(221, 214, 254, 0.6)',
                    borderRadius: '20px',
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ background: '#FCE7F3', color: '#EC4899', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                      <User size={16} />
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Tus Datos de Acceso
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="fullName"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
                    >
                      Nombre completo
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Ej: Sofía Martínez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-primary)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(144, 97, 249, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-glass)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
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
                        padding: '12px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-primary)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(144, 97, 249, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-glass)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
                    >
                      Contraseña
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        style={{
                          width: '100%',
                          padding: '12px 44px 12px 14px',
                          background: '#ffffff',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '12px',
                          color: 'var(--text-main)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(144, 97, 249, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-glass)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '8px',
                          transition: 'opacity 0.2s',
                        }}
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <EyeOff size={18} color="#7E49F6" /> : <Eye size={18} color="#94A3B8" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Columna 2: Festejo y Círculo Familiar */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.65)',
                    border: '1px solid rgba(221, 214, 254, 0.6)',
                    borderRadius: '20px',
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ background: '#EDE9FE', color: '#7E49F6', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                      <Calendar size={16} />
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Tu Fecha de Cumpleaños & Familia
                    </span>
                  </div>

                  {/* Fecha de Cumpleaños con Selector de Calendario */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(252, 231, 243, 0.4) 100%)',
                      border: '1px solid rgba(253, 230, 138, 0.7)',
                      borderRadius: '14px',
                      padding: '14px',
                    }}
                  >
                    <label
                      htmlFor="regBirthDate"
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '8px',
                      }}
                    >
                      🎂 Selecciona tu Fecha de Nacimiento
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
                        padding: '11px 14px',
                        background: '#ffffff',
                        border: '1px solid rgba(221, 214, 254, 0.9)',
                        borderRadius: '10px',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4, margin: '8px 0 0' }}>
                      ✨ Se agregará de forma inmediata a tu calendario y se sincronizará con tu círculo.
                    </p>
                  </div>

                  {/* Código de Invitación Familiar */}
                  <div>
                    <label
                      htmlFor="inviteCode"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
                    >
                      🔗 Código de invitación familiar (opcional)
                    </label>
                    <input
                      id="inviteCode"
                      type="text"
                      placeholder="Ej: FESTY-8B92"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-primary)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(144, 97, 249, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-glass)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '5px', margin: '5px 0 0' }}>
                      Si te invitaron a un círculo familiar, escribe aquí el código para unirte directo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Enviar a lo ancho */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '15px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(126, 73, 246, 0.28)',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? '⏳ Creando tu cuenta...' : '✨ Completar Registro y Empezar'}
              </button>
            </div>
          ) : (
            /* DISEÑO VERTICAL COMPACTO PARA LOGIN */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    borderRadius: '12px',
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 16px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      borderRadius: '8px',
                      transition: 'opacity 0.2s',
                    }}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} color="#7E49F6" /> : <Eye size={18} color="#94A3B8" />}
                  </button>
                </div>
              </div>

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
                  borderRadius: '14px',
                  boxShadow: '0 8px 20px rgba(126, 73, 246, 0.25)',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? '⏳ Iniciando sesión...' : '🔑 Iniciar Sesión'}
              </button>
            </div>
          )}
        </form>

        {/* Toggle Login / Register Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', margin: 0 }}>
            {isRegister ? '¿Ya tienes una cuenta registrada?' : '¿Aún no tienes cuenta en Festy?'}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 700,
                marginLeft: '6px',
                fontSize: '0.92rem',
                textDecoration: 'underline',
              }}
            >
              {isRegister ? 'Iniciar sesión aquí' : 'Regístrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E49F6' }}>Cargando Festy...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
