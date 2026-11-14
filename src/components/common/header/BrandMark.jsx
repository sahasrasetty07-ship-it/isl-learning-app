import React from 'react';

/**
 * Clean, flat brand mark with monogram, title, Gujarati translation, and ISL indicator.
 */
export const BrandMark = ({ uiLanguage = 'gu' }) => {
  const isEn = uiLanguage === 'en';

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {/* Monogram tile: simple, high contrast, non-gradient */}
      <div
        className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs select-none"
        aria-hidden="true"
      >
        <span lang="gu">સ</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-baseline">
          <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
            Saket
          </span>
          <span
            lang="gu"
            className="font-normal text-slate-500 text-sm ml-1"
          >
            (સાકેત)
          </span>
        </div>

        {/* Subtle, accessible ISL tag */}
        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
          ISL
        </span>

        {/* Desktop tagline */}
        <span className="text-xs text-slate-400 hidden xl:inline-block border-l border-slate-200 pl-2">
          {isEn
            ? 'Inclusive Gujarati Sign Language Learning'
            : 'ગુજરાતી સંકેત ભાષા શિક્ષણ'}
        </span>
      </div>
    </div>
  );
};
