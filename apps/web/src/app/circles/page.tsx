'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, getUser, removeToken } from '@/lib/api';
import {
  Users,
  Plus,
  Copy,
  Check,
  Link2,
  Hash,
  Crown,
  Shield,
  Eye,
  UserPlus,
  ArrowLeft,
  LogOut,
  Sparkles,
  Settings,
} from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  joinedAt: string;
  birthDay?: number | null;
  birthMonth?: number | null;
  birthYear?: number | null;
}

interface Circle {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
  createdAt: string;
  members?: Member[];
  memberCount?: number;
}

interface Invitation {
  id: string;
  inviteCode: string;
  joinUrl: string;
  role: string;
  maxUses: number;
  expiresAt: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Create circle state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join circle state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Invitation state
  const [generatingInvite, setGeneratingInvite] = useState<string | null>(null);
  const [lastInvitation, setLastInvitation] = useState<Invitation | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = getToken();
    const userData = getUser();
    if (!token) {
      router.replace('/info');
      return;
    }
    setUser(userData);
    loadCircles();
  }, []);

  const loadCircles = async () => {
    try {
      const token = getToken()!;
      const data = await apiFetch('/api/circles', { token });
      setCircles(data.circles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const token = getToken()!;
      await apiFetch('/api/circles', {
        method: 'POST',
        body: { name: newCircleName },
        token,
      });
      setNewCircleName('');
      setShowCreateForm(false);
      setSuccess('¡Círculo creado exitosamente!');
      await loadCircles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError('');
    try {
      const token = getToken()!;
      await apiFetch('/api/circles/invitations/accept', {
        method: 'POST',
        body: { code: joinCode.trim().toUpperCase() },
        token,
      });
      setJoinCode('');
      setShowJoinForm(false);
      setSuccess('¡Te has unido al círculo exitosamente!');
      await loadCircles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleGenerateInvite = async (circleId: string) => {
    setGeneratingInvite(circleId);
    setError('');
    try {
      const token = getToken()!;
      const data = await apiFetch(`/api/circles/${circleId}/invitations`, {
        method: 'POST',
        body: {
          circleId,
          inviteType: 'direct_code',
          role: 'member',
          maxUses: 10,
          expiresInDays: 7,
        },
        token,
      });
      setLastInvitation(data.invitation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingInvite(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={14} color="#F59E0B" />;
      case 'admin': return <Shield size={14} color="#8B5CF6" />;
      case 'viewer': return <Eye size={14} color="#64748B" />;
      default: return <Users size={14} color="#10B981" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Dueño';
      case 'admin': return 'Admin';
      case 'viewer': return 'Observador';
      default: return 'Miembro';
    }
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/info');
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>⏳ Cargando tus círculos...</p>
      </div>
    );
  }

  return (
    <div className="main-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <button onClick={() => router.push('/')} className="btn-secondary" style={{ marginBottom: '12px', padding: '6px 14px', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} /> Volver al Calendario
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            👥 <span className="gradient-text">Mis Círculos</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Organiza tus cumpleaños por grupos: Familia, Amigos, Trabajo...
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.push('/profile')} className="btn-secondary" style={{ padding: '8px 14px' }}>
            <Settings size={14} /> Mi Perfil
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px' }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(254, 226, 226, 0.9)', border: '1px solid rgba(248, 113, 113, 0.5)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '0.88rem', fontWeight: 600 }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(209, 250, 229, 0.9)', border: '1px solid rgba(110, 231, 183, 0.6)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px', color: '#065F46', fontSize: '0.88rem', fontWeight: 600 }}>
          ✅ {success}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button onClick={() => { setShowCreateForm(true); setShowJoinForm(false); }} className="btn-primary">
          <Plus size={16} /> Crear Círculo
        </button>
        <button onClick={() => { setShowJoinForm(true); setShowCreateForm(false); }} className="btn-secondary">
          <UserPlus size={16} /> Unirme con Código
        </button>
      </div>

      {/* Create Circle Form */}
      {showCreateForm && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            <Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Crear Nuevo Círculo
          </h3>
          <form onSubmit={handleCreateCircle} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Nombre del círculo
              </label>
              <input
                type="text"
                placeholder="Ej: Familia, Amigos del Cole, Oficina..."
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap' }}>
              {creating ? '⏳...' : '✨ Crear'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Join Circle Form */}
      {showJoinForm && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Unirme a un Círculo
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Ingresa el código de invitación que te compartieron (ej: <code style={{ color: 'var(--accent-primary)' }}>FESTY-8K92AB3D</code>)
          </p>
          <form onSubmit={handleJoinCircle} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="FESTY-XXXXXXXX"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-main)',
                  fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px',
                  textAlign: 'center', outline: 'none', fontFamily: 'monospace',
                }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={joining}>
              {joining ? '⏳...' : '🔗 Unirme'}
            </button>
            <button type="button" onClick={() => setShowJoinForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Invitation Modal */}
      {lastInvitation && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderColor: 'var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            🎉 ¡Invitación Generada!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Comparte el <strong>código</strong> o el <strong>enlace</strong> con quien quieras invitar al círculo:
          </p>

          {/* Code */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
              <Hash size={14} /> Código para tipear en la app
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <code style={{
                flex: 1, padding: '14px 20px',
                background: 'rgba(237, 233, 254, 0.9)', border: '1px solid rgba(196, 181, 253, 0.8)',
                borderRadius: 'var(--radius-sm)', color: '#5B21B6',
                fontSize: '1.3rem', fontWeight: 800, letterSpacing: '2px',
                textAlign: 'center', fontFamily: 'monospace',
              }}>
                {lastInvitation.inviteCode}
              </code>
              <button
                onClick={() => copyToClipboard(lastInvitation.inviteCode, 'code')}
                className="btn-secondary" style={{ padding: '12px' }}
              >
                {copiedField === 'code' ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Link */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
              <Link2 size={14} /> Enlace para compartir por chat
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                readOnly value={lastInvitation.joinUrl}
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                  fontSize: '0.8rem', outline: 'none',
                }}
              />
              <button
                onClick={() => copyToClipboard(lastInvitation.joinUrl, 'link')}
                className="btn-secondary" style={{ padding: '12px' }}
              >
                {copiedField === 'link' ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            ⏱️ Expira en 7 días • Máximo {lastInvitation.maxUses} usos
          </p>
          <button onClick={() => setLastInvitation(null)} className="btn-secondary" style={{ marginTop: '12px' }}>
            Cerrar
          </button>
        </div>
      )}

      {/* Circles List */}
      {circles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
            Aún no tienes círculos
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Crea tu primer círculo (ej: <strong>Familia</strong>) y genera una invitación para que tus seres queridos se unan y compartan cumpleaños y fotos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {circles.map((circle) => {
            const members = circle.members || [];
            return (
              <div
                key={circle.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  borderRadius: '20px',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '16px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.45rem',
                        boxShadow: '0 4px 14px rgba(144, 97, 249, 0.2)',
                        flexShrink: 0,
                      }}
                    >
                      {circle.name === 'Familia' || circle.name.toLowerCase().includes('fam')
                        ? '👨‍👩‍👧‍👦'
                        : circle.name === 'Amigos' || circle.name.toLowerCase().includes('amig')
                        ? '🤝'
                        : circle.name.toLowerCase().includes('ofi') || circle.name.toLowerCase().includes('itb') || circle.name.toLowerCase().includes('trab')
                        ? '💼'
                        : '👥'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{circle.name}</h3>
                        <span className="badge badge-purple" style={{ fontSize: '0.74rem', padding: '2px 9px' }}>
                          👥 {circle.memberCount || members.length} {(circle.memberCount || members.length) === 1 ? 'integrante' : 'integrantes'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        {getRoleIcon(circle.role)}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Tu rol: {getRoleLabel(circle.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(circle.role === 'owner' || circle.role === 'admin') && (
                      <button
                        onClick={() => handleGenerateInvite(circle.id)}
                        className="btn-secondary"
                        disabled={generatingInvite === circle.id}
                        style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                      >
                        {generatingInvite === circle.id ? '⏳...' : <><UserPlus size={14} /> Invitar</>}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/?circle=${circle.id}`)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      📅 Ver Calendario
                    </button>
                  </div>
                </div>

                {/* Assigned Members Section */}
                <div
                  style={{
                    borderTop: '1px solid rgba(221, 214, 254, 0.65)',
                    paddingTop: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Users size={14} color="#7E49F6" />
                      Integrantes Asignados ({members.length})
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      No hay otros integrantes registrados en este círculo aún. ¡Usa el botón "Invitar" para sumar a más personas!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {members.map((m) => {
                        const isSelf = user?.email && m.email.toLowerCase() === user.email.toLowerCase();
                        const initial = m.fullName ? m.fullName.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase();

                        return (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '14px',
                              background: isSelf ? 'rgba(237, 233, 254, 0.65)' : 'rgba(255, 255, 255, 0.75)',
                              border: isSelf ? '1.5px solid rgba(167, 139, 250, 0.65)' : '1px solid rgba(221, 214, 254, 0.55)',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                            }}
                          >
                            {/* Avatar */}
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background:
                                  m.role === 'owner'
                                    ? 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)'
                                    : m.role === 'admin'
                                    ? 'linear-gradient(135deg, #DDD6FE 0%, #7E49F6 100%)'
                                    : 'linear-gradient(135deg, #BAE6FD 0%, #818CF8 100%)',
                                color: m.role === 'owner' ? '#78350F' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                              }}
                            >
                              {initial}
                            </div>

                            {/* Details */}
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span
                                  style={{
                                    fontSize: '0.88rem',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={m.fullName}
                                >
                                  {m.fullName}
                                </span>
                                {isSelf && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      color: '#7E49F6',
                                      fontWeight: 800,
                                      background: 'rgba(126, 73, 246, 0.1)',
                                      padding: '1px 5px',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    Tú
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    color: m.role === 'owner' ? '#B45309' : m.role === 'admin' ? '#6D28D9' : 'var(--text-dim)',
                                    fontWeight: 600,
                                  }}
                                >
                                  {m.role === 'owner' ? '👑 Dueño' : m.role === 'admin' ? '🛡️ Admin' : '👤 Miembro'}
                                </span>

                                {m.birthDay && m.birthMonth && (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#BE185D',
                                      fontWeight: 700,
                                      background: 'rgba(251, 207, 232, 0.5)',
                                      padding: '1px 6px',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    🎂 {m.birthDay} {MONTH_NAMES[m.birthMonth - 1]?.slice(0, 3)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How It Works */}
      <div className="glass-panel" style={{ padding: '28px', marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
          💡 ¿Cómo funcionan los círculos?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { step: '1', icon: '✨', title: 'Crea un Círculo', desc: 'Dale un nombre como "Familia" o "Amigos del Cole".' },
            { step: '2', icon: '🔗', title: 'Genera una Invitación', desc: 'Obtienes un código (FESTY-XXXX) o un enlace para compartir.' },
            { step: '3', icon: '👥', title: 'Invita a tu Gente', desc: 'Envía el código por WhatsApp, email o en persona.' },
            { step: '4', icon: '🎂', title: 'Compartan Cumpleaños', desc: 'Todos en el círculo ven las fechas y suben fotos de eventos.' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                minWidth: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--accent-gradient-subtle)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
