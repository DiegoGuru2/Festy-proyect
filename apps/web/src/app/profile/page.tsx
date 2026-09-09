'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, setToken, getUser, setUser, removeToken } from '@/lib/api';

import {
  User,
  Lock,
  Bell,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [birthDate, setBirthDate] = useState<string>('1995-09-18');
  const [birthDay, setBirthDay] = useState<number>(18);
  const [birthMonth, setBirthMonth] = useState<number>(9);
  const [birthYear, setBirthYear] = useState<string>('1995');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Notifications
  const [enablePush, setEnablePush] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);
  const [daysBefore, setDaysBefore] = useState(1);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifMsg, setNotifMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/info');
      return;
    }
    loadUserData(token);
  }, []);

  const loadUserData = async (token: string) => {
    try {
      const data = await apiFetch('/api/auth/me', { token });
      if (data?.user) {
        setFullName(data.user.fullName || '');
        setEmail(data.user.email || '');
        setTimezone(data.user.timezone || 'America/Guayaquil');
      }
      if (data?.birthday) {
        const d = data.birthday.birthDay || 18;
        const m = data.birthday.birthMonth || 9;
        const y = data.birthday.birthYear || 1995;
        setBirthDay(d);
        setBirthMonth(m);
        setBirthYear(String(y));
        const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        setBirthDate(formatted);
      }
      if (data?.preferences) {
        setEnablePush(data.preferences.enablePush ?? true);
        setEnableEmail(data.preferences.enableEmail ?? true);
        setDaysBefore(data.preferences.daysBefore ?? 1);
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error cargando datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
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

      const token = getToken()!;
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: {
          fullName,
          timezone,
          birthDay: d,
          birthMonth: m,
          birthYear: y,
        },
        token,
      });

      if (res?.user) {
        setUser(res.user);
      }

      setProfileMsg({ type: 'success', text: '¡Perfil y fecha de cumpleaños guardados correctamente!' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error al guardar perfil' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden' });
      return;
    }

    if (newPassword.length < 8) {
      setPassMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }

    setChangingPass(true);

    try {
      const token = getToken()!;
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        token,
      });

      if (res?.token) {
        setToken(res.token);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassMsg({ type: 'success', text: '¡Contraseña cambiada exitosamente! Tu cuenta está actualizada y segura.' });
      setTimeout(() => setPassMsg({ type: '', text: '' }), 8000);
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Error al cambiar contraseña' });
    } finally {
      setChangingPass(false);
    }
  };

  const handleUpdateNotifs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifs(true);
    setNotifMsg({ type: '', text: '' });

    try {
      const token = getToken()!;
      await apiFetch('/api/auth/notifications', {
        method: 'PATCH',
        body: { enablePush, enableEmail, daysBefore: Number(daysBefore) },
        token,
      });

      setNotifMsg({ type: 'success', text: '¡Preferencias de recordatorios guardadas!' });
      setTimeout(() => setNotifMsg({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setNotifMsg({ type: 'error', text: err.message || 'Error al guardar preferencias' });
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/info');
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>⏳ Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="main-container" style={{ maxWidth: '840px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button onClick={() => router.push('/')} className="btn-secondary" style={{ marginBottom: '12px', padding: '6px 14px', fontSize: '0.82rem' }}>
            <ArrowLeft size={14} /> Volver al Calendario
          </button>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800 }}>
            ⚙️ <span className="gradient-text">Mi Perfil & Ajustes</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Administra tu información personal, seguridad de cuenta y recordatorios.
          </p>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px' }}>
          <LogOut size={14} /> Salir
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* SECTION 1: PERSONAL INFORMATION */}
        <section className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(221, 214, 254, 0.7)', padding: '10px', borderRadius: '12px' }}>
              <User size={20} color="#7E49F6" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Datos Personales</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Tu nombre y zona horaria para los recordatorios de cumpleaños
              </p>
            </div>
          </div>

          {profileMsg.text && (
            <div
              style={{
                background: profileMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                color: profileMsg.type === 'success' ? '#065F46' : '#B91C1C',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              {profileMsg.type === 'success' ? '✅' : '⚠️'} {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}
              />
            </div>

            {/* Fecha de Cumpleaños con Calendario Nativo */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '18px',
                boxShadow: '0 2px 8px rgba(160, 140, 190, 0.06)',
              }}
            >
              <label
                htmlFor="profileBirthDate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '8px',
                }}
              >
                <Calendar size={18} color="#9061F9" /> Fecha de Cumpleaños
              </label>
              <input
                id="profileBirthDate"
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
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.95rem',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                }}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
                🎉 Selecciona tu fecha en el calendario. Se sincroniza automáticamente en el calendario familiar de tus círculos.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', opacity: 0.7, background: 'rgba(0,0,0,0.03)' }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                🔒 El correo electrónico está vinculado a tu cuenta en TiDB Cloud.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Zona horaria
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#ffffff', fontWeight: 600 }}
              >
                <option value="America/Guayaquil">Ecuador (America/Guayaquil - GMT-5)</option>
                <option value="America/Bogota">Colombia (America/Bogota - GMT-5)</option>
                <option value="America/Lima">Perú (America/Lima - GMT-5)</option>
                <option value="America/Mexico_City">México (America/Mexico_City - GMT-6)</option>
                <option value="America/Santiago">Chile (America/Santiago - GMT-4)</option>
                <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires - GMT-3)</option>
                <option value="America/New_York">EE. UU. Este (America/New_York - GMT-4)</option>
                <option value="Europe/Madrid">España (Europe/Madrid - GMT+2)</option>
                <option value="UTC">UTC Universal</option>
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                ⏰ Los recordatorios se despachan según la hora exacta de tu zona.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={savingProfile}
              style={{ alignSelf: 'flex-start', marginTop: '6px', padding: '12px 24px' }}
            >
              <Save size={16} /> {savingProfile ? 'Guardando...' : 'Guardar Cambios de Perfil'}
            </button>
          </form>
        </section>

        {/* SECTION 2: CHANGE PASSWORD */}
        <section id="seguridad" className="glass-panel" style={{ padding: '28px', scrollMarginTop: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(251, 207, 232, 0.7)', padding: '10px', borderRadius: '12px' }}>
              <KeyRound size={20} color="#BE185D" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Seguridad y Contraseña</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Actualiza tu contraseña para mantener tu cuenta protegida
              </p>
            </div>
          </div>

          {/* Pastel Security Badge */}
          <div style={{ background: 'rgba(237, 233, 254, 0.45)', border: '1px solid rgba(221, 214, 254, 0.75)', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.83rem', color: '#5B21B6' }}>
            <ShieldCheck size={18} color="#7E49F6" />
            <span>Tu cuenta está resguardada con cifrado bcrypt en TiDB y sesiones protegidas con JWT.</span>
          </div>

          {passMsg.text && (
            <div
              style={{
                background: passMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                color: passMsg.type === 'success' ? '#065F46' : '#B91C1C',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              {passMsg.type === 'success' ? '✅' : '⚠️'} {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Contraseña actual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 42px 12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showCurrentPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: '100%', padding: '12px 42px 12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                    title={showNewPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Confirmar nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: '100%', padding: '12px 42px 12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                    title={showConfirmPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={changingPass}
              style={{ alignSelf: 'flex-start', marginTop: '6px', padding: '12px 24px' }}
            >
              <Lock size={16} /> {changingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </section>

        {/* SECTION 3: NOTIFICATION PREFERENCES */}
        <section className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(254, 215, 170, 0.7)', padding: '10px', borderRadius: '12px' }}>
              <Bell size={20} color="#C2410C" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recordatorios Automáticos</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Configura cuándo y cómo recibir alertas de cumpleaños de tu familia
              </p>
            </div>
          </div>

          {notifMsg.text && (
            <div
              style={{
                background: notifMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                color: notifMsg.type === 'success' ? '#065F46' : '#B91C1C',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              {notifMsg.type === 'success' ? '✅' : '⚠️'} {notifMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateNotifs} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notificaciones Push</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Alertas directas en el navegador y móvil</div>
              </div>
              <input
                type="checkbox"
                checked={enablePush}
                onChange={(e) => setEnablePush(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#9061F9', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notificaciones por Correo</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Recibir recordatorio por email a {email}</div>
              </div>
              <input
                type="checkbox"
                checked={enableEmail}
                onChange={(e) => setEnableEmail(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#9061F9', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Anticipación del recordatorio
              </label>
              <select
                value={daysBefore}
                onChange={(e) => setDaysBefore(Number(e.target.value))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#ffffff', fontWeight: 600 }}
              >
                <option value={0}>El mismo día del cumpleaños</option>
                <option value={1}>1 día antes (Recomendado)</option>
                <option value={3}>3 días antes (Para preparar el regalo 🎁)</option>
                <option value={7}>1 semana antes</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={savingNotifs}
              style={{ alignSelf: 'flex-start', marginTop: '6px', padding: '12px 24px' }}
            >
              <Save size={16} /> {savingNotifs ? 'Guardando...' : 'Guardar Preferencias de Recordatorio'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
