'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { dbService, isSupabaseConfigured, supabase } from './db';
import * as T from './types';
import { Key, AlertCircle, RefreshCw, LogOut } from 'lucide-react';

interface AuthContextType {
  user: T.Profile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<T.Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await dbService.login(session.user.email || '');
            setUser(profile);
          }
        } else {
          const stored = localStorage.getItem('aud_session_user');
          if (stored) {
            setUser(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  // Watch route changes to enforce role-based access
  useEffect(() => {
    if (loading) return;

    const isLoginPath = pathname === '/login';
    const isRootPath = pathname === '/';

    if (!user) {
      if (!isLoginPath && !isRootPath) {
        router.replace('/login');
      }
    } else {
      if (isLoginPath || isRootPath) {
        // Redirect to their dashboard
        router.replace(`/${user.role === 'parent' ? 'student' : user.role}`);
      } else {
        // Prevent accessing other roles' folders
        const pathParts = pathname.split('/');
        const currentRoleFolder = pathParts[1]; // e.g., 'admin', 'teacher', 'student'
        const allowedFolders: string[] = [user.role];
        // Parent goes to student folder
        if (user.role === 'parent') {
          allowedFolders.push('student');
        }
        
        if (['admin', 'teacher', 'student', 'parent'].includes(currentRoleFolder) && !allowedFolders.includes(currentRoleFolder)) {
          router.replace(`/${user.role === 'parent' ? 'student' : user.role}`);
        }
      }
    }
  }, [user, pathname, loading, router]);

  const login = async (email: string, password = 'password123'): Promise<boolean> => {
    setLoading(true);
    try {
      // 1. Try standard Supabase Auth first
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password
        });

        if (!error && data.user) {
          const profileData = await dbService.login(email.trim());
          if (profileData) {
            setUser(profileData);
            return true;
          }
        }
      }

      // 2. If standard login fails or if Supabase is not configured, load profile
      let profile = null;
      try {
        profile = await dbService.login(email);
      } catch (err) {
        console.warn("Bypassing profile query check:", err);
      }

      if (profile) {
        // Check for custom password override (if active)
        if (profile.custom_password) {
          if (password === profile.custom_password) {
            if (!isSupabaseConfigured) {
              localStorage.setItem('aud_session_user', JSON.stringify(profile));
            }
            setUser(profile);
            return true;
          }
          return false;
        }

        // Check for temporary password (if active)
        if (profile.temp_password) {
          if (password === profile.temp_password) {
            if (!isSupabaseConfigured) {
              localStorage.setItem('aud_session_user', JSON.stringify(profile));
            }
            setUser(profile);
            return true;
          }
          return false;
        }
      }

      // 3. For Mock storage flow, if no temp/custom password is set, log them in
      if (!isSupabaseConfigured && profile) {
        localStorage.setItem('aud_session_user', JSON.stringify(profile));
        setUser(profile);
        return true;
      }

      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (!isSupabaseConfigured) {
      localStorage.removeItem('aud_session_user');
    } else {
      supabase?.auth.signOut();
    }
    router.replace('/login');
  };

  const refreshUserSession = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await dbService.login(session.user.email || '');
          setUser(profile);
        }
      } else {
        if (user) {
          const profile = await dbService.login(user.email);
          if (profile) {
            localStorage.setItem('aud_session_user', JSON.stringify(profile));
            setUser(profile);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  const showPasswordChangeForce = user && user.role !== 'admin' && !user.password_changed && pathname !== '/login';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUserSession }}>
      {showPasswordChangeForce ? (
        <FirstTimePasswordChange />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

function FirstTimePasswordChange() {
  const { user, logout, refreshUserSession } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Only update standard auth if they are NOT logging in via temporary bypass
      if (isSupabaseConfigured && supabase && !user.temp_password) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }
        }
      }

      await dbService.updateCustomPassword(user.id, newPassword);
      await refreshUserSession();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-md max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center">
            <Key className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">First-Time Portal Sign In</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            For security reasons, you are required to change your temporary password before accessing the dashboard.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[11px] font-bold text-gray-700">Choose New Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-gray-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700">Confirm New Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            <span>{loading ? 'Updating...' : 'Update Password & Continue'}</span>
          </button>
        </form>

        <div className="border-t border-gray-150 pt-4 flex justify-between items-center text-xs">
          <span className="text-gray-400 font-medium">Logged in as: <strong className="text-gray-700">{user.email}</strong></span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
