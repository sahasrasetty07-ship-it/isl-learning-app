// Short student-facing messages for each handwriting error type.
// Shown Gujarati first with English underneath, whatever the UI language.
export const WRITING_ERRORS = {
  order: { gu: 'રેખાઓનો ક્રમ ખોટો છે', en: 'Wrong stroke order' },
  direction: { gu: 'રેખા ઊલટી દિશામાં દોરી છે', en: 'Stroke drawn the wrong way' },
  missing: { gu: 'એક રેખા ખૂટે છે', en: 'A stroke is missing' },
  extra: { gu: 'એક રેખા વધારાની છે', en: 'There is an extra stroke' },
  shape: { gu: 'આકાર હજુ પૂરતો નજીક નથી', en: 'Shape is not close enough yet' },
  outside: { gu: 'રેખા માર્ગદર્શકની બહાર ગઈ', en: 'Stroke went outside the guide' }
};

export const SUBJECT_LABELS = {
  gujarati: { gu: 'ગુજરાતી', en: 'Gujarati' },
  math: { gu: 'ગણિત', en: 'Maths' },
  science: { gu: 'વિજ્ઞાન', en: 'Science' }
};

export const formatAttemptTime = (iso, isEn) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(isEn ? 'en-IN' : 'gu-IN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `${isEn ? 'Today' : 'આજે'} ${time}`;
  return `${d.toLocaleDateString(isEn ? 'en-IN' : 'gu-IN', { day: 'numeric', month: 'short' })} ${time}`;
};

// Summary numbers for reports: attempts, pass rate, characters that earned stars.
export const summariseWriting = (attempts = [], writingStars = {}) => {
  const passed = attempts.filter(a => a.passed).length;
  return {
    total: attempts.length,
    passed,
    passRate: attempts.length ? Math.round((100 * passed) / attempts.length) : 0,
    mastered: Object.keys(writingStars || {}).length,
    avgScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0
  };
};
