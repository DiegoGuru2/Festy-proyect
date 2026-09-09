'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, getUser, removeToken } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Sparkles,
  Camera,
  Plus,
  Users,
  ShieldCheck,
  LogOut,
  Cake,
  Gift,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Settings,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

interface BirthdayItem {
  id: string;
  fullName: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  circleName: string;
  circleId: string;
  isClaimed: boolean;
  contactEmail?: string;
  notes?: string;
}

interface CelebrationPhoto {
  id: string;
  celebrationId: string;
  celebrationTitle?: string;
  secureUrl: string;
  caption?: string;
  uploadedBy: string;
  uploaderName: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Septiembre 2026
  const [selectedCircle, setSelectedCircle] = useState('Todos');
  const [user, setUserState] = useState<any>(null);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [circles, setCircles] = useState<string[]>(['Todos']);
  const [photosFeed, setPhotosFeed] = useState<CelebrationPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Birthday Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('2000-09-15');
  const [newDay, setNewDay] = useState(15);
  const [newMonth, setNewMonth] = useState(9);
  const [newYear, setNewYear] = useState('');
  const [newCircleId, setNewCircleId] = useState('');
  const [userCirclesList, setUserCirclesList] = useState<{ id: string; name: string }[]>([]);
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  // Celebration & Photo Upload Modal State
  const [selectedBirthday, setSelectedBirthday] = useState<BirthdayItem | null>(null);
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const [celebrationPhotos, setCelebrationPhotos] = useState<CelebrationPhoto[]>([]);
  const [modalTab, setModalTab] = useState<'gallery' | 'circle_gallery' | 'upload'>('gallery');
  const [circleFilterInModal, setCircleFilterInModal] = useState<string>('Todos');
  const [loadingCelebration, setLoadingCelebration] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [containsMinors, setContainsMinors] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Muro Filter State
  const [muroFilter, setMuroFilter] = useState<string>('Todos');

  // Lightbox / Full-screen Photo Viewer State with Navigation
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const [lightboxList, setLightboxList] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const openLightbox = (photo: any, list: any[]) => {
    const idx = list.findIndex((p) => p.id === photo.id);
    setLightboxList(list);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxPhoto(photo);
  };


  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxList.length === 0) return;
    const nextIdx = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(nextIdx);
    setLightboxPhoto(lightboxList[nextIdx]);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxList.length === 0) return;
    const prevIdx = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(prevIdx);
    setLightboxPhoto(lightboxList[prevIdx]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === 'Escape') setLightboxPhoto(null);
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, lightboxIndex, lightboxList]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/info');
      return;
    }
    setUserState(getUser());
    loadAllData(token);
  }, []);

  const loadAllData = async (token: string) => {
    try {
      const [feedData, circlesData, photosData] = await Promise.all([
        apiFetch('/api/birthdays/feed', { token }).catch(() => ({ birthdays: [] })),
        apiFetch('/api/circles', { token }).catch(() => ({ circles: [] })),
        apiFetch('/api/media/photos/feed', { token }).catch(() => ({ photos: [] })),
      ]);

      const items: BirthdayItem[] = feedData?.birthdays || [];
      setBirthdays(items);

      const userCircles = circlesData?.circles || [];
      setUserCirclesList(userCircles);
      if (userCircles.length > 0 && !newCircleId) {
        setNewCircleId(userCircles[0].id);
      }

      const uniqueNames = Array.from(new Set(items.map((b) => b.circleName))) as string[];
      setCircles(['Todos', ...uniqueNames]);

      setPhotosFeed(photosData?.photos || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  // Open Celebration Modal when clicking a birthday
  const handleOpenCelebration = async (bday: BirthdayItem, initialTab: 'gallery' | 'circle_gallery' | 'upload' = 'gallery') => {
    setSelectedBirthday(bday);
    setLoadingCelebration(true);
    setUploadError('');
    setUploadSuccess('');
    setSelectedFile(null);
    setFilePreview(null);
    setUploadCaption('');

    try {
      const token = getToken()!;
      const data = await apiFetch('/api/media/celebrations/get-or-create', {
        method: 'POST',
        body: {
          birthdayId: bday.id,
          year: currentDate.getFullYear(),
        },
        token,
      });

      setCelebrationData(data.celebration);
      const photos = data.photos || [];
      setCelebrationPhotos(photos);
      setModalTab(initialTab);
    } catch (err: any) {
      setUploadError(err.message || 'Error cargando celebración');
    } finally {
      setLoadingCelebration(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 15 MB.');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    setFilePreview(URL.createObjectURL(file));
  };

  // Direct Signed Upload to Cloudinary
  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !celebrationData) return;

    setUploadingPhoto(true);
    setUploadProgress('Obteniendo firma segura...');
    setUploadError('');
    setUploadSuccess('');

    try {
      const token = getToken()!;

      // 1. Obtener firma criptográfica del backend
      const signRes = await apiFetch('/api/media/sign-upload', {
        method: 'POST',
        body: {
          celebrationId: celebrationData.id,
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          containsMinors,
        },
        token,
      });

      const { signature, timestamp, folder, apiKey, cloudName } = signRes;

      // 2. Subir directamente a Cloudinary
      setUploadProgress('Subiendo foto a Cloudinary...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const cloudData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) {
        throw new Error(cloudData.error?.message || 'Error al subir imagen a Cloudinary');
      }

      // 3. Registrar metadatos en backend / TiDB
      setUploadProgress('Guardando en tu álbum familiar...');
      await apiFetch('/api/media/photos', {
        method: 'POST',
        body: {
          celebrationId: celebrationData.id,
          cloudinaryPublicId: cloudData.public_id,
          secureUrl: cloudData.secure_url,
          caption: uploadCaption || undefined,
          width: cloudData.width,
          height: cloudData.height,
          format: cloudData.format,
          sizeBytes: cloudData.bytes,
          containsMinors,
          visibility: 'inherit_celebration',
        },
        token,
      });

      setUploadSuccess('¡Foto subida y guardada exitosamente! 📸');
      setSelectedFile(null);
      setFilePreview(null);
      setUploadCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Recargar fotos de esta celebración y cambiar a pestaña de galería
      const updatedCelebration = await apiFetch('/api/media/celebrations/get-or-create', {
        method: 'POST',
        body: { birthdayId: selectedBirthday!.id, year: currentDate.getFullYear() },
        token,
      });
      setCelebrationPhotos(updatedCelebration.photos || []);
      setModalTab('gallery');

      const updatedPhotos = await apiFetch('/api/media/photos/feed', { token }).catch(() => null);
      if (updatedPhotos?.photos) setPhotosFeed(updatedPhotos.photos);
    } catch (err: any) {
      setUploadError(err.message || 'Error durante la subida de foto');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress('');
    }
  };

  // Like Photo Handler
  const handleLikePhoto = async (photoId: string) => {
    try {
      const token = getToken()!;
      await apiFetch(`/api/media/photos/${photoId}/like`, { method: 'POST', token });

      // Actualizar conteo optimista en celebración, feed y lightbox
      setCelebrationPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, likesCount: p.likesCount + 1 } : p))
      );
      setPhotosFeed((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, likesCount: p.likesCount + 1 } : p))
      );
      if (lightboxPhoto && lightboxPhoto.id === photoId) {
        setLightboxPhoto({ ...lightboxPhoto, likesCount: lightboxPhoto.likesCount + 1 });
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    }
  };

  const handleAddBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleId) return;
    setSavingBirthday(true);
    setAddMessage('');

    try {
      let d = newDay;
      let m = newMonth;
      let y = newYear ? Number(newYear) : undefined;
      if (newBirthDate) {
        const parts = newBirthDate.split('-');
        if (parts.length === 3) {
          y = Number(parts[0]);
          m = Number(parts[1]);
          d = Number(parts[2]);
        }
      }

      const token = getToken()!;
      await apiFetch('/api/birthdays', {
        method: 'POST',
        body: {
          circleId: newCircleId,
          fullName: newName,
          birthDay: d,
          birthMonth: m,
          birthYear: y,
          isMinor: false,
          notes: 'Agregado desde el calendario',
        },
        token,
      });

      setNewName('');
      setShowAddModal(false);
      await loadAllData(token);
    } catch (err: any) {
      setAddMessage(err.message || 'Error al guardar cumpleaños');
    } finally {
      setSavingBirthday(false);
    }
  };

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

  const filteredBirthdays = selectedCircle === 'Todos'
    ? birthdays
    : birthdays.filter((b) => b.circleName === selectedCircle);

  // Fallback demo photos if feed is empty
  const displayPhotos = photosFeed.length > 0
    ? photosFeed
    : [
        {
          id: 'demo1',
          celebrationId: 'c1',
          celebrationTitle: 'Cumpleaños de Diego Gurumendi',
          secureUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
          uploaderName: 'Diego Gurumendi',
          likesCount: 12,
          commentsCount: 3,
          createdAt: '2026-09-08',
        },
        {
          id: 'demo2',
          celebrationId: 'c2',
          celebrationTitle: 'Fiesta Familiar Gurumendi',
          secureUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop&q=80',
          uploaderName: 'Mariana Gurumendi',
          likesCount: 19,
          commentsCount: 5,
          createdAt: '2026-09-08',
        },
      ];

  return (
    <div className="main-container">
      {/* Top Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            👋 Hola, <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>{user?.fullName || 'Usuario'}</strong>
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
            🎂 TiDB + Cloudinary
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              const el = document.getElementById('seccion-recuerdos');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Camera size={15} /> Ver Galería Familiar
          </button>
          <button onClick={() => router.push('/circles')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Users size={15} /> Mis Círculos
          </button>
          <button onClick={() => router.push('/profile')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Settings size={15} /> Mi Perfil
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-purple">
              <Sparkles size={14} /> Calendario Colaborativo
            </span>
            <span className="badge badge-pink">
              <ShieldCheck size={14} /> Álbumes de Recuerdos Familiares
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px' }}>
            Toca a un cumpleañero y <span className="gradient-text">mira o sube fotos</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '22px' }}>
            Cada cumpleaños tiene su propio álbum colaborativo donde todos los miembros del círculo pueden revivir recuerdos y subir fotos a Cloudinary.
          </p>

          {/* Circle Selector Chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              Filtrar por círculo:
            </span>
            {circles.map((circle) => (
              <button
                key={circle}
                onClick={() => setSelectedCircle(circle)}
                className={selectedCircle === circle ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '7px 16px', fontSize: '0.82rem' }}
              >
                <Users size={13} /> {circle}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Responsive Dashboard Grid */}
      <div className="dashboard-layout">
        {/* Left Column: Interactive Calendar Grid */}
        <section className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(221, 214, 254, 0.6)', padding: '10px', borderRadius: '12px' }}>
                <CalendarIcon size={24} color="#7E49F6" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {filteredBirthdays.length} cumpleaños registrados • Toca un nombre para ver su álbum
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
              const matches = filteredBirthdays.filter(
                (b) => b.birthDay === dayNumber && b.birthMonth === currentDate.getMonth() + 1
              );
              const isToday = dayNumber === 8 && currentDate.getMonth() === 8;

              return (
                <div key={`day-${dayNumber}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                  <span className="cell-number" style={isToday ? { color: '#9061F9', fontWeight: 800 } : {}}>
                    {dayNumber} {isToday && '• Hoy'}
                  </span>
                  {matches.map((bday) => (
                    <div
                      key={bday.id}
                      className="birthday-pill"
                      onClick={() => handleOpenCelebration(bday, 'gallery')}
                      title={`Toca para ver el álbum de fotos del cumpleaños de ${bday.fullName}`}
                    >
                      🎂 {bday.fullName.split(' ')[0]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Upcoming & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Birthdays Card */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎉 Próximos Cumpleaños
              </h3>
              <span className="badge badge-mint" style={{ fontSize: '0.72rem' }}>
                Familia
              </span>
            </div>

            {filteredBirthdays.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-dim)' }}>
                <Cake size={32} color="#C4B5FD" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '0.88rem' }}>No hay cumpleaños registrados para este mes.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredBirthdays.map((bday) => {
                  const daysLeft = bday.birthDay - 8;
                  return (
                    <div
                      key={bday.id}
                      onClick={() => handleOpenCelebration(bday, 'gallery')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid var(--border-glass)',
                        boxShadow: '0 2px 8px rgba(160, 140, 190, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9061F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #DDD6FE 0%, #FBCFE8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                          }}
                        >
                          🎂
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {bday.fullName}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                            {bday.circleName} • {bday.birthDay} de {monthNames[bday.birthMonth - 1]}
                            {bday.birthYear ? ` (${new Date().getFullYear() - bday.birthYear} años)` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className={daysLeft === 0 ? 'badge badge-pink' : 'badge badge-purple'} style={{ fontSize: '0.72rem' }}>
                          {daysLeft === 0 ? '¡Hoy! 🥳' : daysLeft > 0 ? `En ${daysLeft} días` : `Día ${bday.birthDay}`}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCelebration(bday, 'gallery');
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '8px' }}
                            title="Ver fotos de este cumpleaños"
                          >
                            <ImageIcon size={12} /> Ver Álbum
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCelebration(bday, 'upload');
                            }}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '8px' }}
                            title="Subir foto a este cumpleaños"
                          >
                            <Camera size={12} /> Subir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Add Birthday Card */}
          <section className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <Gift size={28} color="#F472B6" style={{ margin: '0 auto 8px', display: 'block' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
              ¿Falta alguien en la familia?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Agrega su fecha de cumpleaños para que todo el grupo familiar la celebre.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={16} /> Agregar Cumpleaños
            </button>
          </section>
        </div>
      </div>

      {/* CELEBRATION MODAL (ALBUM COLABORATIVO & SUBIDA) */}
      {selectedBirthday && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(35, 25, 54, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedBirthday(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              background: '#ffffff',
              boxShadow: '0 24px 50px rgba(160, 130, 200, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBirthday(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} color="#64748B" />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #DDD6FE 0%, #FBCFE8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                }}
              >
                🎂
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Álbum: Cumpleaños de {selectedBirthday.fullName}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {selectedBirthday.circleName} • {selectedBirthday.birthDay} de {monthNames[selectedBirthday.birthMonth - 1]}
                  {selectedBirthday.birthYear ? ` • Cumple ${currentDate.getFullYear() - selectedBirthday.birthYear} años` : ''}
                </p>
              </div>
            </div>

            {/* Tab Selector */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '22px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setModalTab('gallery')}
                className={modalTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                <ImageIcon size={15} /> Álbum de este Cumpleaños ({celebrationPhotos.length})
              </button>
              <button
                onClick={() => setModalTab('circle_gallery')}
                className={modalTab === 'circle_gallery' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                <Users size={15} /> Ver Fotos de todo el Círculo ({photosFeed.length > 0 ? photosFeed.length : displayPhotos.length})
              </button>
              <button
                onClick={() => setModalTab('upload')}
                className={modalTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                <Camera size={15} /> Subir Recuerdos
              </button>
            </div>

            {/* TAB 1: GALLERY OF CELEBRATION PHOTOS */}
            {modalTab === 'gallery' && (
              <div>
                {loadingCelebration ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', padding: '32px' }}>
                    ⏳ Cargando álbum de recuerdos...
                  </p>
                ) : celebrationPhotos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-dim)', background: 'rgba(245, 243, 255, 0.6)', borderRadius: '16px', border: '1px dashed var(--border-glass)' }}>
                    <Camera size={36} color="#A78BFA" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Aún no hay fotos en este álbum
                    </h4>
                    <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 18px', color: 'var(--text-muted)' }}>
                      ¡Sé el primero en compartir un recuerdo de la fiesta de {selectedBirthday.fullName.split(' ')[0]}! O también puedes explorar los recuerdos compartidos en otros cumpleaños.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setModalTab('upload')}
                        className="btn-primary"
                        style={{ padding: '10px 22px' }}
                      >
                        <Upload size={16} /> Subir la Primera Foto
                      </button>
                      <button
                        onClick={() => setModalTab('circle_gallery')}
                        className="btn-secondary"
                        style={{ padding: '10px 20px' }}
                      >
                        <Users size={16} /> Ver Fotos de la Familia
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        Haz clic en cualquier foto para verla en pantalla completa
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setModalTab('circle_gallery')}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Ver todas las fotos compartidas por el círculo familiar"
                        >
                          <Users size={13} /> Fotos de todo el círculo
                        </button>
                        <button
                          onClick={() => setModalTab('upload')}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Plus size={13} /> Sumar más fotos
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                      {celebrationPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            borderRadius: '14px',
                            overflow: 'hidden',
                            background: '#ffffff',
                            border: '1px solid var(--border-glass)',
                            boxShadow: '0 4px 14px rgba(160, 140, 190, 0.1)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div
                            style={{ aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}
                            onClick={() => openLightbox(photo, celebrationPhotos)}
                          >
                            <img
                              src={photo.secureUrl}
                              alt={photo.caption || 'Foto del evento'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Maximize2 size={13} />
                            </div>
                          </div>
                          <div style={{ padding: '10px 12px' }}>
                            {photo.caption && (
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {photo.caption}
                              </p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              <span>Por {photo.uploaderName.split(' ')[0]}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikePhoto(photo.id);
                                }}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  color: '#EC4899', fontWeight: 700,
                                }}
                              >
                                <Heart size={14} fill="#EC4899" color="#EC4899" /> {photo.likesCount}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CIRCLE-WIDE GALLERY */}
            {modalTab === 'circle_gallery' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Todas las Fotos Compartidas en {selectedBirthday.circleName}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Explora todos los recuerdos compartidos por la familia en sus distintos cumpleaños
                    </p>
                  </div>
                  <button
                    onClick={() => setModalTab('upload')}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} /> Subir nueva foto
                  </button>
                </div>

                {/* Filter chips inside modal */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setCircleFilterInModal('Todos')}
                    className={circleFilterInModal === 'Todos' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                  >
                    Todos ({displayPhotos.length})
                  </button>
                  {birthdays.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCircleFilterInModal(b.fullName)}
                      className={circleFilterInModal === b.fullName ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                    >
                      🎂 {b.fullName.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {(() => {
                  const filteredCirclePhotos = circleFilterInModal === 'Todos'
                    ? displayPhotos
                    : displayPhotos.filter(
                        (p) =>
                          p.celebrationTitle?.toLowerCase().includes(circleFilterInModal.toLowerCase()) ||
                          (p as any).caption?.toLowerCase().includes(circleFilterInModal.toLowerCase()) ||
                          p.uploaderName?.toLowerCase().includes(circleFilterInModal.toLowerCase())
                      );


                  if (filteredCirclePhotos.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-dim)', background: 'rgba(245, 243, 255, 0.6)', borderRadius: '16px' }}>
                        <Camera size={32} color="#A78BFA" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ fontSize: '0.9rem' }}>No se encontraron fotos para este filtro en el círculo.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                      {filteredCirclePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            borderRadius: '14px',
                            overflow: 'hidden',
                            background: '#ffffff',
                            border: '1px solid var(--border-glass)',
                            boxShadow: '0 4px 14px rgba(160, 140, 190, 0.1)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div
                            style={{ aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}
                            onClick={() => openLightbox(photo, filteredCirclePhotos)}
                          >
                            <img
                              src={photo.secureUrl}
                              alt={(photo as any).caption || 'Foto del evento'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {photo.celebrationTitle && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '6px',
                                  left: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.65)',
                                  color: '#fff',
                                  borderRadius: '6px',
                                  padding: '2px 6px',
                                  fontSize: '0.68rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {photo.celebrationTitle}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '10px 12px' }}>
                            {(photo as any).caption && (
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(photo as any).caption}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              <span>Por {photo.uploaderName.split(' ')[0]}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikePhoto(photo.id);
                                }}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  color: '#EC4899', fontWeight: 700,
                                }}
                              >
                                <Heart size={14} fill="#EC4899" color="#EC4899" /> {photo.likesCount}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: UPLOAD PHOTOS */}
            {modalTab === 'upload' && (
              <div
                style={{
                  background: 'rgba(245, 243, 255, 0.7)',
                  border: '2px dashed rgba(167, 139, 250, 0.5)',
                  borderRadius: '16px',
                  padding: '28px',
                  textAlign: 'center',
                }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
                  📸 Subir Foto a este Álbum Familiar
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  La foto se almacenará en tu cuenta de Cloudinary y quedará visible para todos los miembros del círculo.
                </p>

                {uploadError && (
                  <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'left' }}>
                    ⚠️ {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'left' }}>
                    ✅ {uploadSuccess}
                  </div>
                )}

                <form onSubmit={handleUploadPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="celebration-photo-input"
                  />

                  {filePreview ? (
                    <div style={{ position: 'relative', width: '100%', maxWidth: '280px', margin: '0 auto', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                      <img src={filePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff',
                          borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="celebration-photo-input"
                      className="btn-secondary"
                      style={{ margin: '0 auto', cursor: 'pointer', padding: '14px 28px', fontSize: '0.95rem' }}
                    >
                      <Upload size={18} /> Seleccionar Foto de la Cámara o Galería
                    </label>
                  )}

                  {selectedFile && (
                    <>
                      <input
                        type="text"
                        placeholder="Agrega una dedicatoria o pie de foto (ej: ¡Feliz cumpleaños! 🎉)"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 16px',
                          borderRadius: '10px', border: '1px solid var(--border-glass)',
                          background: '#ffffff', fontSize: '0.9rem',
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="check-minors"
                          checked={containsMinors}
                          onChange={(e) => setContainsMinors(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#9061F9', cursor: 'pointer' }}
                        />
                        <label htmlFor="check-minors" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          Esta foto contiene menores de edad (activa protección reforzada)
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={uploadingPhoto}
                        style={{ justifyContent: 'center', padding: '12px', margin: '0 auto', width: '100%', maxWidth: '320px' }}
                      >
                        {uploadingPhoto ? `⏳ ${uploadProgress}` : '✨ Subir Foto a Cloudinary'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN PHOTO VIEWER (LIGHTBOX) WITH NAVIGATION */}
      {lightboxPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 10, 25, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px',
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Index Counter */}
            {lightboxList.length > 1 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-42px',
                  left: '0',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                Foto {lightboxIndex + 1} de {lightboxList.length}
              </span>
            )}

            {/* Close Button */}
            <button
              onClick={() => setLightboxPhoto(null)}
              style={{
                position: 'absolute',
                top: '-44px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
              title="Cerrar (Escape)"
            >
              <X size={20} />
            </button>

            {/* High-Res Image Container with Arrows */}
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
                maxHeight: '75vh',
                background: '#000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <img
                src={lightboxPhoto.secureUrl}
                alt={lightboxPhoto.caption || 'Foto ampliada'}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
              />

              {/* Prev Button */}
              {lightboxList.length > 1 && (
                <button
                  onClick={handlePrevPhoto}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'background 0.2s ease',
                  }}
                  title="Foto anterior (←)"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Next Button */}
              {lightboxList.length > 1 && (
                <button
                  onClick={handleNextPhoto}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'background 0.2s ease',
                  }}
                  title="Foto siguiente (→)"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Footer Details */}
            <div
              style={{
                width: '100%',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#F8FAFC',
                padding: '0 8px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {lightboxPhoto.caption || lightboxPhoto.celebrationTitle || 'Recuerdo familiar'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                  Compartido por <strong>{lightboxPhoto.uploaderName}</strong>
                  {lightboxPhoto.celebrationTitle && ` • ${lightboxPhoto.celebrationTitle}`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                  href={lightboxPhoto.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                  title="Abrir imagen original en Cloudinary"
                >
                  <ExternalLink size={14} /> Abrir original
                </a>

                <button
                  onClick={() => handleLikePhoto(lightboxPhoto.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  <Heart size={16} fill="#EC4899" color="#EC4899" /> {lightboxPhoto.likesCount}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD BIRTHDAY MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(35, 25, 54, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(160, 130, 200, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              🎂 Agregar Cumpleaños al Círculo
            </h3>

            {addMessage && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                ⚠️ {addMessage}
              </div>
            )}

            <form onSubmit={handleAddBirthday} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Nombre de la persona
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mamá, Tía Rosa, Hermano..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Círculo
                </label>
                <select
                  value={newCircleId}
                  onChange={(e) => setNewCircleId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#ffffff', fontWeight: 600 }}
                >
                  {userCirclesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Fecha de Cumpleaños
                </label>
                <input
                  type="date"
                  value={newBirthDate}
                  onChange={(e) => {
                    setNewBirthDate(e.target.value);
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setNewYear(String(y));
                      setNewMonth(m);
                      setNewDay(d);
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" disabled={savingBirthday} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingBirthday ? 'Guardando...' : '✨ Guardar Cumpleaños'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY SECTION: RECENT RECUERDOS (MURO FAMILIAR) */}
      <section id="seccion-recuerdos" style={{ marginTop: '54px', scrollMarginTop: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Camera size={22} color="#EC4899" />
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Recuerdos Recientes del Círculo</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Muro colaborativo de fotos y momentos compartidos por toda la familia en Cloudinary
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {birthdays.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Subir recuerdo a:
                </span>
                <select
                  onChange={(e) => {
                    const found = birthdays.find((b) => b.id === e.target.value);
                    if (found) handleOpenCelebration(found, 'upload');
                  }}
                  value=""
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '12px', cursor: 'pointer', background: '#fff' }}
                >
                  <option value="" disabled>Selecciona cumpleañero...</option>
                  {birthdays.map((b) => (
                    <option key={b.id} value={b.id}>
                      🎂 {b.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filter Chips by Person */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Filtrar por:
          </span>
          <button
            onClick={() => setMuroFilter('Todos')}
            className={muroFilter === 'Todos' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '12px', whiteSpace: 'nowrap' }}
          >
            Todos ({displayPhotos.length})
          </button>
          {birthdays.map((b) => (
            <button
              key={b.id}
              onClick={() => setMuroFilter(b.fullName)}
              className={muroFilter === b.fullName ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              🎂 {b.fullName.split(' ')[0]}
            </button>
          ))}
        </div>

        {(() => {
          const filteredMuroPhotos = muroFilter === 'Todos'
            ? displayPhotos
            : displayPhotos.filter(
                (p) =>
                  p.celebrationTitle?.toLowerCase().includes(muroFilter.toLowerCase()) ||
                  (p as any).caption?.toLowerCase().includes(muroFilter.toLowerCase()) ||
                  p.uploaderName?.toLowerCase().includes(muroFilter.toLowerCase())
              );

          if (filteredMuroPhotos.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '18px', border: '1px dashed var(--border-glass)' }}>
                <Camera size={40} color="#C4B5FD" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  No hay recuerdos para este filtro
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Sé el primero en compartir un momento para {muroFilter}.
                </p>
                {birthdays.length > 0 && (
                  <button
                    onClick={() => {
                      const found = birthdays.find((b) => b.fullName === muroFilter) || birthdays[0];
                      handleOpenCelebration(found, 'upload');
                    }}
                    className="btn-primary"
                  >
                    <Camera size={15} /> Subir la Primera Foto
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="photo-gallery">
              {filteredMuroPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-card"
                  onClick={() => openLightbox(photo, filteredMuroPhotos)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={photo.secureUrl} alt={(photo as any).caption || photo.celebrationTitle || 'Foto'} />
                  <div className="photo-overlay">
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                      {(photo as any).caption || photo.celebrationTitle || 'Celebración'}
                    </h4>

                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.75rem', marginBottom: '10px' }}>
                      Por {photo.uploaderName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                        🔍 Toca para ampliar
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePhoto(photo.id);
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          fontSize: '0.8rem', fontWeight: 700,
                        }}
                      >
                        <Heart size={14} fill="#EC4899" color="#EC4899" /> {photo.likesCount}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
