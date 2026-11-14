import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
