import React, { useState } from 'react';
import { Sparkles, ExternalLink, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';

// Sign-in screen: branding + Google only.
// The demo shortcuts exist only when VITE_ENABLE_DEMO === 'true' (default off)
// and stay entirely local — they never send a role to the database.
export const LoginScreen = ({ signInWithGoogle, signInAsDemo, isConfigured, demoEnabled = false }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      if (err?.message === 'SUPABASE_NOT_CONFIGURED') {
        setAuthError(
          'Supabase credentials are not configured in .env. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
      } else {
        setAuthError(
          err?.message || 'Failed to initialize Google Sign In. Please verify your Supabase OAuth configuration.'
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemo = (role, allAccess = false) => {
    try {
      signInAsDemo(role, allAccess);
    } catch {
      setAuthError('Demo mode is disabled in this build.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        <div className="glass-card-dark p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40 text-3xl font-black text-white">
              સ
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Saket <span className="text-amber-400 font-normal">(સાકેત)</span>
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ISL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Gujarati Sign Language Inclusive Learning
            </p>
            <p lang="gu" className="text-[11px] text-amber-400/90 font-medium">
              ગુજરાતી સંકેત ભાષા શિક્ષણ અને સંવાદ પ્લેટફોર્મ
            </p>
          </div>

          {authError && (
            <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 p-3 rounded-2xl text-xs flex items-start gap-2.5 text-left" role="alert">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Authentication Note:</span>
                <p className="text-[11px] leading-relaxed text-rose-200/90">{authError}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
            >
              {isSigningIn ? (
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{isSigningIn ? 'Connecting to Google…' : 'Sign in with Google'}</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              You’ll choose your role (student, parent or teacher) after signing in.
            </p>
          </div>

          {demoEnabled && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Demo access (local only, no database writes)
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['student', 'parent', 'teacher'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemo(role)}
                    className="min-h-[44px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold capitalize"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card-subtle p-3.5 rounded-2xl border border-white/5 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-medium text-slate-300">
                Supabase Backend: {isConfigured ? 'Connected' : 'Credentials Pending (.env)'}
              </span>
            </div>
            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              aria-expanded={showSqlGuide}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <span>Setup Guide</span>
              {showSqlGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showSqlGuide && (
            <div className="pt-2 border-t border-white/5 space-y-2 text-[11px] text-slate-300">
              <p><strong>1. Add credentials in <code>.env</code>:</strong></p>
              <pre className="bg-slate-900/90 p-2 rounded-lg text-[10px] text-amber-300 overflow-x-auto border border-white/10 font-mono">
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <p><strong>2. Run the project SQL</strong> (profiles, RPCs, student_codes, student_progress, student_links) in the Supabase SQL editor.</p>
              <a
                href="https://supabase.com/dashboard/project/_/sql"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 font-semibold"
              >
                Open SQL editor <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          Prototype for inclusive Gujarati learning
        </p>
      </div>
    </div>
  );
};
