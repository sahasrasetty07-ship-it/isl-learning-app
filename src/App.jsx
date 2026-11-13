import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { SignVideoModal } from './components/common/SignVideoModal';
import { LandingPage } from './components/landing/LandingPage';
import { StudentDashboard } from './components/student/StudentDashboard';
import { LearnHub } from './components/student/LearnHub';
import { GujaratiModule } from './components/student/GujaratiModule';
import { MathModule } from './components/student/MathModule';
import { ScienceModule } from './components/student/ScienceModule';
import { ReportCard } from './components/student/ReportCard';
import { TranslatorHub } from './components/translation/TranslatorHub';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { CheckCircle2 } from 'lucide-react';

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

// Student tab IDs - must remain unchanged
export const STUDENT_TABS = ['dashboard', 'learn', 'gujarati', 'math', 'science', 'translator', 'report'];

const MainContent = () => {
  const { currentRole, activeTab, toastMessage } = useApp();
  // Landing page shows first on every visit; it is layout only, nothing is stored
  const [showLanding, setShowLanding] = useState(true);

  const renderStudentView = () => {
    switch (activeTab) {
      case 'learn':
        return <LearnHub />;
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

  const renderRoleScreen = () => {
    if (currentRole === 'teacher') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <TeacherDashboard />
        </div>
      );
    }
    if (currentRole === 'parent') {
      return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <ParentDashboard />
        </div>
      );
    }
    // Student: phone first, bottom navigation. Lessons widen on tablets for teaching in class.
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-28">
          {renderStudentView()}
        </div>
        <Navigation />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {showLanding ? (
        <LandingPage onEnter={() => setShowLanding(false)} />
      ) : (
        <>
          <Header onShowLanding={() => setShowLanding(true)} />
          <main className="flex-1">{renderRoleScreen()}</main>
        </>
      )}

      <SignVideoModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed z-50 left-4 right-4 bottom-24 sm:left-auto sm:right-6 sm:max-w-sm animate-fade-in"
        >
          <div className="bg-ink text-white px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { user, profile, loading, signInWithGoogle, signInAsDemo, isConfigured } = useAuth();

  // If auth is initializing or profile hasn't loaded yet, show the loading state
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
