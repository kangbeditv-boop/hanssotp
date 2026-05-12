import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    if (token) {
      fetchUser(token);
    } else if (adminToken) {
      setLoading(false);
    } else {
      setLoading(false);
    }

    if (adminToken) {
      const savedAdmin = localStorage.getItem('admin');
      if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  async function fetchUser(token) {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await api.get('/api/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    setUser(data.data.user);
    return data;
  }

  async function register(formData) {
    const { data } = await api.post('/api/auth/register', formData);
    localStorage.setItem('token', data.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    setUser(data.data.user);
    return data;
  }

  async function adminLogin(username, password) {
    const { data } = await api.post('/api/admin/login', { username, password });
    localStorage.setItem('adminToken', data.data.token);
    localStorage.setItem('admin', JSON.stringify(data.data.admin));
    setAdmin(data.data.admin);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }

  function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
  }

  function updateUser(updates) {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }

  return (
    <AuthContext.Provider
      value={{ user, admin, loading, login, register, adminLogin, logout, adminLogout, updateUser, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
