// Short learning clips attached to a lesson item.
//
// Any lesson item — a letter, a number, and later a word, sentence, maths
// table or science topic — is described by one plain "clip item":
//
//   {
//     key:       'letter:ka'   unique id, also used to store "watched"
//     kind:      'letter'      folder name for its video files
//     id:        'ka'          file name for its video files
//     subject:   'gujarati'    subject whose lesson progress it counts toward
//     text:      'ક'           what is written / said first
//     word:      'કમળ'         example word said after it (optional)
//     textLatin: 'Ka'          English transliteration of text
//     wordLatin: 'Kamal'       English transliteration of word (optional)
//   }
//
// From that, getLessonClips() works out the two clips:
//   write — animated stroke-by-stroke from the writing pad's stroke data
//           (available whenever every character of `text` has stroke data)
//   say   — a close-up mouth video, loaded from
//           /videos/say/<kind>/<id>.mp4 when it is listed in SAY_VIDEOS
//
// Adding clips to a new kind of content only needs a builder like
// letterClipItem() below; the buttons, player and progress work unchanged.

import { gujaratiAlphabets } from './gujaratiAlphabets';
import { gujaratiNumbers } from './gujaratiNumbers';
import { hasStrokeReference } from './strokeReferences';

// "How to say" videos that have been recorded, by clip-item key.
// Put the file at public/videos/say/<kind>/<id>.mp4, then add its key here.
// Listing only files that exist means a missing clip shows "Video coming
// soon" without any network request on a slow connection.
export const SAY_VIDEOS = new Set([
  // 'letter:ka',
]);

const stripParen = (s = '') => s.replace(/\s*\(.*\)\s*$/, '').trim();

export const letterClipItem = (l) => ({
  key: `letter:${l.id}`,
  kind: 'letter',
  id: l.id,
  subject: 'gujarati',
  text: l.letter,
  word: l.word,
  textLatin: l.english,
  wordLatin: stripParen(l.wordEnglish)
});

export const numberClipItem = (n) => ({
  key: `number:${n.id}`,
  kind: 'number',
  id: n.id,
  subject: 'gujarati',
  text: n.number,
  word: n.word,
  textLatin: n.englishNumber,
  wordLatin: stripParen(n.englishWord)
});

export const sayVideoSrc = (item) =>
  SAY_VIDEOS.has(item.key) ? `${import.meta.env.BASE_URL}videos/say/${item.kind}/${item.id}.mp4` : null;

export const getLessonClips = (item) => ({
  write: hasStrokeReference(item.text) ? { text: item.text } : null,
  say: {
    src: sayVideoSrc(item),
    caption: { text: item.text, word: item.word, textLatin: item.textLatin, wordLatin: item.wordLatin }
  }
});

// A lesson item's videos are complete once the sign has been watched, plus
// every other clip that actually exists for it (a "coming soon" placeholder
// is not required).
export const isClipItemComplete = (item, watched = {}) => {
  const clips = getLessonClips(item);
  return Boolean(watched.sign)
    && (Boolean(watched.write) || !clips.write)
    && (Boolean(watched.say) || !clips.say.src);
};

// Every item that has clips today, for progress reporting.
export const LESSON_CLIP_ITEMS = [
  ...gujaratiAlphabets.map(letterClipItem),
  ...gujaratiNumbers.map(numberClipItem)
];

export const summariseLessonClips = (lessonClips = {}) => {
  const count = (kind, clip) => LESSON_CLIP_ITEMS.filter(i => i.kind === kind && lessonClips[i.key]?.[clip]).length;
  const kinds = ['letter', 'number'].map(kind => {
    const items = LESSON_CLIP_ITEMS.filter(i => i.kind === kind);
    return {
      kind,
      total: items.length,
      complete: items.filter(i => isClipItemComplete(i, lessonClips[i.key])).length,
      sign: count(kind, 'sign'),
      write: count(kind, 'write'),
      say: count(kind, 'say')
    };
  });
  return {
    kinds,
    complete: kinds.reduce((s, k) => s + k.complete, 0),
    total: kinds.reduce((s, k) => s + k.total, 0)
  };
};
