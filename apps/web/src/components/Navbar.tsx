'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, getUser, removeToken } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Users,
  Settings,
  LogOut,
  Info,
  LogIn,
  UserPlus,
  ChevronDown,
  ShieldCheck,
  User as UserIcon,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    const currentUser = getUser();
    setIsAuth(Boolean(token));
    setUser(currentUser);
  }, [pathname]);

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogoClick = () => {
    const token = getToken();
    if (token) {
      router.push('/');
    } else {
      router.push('/info');
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuth(false);
    setUser(null);
    setDropdownOpen(false);
    router.replace('/info');
  };

  // Get user initials
  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userDisplayName = user?.fullName || 'Usuario Festy';
  const userDisplayEmail = user?.email || 'usuario@festy.app';

  return (
    <header className="navbar" id="main-navbar">
      {/* Brand & Logo */}
      <div
        className="nav-brand"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}
        title={isAuth ? 'Ir al Calendario de Festy' : 'Conoce más sobre Festy'}
      >
        <img
          src="/logo.png"
          alt="Festy Logo"
          style={{
            height: '44px',
            width: 'auto',
            objectFit: 'contain',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: 'drop-shadow(0 2px 8px rgba(167, 139, 250, 0.25))',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08) rotate(-2deg)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) rotate(0deg)')}
        />
        <span
          className="gradient-text"
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            display: 'inline-block',
          }}
        >
          Festy
        </span>
        <span className="nav-badge" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center' }}>
          {isAuth ? '🎂 Familiar' : '✨ Conoce Festy'}
        </span>
      </div>

      {/* Navigation Links & Actions */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuth ? (
          <>
            {/* Main Tabs */}
            <button
              onClick={() => router.push('/')}
              className={pathname === '/' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
            >
              <CalendarIcon size={16} /> <span className="nav-text-hide">Calendario</span>
            </button>

            <button
              onClick={() => router.push('/circles')}
              className={pathname === '/circles' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
            >
              <Users size={16} /> <span className="nav-text-hide">Círculos</span>
            </button>

            {/* Profile Dropdown Trigger */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px 5px 8px',
                  background: dropdownOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid rgba(221, 214, 254, 0.8)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  boxShadow: dropdownOpen
                    ? '0 4px 14px rgba(144, 97, 249, 0.18)'
                    : '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                title="Menú de usuario"
              >
                {/* Email text (hidden on small screens) */}
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  className="nav-email-text"
                >
                  {userDisplayEmail}
                </span>

                {/* Avatar circle with initial */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #BAE6FD 0%, #E0E7FF 100%)',
                    color: '#0369A1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: '1px solid #7DD3FC',
                  }}
                >
                  {userInitial}
                </div>

                <ChevronDown
                  size={15}
                  color="var(--text-muted)"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* DROPDOWN MENU */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(221, 214, 254, 0.85)',
                    borderRadius: '18px',
                    boxShadow: '0 16px 36px -8px rgba(144, 97, 249, 0.2)',
                    zIndex: 200,
                    padding: '8px 0',
                    animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* User Header */}
                  <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid #F3E8FF' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                      {userDisplayName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {userDisplayEmail}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: '6px 6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/profile');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '10px',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <UserIcon size={16} color="#7E49F6" />
                      <span>Mi perfil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/profile#seguridad');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '10px',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <KeyRound size={16} color="#EC4899" />
                      <span>Seguridad y Contraseña</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/info');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '10px',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Info size={16} color="#6B7280" />
                      <span>¿Qué es Festy?</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#F3E8FF', margin: '4px 0' }} />

                  {/* Logout Button */}
                  <div style={{ padding: '4px 6px 2px' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '10px',
                        color: '#DC2626',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={16} color="#DC2626" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/info')}
              className={pathname === '/info' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Info size={15} /> <span className="nav-text-hide">¿Qué es Festy?</span>
            </button>
            <button
              onClick={() => router.push('/login?tab=login')}
              className={pathname === '/login' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <LogIn size={15} /> Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/login?tab=register')}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <UserPlus size={15} /> Registrarme
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
