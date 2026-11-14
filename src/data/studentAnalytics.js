// Student Learning Analytics & Performance Data
export const initialStudentData = {
  id: 'stu-101',
  name: 'આરવ પટેલ (Aarav Patel)',
  avatar: '👦',
  grade: 'ધોરણ ૪ (Grade 4)',
  school: 'પ્રજ્ઞાચક્ષુ અને મૂકબધિર વિદ્યાલય, ગાંધીનગર',
  overallProgress: 78,
  totalStars: 142,
  currentStreak: 6, // days
  activityDates: [], // YYYY-MM-DD list of active learning dates
  // Handwriting pad: every verified attempt, newest first
  // { id, subject, character, score, error, attempt, mode, passed, stars, at (ISO time) }
  writingAttempts: [],
  // Stars already earned per character ('subject:character' -> stars), so repeat practice doesn't re-award
  writingStars: {},
  // Lesson clips watched per item ('letter:ka' -> { sign, write, say })
  lessonClips: {},
  weeklyHours: 4.5,
  subjects: {
    gujarati: {
      name: 'ગુજરાતી મૂળાક્ષરો અને શબ્દો',
      progress: 85,
      completedLessons: 12,
      totalLessons: 14,
      accuracy: 92,
      attempted: 25,
      correct: 23,
      lastPracticed: 'આજે, ૨ કલાક પહેલાં',
      badges: ['મૂળાક્ષર માસ્ટર', 'સુંદર અક્ષર લેખન', 'વાક્ય નિર્માતા'],
      topics: [
        { name: 'સ્વરો (Vowels)', mastery: 95, status: 'નિપુણ' },
        { name: 'વ્યંજનો (Consonants ક-જ)', mastery: 90, status: 'નિપુણ' },
        { name: 'સંખ્યા ૧ થી ૧૦', mastery: 100, status: 'સંપૂર્ણ' },
        { name: 'શબ્દલેખન પ્રેક્ટિસ', mastery: 75, status: 'પ્રગતિમાં' }
      ]
    },
    math: {
      name: 'ગણિત અને ઘડિયા',
      progress: 75,
      completedLessons: 9,
      totalLessons: 12,
      accuracy: 84,
      attempted: 25,
      correct: 21,
      lastPracticed: 'ગઈકાલે સાંજે',
      badges: ['ઘડિયા ચેમ્પિયન', 'ઝડપી સરવાળા'],
      topics: [
        { name: '૨ અને ૫ નો ઘડિયો', mastery: 90, status: 'નિપુણ' },
        { name: 'સરવાળો (Addition)', mastery: 85, status: 'નિપુણ' },
        { name: 'બાદબાકી (Subtraction)', mastery: 80, status: 'સુધારો જરૂરી' },
        { name: 'ગુણાકાર અને ભાગાકાર', mastery: 65, status: 'પ્રગતિમાં' }
      ]
    },
    science: {
      name: 'સામાન્ય વિજ્ઞાન સાઇન સાથે',
      progress: 70,
      completedLessons: 6,
      totalLessons: 8,
      accuracy: 88,
      attempted: 25,
      correct: 22,
      lastPracticed: '૨ દિવસ પહેલાં',
      badges: ['નાનો વિજ્ઞાની', 'પ્રકૃતિ મિત્ર'],
      topics: [
        { name: 'સૂર્યમંડળ અને ગ્રહો', mastery: 95, status: 'નિપુણ' },
        { name: 'પ્રકાશસંશ્લેષણ', mastery: 80, status: 'નિપુણ' },
        { name: 'જળચક્ર (Water Cycle)', mastery: 75, status: 'પ્રગતિમાં' },
        { name: 'દ્રવ્યની અવસ્થાઓ', mastery: 60, status: 'નવું' }
      ]
    }
  },
  recentAttempts: [
    { id: 'att-1', subject: 'ગણિત', topic: 'સરવાળા ક્વિઝ (૪ + ૩)', score: '૧૦/૧૦', date: 'આજે', time: '૧૫ મિનિટ' },
    { id: 'att-2', subject: 'ગુજરાતી', topic: 'અક્ષર ‘ક’ અને ‘ખ’ લેખન પેડ', score: '૯/૧૦', date: 'આજે', time: '૨૦ મિનિટ' },
    { id: 'att-3', subject: 'વિજ્ઞાન', topic: 'સૂર્યમંડળ ISL વિડીયો ટેસ્ટ', score: '૮/૧૦', date: 'ગઈકાલે', time: '૧૨ મિનિટ' },
    { id: 'att-4', subject: 'ગણિત', topic: '૨ નો ઘડિયો રિવિઝન', score: '૧૦/૧૦', date: '૩ દિવસ પહેલાં', time: '૧૦ મિનિટ' }
  ],
  pendingAssignments: [
    {
      id: 'asg-1',
      title: 'અક્ષર ‘ગ’ અને ‘ઘ’ ૫ વખત પેડ પર લખો',
      subject: 'ગુજરાતી',
      subjectKey: 'gujarati',
      exerciseType: 'writing',
      count: 5,
      done: 0,
      correct: 0,
      dueDate: 'આવતીકાલે',
      teacher: 'શ્રીમતી નીતાબેન જોશી',
      status: 'બાકી'
    },
    {
      id: 'asg-2',
      title: 'બાદબાકીના ૫ દાખલા ગણો',
      subject: 'ગણિત',
      subjectKey: 'math',
      exerciseType: 'subtraction',
      count: 5,
      done: 0,
      correct: 0,
      dueDate: '૧૫ નવેમ્બર',
      teacher: 'શ્રી હરેશભાઈ શાહ',
      status: 'બાકી'
    }
  ]
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

