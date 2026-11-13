import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { SignVideoModal } from './components/common/SignVideoModal';
import { StudentDashboard } from './components/student/StudentDashboard';
import { GujaratiModule } from './components/student/GujaratiModule';
import { MathModule } from './components/student/MathModule';
import { ScienceModule } from './components/student/ScienceModule';
import { ReportCard } from './components/student/ReportCard';
import { TranslatorHub } from './components/translation/TranslatorHub';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
    </div>
    <div className="glass-card-dark p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 relative z-10 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-500/30 border border-amber-300/40 animate-pulse">
        સ
      </div>
      <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-xs font-bold text-slate-100">
          Saket (સાકેત)
        </p>
        <p className="text-[11px] text-slate-400">
          Loading inclusive learning portal...
        </p>
      </div>
    </div>
  </div>
);

const MainContent = () => {
  const { currentRole, activeTab, isMobileFrame, toastMessage } = useApp();

  // Student active tab view with fallback
  const STUDENT_TABS = ['dashboard', 'gujarati', 'math', 'science', 'translator', 'report'];
  const renderStudentView = () => {
    const safeTab = STUDENT_TABS.includes(activeTab) ? activeTab : 'dashboard';
    switch (safeTab) {
      case 'gujarati':
        return <GujaratiModule />;
      case 'math':
        return <MathModule />;
      case 'science':
        return <ScienceModule />;
      case 'translator':
        return <TranslatorHub />;
      case 'report':
        return <ReportCard />;
      case 'dashboard':
      default:
        return <StudentDashboard />;
    }
  };

  // Render role-specific screen: strictly Student, Teacher, or Parent
  const renderRoleScreen = () => {
    if (currentRole === 'teacher') {
      return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <TeacherDashboard />
        </div>
      );
    }

    if (currentRole === 'parent') {
      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <ParentDashboard />
        </div>
      );
    }

    // Default: Student Learning Experience (role === 'student' or fallback)
    // The student bottom Navigation is rendered ONLY for the student view.
    if (isMobileFrame) {
      return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-2 sm:p-6 overflow-x-hidden">
          {/* Mobile Phone Mockup Shell with Glass Bezel */}
          <div className="w-full max-w-[420px] bg-slate-900/90 rounded-[44px] shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.15)_inset] p-[7px] overflow-hidden flex flex-col h-[854px] max-h-[92vh] relative transition-all">
            {/* Phone Speaker & Dynamic Island / Camera Notch */}
            <div className="bg-slate-950 h-7 w-full flex items-center justify-center relative shrink-0 rounded-t-[38px]">
              <div className="w-24 h-4 bg-black/80 rounded-full flex items-center justify-center gap-2 px-2 border border-white/10 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/60"></div>
                </div>
                <div className="w-7 h-1 rounded-full bg-slate-800"></div>
              </div>
            </div>

            {/* Scrollable Viewport with Ambient Glass Backdrop */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 bg-gradient-to-b from-slate-50/90 via-slate-100/80 to-slate-50/90 w-full max-w-full backdrop-blur-md">
              <div className="w-full max-w-full overflow-x-hidden">
                {renderStudentView()}
              </div>
            </div>

            {/* Bottom Mobile Navigation Bar */}
            <div className="w-full max-w-full overflow-hidden shrink-0 rounded-b-[38px]">
              <Navigation />
            </div>
          </div>
        </div>
      );
    }

    // Full responsive layout
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-24 relative">
        {renderStudentView()}
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto z-30 px-3">
          <Navigation />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/90 flex flex-col text-slate-900 selection:bg-amber-200 selection:text-amber-900 relative overflow-x-hidden">
      {/* Ambient background light orbs for glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[30rem] h-[30rem] rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-purple-400/15 blur-3xl" />
      </div>

      <Header />

      {/* Main Role Content */}
      <main className="flex-1">
        {renderRoleScreen()}
      </main>

      {/* Global Sign Video Modal */}
      <SignVideoModal />

      {/* Floating Frosted Glass Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 animate-bounce-short">
          <div className="glass-card-dark text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold tracking-wide">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/40 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-slate-100">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { user, profile, loading, signInWithGoogle, signInAsDemo, isConfigured } = useAuth();

  // If auth is initializing or profile hasn't loaded yet, show the loading state, never the role switcher
  if (loading || (user && !profile)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <LoginScreen
        signInWithGoogle={signInWithGoogle}
        signInAsDemo={signInAsDemo}
        isConfigured={isConfigured}
      />
    );
  }

  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

