'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, getUser, removeToken } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Users,
  Settings,
  LogOut,
  Info,
  Sparkles,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    const currentUser = getUser();
    setIsAuth(Boolean(token));
    setUser(currentUser);
  }, [pathname]);

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
    router.push('/login');
  };

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
            height: '46px',
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
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            display: 'inline-block',
          }}
        >
          Festy
        </span>
        <span className="nav-badge" style={{ fontSize: '0.72rem' }}>
          {isAuth ? '🎂 Familiar' : '✨ Conoce Festy'}
        </span>
      </div>

      {/* Navigation Links & Actions */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuth ? (
          <>
            <button
              onClick={() => router.push('/')}
              className={pathname === '/' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <CalendarIcon size={15} /> Calendario
            </button>
            <button
              onClick={() => router.push('/circles')}
              className={pathname === '/circles' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <Users size={15} /> Círculos
            </button>
            <button
              onClick={() => router.push('/profile')}
              className={pathname === '/profile' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <Settings size={15} /> Perfil
            </button>
            <button
              onClick={() => router.push('/info')}
              className={pathname === '/info' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              title="Información sobre Festy"
            >
              <Info size={15} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.84rem', color: '#B91C1C' }}
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/info')}
              className={pathname === '/info' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <Info size={15} /> ¿Qué es Festy?
            </button>
            <button
              onClick={() => router.push('/login')}
              className={pathname === '/login' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <LogIn size={15} /> Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/login')}
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
