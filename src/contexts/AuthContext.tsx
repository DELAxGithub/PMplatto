import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('🔐 AuthProvider initializing...');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active sessions and sets the user
    console.log('🔐 Checking authentication session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Auth session result:', session ? 'FOUND' : 'NOT_FOUND');
      if (session?.user) {
        console.log('👤 User authenticated:', session.user.email);
        console.log('🔐 User role:', session.user.role);
        console.log('🔐 User aud:', session.user.aud);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'WITH_SESSION' : 'NO_SESSION');
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // ユーザーの状態に応じて適切なページにリダイレクト
      if (currentUser) {
        // ログイン後は、ログインページにいた場合のみホームにリダイレクト
        if (location.pathname === '/login') {
          navigate('/', { replace: true });
        }
      } else {
        // ログアウト時やセッション切れ時は常にログインページへ
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }
        throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}