/**
 * src/utils/video.js
 * Helpers for embedding ISL sign videos from YouTube or direct file URLs.
 * This app uses Indian Sign Language (ISL), not ASL.
 */

// Matches any of these YouTube URL forms and extracts the 11-char video ID:
//   https://www.youtube.com/watch?v=XXXXXXXXXXX
//   https://youtu.be/XXXXXXXXXXX
//   https://www.youtube.com/embed/XXXXXXXXXXX
//   https://www.youtube.com/shorts/XXXXXXXXXXX
//   XXXXXXXXXXX  (bare 11-char ID)
const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const BARE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the YouTube video ID from a URL or bare ID.
 * Returns null if the input does not look like a YouTube link or ID.
 * @param {string} input
 * @returns {string|null}
 */
export function getYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const match = trimmed.match(YT_REGEX);
  if (match) return match[1];
  if (BARE_ID_REGEX.test(trimmed)) return trimmed;
  return null;
}

/**
 * Build a youtube-nocookie embed URL with optional start/end trim.
 * @param {string} input  - YouTube URL or bare ID
 * @param {{ start?: number, end?: number }} opts
 * @returns {string|null}  null when id cannot be resolved
 */
export function getEmbedUrl(input, { start, end } = {}) {
  const id = getYouTubeId(input);
  if (!id) return null;
  let url = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  if (start != null && start > 0) url += `&start=${Math.round(start)}`;
  if (end != null && end > 0) url += `&end=${Math.round(end)}`;
  return url;
}

/**
 * Returns true when the URL points to a direct video file (.mp4, .webm, .ogg).
 * @param {string} url
 * @returns {boolean}
 */
export function isDirectVideoFile(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
}

// ─── Sign-video registry helper ───────────────────────────────────────────────

import { signVideos } from '../data/signVideos.js';

/**
 * Return a sign-video entry only when status === 'approved' and a playable
 * source is set. Returns null otherwise, so callers can safely fall back to
 * text descriptions.
 *
 * Entries may be keyed by id ('ka', 'n1') or with the 'letter-'/'number-'
 * prefix, and may store either a `url` or a `youtubeId`.
 * @param {string} key  - key in signVideos (e.g. 'letter-ka' or 'ka')
 * @returns {{ url: string, start: number|null, end: number|null }|null}
 */
export function getSignVideo(key) {
  if (!key || typeof key !== 'string') return null;
  const entry = signVideos[key] || signVideos[key.replace(/^(letter|number)-/, '')];
  if (!entry) return null;
  if (entry.status !== 'approved') return null;

  const url = entry.url && entry.url.trim()
    ? entry.url
    : entry.youtubeId
      ? `https://www.youtube.com/watch?v=${entry.youtubeId}`
      : '';
  if (!url) return null;

  return {
    ...entry,
    url,
    start: entry.start ?? entry.startTime ?? null,
    end: entry.end ?? entry.endTime ?? null,
  };
}

