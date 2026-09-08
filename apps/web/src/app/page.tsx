'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, removeToken } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Camera,
  Plus,
  Users,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

interface MockBirthday {
  id: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  circle: string;
  avatar: string;
  isClaimed: boolean;
}

interface MockPhoto {
  id: string;
  celebrationTitle: string;
  uploaderName: string;
  imageUrl: string;
  likes: number;
  comments: number;
  date: string;
}

export default function HomePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Septiembre 2026
  const [selectedCircle, setSelectedCircle] = useState('Familia');
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setUserState(getUser());
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const circles = ['Todos', 'Familia', 'Amigos Cercanos', 'Oficina'];

  const upcomingBirthdays: MockBirthday[] = [
    {
      id: '1',
      name: 'Sofía Gurumendi',
      day: 12,
      month: 9,
      year: 1996,
      circle: 'Familia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      isClaimed: true,
    },
    {
      id: '2',
      name: 'Carlos Mendoza',
      day: 18,
      month: 9,
      year: 1990,
      circle: 'Amigos Cercanos',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      isClaimed: true,
    },
    {
      id: '3',
      name: 'Abuela Rosa',
      day: 25,
      month: 9,
      circle: 'Familia',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces',
      isClaimed: false,
    },
  ];

  const recentPhotos: MockPhoto[] = [
    {
      id: 'p1',
      celebrationTitle: 'Cumpleaños 30 de Carlos 🎉',
      uploaderName: 'David G.',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
      likes: 18,
      comments: 6,
      date: 'Hace 2 días',
    },
    {
      id: 'p2',
      celebrationTitle: 'Fiesta Sorpresa de Mamá 💐',
      uploaderName: 'Mariana P.',
      imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop&q=80',
      likes: 24,
      comments: 9,
      date: 'Hace 5 días',
    },
    {
      id: 'p3',
      celebrationTitle: 'Celebración 5to de Lucas 🎈',
      uploaderName: 'David G.',
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80',
      likes: 31,
      comments: 12,
      date: 'La semana pasada',
    },
  ];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="main-container">
      {/* Top Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            👋 Hola, <strong style={{ color: 'var(--text-main)' }}>{user?.fullName || 'Usuario'}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.push('/circles')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Users size={15} /> Mis Círculos
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-purple">
              <Sparkles size={14} /> TiDB Serverless + Cloudinary Ready
            </span>
            <span className="badge badge-pink">
              <ShieldCheck size={14} /> Protección de Menores Activa
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Nunca olvides un día especial, <span className="gradient-text">revívelo en fotos</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Calendario sincronizado con recordatorios inteligentes en tu zona horaria y álbumes de fotos colaborativos para cada celebración familiar y de amigos.
          </p>

          {/* Circle Selector Chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {circles.map((circle) => (
              <button
                key={circle}
                onClick={() => setSelectedCircle(circle)}
                className={selectedCircle === circle ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Users size={14} /> {circle}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Left Column: Calendar Grid */}
        <section className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-gradient-subtle)', padding: '10px', borderRadius: '12px' }}>
                <CalendarIcon size={24} color="#8B5CF6" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Vista de calendario interactivo
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '8px' }} aria-label="Mes anterior">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '8px' }} aria-label="Mes siguiente">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="calendar-grid" style={{ marginBottom: '8px' }}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-grid">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ opacity: 0.2 }} className="calendar-cell" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const matches = upcomingBirthdays.filter(
                (b) => b.day === dayNumber && b.month === currentDate.getMonth() + 1
              );
              const isToday = dayNumber === 7 && currentDate.getMonth() === 8;

              return (
                <div key={`day-${dayNumber}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                  <span className="cell-number" style={isToday ? { color: '#8B5CF6', fontWeight: 800 } : {}}>
                    {dayNumber} {isToday && '• Hoy'}
                  </span>
                  {matches.map((bday) => (
                    <div key={bday.id} className="birthday-pill" title={`${bday.name} (${bday.circle})`}>
                      🎂 {bday.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Upcoming & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Card */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎉 Próximos Cumpleaños
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingBirthdays.map((bday) => (
                <div
                  key={bday.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={bday.avatar}
                      alt={bday.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{bday.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {bday.circle} • {bday.day} de {monthNames[bday.month - 1]}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    En {bday.day - 7} días
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Invite Box */}
          <section className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
              ¿Falta alguien de tu familia?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Invita a miembros o crea su perfil de cumpleaños para no olvidar su fecha.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> Agregar Cumpleaños al Círculo
            </button>
          </section>
        </div>
      </div>

      {/* Gallery Section: Photos by Event */}
      <section style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Camera size={20} color="#EC4899" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Momentos & Recuerdos</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Galería colaborativa optimizada en Cloudinary con Smart Face Crop
            </p>
          </div>

          <button className="btn-secondary" id="btn-upload-photo">
            <Camera size={16} /> Subir Fotos de Evento
          </button>
        </div>

        <div className="photo-gallery">
          {recentPhotos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <img src={photo.imageUrl} alt={photo.celebrationTitle} />
              <div className="photo-overlay">
                <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                  {photo.celebrationTitle}
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', marginBottom: '10px' }}>
                  Por {photo.uploaderName} • {photo.date}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#fff' }}>
                    <Heart size={14} fill="#EC4899" color="#EC4899" /> {photo.likes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#fff' }}>
                    <MessageCircle size={14} color="#C4B5FD" /> {photo.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
