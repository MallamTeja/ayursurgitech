import { createContext, useContext, useState } from 'react';
import { get, post, TOKEN_KEY, USER_KEY } from './api';

const AuthContext = createContext(null);

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Rehydrated in the state initialiser, so a returning user never flashes as logged out.
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readJson(USER_KEY));
  // No admin session here any more — the ops desk has no sign-in. This context is the
  // shopper's alone.

  function startSession({ token: t, user: u }) {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }

  // ponytail: the token is just the user's _id — see "known holes" in SPEC.md.
  const value = {
    user,
    token,

    login: async (phone, password) => startSession(await post('/auth/login', { phone, password })),

    register: async (name, phone, password) =>
      startSession(await post('/auth/register', { name, phone, password })),

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    },

    // Re-reads the user from the server. Checkout calls this after adding an address so the
    // picker shows it — without it that screen is write-only.
    refreshUser: async () => {
      const fresh = await get('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
      return fresh;
    },

    // Same cache write without the round trip, for endpoints that already return the new user
    // or address list.
    updateUser: (next) => {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      setUser(next);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth needs an AuthProvider above it.');
  return ctx;
}
