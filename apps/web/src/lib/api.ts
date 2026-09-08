const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return data as T;
}

// Auth helpers for localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('festy_token');
}

export function setToken(token: string): void {
  localStorage.setItem('festy_token', token);
}

export function removeToken(): void {
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
