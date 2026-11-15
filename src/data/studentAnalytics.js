// Student learning state.
//
// Every number here starts empty: the report only ever shows what the student
// has actually done. Name/grade/school come from the signed-in profile, so they
// are not seeded here either (see src/lib/reportStats.js).
export const initialStudentData = {
  id: 'stu-101',
  name: '',
  avatar: '👦',
  activityDates: [], // YYYY-MM-DD list of active learning dates
  // Every graded attempt, newest first:
  // { id, subject, topic, exerciseType, correct, at (ISO time) }
  attemptLog: [],
  // Handwriting pad: every verified attempt, newest first
  // { id, subject, character, score, error, attempt, mode, passed, stars, at (ISO time) }
  writingAttempts: [],
  // Stars already earned per character ('subject:character' -> stars), so repeat practice doesn't re-award
  writingStars: {},
  // Lesson clips watched per item ('letter:ka' -> { sign, write, say })
  lessonClips: {},
  // Active time per local day in seconds, for the "this week" report tile
  sessionSecondsByDate: {},
  totalStars: 0,
  currentStreak: 0, // days, derived from activityDates
  subjects: {
    gujarati: { name: 'ગુજરાતી મૂળાક્ષરો અને શબ્દો', lastPracticed: null },
    math: { name: 'ગણિત અને ઘડિયા', lastPracticed: null },
    science: { name: 'સામાન્ય વિજ્ઞાન સાઇન સાથે', lastPracticed: null }
  },
  recentAttempts: [],
  pendingAssignments: []
};

// Teacher's Class Roster (ધોરણ ૪ - વિશેષ વર્ગ)
export const classStudents = [
  {
    id: 'stu-101',
    name: 'આરવ પટેલ',
    rollNo: '૦૧',
    progress: 78,
    accuracy: '૮૮%',
    strongTopic: 'સૂર્યમંડળ, ૨ નો ઘડિયો',
    weakTopic: 'બાદબાકી અને ભાગાકાર',
    focus: { subjectKey: 'math', exerciseType: 'subtraction' },
    attendance: '૯૬%',
    lastActive: '૨ કલાક પહેલાં'
  },
  {
    id: 'stu-102',
    name: 'દિયા શાહ',
    rollNo: '૦૨',
    progress: 92,
    accuracy: '૯૪%',
    strongTopic: 'ગુજરાતી અક્ષરલેખન, સ્વરો',
    weakTopic: 'ગુણાકારના કોયડા',
    focus: { subjectKey: 'math', exerciseType: 'multiplication' },
    attendance: '૧૦૦%',
    lastActive: '૧૦ મિનિટ પહેલાં'
  },
  {
    id: 'stu-103',
    name: 'મીત વ્યાસ',
    rollNo: '૦૩',
    progress: 64,
    accuracy: '૭૬%',
    strongTopic: 'વિજ્ઞાન સાઇન સંકેત',
    weakTopic: 'ગુજરાતી જોડાક્ષરો',
    focus: { subjectKey: 'gujarati', exerciseType: 'writing' },
    attendance: '૮૮%',
    lastActive: '૧ દિવસ પહેલાં'
  },
  {
    id: 'stu-104',
    name: 'રિયા પંડ્યા',
    rollNo: '૦૪',
    progress: 86,
    accuracy: '૯૦%',
    strongTopic: 'ગણિત ઘડિયા, સરવાળો',
    weakTopic: 'જળચક્ર પ્રક્રિયા',
    focus: { subjectKey: 'science', exerciseType: 'water-cycle' },
    attendance: '૯૪%',
    lastActive: '૫ કલાક પહેલાં'
  },
  {
    id: 'stu-105',
    name: 'યશ સોલંકી',
    rollNo: '૦૫',
    progress: 70,
    accuracy: '૮૨%',
    strongTopic: 'સંખ્યા ૧ થી ૧૦ સાઇન',
    weakTopic: 'વાક્ય લેખન',
    focus: { subjectKey: 'gujarati', exerciseType: 'writing' },
    attendance: '૯૦%',
    lastActive: 'ગઈકાલે'
  }
];

