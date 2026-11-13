import { useState } from 'react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Volume2,
  VolumeX,
  UserCircle2,
  GraduationCap,
  Presentation,
  Users,
  Home,
  Check,
  ChevronDown,
  LogOut,
  Sparkles,
  Flame,
  Info,
  X
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
  const { currentRole, setCurrentRole, canSwitchRoles, uiLanguage, setUiLanguage, audioEnabled, setAudioEnabled, student } = useApp();
  const { user, profile, isAllAccess, signOut } = useAuth();
  const isEn = uiLanguage === 'en';
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const role = ROLE_OPTIONS.find(r => r.id === currentRole) || ROLE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Logo onClick={onShowLanding} isEn={isEn} />

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Student Stats (Stars & Streak) */}
          {currentRole === 'student' && student && (
            <div className="hidden lg:flex items-center gap-2 mr-1">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700"
                title={isEn ? 'Stars earned' : 'મેળવેલા તારા'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{student.totalStars || 0}</span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-700"
                title={isEn ? 'Day streak' : 'સતત દિવસો'}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>{student.currentStreak || 0}</span>
              </div>
            </div>
          )}

          <LanguageSwitch uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} />

          {/* Audio toggle */}
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

          {/* User Profile & Role Switch Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-1.5 min-h-tap px-2.5 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold transition"
            >
              <div className="w-6 h-6 rounded-full bg-action/10 text-action flex items-center justify-center font-bold text-xs shrink-0 border border-action/20">
                {(profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-medium text-xs max-w-[100px] truncate">
                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-ink-muted hidden md:inline">
                ({isEn ? role.en : role.gu})
              </span>
              <ChevronDown className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label={isEn ? 'Close menu' : 'મેનુ બંધ કરો'}
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={-1}
                />
                <div role="menu" className="absolute right-0 mt-2 w-64 z-50 bg-surface border border-line rounded-2xl p-2 shadow-xl">
                  {/* User info */}
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <p className="font-bold text-xs text-ink truncate">
                      {profile?.full_name || user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">{user?.email}</p>
                    {isAllAccess && (
                      <span className="inline-block mt-1 text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-300">
                        All access
                      </span>
                    )}
                  </div>

                  {/* Role switcher (only interactive if canSwitchRoles) */}
                  <p className="px-3 pt-1 pb-1 text-[11px] font-semibold text-ink-muted">
                    {isEn ? 'View role:' : 'ભૂમિકા:'} {!canSwitchRoles && <span className="font-normal text-[10px]">({isEn ? 'fixed' : 'નિયત'})</span>}
                  </p>
                  {ROLE_OPTIONS.map(r => {
                    const active = r.id === currentRole;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        disabled={!canSwitchRoles}
                        onClick={() => {
                          if (canSwitchRoles) {
                            setCurrentRole(r.id);
                            setMenuOpen(false);
                          }
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-xs text-left transition',
                          active ? 'bg-action-soft font-bold text-action' : 'font-medium text-ink hover:bg-canvas',
                          !canSwitchRoles && !active && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <r.icon className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                        <span className="flex-1">{isEn ? r.en : r.gu}</span>
                        {active && <Check className="w-4 h-4 text-action" aria-hidden="true" />}
                      </button>
                    );
                  })}

                  <div className="my-2 border-t border-line" />

                  {/* Credits button */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setShowCredits(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-xs font-medium text-left hover:bg-canvas transition"
                  >
                    <Info className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                    {isEn ? 'Sources & Credits' : 'સ્ત્રોત અને ક્રેડિટ'}
                  </button>

                  {/* Landing page button */}
                  {onShowLanding && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onShowLanding(); }}
                      className="w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-xs font-medium text-left hover:bg-canvas transition"
                    >
                      <Home className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                      {isEn ? 'Saket home page' : 'સાકેત મુખ્ય પાનું'}
                    </button>
                  )}

                  <div className="my-2 border-t border-line" />

                  {/* Sign Out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-3 min-h-tap px-3 rounded-xl text-xs font-bold text-left text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" aria-hidden="true" />
                    {isEn ? 'Sign Out' : 'બહાર નીકળો'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Credits drawer modal */}
        {showCredits && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-5 shadow-2xl text-xs text-ink space-y-3 leading-relaxed">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-ink">{isEn ? 'Sources & Credits' : 'સ્ત્રોત અને ક્રેડિટ'}</span>
                <button
                  onClick={() => setShowCredits(false)}
                  className="p-1 rounded-full hover:bg-canvas transition text-ink-muted hover:text-ink"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p>
                <span className="font-semibold text-action">
                  {isEn ? 'Sign Videos:' : 'સંકેત વિડીયો:'}
                </span>{' '}
                {isEn
                  ? 'Indian Sign Language Research and Training Centre (ISLRTC), Dept. of Empowerment of Persons with Disabilities, Ministry of Social Justice and Empowerment, Government of India.'
                  : 'ભારતીય સંકેત ભાષા સંશોધન અને પ્રશિક્ષણ કેન્દ્ર (ISLRTC), સામાજિક ન્યાય અને સશક્તિકરણ મંત્રાલય, ભારત સરકાર.'}
              </p>
              <p className="text-ink-muted text-[11px]">
                {isEn
                  ? 'This is a student project. Sign videos belong to their original creators and are embedded, not copied.'
                  : 'આ એક વિદ્યાર્થી પ્રોજેક્ટ છે. સંકેત વિડીયો તેના મૂળ નિર્માતાઓના છે; અમે ફક્ત embed કરીએ છીએ, copy નહીં.'}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCredits(false)}
                  className="px-4 py-1.5 rounded-xl bg-action text-white text-xs font-bold transition hover:opacity-90"
                >
                  {isEn ? 'Close' : 'બંધ કરો'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
