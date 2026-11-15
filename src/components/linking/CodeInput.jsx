import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { sanitizeCodeInput, formatCode, isCodeReady, hasAmbiguousChars } from '../../lib/studentCodes';

// Shared 6-character student-code field used by parents and teachers.
// Uppercases, strips spaces/dashes, refuses to submit ambiguous characters and
// keeps whatever was typed when the server rejects the code.
export const CodeInput = ({
  value,
  onChange,
  onSubmit,
  submitting = false,
  error = null,
  isEn = true,
  label,
  buttonLabel
}) => {
  const [touched, setTouched] = useState(false);
  const ambiguous = hasAmbiguousChars(value);
  const ready = isCodeReady(value);

  const handleChange = (event) => {
    setTouched(true);
    onChange(sanitizeCodeInput(event.target.value));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!ready || submitting) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="student-code" className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label || (isEn ? 'Student code' : 'વિદ્યાર્થી કોડ')}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="student-code"
          name="student-code"
          value={formatCode(value)}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="student-code-hint"
          aria-invalid={Boolean(error) || ambiguous}
          placeholder="34B SD5"
          className="min-h-[48px] w-full sm:max-w-[220px] rounded-xl border-2 border-line bg-surface px-3 font-mono text-lg tracking-[0.2em] uppercase focus:outline-none focus:border-action"
        />
        <button
          type="submit"
          disabled={!ready || submitting}
          className="min-h-[48px] px-5 rounded-xl bg-action text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {buttonLabel || (isEn ? 'Add student' : 'વિદ્યાર્થી ઉમેરો')}
        </button>
      </div>
      <p id="student-code-hint" className="text-xs text-ink-muted">
        {isEn
          ? '6 characters. Letters 0, O, 1 and I are not used.'
          : '૬ અક્ષર. 0, O, 1 અને I અક્ષરો વપરાતા નથી.'}
      </p>
      <div aria-live="polite" className="min-h-[20px]">
        {ambiguous && (touched || value) && (
          <p className="text-xs font-semibold text-danger">
            {isEn ? 'Codes never contain 0, O, 1 or I — check the code.' : 'કોડમાં 0, O, 1 કે I હોતા નથી — કોડ તપાસો.'}
          </p>
        )}
        {!ambiguous && error && <p className="text-xs font-semibold text-danger">{error}</p>}
      </div>
    </form>
  );
};
