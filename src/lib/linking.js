// Parent/teacher <-> student linking through Supabase RPCs.
// All functions return plain result objects; nothing throws at the UI.
import { supabase, isSupabaseConfigured } from './supabase';
import { isMissingBackendError } from './backendErrors';
import { normalizeCode, isCodeReady } from './studentCodes';

export const LINK_ERROR_MESSAGES = {
  invalid_code: {
    en: "That code doesn't match any student.",
    gu: 'આ કોડ કોઈ વિદ્યાર્થી સાથે મેળ ખાતો નથી.'
  },
  rate_limited: {
    en: 'Too many attempts. Try again in 10 minutes.',
    gu: 'ઘણા પ્રયત્નો થઈ ગયા. ૧૦ મિનિટ પછી ફરી પ્રયત્ન કરો.'
  },
  not_allowed: {
    en: "Your account can't add students.",
    gu: 'તમારું ખાતું વિદ્યાર્થીઓ ઉમેરી શકતું નથી.'
  },
  not_authenticated: {
    en: 'Please sign in again.',
    gu: 'કૃપા કરીને ફરી સાઇન ઇન કરો.'
  },
  already_linked: {
    en: 'Already added',
    gu: 'પહેલેથી જોડાયેલ છે'
  },
  missing_backend: {
    en: 'Database setup not applied yet. Run the project SQL, then reload.',
    gu: 'ડેટાબેઝ સેટઅપ હજુ લાગુ થયું નથી. પ્રોજેક્ટ SQL ચલાવો અને પૃષ્ઠ ફરી લોડ કરો.'
  },
  unknown: {
    en: 'Something went wrong. Please try again.',
    gu: 'કંઈક ખોટું થયું. ફરી પ્રયત્ન કરો.'
  }
};

export const linkErrorMessage = (error, isEn = true) => {
  const key = LINK_ERROR_MESSAGES[error] ? error : 'unknown';
  return isEn ? LINK_ERROR_MESSAGES[key].en : LINK_ERROR_MESSAGES[key].gu;
};

const callRpc = async (fn, params) => {
  if (!isSupabaseConfigured) return { ok: false, error: 'missing_backend' };
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    if (isMissingBackendError(error)) return { ok: false, error: 'missing_backend' };
    return { ok: false, error: 'unknown', raw: error };
  }
  return { ok: true, data };
};

// Link a student with their code. Client-side validation comes first so an
// obvious typo never hits the rate limiter.
export const linkStudent = async (rawCode) => {
  const code = normalizeCode(rawCode);
  if (!isCodeReady(code)) return { ok: false, error: 'invalid_code' };

  const result = await callRpc('link_student', { p_code: code });
  if (!result.ok) return result;

  const payload = result.data || {};
  if (!payload.ok) {
    return { ok: false, error: payload.error || 'unknown' };
  }
  return {
    ok: true,
    studentId: payload.student_id,
    displayName: payload.display_name || '',
    alreadyLinked: Boolean(payload.already_linked)
  };
};

export const unlinkStudent = async (studentId, viewerId) =>
  callRpc('unlink_student', { p_student_id: studentId, p_viewer_id: viewerId });

export const ensureMyCode = async () => {
  const result = await callRpc('ensure_my_code', {});
  if (!result.ok) return result;
  return { ok: true, code: String(result.data || '') };
};

export const regenerateMyCode = async () => {
  const result = await callRpc('regenerate_my_code', {});
  if (!result.ok) return result;
  return { ok: true, code: String(result.data || '') };
};

export const getLinkedStudents = async () => {
  const result = await callRpc('get_my_linked_students', {});
  if (!result.ok) return result;
  return { ok: true, students: Array.isArray(result.data) ? result.data : [] };
};

export const getLinkedViewers = async () => {
  const result = await callRpc('get_my_linked_viewers', {});
  if (!result.ok) return result;
  return { ok: true, viewers: Array.isArray(result.data) ? result.data : [] };
};
