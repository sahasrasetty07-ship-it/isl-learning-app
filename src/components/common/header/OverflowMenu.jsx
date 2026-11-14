import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Volume2,
  VolumeX,
  Info,
  LogOut,
  X,
  ChevronDown,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const OverflowMenu = ({
  user,
  profile,
  isAllAccess,
  signOut,
  audioEnabled,
  setAudioEnabled,
  uiLanguage = 'gu',
}) => {
  const isEn = uiLanguage === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const userInitial = (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    'U'
  )
    .charAt(0)
    .toUpperCase();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    (isEn ? 'Account' : 'ખાતું');

  return (
    <div className="relative">
      {/* Trigger Button: User Avatar + Chevron */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isEn ? 'Account and settings menu' : 'એકાઉન્ટ અને સેટિંગ્સ મેનૂ'}
        className="min-h-[38px] min-w-[38px] px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <div
          className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs select-none"
          aria-hidden="true"
        >
          {userInitial}
        </div>
        <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Popover (z-50) */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={isEn ? 'Settings and Account' : 'સેટિંગ્સ અને એકાઉન્ટ'}
          className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs text-slate-700 space-y-1 animate-in fade-in-50 duration-150"
        >
          {/* User Profile Info Card */}
          {user && (
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg mb-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm truncate">
                  {displayName}
                </span>
                {isAllAccess && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                    All Access
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          )}

          {/* Quick Controls Section */}
          <div className="py-1 border-t border-slate-100 space-y-0.5">
            {/* Audio Speech Output Toggle */}
            <button
              type="button"
              role="menuitem"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2">
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {isEn ? 'Speech Audio (TTS)' : 'વાણી વાંચન (TTS)'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {audioEnabled
                      ? isEn
                        ? 'Audio output enabled'
                        : 'અવાજ ચાલુ છે'
                      : isEn
                      ? 'Audio output muted'
                      : 'અવાજ બંધ છે'}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  audioEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {audioEnabled ? (isEn ? 'ON' : 'ચાલુ') : isEn ? 'OFF' : 'બંધ'}
              </span>
            </button>

            {/* Sources & Credits Trigger */}
            <button
              type="button"
              role="menuitem"
              onClick={() => setShowCreditsDialog(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-slate-800">
                  {isEn ? 'Sources & Credits' : 'સ્ત્રોત અને ક્રેડિટ્સ'}
                </span>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          </div>

          {/* Sign Out Button */}
          {user && (
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                <span>{isEn ? 'Sign Out' : 'લૉગ આઉટ'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sources & Credits Dialog Modal (Accessible, z-50) */}
      {showCreditsDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="credits-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-5 space-y-3 relative animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <h3
                  id="credits-dialog-title"
                  className="font-bold text-slate-900 text-sm"
                >
                  {isEn ? 'Sources & Credits' : 'સ્ત્રોત અને ક્રેડિટ્સ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditsDialog(false)}
                aria-label={isEn ? 'Close credits dialog' : 'ક્રેડિટ્સ બંધ કરો'}
                className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">
                  {isEn ? 'Sign Video Content:' : 'સંકેત વિડીયો સામગ્રી:'}
                </strong>{' '}
                {isEn
                  ? 'Indian Sign Language Research and Training Centre (ISLRTC), Department of Empowerment of Persons with Disabilities, Ministry of Social Justice and Empowerment, Government of India.'
                  : 'ભારતીય સંકેત ભાષા સંશોધન અને પ્રશિક્ષણ કેન્દ્ર (ISLRTC), સામાજિક ન્યાય અને સશક્તિકરણ મંત્રાલય, ભારત સરકાર.'}
              </p>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {isEn
                  ? 'This application is a student learning portal. Curated sign videos belong to their authorized creators and are embedded for non-commercial educational instruction.'
                  : 'આ એપ્લિકેશન એક શિક્ષણ પોર્ટલ છે. સંકેત વિડીયો તેમના અધિકૃત નિર્માતાઓના છે અને શૈક્ષણિક હેતુ માટે એમ્બેડ કરવામાં આવ્યા છે.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreditsDialog(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {isEn ? 'Close' : 'બંધ કરો'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
