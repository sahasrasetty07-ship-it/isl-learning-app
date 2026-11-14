import { useApp } from '../../context/AppContext';
import { PenLine, Smile, CheckCircle2 } from 'lucide-react';

// "How to write" and "How to say" buttons for any lesson clip item.
export const LessonClipButtons = ({ item, onOpen }) => {
  const { student, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const watched = student.lessonClips?.[item.key] || {};

  const buttons = [
    { type: 'write', icon: PenLine, label: isEn ? 'How to write' : 'કેવી રીતે લખવું' },
    { type: 'say', icon: Smile, label: isEn ? 'How to say' : 'કેવી રીતે બોલવું' }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {buttons.map(b => (
        <button
          key={b.type}
          onClick={() => onOpen(b.type)}
          type="button"
          className="relative flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-xl bg-surface border border-line hover:bg-canvas text-ink text-sm font-semibold transition"
        >
          <b.icon className="w-5 h-5 text-action" aria-hidden="true" />
          <span>{b.label}</span>
          {watched[b.type] && (
            <CheckCircle2
              className="w-5 h-5 text-success"
              aria-label={isEn ? 'Watched' : 'જોયું'}
            />
          )}
        </button>
      ))}
    </div>
  );
};
