const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const AUTH_KEYS = ['token', 'role', 'user_email', 'user_name', 'organization_id'] as const;

const TOKEN_KEY = "aegis_auth_token";

type AuthResponse = {
  access_token: string;
  token_type: string;
  role: string;
  email: string;
  name: string;
  organization_id?: number | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  organization_name: string;
  industry?: string;
};

// get auth token
export const auth = { 
  getToken : (): string | null => {
  if (typeof window === "undefined") {
    return null; // Running on server
  }
  return localStorage.getItem(TOKEN_KEY) ||  sessionStorage.getItem(TOKEN_KEY);
  },

  // set auth token
setToken : (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
},

// remove auth token
logout : () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
},

  // Check if logged in
  isLoggedIn():
   boolean {
    return !!this.getToken();
  },

  // Get Authorization header
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
    
  }
};

 

async function apiRequest<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...auth.getAuthHeader(),
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options,);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || 'Request failed');
  }

  return data as T;
}

function getStorage(remember: boolean) {
  if (typeof window === 'undefined') {
    return null;
  }

  return remember ? localStorage : sessionStorage;
}

function clearStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

function readStoredValue(key: (typeof AUTH_KEYS)[number]) {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/api/auth/login', 'POST', payload);
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/api/auth/register', 'POST', payload);
}
export async function apirequest<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  return apiRequest<T>(path, method, body);
}
export function persistAuth(auth: AuthResponse, remember = true) {
  if (typeof window === 'undefined') {
    return;
  }

  const primaryStorage = getStorage(remember);
  const secondaryStorage = remember ? sessionStorage : localStorage;

  if (!primaryStorage) {
    return;
  }

  primaryStorage.setItem('token', auth.access_token);
  primaryStorage.setItem('role', auth.role);
  primaryStorage.setItem('user_email', auth.email);
  primaryStorage.setItem('user_name', auth.name);
  if (auth.organization_id != null) {
    primaryStorage.setItem('organization_id', String(auth.organization_id));
  }

  secondaryStorage.removeItem('token');
  secondaryStorage.removeItem('role');
  secondaryStorage.removeItem('user_email');
  secondaryStorage.removeItem('user_name');
  secondaryStorage.removeItem('organization_id');
}

export function getToken() {
  return readStoredValue('token');
}

export function getRole() {
  return readStoredValue('role');
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  clearStorage();
  window.location.href = '/auth';
}
