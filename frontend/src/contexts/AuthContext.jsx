import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'gmp_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(async (token) => {
    if (!token) {
      setPerfil(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
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

  async function login(email, password) {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

  function getToken() {
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