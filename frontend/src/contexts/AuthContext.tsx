import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Perfil } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

interface AuthContextType {
  perfil: Perfil | null;
  loading: boolean;
  error: string;
  login: (username: string, password: string) => Promise<{ perfil: Perfil }>;
  logout: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleUnauthorized = useCallback(() => {
    setPerfil(null);
    setError('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.');
  }, []);

  const authFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const res = await fetch(url, { ...init, credentials: 'include' });
    if (res.status === 401) {
      handleUnauthorized();
    }
    return res;
  }, [handleUnauthorized]);

  const cargarPerfil = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/auth/me`);
      if (res.ok) {
        const data = await res.json() as Perfil;
        setPerfil(data);
        setError('');
      } else {
        setPerfil(null);
        if (res.status === 403) {
          setError('Tu usuario no tiene un perfil asignado. Contacta al administrador.');
        } else if (res.status !== 401) {
          setError(`Error en el servidor (${res.status}). Intentalo mas tarde.`);
        }
      }
    } catch {
      setPerfil(null);
      setError('No se pudo conectar con el servidor. Verifica tu conexion o el estado del backend.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  async function login(username: string, password: string) {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
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
      setPerfil(data.perfil);
      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexion.');
      }
      throw err;
    }
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    setPerfil(null);
    setError('');
  }

  return (
    <AuthContext.Provider value={{ perfil, loading, error, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}