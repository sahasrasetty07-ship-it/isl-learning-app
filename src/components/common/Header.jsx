import { useState } from 'react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  VolumeX,
  UserCircle2,
  GraduationCap,
  Presentation,
  Users,
  Home,
  Check,
  ChevronDown
} from 'lucide-react';

export const ROLE_OPTIONS = [
  { id: 'student', icon: GraduationCap, en: 'Student', gu: 'વિદ્યાર્થી' },
  { id: 'teacher', icon: Presentation, en: 'Teacher', gu: 'શિક્ષક' },
  { id: 'parent', icon: Users, en: 'Parent', gu: 'વાલી' }
];

export const Logo = ({ onClick, isEn }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2.5 min-h-tap rounded-xl pr-2"
    aria-label={isEn ? 'Saket home page' : 'સાકેત મુખ્ય પાનું'}
  >
    <span className="w-10 h-10 rounded-xl bg-action text-white flex items-center justify-center font-heading font-bold text-2xl leading-none pt-1" aria-hidden="true">
      સ
    </span>
    <span className="text-left leading-tight">
      <span className="block font-heading font-bold text-lg">Saket</span>
      <span className="block text-xs text-ink-muted">સાકેત</span>
    </span>
  </button>
);

// English / ગુજરાતી switch backed by the existing uiLanguage setting
export const LanguageSwitch = ({ uiLanguage, setUiLanguage }) => (
  <div role="group" aria-label="Language / ભાષા" className="flex p-1 rounded-xl bg-canvas border border-line">
    {[
      { id: 'en', label: 'English', short: 'EN' },
      { id: 'gu', label: 'ગુજરાતી', short: 'ગુ' }
    ].map(l => {
      const active = uiLanguage === l.id;
      return (
        <button
          key={l.id}
          type="button"
          aria-pressed={active}
          onClick={() => setUiLanguage(l.id)}
          className={clsx(
            'min-h-[36px] min-w-tap px-2.5 rounded-lg text-sm transition',
            active ? 'bg-surface text-ink font-bold border border-line' : 'text-ink-muted font-medium hover:text-ink'
          )}
        >
          <span className="sm:hidden">{l.short}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </button>
      );
    })}
  </div>
);

export const Header = ({ onShowLanding }) => {
  const { currentRole, setCurrentRole, uiLanguage, setUiLanguage, audioEnabled, setAudioEnabled } = useApp();
  const isEn = uiLanguage === 'en';
  const [menuOpen, setMenuOpen] = useState(false);
  const role = ROLE_OPTIONS.find(r => r.id === currentRole) || ROLE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Logo onClick={onShowLanding} isEn={isEn} />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitch uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} />

          {/* Audio is an optional aid: the label says the state, not only the icon */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            aria-pressed={audioEnabled}
            title={audioEnabled ? (isEn ? 'Audio on' : 'અવાજ ચાલુ') : (isEn ? 'Audio off' : 'અવાજ બંધ')}
            className="inline-flex items-center gap-1.5 min-h-tap min-w-tap justify-center px-2.5 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold transition"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
            <span className="hidden md:inline">
              {audioEnabled ? (isEn ? 'Audio on' : 'અવાજ ચાલુ') : (isEn ? 'Audio off' : 'અવાજ બંધ')}
            </span>
            <span className="sr-only md:hidden">
              {audioEnabled ? (isEn ? 'Audio on' : 'અવાજ ચાલુ') : (isEn ? 'Audio off' : 'અવાજ બંધ')}
            </span>
          </button>

          {/* Profile menu holds the role switch */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-1.5 min-h-tap px-2.5 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold transition"
            >
              <UserCircle2 className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">{isEn ? role.en : role.gu}</span>
              <span className="sr-only sm:hidden">{isEn ? `Profile: ${role.en}` : `પ્રોફાઇલ: ${role.gu}`}</span>
              <ChevronDown className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            </button>

            {menuOpen && (
              <>
                {/* Click outside closes the menu */}
                <button
                  type="button"
                  aria-label={isEn ? 'Close menu' : 'મેનુ બંધ કરો'}
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={-1}
                />
                <div role="menu" className="absolute right-0 mt-2 w-64 z-50 bg-surface border border-line rounded-2xl p-2">
                  <p className="px-3 pt-1 pb-2 text-xs font-semibold text-ink-muted">
                    {isEn ? 'View the app as' : 'એપ આ રીતે જુઓ'}
                  </p>
                  {ROLE_OPTIONS.map(r => {
                    const active = r.id === currentRole;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => { setCurrentRole(r.id); setMenuOpen(false); }}
                        className={clsx(
                          'w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-sm text-left transition',
                          active ? 'bg-action-soft font-bold' : 'font-medium hover:bg-canvas'
                        )}
                      >
                        <r.icon className="w-5 h-5 text-ink-muted" aria-hidden="true" />
                        <span className="flex-1">{isEn ? r.en : r.gu}</span>
                        {active && <Check className="w-4 h-4 text-action" aria-hidden="true" />}
                      </button>
                    );
                  })}
                  <div className="my-2 border-t border-line" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onShowLanding(); }}
                    className="w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-sm font-medium text-left hover:bg-canvas transition"
                  >
                    <Home className="w-5 h-5 text-ink-muted" aria-hidden="true" />
                    {isEn ? 'Saket home page' : 'સાકેત મુખ્ય પાનું'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
