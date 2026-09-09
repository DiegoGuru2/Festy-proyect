const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Checks if a JWT token has expired based on its 'exp' claim.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && typeof payload.exp === 'number') {
      // payload.exp is unix timestamp in seconds
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Handles closing the session immediately when a token expires or is rejected.
 */
export function handleSessionExpired(reason = 'Tu sesión ha caducado por seguridad.'): void {
  removeToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('festy_session_expired', { detail: { reason } }));

    const pathname = window.location.pathname;
    // If user is in a protected route, redirect to login page with expired flag
    if (pathname === '/' || pathname === '/profile' || pathname === '/circles') {
      window.location.replace('/login?expired=1');
    }
  }
}

/**
 * Configures a proactive client-side timer to auto-logout when JWT expires.
 */
export function scheduleTokenExpiration(token: string): void {
  if (typeof window === 'undefined') return;

  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    if (payload.exp && typeof payload.exp === 'number') {
      const msRemaining = payload.exp * 1000 - Date.now();
      if (msRemaining <= 0) {
        handleSessionExpired();
      } else {
        autoLogoutTimer = setTimeout(() => {
          handleSessionExpired();
        }, msRemaining);
      }
    }
  } catch {
    // Ignore parse error
  }
}

export async function apiFetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  // Proactively check token expiration before sending request
  if (token && isTokenExpired(token)) {
    handleSessionExpired('Tu token de sesión ha expirado');
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // If unauthorized (401) or forbidden (403), token is invalid or expired
  if (res.status === 401 || res.status === 403) {
    handleSessionExpired(data.message || 'Tu sesión ha caducado');
    throw new Error(data.message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return data as T;
}

// Auth helpers for localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('festy_token');
  if (!token) return null;

  if (isTokenExpired(token)) {
    handleSessionExpired();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  localStorage.setItem('festy_token', token);
  scheduleTokenExpiration(token);
}

export function removeToken(): void {
  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
  }
  localStorage.removeItem('festy_token');
  localStorage.removeItem('festy_user');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('festy_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: any): void {
  localStorage.setItem('festy_user', JSON.stringify(user));
}
