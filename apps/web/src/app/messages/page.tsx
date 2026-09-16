'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, getUser } from '@/lib/api';
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  CheckCheck,
  Check,
  Users,
  Sparkles,
  Smile,
} from 'lucide-react';

interface SharedCircle {
  id: string;
  name: string;
}

interface LastMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Contact {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  sharedCircles: SharedCircle[];
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  circleId: string | null;
}

const QUICK_MESSAGES = [
  '¡Feliz Cumpleaños! 🎉',
  '¿Cómo estás? 😊',
  '¡Nos vemos en la fiesta! 🎂',
  '¡Gracias! 💜',
  '¡Hola! 👋',
];

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [circleFilter, setCircleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // All unique circles across contacts
  const allCircles = React.useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) =>
      c.sharedCircles.forEach((sc) => map.set(sc.id, sc.name))
    );
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contacts]);

  // Auth check
  useEffect(() => {
    const token = getToken();
    const userData = getUser();
    if (!token) {
      router.replace('/info');
      return;
    }
    setUser(userData);
    loadContacts();
  }, []);

  // Filter contacts
  useEffect(() => {
    let filtered = contacts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    if (circleFilter !== 'all') {
      filtered = filtered.filter((c) =>
        c.sharedCircles.some((sc) => sc.id === circleFilter)
      );
    }
    setFilteredContacts(filtered);
  }, [contacts, searchQuery, circleFilter]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages when a contact is selected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedContact) {
      pollRef.current = setInterval(() => {
        loadMessages(selectedContact.id, true);
        loadContacts(true);
      }, 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = getToken()!;
      const data = await apiFetch('/api/messages/contacts', { token });
      setContacts(data.contacts || []);
    } catch (err: any) {
      if (!silent) console.error('Error loading contacts:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMessages = async (contactId: string, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      const token = getToken()!;
      const data = await apiFetch(`/api/messages/history/${contactId}`, { token });
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error loading messages:', err.message);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const markAsRead = async (contactId: string) => {
    try {
      const token = getToken()!;
      await apiFetch(`/api/messages/read/${contactId}`, {
        method: 'PATCH',
        token,
      });
    } catch {}
  };

  const selectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
    await loadMessages(contact.id);
    if (contact.unreadCount > 0) {
      await markAsRead(contact.id);
      loadContacts(true);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || sendingMessage) return;
    try {
      setSendingMessage(true);
      const token = getToken()!;
      const data = await apiFetch('/api/messages/send', {
        method: 'POST',
        token,
        body: {
          receiverId: selectedContact.id,
          content: newMessage.trim(),
        },
      });
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      loadContacts(true);
    } catch (err: any) {
      console.error('Error sending message:', err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = [
      'linear-gradient(135deg, #9061F9 0%, #C084FC 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const truncateMsg = (text: string, max = 40) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div id="messages-page" style={{ height: 'calc(100vh - 72px)', display: 'flex', overflow: 'hidden' }}>
      {/* ═══ SIDEBAR: CONTACTS LIST ═══ */}
      <aside
        style={{
          width: '380px',
          minWidth: '320px',
          borderRight: '1px solid var(--border-glass)',
          display: showMobileChat ? 'none' : 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px)',
        }}
        className="messages-sidebar"
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '20px 20px 14px',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Mensajes
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                Familia y compañeros
              </p>
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              position: 'relative',
              marginBottom: '10px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              id="search-contacts"
              type="text"
              placeholder="Buscar familiar o compañero…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.85rem',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                outline: 'none',
                transition: 'var(--transition-smooth)',
                color: 'var(--text-main)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(144,97,249,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glass)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Circle Filter Chips */}
          {allCircles.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCircleFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: circleFilter === 'all' ? 'none' : '1px solid var(--border-glass)',
                  background: circleFilter === 'all' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.6)',
                  color: circleFilter === 'all' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Todos
              </button>
              {allCircles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => setCircleFilter(circle.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    border:
                      circleFilter === circle.id ? 'none' : '1px solid var(--border-glass)',
                    background:
                      circleFilter === circle.id
                        ? 'var(--accent-gradient)'
                        : 'rgba(255,255,255,0.6)',
                    color: circleFilter === circle.id ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {circle.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                Cargando contactos…
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Users size={40} style={{ color: 'var(--accent-pastel-lavender)', marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {searchQuery ? 'No se encontraron contactos' : 'Aún no tienes contactos'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                Únete a un círculo para empezar a chatear
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                id={`contact-${contact.id}`}
                onClick={() => selectContact(contact)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  background:
                    selectedContact?.id === contact.id
                      ? 'rgba(144, 97, 249, 0.08)'
                      : 'transparent',
                  borderLeft:
                    selectedContact?.id === contact.id
                      ? '3px solid var(--accent-primary)'
                      : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (selectedContact?.id !== contact.id) {
                    e.currentTarget.style.background = 'rgba(221, 214, 254, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedContact?.id !== contact.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: contact.avatarUrl ? `url(${contact.avatarUrl}) center/cover` : getAvatarColor(contact.fullName),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(144,97,249,0.15)',
                  }}
                >
                  {!contact.avatarUrl && (
                    <span style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                      {getInitial(contact.fullName)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontWeight: contact.unreadCount > 0 ? 700 : 600,
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contact.fullName}
                    </span>
                    {contact.lastMessage && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: contact.unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-dim)',
                          fontWeight: contact.unreadCount > 0 ? 700 : 400,
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      >
                        {formatTime(contact.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Circle badges */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                    {contact.sharedCircles.slice(0, 2).map((sc) => (
                      <span
                        key={sc.id}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(221, 214, 254, 0.5)',
                          color: '#6D28D9',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sc.name}
                      </span>
                    ))}
                    {contact.sharedCircles.length > 2 && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        +{contact.sharedCircles.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Last message preview */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: contact.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-dim)',
                        fontWeight: contact.unreadCount > 0 ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {contact.lastMessage
                        ? (contact.lastMessage.senderId === user?.id ? 'Tú: ' : '') +
                          truncateMsg(contact.lastMessage.content)
                        : 'Empieza una conversación'}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span
                        style={{
                          minWidth: '22px',
                          height: '22px',
                          borderRadius: '11px',
                          background: 'var(--accent-gradient)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                          flexShrink: 0,
                          marginLeft: '8px',
                          boxShadow: '0 2px 8px rgba(144,97,249,0.3)',
                        }}
                      >
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ═══ MAIN: CHAT AREA ═══ */}
      <main
        style={{
          flex: 1,
          display: showMobileChat || !selectedContact ? 'flex' : 'flex',
          flexDirection: 'column',
          background: 'var(--bg-main)',
          position: 'relative',
        }}
        className="messages-main"
      >
        {!selectedContact ? (
          /* Empty State */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '40px',
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '28px',
                background: 'var(--accent-gradient-pastel)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(144,97,249,0.15)',
              }}
            >
              <MessageCircle size={44} color="#9061F9" />
            </div>
            <h3
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                textAlign: 'center',
              }}
            >
              Mensajes de Festy
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                maxWidth: '360px',
                lineHeight: 1.6,
              }}
            >
              Selecciona un familiar o compañero para empezar a chatear. Solo puedes hablar con personas en tus círculos. 💜
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(221,214,254,0.4)', color: '#6D28D9', fontWeight: 600 }}>
                🏠 Familia
              </span>
              <span style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(251,207,232,0.4)', color: '#BE185D', fontWeight: 600 }}>
                💼 Compañeros
              </span>
              <span style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(167,243,208,0.4)', color: '#065F46', fontWeight: 600 }}>
                🎉 Amigos
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-glass)',
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(14px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 10,
              }}
            >
              {/* Back button (mobile) */}
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setShowMobileChat(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '10px',
                  display: 'none',
                  transition: 'var(--transition-smooth)',
                  color: 'var(--text-muted)',
                }}
                className="mobile-back-btn"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Contact Avatar */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: selectedContact.avatarUrl
                    ? `url(${selectedContact.avatarUrl}) center/cover`
                    : getAvatarColor(selectedContact.fullName),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 3px 10px rgba(144,97,249,0.15)',
                }}
              >
                {!selectedContact.avatarUrl && (
                  <span style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                    {getInitial(selectedContact.fullName)}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedContact.fullName}
                </h3>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {selectedContact.sharedCircles.map((sc) => (
                    <span
                      key={sc.id}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(221, 214, 254, 0.5)',
                        color: '#6D28D9',
                      }}
                    >
                      {sc.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  <Sparkles size={24} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.9rem' }}>Cargando mensajes…</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Smile size={40} style={{ color: 'var(--accent-pastel-lavender)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ¡Empieza la conversación!
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Envía el primer mensaje a {selectedContact.fullName} 💬
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderId === user?.id;
                    const showDateSep =
                      idx === 0 ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(messages[idx - 1].createdAt).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSep && (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '12px 0 6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--text-dim)',
                                background: 'rgba(255,255,255,0.7)',
                                padding: '4px 14px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--border-glass)',
                              }}
                            >
                              {new Date(msg.createdAt).toLocaleDateString('es', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            marginBottom: '2px',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%',
                              padding: '10px 16px',
                              borderRadius: isMine
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                              background: isMine
                                ? 'var(--accent-gradient)'
                                : 'rgba(255, 255, 255, 0.85)',
                              color: isMine ? '#fff' : 'var(--text-main)',
                              boxShadow: isMine
                                ? '0 3px 14px rgba(144,97,249,0.25)'
                                : '0 2px 8px rgba(150,130,180,0.1)',
                              border: isMine ? 'none' : '1px solid var(--border-glass)',
                              position: 'relative',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.88rem',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.content}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '4px',
                                marginTop: '4px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  opacity: 0.7,
                                  color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)',
                                }}
                              >
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {isMine && (
                                msg.isRead ? (
                                  <CheckCheck
                                    size={14}
                                    style={{ color: 'rgba(255,255,255,0.9)' }}
                                  />
                                ) : (
                                  <Check
                                    size={14}
                                    style={{ color: 'rgba(255,255,255,0.6)' }}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Messages */}
            <div
              style={{
                padding: '6px 20px',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                borderTop: '1px solid rgba(233,224,243,0.5)',
                background: 'rgba(255,255,255,0.4)',
              }}
            >
              {QUICK_MESSAGES.map((qm) => (
                <button
                  key={qm}
                  onClick={() => {
                    setNewMessage(qm);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition-smooth)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(221,214,254,0.3)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {qm}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-glass)',
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(14px)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
              }}
            >
              <textarea
                ref={textareaRef}
                id="message-input"
                value={newMessage}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje…"
                rows={1}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.85)',
                  fontSize: '0.88rem',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  outline: 'none',
                  resize: 'none',
                  maxHeight: '120px',
                  lineHeight: 1.4,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  color: 'var(--text-main)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(144,97,249,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                id="send-message-btn"
                onClick={handleSend}
                disabled={!newMessage.trim() || sendingMessage}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '16px',
                  border: 'none',
                  background:
                    newMessage.trim() && !sendingMessage
                      ? 'var(--accent-gradient)'
                      : 'rgba(221,214,254,0.4)',
                  color: newMessage.trim() && !sendingMessage ? '#fff' : 'var(--text-dim)',
                  cursor: newMessage.trim() && !sendingMessage ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'var(--transition-smooth)',
                  boxShadow:
                    newMessage.trim() && !sendingMessage
                      ? '0 4px 14px rgba(144,97,249,0.3)'
                      : 'none',
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        )}
      </main>

      {/* ═══ RESPONSIVE STYLES ═══ */}
      <style jsx>{`
        @media (max-width: 768px) {
          .messages-sidebar {
            width: 100% !important;
            min-width: 0 !important;
            border-right: none !important;
            display: ${showMobileChat ? 'none' : 'flex'} !important;
          }
          .messages-main {
            display: ${showMobileChat || !selectedContact ? 'flex' : 'none'} !important;
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .messages-sidebar {
            display: flex !important;
          }
          .messages-main {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
