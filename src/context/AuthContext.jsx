import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [demoUser, setDemoUser] = useState(null);

  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    }
    return null;
  };

  useEffect(() => {
    let subscription = null;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data }) => {
        setSession(data?.session ?? null);
        if (data?.session?.user) {
          await fetchProfile(data.session.user.id);
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession error:', err);
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      });
      subscription = authListener?.subscription;
    } else {
      setLoading(false);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('SUPABASE_NOT_CONFIGURED');
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signInAsDemo = (role = 'student', allAccess = false) => {
    const demo = {
      id: `demo-${role}-101`,
      email: `${role}@saket-learning.edu`,
      user_metadata: {
        full_name: role === 'student' ? 'Aarav Patel (વિદ્યાર્થી)' : role === 'teacher' ? 'Mrs. Nitaben Joshi (શિક્ષક)' : 'Kavita Patel (વાલી)',
      },
      role,
      all_access: allAccess,
    };
    setDemoUser(demo);
    setProfile({
      id: demo.id,
      email: demo.email,
      full_name: demo.user_metadata.full_name,
      role,
      all_access: allAccess,
    });
  };

  const signOut = async () => {
    setDemoUser(null);
    setProfile(null);
    setSession(null);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }
  };

  const currentUser = session?.user || demoUser || null;
  const isAllAccess = Boolean(profile?.all_access);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: currentUser,
        profile,
        userRole: profile?.role || currentUser?.role || 'student',
        isAllAccess,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
