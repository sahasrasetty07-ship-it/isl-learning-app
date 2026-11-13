// Indian Sign Language (ISL) demonstration video mappings
// Official Source: Indian Sign Language Research and Training Centre (ISLRTC), Government of India
// Channel: https://www.youtube.com/@ISLRTC / https://www.youtube.com/channel/UC3AcGIlqVI4nJWCwHgHFXtg
// Status must only be set to 'approved' after the actual demonstration has been verified.
//
// HOW TO ADD A VIDEO
// ------------------
// 1. Find the approved video on the ISLRTC YouTube channel or another authorised source.
// 2. Paste the YouTube link (or bare 11-char ID) into `youtubeId` — or `url` for a direct mp4.
// 3. Set `status: 'approved'` once you have verified the link plays correctly.
// 4. Optionally set start/end (in seconds) to clip a long ISLRTC video down to one sign.
//
// Keys are the `id` field of the data files (e.g. 'ka', 'n1'). Lookups also accept the
// prefixed forms 'letter-ka' / 'number-n1', and phrases use 'phrase-<slug>' keys.

export const signVideos = {
  // --- Gujarati Alphabets (Consonants & Vowels) ---
  ka: {
    id: 'ka',
    type: 'alphabet',
    gujarati: 'ક',
    word: 'કમળ',
    youtubeId: 'anQpnGwvkG4',
    startTime: 1,
    endTime: 3,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  kha: {
    id: 'kha',
    type: 'alphabet',
    gujarati: 'ખ',
    word: 'ખલ',
    youtubeId: 'bP0ibVNj7TU',
    startTime: 2,
    endTime: 7,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  ga: {
    id: 'ga',
    type: 'alphabet',
    gujarati: 'ગ',
    word: 'ગંગટોક',
    youtubeId: 'fyyWZWqh3BI',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  gha: {
    id: 'gha',
    type: 'alphabet',
    gujarati: 'ઘ',
    word: 'ઘર',
    youtubeId: 'U--0FZU2bDg',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  cha: {
    id: 'cha',
    type: 'alphabet',
    gujarati: 'ચ',
    word: 'ચકલી',
    youtubeId: '04Y_zC6sQ80',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  chha: {
    id: 'chha',
    type: 'alphabet',
    gujarati: 'છ',
    word: 'છત્રી',
    youtubeId: '1xTATM3v8k4',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  ja: {
    id: 'ja',
    type: 'alphabet',
    gujarati: 'જ',
    word: 'જંક્શન',
    youtubeId: 'kxDJnposaNk',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  zha: {
    id: 'zha',
    type: 'alphabet',
    gujarati: 'ઝ',
    word: 'ઝાડુ',
    youtubeId: '_XI-ZBIFNdU',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  ta: {
    id: 'ta',
    type: 'alphabet',
    gujarati: 'ટ',
    word: 'ટકાવારી',
    youtubeId: 'IMZb4D-ulNs',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  na: {
    id: 'na',
    type: 'alphabet',
    gujarati: 'ન',
    word: 'નકલ',
    youtubeId: 'vSEUaTn35j4',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  pa: {
    id: 'pa',
    type: 'alphabet',
    gujarati: 'પ',
    word: 'પતંગ',
    youtubeId: 'iLrSnUDmfC4',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  a: {
    id: 'a',
    type: 'alphabet',
    gujarati: 'અ',
    word: 'અંકગણિત સરેરાશ (Arithmetic Mean)',
    youtubeId: 'sVT6S-xJcbQ',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },
  aa: {
    id: 'aa',
    type: 'alphabet',
    gujarati: 'આ',
    word: 'આકાશ',
    youtubeId: 'wK63rmj8--U',
    startTime: null,
    endTime: null,
    status: 'approved',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: 'User visual verification'
  },

  // --- Gujarati Numbers (૧ to ૧૦) ---
  n1: {
    id: 'n1',
    type: 'number',
    number: '૧',
    word: 'એક',
    youtubeId: 'K0saQgxc3OU',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n2: {
    id: 'n2',
    type: 'number',
    number: '૨',
    word: 'બે',
    youtubeId: 'MBJe-opDrVg',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n3: {
    id: 'n3',
    type: 'number',
    number: '૩',
    word: 'ત્રણ',
    youtubeId: '_KtmAUfK7oM',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n4: {
    id: 'n4',
    type: 'number',
    number: '૪',
    word: 'ચાર',
    youtubeId: '4x1ptujpYik',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n5: {
    id: 'n5',
    type: 'number',
    number: '૫',
    word: 'પાંચ',
    youtubeId: 'BYnUpQfk3Ts',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n6: {
    id: 'n6',
    type: 'number',
    number: '૬',
    word: 'છ',
    youtubeId: 'm6Uby73Tg3s',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n7: {
    id: 'n7',
    type: 'number',
    number: '૭',
    word: 'સાત',
    youtubeId: 'HV7L78k5KeE',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n8: {
    id: 'n8',
    type: 'number',
    number: '૮',
    word: 'આઠ',
    youtubeId: 'T7J3gDE8hNA',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n9: {
    id: 'n9',
    type: 'number',
    number: '૯',
    word: 'નવ',
    youtubeId: '1VHhWnMU21Y',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },
  n10: {
    id: 'n10',
    type: 'number',
    number: '૧૦',
    word: 'દસ',
    youtubeId: 'Y9MkvKtXngo',
    startTime: null,
    endTime: null,
    status: 'pending',
    source: 'ISLRTC Gujarati dictionary',
    verifiedBy: null
  },

  // ─── Phrasebook (first 5 entries, keyed by Gujarati word slug) ────────────
  // Slugs map to phrasebookData.gujarati values
  'phrase-namaste': {
    url: '',
    start: null,
    end: null,
    status: 'pending',
    note: 'નમસ્તે (Namaste / Hello)'
  },
  'phrase-aabhar': {
    url: '',
    start: null,
    end: null,
    status: 'pending',
    note: 'આભાર (Thank You)'
  },
  'phrase-shubh-savar': {
    url: '',
    start: null,
    end: null,
    status: 'pending',
    note: 'શુભ સવાર (Good Morning)'
  },
  'phrase-tamaru-naam': {
    url: '',
    start: null,
    end: null,
    status: 'pending',
    note: 'તમારું નામ શું છે? (What is your name?)'
  },
  'phrase-hu-vidyarthi': {
    url: '',
    start: null,
    end: null,
    status: 'pending',
    note: 'હું વિદ્યાર્થી છું (I am a student)'
  },
};

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Resolve a key that may come from either the id scheme ('ka', 'n1') or the
 * prefixed scheme ('letter-ka', 'number-n1'). Phrase keys are already stable.
 * @param {string} key
 * @returns {string}
 */
const normalizeKey = (key) =>
  key.startsWith('letter-') || key.startsWith('number-')
    ? key.slice(key.indexOf('-') + 1)
    : key;

/**
 * Retrieve video entry by ID
 * @param {string} id - The item ID (e.g. 'ka', 'n1') or prefixed key ('letter-ka')
 * @returns {object|null}
 */
export const getSignVideo = (id) => {
  if (!id || typeof id !== 'string') return null;
  return signVideos[id] || signVideos[normalizeKey(id)] || null;
};

/**
 * Builds a privacy-enhanced YouTube embed URL with optional start and end timestamps
 * @param {string} youtubeId - 11 character YouTube video identifier
 * @param {number|null} startTime - start offset in seconds
 * @param {number|null} endTime - end offset in seconds
 * @returns {string|null}
 */
export const buildYouTubeEmbedUrl = (youtubeId, startTime, endTime) => {
  if (!youtubeId || typeof youtubeId !== 'string') return null;
  const params = new URLSearchParams();
  params.set('rel', '0');
  if (typeof startTime === 'number' && !isNaN(startTime) && startTime >= 0) {
    params.set('start', String(Math.floor(startTime)));
  }
  if (typeof endTime === 'number' && !isNaN(endTime) && endTime > 0) {
    params.set('end', String(Math.floor(endTime)));
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?${params.toString()}`;
};
