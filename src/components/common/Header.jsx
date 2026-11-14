import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from './header/BrandMark';
import { RoleSwitcher } from './header/RoleSwitcher';
import { StatPills } from './header/StatPills';
import { OverflowMenu } from './header/OverflowMenu';
import { Globe } from 'lucide-react';

export const Header = () => {
  const {
    currentRole,
    setCurrentRole,
    canSwitchRoles,
    uiLanguage,
    setUiLanguage,
    audioEnabled,
    setAudioEnabled,
    student,
  } = useApp();

  const { user, profile, isAllAccess, signOut } = useAuth();
  const isEn = uiLanguage === 'en';

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[52px] sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <BrandMark uiLanguage={uiLanguage} />
        </div>

        {/* Center: Role Switcher (Hidden on narrow mobile, visible from sm up) */}
        <div className="hidden sm:flex items-center justify-center flex-1">
          <RoleSwitcher
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            canSwitchRoles={canSwitchRoles}
            uiLanguage={uiLanguage}
          />
        </div>

        {/* Right: Controls & User Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Role Switcher for small screens when role switching is allowed */}
          {canSwitchRoles && (
            <div className="sm:hidden">
              <RoleSwitcher
                currentRole={currentRole}
                setCurrentRole={setCurrentRole}
                canSwitchRoles={canSwitchRoles}
                uiLanguage={uiLanguage}
              />
            </div>
          )}

          {/* Student Stats (Stars & Streak) */}
          {currentRole === 'student' && student && (
            <StatPills student={student} uiLanguage={uiLanguage} />
          )}

          {/* Language Toggle: EN / ગુ */}
          <button
            type="button"
            onClick={() => setUiLanguage(isEn ? 'gu' : 'en')}
            aria-label={
              isEn
                ? 'Switch language to Gujarati'
                : 'ભાષા અંગ્રેજીમાં બદલો'
            }
            title={isEn ? 'Switch to Gujarati' : 'અંગ્રેજીમાં બદલો'}
            className="min-h-[36px] min-w-[36px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{isEn ? 'EN' : 'ગુ'}</span>
          </button>

          {/* Unified Overflow & User Account Menu */}
          <OverflowMenu
            user={user}
            profile={profile}
            isAllAccess={isAllAccess}
            signOut={signOut}
            audioEnabled={audioEnabled}
            setAudioEnabled={setAudioEnabled}
            uiLanguage={uiLanguage}
          />
        </div>
      </div>
    </header>
  );
};
