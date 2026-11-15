// Local-calendar date helpers shared by the progress state and the report.
// Kept free of React/store imports so it can be unit tested directly.

// Returns the current local calendar date formatted as YYYY-MM-DD (timezone-safe)
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Current streak: consecutive days with recorded activity, ending today
// (or yesterday, so a streak is not lost before the student studies today).
export const calculateStreak = (activityDates = [], referenceDate = new Date()) => {
  if (!Array.isArray(activityDates) || activityDates.length === 0) return 0;

  const dateSet = new Set(activityDates);
  const todayStr = getLocalDateString(referenceDate);

  // Evaluate at noon to ensure robustness against clock skew and date boundaries
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  let currentCheck = new Date(ref);
  let streak = 0;

  // Case 1: Practiced today -> count consecutive active days back from today
  if (dateSet.has(todayStr)) {
    while (true) {
      const dateStr = getLocalDateString(currentCheck);
      if (dateSet.has(dateStr)) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // Case 2: Not yet practiced today -> check if streak is preserved from yesterday
  currentCheck.setDate(currentCheck.getDate() - 1);
  const yesterdayStr = getLocalDateString(currentCheck);

  if (dateSet.has(yesterdayStr)) {
    while (true) {
      const dateStr = getLocalDateString(currentCheck);
      if (dateSet.has(dateStr)) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // Case 3: Neither today nor yesterday had activity -> streak is broken
  return 0;
};
