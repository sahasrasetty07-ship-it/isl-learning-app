import { useCallback, useEffect, useState } from 'react';
import { ensureMyCode, regenerateMyCode, linkErrorMessage } from '../../lib/linking';
import { formatCode } from '../../lib/studentCodes';
import { Copy, Share2, RefreshCw, KeyRound, Check, Loader2, AlertTriangle } from 'lucide-react';

// The student's private linking code. Shown on screen only — never written to
// storage, logs or the URL.
export const MyCodeCard = ({ isEn = true, showToast }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await ensureMyCode();
    if (result.ok) setCode(result.code);
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      showToast?.(isEn ? 'Code copied' : 'કોડ કોપી થયો', 'success');
    } catch {
      showToast?.(isEn ? 'Could not copy the code.' : 'કોડ કોપી થઈ શક્યો નહીં.', 'error');
    }
  };

  const share = async () => {
    const text = isEn
      ? `Link to my Saket progress with this student code: ${code}`
      : `આ વિદ્યાર્થી કોડ સાથે મારી સાકેત પ્રગતિ જોડો: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Saket student code', text });
        return;
      } catch {
        /* user cancelled: fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(code);
      showToast?.(isEn ? 'Code copied instead' : 'કોડ કોપી થયો', 'success');
    } catch {
      showToast?.(isEn ? 'Sharing is not available here.' : 'અહીં શેર થઈ શકતું નથી.', 'error');
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    const result = await regenerateMyCode();
    setRegenerating(false);
    setConfirmingRegenerate(false);
    if (result.ok) {
      setCode(result.code);
      showToast?.(isEn ? 'New code created' : 'નવો કોડ બન્યો', 'success');
    } else {
      setError(result.error);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-action-soft text-action flex items-center justify-center">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold leading-tight">{isEn ? 'My student code' : 'મારો વિદ્યાર્થી કોડ'}</h2>
          <p className="text-sm text-ink-muted">
            {isEn
              ? 'Share this with a parent or teacher so they can follow your progress.'
              : 'તમારી પ્રગતિ જોવા માટે વાલી કે શિક્ષકને આ કોડ આપો.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {isEn ? 'Loading your code…' : 'તમારો કોડ લોડ થઈ રહ્યો છે…'}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{linkErrorMessage(error, isEn)}</span>
        </div>
      ) : (
        <>
          <p
            className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.25em] tabular-nums select-all"
            aria-label={isEn ? `Student code ${formatCode(code)}` : `વિદ્યાર્થી કોડ ${formatCode(code)}`}
          >
            {formatCode(code)}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="min-h-[44px] px-3 rounded-xl border border-line text-sm font-semibold inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-success" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              {isEn ? 'Copy' : 'કોપી'}
            </button>
            <button
              type="button"
              onClick={share}
              className="min-h-[44px] px-3 rounded-xl border border-line text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'Share' : 'શેર'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRegenerate(true)}
              className="min-h-[44px] px-3 rounded-xl border border-line text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'New code' : 'નવો કોડ'}
            </button>
          </div>

          {confirmingRegenerate && (
            <div className="rounded-lg border border-action/40 bg-action-soft p-3 space-y-2" role="alertdialog" aria-label={isEn ? 'Confirm new code' : 'નવો કોડ પુષ્ટિ'}>
              <p className="text-sm font-semibold text-action">
                {isEn
                  ? 'Your old code will stop working. People already linked stay linked.'
                  : 'તમારો જૂનો કોડ કામ કરવાનું બંધ કરશે. પહેલેથી જોડાયેલા લોકો જોડાયેલા જ રહેશે.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={regenerating}
                  className="min-h-[44px] px-4 rounded-xl bg-action text-white text-sm font-bold disabled:opacity-50"
                >
                  {regenerating ? (isEn ? 'Creating…' : 'બની રહ્યો છે…') : isEn ? 'Create new code' : 'નવો કોડ બનાવો'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRegenerate(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-line bg-surface text-sm font-semibold"
                >
                  {isEn ? 'Cancel' : 'રદ કરો'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
