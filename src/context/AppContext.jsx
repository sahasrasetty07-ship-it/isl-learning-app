import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialStudentData, classStudents } from '../data/studentAnalytics';
import { isClipItemComplete } from '../data/lessonClips';
import { getLocalDateString, calculateStreak } from '../lib/dateUtils';
import { useAuth } from './AuthContext';

const AppContext = createContext();
// v2 drops the seeded demo numbers that older saves carried.
const STUDENT_KEY = 'gsl-student-v2';
const SETTINGS_KEY = 'gsl-settings-v1';
export const DEFAULT_WRITING_THRESHOLD = 85;

// Re-exported so existing imports of these helpers keep working
export { getLocalDateString, calculateStreak };

export const AppProvider = ({ children }) => {
  const { profile, isAllAccess } = useAuth();

  // Permitted roles in the app. The role itself always comes from the profile;
  // there is deliberately no fallback role here.
  const VALID_ROLES = ['student', 'teacher', 'parent'];
  const profileRole = VALID_ROLES.includes(profile?.role) ? profile.role : null;

  // Selected role state for all-access users, defaulting to profile.role
  const [selectedRole, setSelectedRole] = useState(profileRole);

  // Sync selectedRole when profile.role loads or updates
  useEffect(() => {
    setSelectedRole(profileRole);
  }, [profileRole]);

  // Only all-access accounts may preview another role's screens.
  const currentRole = isAllAccess && VALID_ROLES.includes(selectedRole) ? selectedRole : profileRole;

  // Switching role resets the tab so a teacher-only tab can never linger.
  const setCurrentRole = (role) => {
    if (!isAllAccess) return;
    if (!VALID_ROLES.includes(role)) return;
    setSelectedRole(role);
    setActiveTab('dashboard');
  };

  const canSwitchRoles = Boolean(isAllAccess && profileRole);
  
  // UI Language: 'en' (English default) | 'gu' (Gujarati)
  const [uiLanguage, setUiLanguage] = useState('en');

  // Navigation active tab for student
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mobile device simulator container toggle (defaults to false for standard PC/responsive aspect ratio)
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  
  // Audio narration toggle (ISL accessible rule: audio is strictly optional aid)
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Learning & Analytics State
  // Saved in the browser so progress and assignments survive a refresh.
  const [student, setStudent] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STUDENT_KEY));
      // Merge over defaults so data saved by an older version still has every field.
      const baseData = (stored && typeof stored === 'object')
        ? { ...initialStudentData, ...stored, subjects: { ...initialStudentData.subjects, ...stored.subjects } }
        : initialStudentData;

      const activityDates = Array.isArray(baseData.activityDates)
        ? baseData.activityDates
        : [];

      const currentStreak = calculateStreak(activityDates);

      return {
        ...baseData,
        activityDates,
        currentStreak
      };
    } catch {
      return {
        ...initialStudentData,
        activityDates: [],
        currentStreak: 0
      };
    }
  });
  useEffect(() => {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
  }, [student]);

  // Track active time simply: while the tab is visible, add 30 seconds to
  // today's bucket. This is the only source of the report's "this week" tile.
  useEffect(() => {
    const TICK_MS = 30000;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const day = getLocalDateString();
      setStudent(prev => ({
        ...prev,
        sessionSecondsByDate: {
          ...(prev.sessionSecondsByDate || {}),
          [day]: ((prev.sessionSecondsByDate || {})[day] || 0) + TICK_MS / 1000
        }
      }));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Teacher setting: handwriting pass mark (0–100). Higher is stricter.
  const [writingThreshold, setWritingThreshold] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(SETTINGS_KEY))?.writingThreshold;
      return Number.isFinite(v) ? v : DEFAULT_WRITING_THRESHOLD;
    } catch {
      return DEFAULT_WRITING_THRESHOLD;
    }
  });
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ writingThreshold }));
  }, [writingThreshold]);

  // Assignment = a set of `count` exercises of one type: { subjectKey, exerciseType, count, title, ... }.
  // exerciseType: math op id or 'mixed', science lesson id, or 'writing' for Gujarati letters.
  const addAssignment = (assignment) => setStudent(prev => ({
    ...prev,
    pendingAssignments: [
      { id: `asg-${Date.now()}`, status: 'બાકી', done: 0, correct: 0, ...assignment },
      ...prev.pendingAssignments
    ]
  }));

  // The assignment the student is working on right now; attempts count toward it.
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const activeAssignment = student.pendingAssignments.find(a => a.id === activeAssignmentId) || null;

  const startAssignment = (asg) => {
    setActiveAssignmentId(asg.id);
    setActiveTab(asg.subjectKey);
  };
  const stopAssignment = () => setActiveAssignmentId(null);
  // The class roster is sample data. It is only loaded when demo mode is on
  // (VITE_ENABLE_DEMO === 'true'), and the teacher screen then labels it.
  const [studentsList, setStudentsList] = useState(() =>
    import.meta.env.VITE_ENABLE_DEMO === 'true' ? classStudents : []
  );
  
  // Selected lesson/letter for direct modal preview
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  
  // Active notification toast
  const [toastMessage, setToastMessage] = useState(null);

  const toastTimerRef = useRef(null);
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    // Reset the timer so an older toast's timeout can't hide a newer one early
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  // Text to speech helper for Gujarati
  const speakText = (text) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'gu-IN'; // Gujarati locale
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Record every exercise attempt; accuracy = correct / attempted.
  // options.silent: skip the generic toast (for screens that show their own feedback)
  const recordExerciseAttempt = (subjectKey, isCorrect, topicName = '', points = 10, exerciseType = null, options = {}) => {
    setStudent(prev => {
      const currentSubject = prev.subjects[subjectKey] || {};

      const updatedSubject = {
        ...currentSubject,
        lastPracticed: uiLanguage === 'en' ? 'Just now' : 'હમણાં જ'
      };

      const newAttempt = {
        id: `att-${Date.now()}`,
        subject: subjectKey === 'gujarati' ? 'ગુજરાતી' : subjectKey === 'math' ? 'ગણિત' : 'વિજ્ઞાન',
        topic: topicName || `${subjectKey} Practice`,
        score: isCorrect ? '✓' : '✗',
        date: uiLanguage === 'en' ? 'Today' : 'આજે',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // When a meaningful learning activity is completed (isCorrect === true),
      // record today's local date in activityDates and recalculate streak dynamically.
      const todayStr = getLocalDateString();
      const prevDates = Array.isArray(prev.activityDates) ? prev.activityDates : [];
      let updatedDates = prevDates;

      if (isCorrect && !prevDates.includes(todayStr)) {
        updatedDates = [...prevDates, todayStr];
      }

      const updatedStreak = calculateStreak(updatedDates);

      // Structured log the report computes every number from
      const logEntry = {
        id: newAttempt.id,
        subject: subjectKey,
        topic: topicName || '',
        exerciseType: exerciseType || null,
        correct: Boolean(isCorrect),
        at: new Date().toISOString()
      };

      return {
        ...prev,
        totalStars: (prev.totalStars || 0) + (isCorrect ? points : 0),
        activityDates: updatedDates,
        currentStreak: updatedStreak,
        subjects: {
          ...prev.subjects,
          [subjectKey]: updatedSubject
        },
        attemptLog: [logEntry, ...(prev.attemptLog || [])].slice(0, 500),
        recentAttempts: [newAttempt, ...(prev.recentAttempts || []).slice(0, 5)],
        pendingAssignments: prev.pendingAssignments.map(asg => {
          const counts = asg.id === activeAssignmentId
            && asg.subjectKey === subjectKey
            && (asg.exerciseType === 'mixed' || asg.exerciseType === exerciseType)
            && asg.done < asg.count;
          if (!counts) return asg;
          const done = asg.done + 1;
          return { ...asg, done, correct: asg.correct + (isCorrect ? 1 : 0), status: done >= asg.count ? 'પૂર્ણ' : 'ચાલુ' };
        })
      };
    });
    if (isCorrect && !options.silent) {
      showToast(uiLanguage === 'en' ? `Well done! +${points} stars earned! ⭐` : `ખૂબ સરસ! +${points} તારા મળ્યા! ⭐`);
    }
  };

  const recordExerciseSuccess = (subjectKey, points = 10, topicName = '', exerciseType = null) =>
    recordExerciseAttempt(subjectKey, true, topicName, points, exerciseType);

  // Record one verified handwriting attempt and award stars:
  // 3 on the first attempt at a character, 2 on the second, 1 after that,
  // nothing on a failed attempt or once the character has already earned stars.
  const recordWritingAttempt = ({ subject, character, score, error, passed, mode }) => {
    const key = `${subject}:${character}`;
    const attempts = student.writingAttempts || [];
    const attemptNumber = attempts.filter(a => a.subject === subject && a.character === character).length + 1;
    const alreadyEarned = Boolean(student.writingStars?.[key]);
    const stars = passed && !alreadyEarned ? (attemptNumber === 1 ? 3 : attemptNumber === 2 ? 2 : 1) : 0;

    const entry = {
      id: `wr-${Date.now()}`,
      subject, character, score, error, mode, passed, stars,
      attempt: attemptNumber,
      at: new Date().toISOString()
    };
    setStudent(prev => ({
      ...prev,
      writingAttempts: [entry, ...(prev.writingAttempts || [])].slice(0, 300),
      writingStars: stars > 0 ? { ...prev.writingStars, [key]: stars } : prev.writingStars
    }));
    // Feeds subject accuracy, the star total, streak and assignment progress
    recordExerciseAttempt(subject, passed, `Writing '${character}' · ${score}%`, stars, 'writing', { silent: true });
    return { stars, attemptNumber, alreadyEarned };
  };

  // Mark one clip ('sign' | 'write' | 'say') of a lesson item as watched.
  // When that completes the item's videos, it adds a point of lesson progress.
  const markClipWatched = (item, clip) => setStudent(prev => {
    const before = prev.lessonClips?.[item.key] || {};
    if (before[clip]) return prev;
    const after = { ...before, [clip]: true };

    // Watching a lesson is activity too: it keeps the streak honest even on a
    // day with no quizzes or writing.
    const todayStr = getLocalDateString();
    const prevDates = Array.isArray(prev.activityDates) ? prev.activityDates : [];
    const updatedDates = prevDates.includes(todayStr) ? prevDates : [...prevDates, todayStr];

    return {
      ...prev,
      lessonClips: { ...prev.lessonClips, [item.key]: after },
      activityDates: updatedDates,
      currentStreak: calculateStreak(updatedDates)
    };
  });

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        canSwitchRoles,
        uiLanguage,
        setUiLanguage,
        activeTab,
        setActiveTab,
        isMobileFrame,
        setIsMobileFrame,
        audioEnabled,
        setAudioEnabled,
        student,
        setStudent,
        studentsList,
        setStudentsList,
        activeVideoModal,
        setActiveVideoModal,
        toastMessage,
        showToast,
        speakText,
        recordExerciseSuccess,
        recordExerciseAttempt,
        recordWritingAttempt,
        markClipWatched,
        writingThreshold,
        setWritingThreshold,
        addAssignment,
        activeAssignment,
        startAssignment,
        stopAssignment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
