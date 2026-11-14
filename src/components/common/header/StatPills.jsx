import React from 'react';
import { Sparkles, Flame } from 'lucide-react';

/**
 * Clean student achievement statistics pills (stars and day streak).
 */
export const StatPills = ({
  student = { totalStars: 0, currentStreak: 0 },
  uiLanguage = 'gu',
  className = '',
}) => {
  const isEn = uiLanguage === 'en';
  const starsLabel = isEn
    ? `${student.totalStars} stars earned`
    : `${student.totalStars} તારા`;
  const streakLabel = isEn
    ? `${student.currentStreak} day streak`
    : `${student.currentStreak} દિવસની સ્ટ્રીક`;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Stars Pill */}
      <div
        role="status"
        aria-label={starsLabel}
        title={starsLabel}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
      >
        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
        <span>{student.totalStars}</span>
      </div>

      {/* Streak Pill */}
      <div
        role="status"
        aria-label={streakLabel}
        title={streakLabel}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
      >
        <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" aria-hidden="true" />
        <span>{student.currentStreak}d</span>
      </div>
    </div>
  );
};
