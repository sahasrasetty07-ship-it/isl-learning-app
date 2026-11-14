import React from 'react';
import { GraduationCap, User, Users } from 'lucide-react';

export const ROLE_CONFIGS = [
  { id: 'student', labelEn: 'Student', labelGu: 'વિદ્યાર્થી', icon: GraduationCap },
  { id: 'teacher', labelEn: 'Teacher', labelGu: 'શિક્ષક', icon: User },
  { id: 'parent', labelEn: 'Parent', labelGu: 'વાલી', icon: Users },
];

/**
 * Role Switcher or read-only status badge.
 */
export const RoleSwitcher = ({
  currentRole = 'student',
  setCurrentRole,
  canSwitchRoles = false,
  uiLanguage = 'gu',
}) => {
  const isEn = uiLanguage === 'en';

  if (!canSwitchRoles) {
    const active = ROLE_CONFIGS.find((r) => r.id === currentRole) || ROLE_CONFIGS[0];
    const Icon = active.icon;
    const label = isEn ? active.labelEn : active.labelGu;

    return (
      <div
        role="status"
        aria-label={isEn ? `Current role: ${label}` : `વર્તમાન ભૂમિકા: ${label}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
      >
        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
        <span lang={isEn ? undefined : 'gu'}>{label}</span>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={isEn ? 'Switch role view' : 'ભૂમિકા પસંદ કરો'}
      className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5"
    >
      {ROLE_CONFIGS.map((role) => {
        const Icon = role.icon;
        const isSelected = currentRole === role.id;
        const label = isEn ? role.labelEn : role.labelGu;

        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setCurrentRole(role.id)}
            className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              isSelected
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-accent' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span lang={isEn ? undefined : 'gu'}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
