/**
 * src/utils/translationHistory.js
 * Optional, non-blocking translation event logger to Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Logs translation usage to public.translation_history table.
 * Fails silently without blocking the user.
 *
 * @param {'text-to-sign'|'speech-to-sign'|'sign-to-text'} mode
 * @param {string} inputText
 * @param {string|null} [userId=null]
 */
export async function logTranslationHistory(mode, inputText, userId = null) {
  if (!isSupabaseConfigured || !inputText || typeof inputText !== 'string') return;

  try {
    const textSnippet = inputText.trim().slice(0, 5000);
    if (!textSnippet) return;

    // Optional and non-blocking
    await supabase.from('translation_history').insert({
      mode,
      input_text: textSnippet,
      user_id: userId || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }
}
