// Detects the "the SQL in the README hasn't been applied yet" case so the UI
// can show one calm notice instead of an error loop or a crash.
const MISSING_CODES = new Set(['PGRST202', '42883', '42P01', 'PGRST204', '404']);

const MISSING_MESSAGES = [
  'schema cache',
  'does not exist',
  'could not find the function',
  'could not find the table',
  'relation "',
  'undefined function'
];

export const isMissingBackendError = (error) => {
  if (!error) return false;
  if (error.code && MISSING_CODES.has(String(error.code))) return true;
  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  return MISSING_MESSAGES.some(fragment => message.includes(fragment));
};

export const SETUP_NOT_APPLIED_MESSAGE = {
  en: 'Database setup not applied yet. Run the SQL from the setup guide, then reload.',
  gu: 'ડેટાબેઝ સેટઅપ હજુ લાગુ થયું નથી. સેટઅપ માર્ગદર્શિકાનું SQL ચલાવો અને પૃષ્ઠ ફરી લોડ કરો.'
};
