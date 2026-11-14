// Sign of the Day Content - Verified Indian Sign Language (ISL) step-by-step sequences
export const DAILY_SIGNS = [
  {
    id: 'going-home',
    titleGu: 'હું ઘરે જાઉં છું.',
    titleEn: 'I am going home.',
    categoryGu: 'દૈનિક વાક્ય',
    categoryEn: 'Everyday Sentence',
    image: `${import.meta.env.BASE_URL}images/sign-of-the-day-home.jpg`,
    steps: [
      {
        num: '01',
        wordGu: 'હું',
        wordEn: 'I',
        hintGu: 'છાતી તરફ તર્જની ચીંધો',
        hintEn: 'Point index finger to chest'
      },
      {
        num: '02',
        wordGu: 'ઘર',
        wordEn: 'Home',
        hintGu: 'હાથથી છાપરું (ત્રિકોણ) બનાવો',
        hintEn: 'Form roof with fingertips'
      },
      {
        num: '03',
        wordGu: 'જવું',
        wordEn: 'Go',
        hintGu: 'હાથ આગળની તરફ લઈ જાઓ',
        hintEn: 'Move open hand forward'
      }
    ]
  },
  {
    id: 'going-school',
    titleGu: 'હું શાળાએ જાઉં છું.',
    titleEn: 'I go to school.',
    categoryGu: 'શાળા જીવન',
    categoryEn: 'School Life',
    image: `${import.meta.env.BASE_URL}images/sign-of-the-day-school.jpg`,
    steps: [
      {
        num: '01',
        wordGu: 'હું',
        wordEn: 'I',
        hintGu: 'છાતી તરફ સંકેત કરો',
        hintEn: 'Point index finger to chest'
      },
      {
        num: '02',
        wordGu: 'શાળા',
        wordEn: 'School',
        hintGu: 'પુસ્તકની જેમ હથેળી જોડો',
        hintEn: 'Hands joined as open book'
      },
      {
        num: '03',
        wordGu: 'જવું',
        wordEn: 'Go',
        hintGu: 'હાથ આગળ વધારો',
        hintEn: 'Move hand forward'
      }
    ]
  },
  {
    id: 'give-water',
    titleGu: 'મને પાણી આપો.',
    titleEn: 'Please give me water.',
    categoryGu: 'નમ્ર વિનંતી',
    categoryEn: 'Polite Request',
    image: `${import.meta.env.BASE_URL}images/sign-of-the-day-water.jpg`,
    steps: [
      {
        num: '01',
        wordGu: 'મને',
        wordEn: 'Me',
        hintGu: 'પોતાની તરફ સંકેત કરો',
        hintEn: 'Indicate towards self'
      },
      {
        num: '02',
        wordGu: 'પાણી',
        wordEn: 'Water',
        hintGu: 'W મુદ્રાથી હોઠ પાસે ટેપ કરો',
        hintEn: 'Tap W handshape near chin'
      },
      {
        num: '03',
        wordGu: 'આપો',
        wordEn: 'Give',
        hintGu: 'બંને હથેળીઓ આગળ ધરો',
        hintEn: 'Extend open palms forward'
      }
    ]
  }
];

/**
 * Returns today's featured sign based on the calendar day.
 * Persists consistently throughout the entire day across refreshes,
 * and advances to the next sign at midnight.
 */
export const getSignOfTheDay = (date = new Date()) => {
  // Epoch day offset calibrated so today maps to index 0 ("I am going home")
  const epochDay = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const offset = 20771;
  const index = Math.abs((epochDay - offset) % DAILY_SIGNS.length);
  return DAILY_SIGNS[index];
};

