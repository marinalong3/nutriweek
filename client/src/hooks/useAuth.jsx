import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('nw_user');
    const session = localStorage.getItem('nw_session');
    if (saved && session) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('nw_session', JSON.stringify(data.session));
    localStorage.setItem('nw_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, referralCode) => {
    const { data } = await api.post('/auth/register', { name, email, password, referral_code: referralCode });
    localStorage.setItem('nw_session', JSON.stringify(data.session));
    localStorage.setItem('nw_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('nw_session');
    localStorage.removeItem('nw_user');
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('nw_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
