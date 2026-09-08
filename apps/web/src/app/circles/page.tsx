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

interface Circle {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  inviteCode: string;
  joinUrl: string;
  role: string;
  maxUses: number;
  expiresAt: string;
}

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
      router.push('/login');
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
    router.push('/login');
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {circles.map((circle) => (
            <div key={circle.id} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '14px',
                  background: 'var(--accent-gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>
                  {circle.name === 'Familia' ? '👨‍👩‍👧‍👦' : circle.name === 'Amigos' ? '🤝' : circle.name === 'Oficina' || circle.name === 'Trabajo' ? '💼' : '👥'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{circle.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {getRoleIcon(circle.role)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {getRoleLabel(circle.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(circle.role === 'owner' || circle.role === 'admin') && (
                  <button
                    onClick={() => handleGenerateInvite(circle.id)}
                    className="btn-secondary"
                    disabled={generatingInvite === circle.id}
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    {generatingInvite === circle.id ? '⏳...' : <><UserPlus size={14} /> Invitar</>}
                  </button>
                )}
                <button onClick={() => router.push(`/?circle=${circle.id}`)} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                  📅 Ver Calendario
                </button>
              </div>
            </div>
          ))}
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
