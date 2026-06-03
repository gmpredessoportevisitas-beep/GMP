import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Perfil } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'gmp_token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface AuthContextType {
  perfil: Perfil | null;
  loading: boolean;
  error: string;
  login: (username: string, password: string) => Promise<{ access_token: string; perfil: Perfil }>;
  logout: () => void;
  getToken: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(async (token: string) => {
    if (!token) {
      setPerfil(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json() as Perfil;
        setPerfil(data);
        setError('');
      } else {
        removeStoredToken();
        setPerfil(null);
        if (res.status === 401) {
          setError('Tu sesion ha expirado o es invalida. Por favor, inicia sesion nuevamente.');
        } else if (res.status === 403) {
          setError('Tu usuario no tiene un perfil asignado. Contacta al administrador.');
        } else {
          setError(`Error en el servidor (${res.status}). Intentalo mas tarde.`);
        }
      }
    } catch {
      setPerfil(null);
      setError('No se pudo conectar con el servidor. Verifica tu conexion o el estado del backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      cargarPerfil(token);
    } else {
      setLoading(false);
    }
  }, [cargarPerfil]);

  async function login(username: string, password: string) {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al iniciar sesion');
      }

      const data = await res.json();
      setStoredToken(data.access_token);
      setPerfil(data.perfil);
      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexion.');
      }
      throw err;
    }
  }

  function logout() {
    removeStoredToken();
    setPerfil(null);
    setError('');
  }

  function getToken(): string {
    return getStoredToken() || '';
  }

  return (
    <AuthContext.Provider value={{ perfil, loading, error, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
