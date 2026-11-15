// Student linking codes.
// Codes are 6 alphanumeric characters, shown as "34B SD5". Ambiguous
// characters (0/O/1/I) are rejected by the client before a request is made.
export const CODE_LENGTH = 6;
const AMBIGUOUS = /[0OI1]/;

// Uppercase and drop anything that is not A-Z/0-9: spaces, dashes, punctuation.
export const normalizeCode = (raw = '') =>
  (raw === null || raw === undefined ? '' : String(raw)).toUpperCase().replace(/[^A-Z0-9]/g, '');

export const hasAmbiguousChars = (code = '') => AMBIGUOUS.test(normalizeCode(code));

// A code is submittable only when it is the right length and unambiguous.
export const isCodeReady = (raw = '') => {
  const code = normalizeCode(raw);
  return code.length === CODE_LENGTH && !hasAmbiguousChars(code);
};

// Display form: "34BSD5" -> "34B SD5" (groups of three)
export const formatCode = (raw = '') => normalizeCode(raw).replace(/(.{3})(?=.)/g, '$1 ');

// 0/O/1/I are never valid, so strip them down to the maximum input length.
export const sanitizeCodeInput = (raw = '') => normalizeCode(raw).slice(0, CODE_LENGTH);
