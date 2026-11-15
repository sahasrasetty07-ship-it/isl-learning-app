import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

// Demo mode is OFF unless explicitly enabled at build time. It never writes a
// role to Supabase and never runs when the flag is absent.
const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO === 'true';
const DEMO_KEY = 'gsl-demo-v1';
const VALID_ROLES = ['student', 'parent', 'teacher'];

const clearDemoFlags = () => {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* storage may be unavailable */
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [demoUser, setDemoUser] = useState(() => {
    if (!DEMO_ENABLED) return null;
    try {
      return JSON.parse(localStorage.getItem(DEMO_KEY)) || null;
    } catch {
      return null;
    }
  });

  // Fetch the signed-in user's profile. Role is whatever the database says —
  // never defaulted here.
  const refreshProfile = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !userId) {
      setProfile(null);
      return null;
    }
    setRoleLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return data;
      }
      if (error) console.warn('Profile fetch error:', error.message);
      setProfile(null);
      return null;
    } catch (err) {
      console.warn('Profile fetch error:', err);
      setProfile(null);
      return null;
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    let subscription = null;

    if (isSupabaseConfigured) {
      supabase.auth
        .getSession()
        .then(async ({ data }) => {
          const nextSession = data?.session ?? null;
          setSession(nextSession);
          if (nextSession?.user) {
            await refreshProfile(nextSession.user.id);
          } else {
            clearDemoFlags();
            setProfile(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Supabase getSession error:', err);
          setLoading(false);
        });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await refreshProfile(newSession.user.id);
        } else {
          clearDemoFlags();
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
  }, [refreshProfile]);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('SUPABASE_NOT_CONFIGURED');
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  // First-and-only role choice. "Role already set" counts as success.
  const chooseRole = async (role) => {
    if (!VALID_ROLES.includes(role)) {
      return { ok: false, error: 'invalid_role' };
    }
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'not_configured' };
    }

    const { error } = await supabase.rpc('set_my_role', { p_role: role });
    if (error) {
      const message = `${error.message || ''}`.toLowerCase();
      if (message.includes('already')) {
        // The database keeps its word: reload the real role and carry on.
        if (session?.user?.id) await refreshProfile(session.user.id);
        return { ok: true, alreadySet: true };
      }
      return { ok: false, error: error.message || 'role_failed', code: error.code };
    }

    if (session?.user?.id) await refreshProfile(session.user.id);
    return { ok: true };
  };

  // Local-only demo session. Guarded by VITE_ENABLE_DEMO and never writes to
  // Supabase (no role, no progress, no links).
  const signInAsDemo = (role = 'student', allAccess = false) => {
    if (!DEMO_ENABLED) {
      throw new Error('DEMO_DISABLED');
    }
    const safeRole = VALID_ROLES.includes(role) ? role : 'student';
    const demo = {
      id: `demo-${safeRole}-101`,
      email: `${safeRole}@demo.local`,
      user_metadata: { full_name: `${safeRole} (demo)` },
      role: safeRole,
      all_access: allAccess
    };
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    } catch {
      /* ignore */
    }
    setDemoUser(demo);
    setProfile({
      id: demo.id,
      email: demo.email,
      full_name: demo.user_metadata.full_name,
      role: safeRole,
      all_access: allAccess
    });
  };

  const signOut = async () => {
    setDemoUser(null);
    setProfile(null);
    setSession(null);
    clearDemoFlags();

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
  // The single source of truth for the app's role: the database profile.
  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: currentUser,
        profile,
        role,
        roleLoading,
        chooseRole,
        refreshProfile: () => refreshProfile(currentUser?.id),
        isAllAccess,
        loading,
        isConfigured: isSupabaseConfigured,
        demoEnabled: DEMO_ENABLED,
        signInWithGoogle,
        signInAsDemo,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
