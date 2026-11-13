import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialStudentData, classStudents } from '../data/studentAnalytics';
import { useAuth } from './AuthContext';

const AppContext = createContext();
const STUDENT_KEY = 'gsl-student-v1';

// Returns the current local calendar date formatted as YYYY-MM-DD (timezone-safe)
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculates current streak based on actual activity dates in local time
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

export const AppProvider = ({ children }) => {
  const { profile, isAllAccess } = useAuth();

  // Permitted roles in the app
  const VALID_ROLES = ['student', 'teacher', 'parent'];
  const profileRole = (profile?.role && VALID_ROLES.includes(profile.role))
    ? profile.role
    : 'student';

  // Selected role state for all-access users, defaulting to profile.role
  const [selectedRole, setSelectedRole] = useState(profileRole);

  // Sync selectedRole when profile.role loads or updates
  useEffect(() => {
    setSelectedRole(profileRole);
  }, [profileRole]);

  // Compute effectiveRole:
  // UI convenience for all-access team members to preview different role views.
  // Non-all-access users strictly receive their own profile.role.
  const effectiveRole = isAllAccess
    ? (VALID_ROLES.includes(selectedRole) ? selectedRole : profileRole)
    : profileRole;

  // Make setCurrentRole a no-op for non-all-access users
  const setCurrentRole = (role) => {
    if (!isAllAccess) return;
    if (VALID_ROLES.includes(role)) {
      setSelectedRole(role);
    }
  };

  const canSwitchRoles = isAllAccess;
  
  // UI Language: 'en' (English default) | 'gu' (Gujarati)
  const [uiLanguage, setUiLanguage] = useState('en');

  // Navigation active tab for student
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mobile device simulator container toggle (allows viewing as mobile or tablet/responsive)
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  
  // Audio narration toggle (ISL accessible rule: audio is strictly optional aid)
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Learning & Analytics State
  // Saved in the browser so progress and assignments survive a refresh.
  const [student, setStudent] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STUDENT_KEY));
      const baseData = (stored && typeof stored === 'object') ? stored : initialStudentData;

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
  const [studentsList, setStudentsList] = useState(classStudents);
  
  // Selected lesson/letter for direct modal preview
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  
  // Active notification toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
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
  const recordExerciseAttempt = (subjectKey, isCorrect, topicName = '', points = 10, exerciseType = null) => {
    setStudent(prev => {
      const currentSubject = prev.subjects[subjectKey] || {};
      const attempted = (currentSubject.attempted || 0) + 1;
      const correct = (currentSubject.correct || 0) + (isCorrect ? 1 : 0);

      const updatedSubject = {
        ...currentSubject,
        attempted,
        correct,
        accuracy: Math.round((100 * correct) / attempted),
        progress: isCorrect ? Math.min(100, (currentSubject.progress || 0) + 2) : currentSubject.progress,
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

      return {
        ...prev,
        totalStars: prev.totalStars + (isCorrect ? points : 0),
        activityDates: updatedDates,
        currentStreak: updatedStreak,
        subjects: {
          ...prev.subjects,
          [subjectKey]: updatedSubject
        },
        recentAttempts: [newAttempt, ...prev.recentAttempts.slice(0, 5)],
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
    if (isCorrect) {
      showToast(uiLanguage === 'en' ? `Well done! +${points} stars earned! ⭐` : `ખૂબ સરસ! +${points} તારા મળ્યા! ⭐`);
    }
  };

  const recordExerciseSuccess = (subjectKey, points = 10, topicName = '', exerciseType = null) =>
    recordExerciseAttempt(subjectKey, true, topicName, points, exerciseType);

  return (
    <AppContext.Provider
      value={{
        currentRole: effectiveRole,
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
