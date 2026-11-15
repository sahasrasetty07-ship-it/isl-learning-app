import { useState } from 'react';
import { CodeInput } from './CodeInput';
import { useAuth } from '../../context/AuthContext';
import { linkStudent, linkErrorMessage, LINK_ERROR_MESSAGES } from '../../lib/linking';
import { CheckCircle2, UserPlus } from 'lucide-react';

// One card for both parents ("Add child") and teachers ("Add student").
export const LinkStudentCard = ({ onLinked, isEn = true, title, subtitle }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submit = async () => {
    if (!user?.id || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await linkStudent(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess({
        name: result.displayName,
        alreadyLinked: result.alreadyLinked
      });
      setCode('');
      onLinked?.(result);
    } catch {
      setError('unknown');
    } finally {
      setSubmitting(false);
    }
  };

  const successText = () => {
    if (!success) return null;
    if (success.alreadyLinked) {
      return isEn ? LINK_ERROR_MESSAGES.already_linked.en : LINK_ERROR_MESSAGES.already_linked.gu;
    }
    return isEn
      ? `${success.name || 'Student'} added.`
      : `${success.name || 'વિદ્યાર્થી'} ઉમેરાયો.`;
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-action-soft text-action flex items-center justify-center">
          <UserPlus className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold leading-tight">{title || (isEn ? 'Add a student' : 'વિદ્યાર્થી ઉમેરો')}</h2>
          <p className="text-sm text-ink-muted">
            {subtitle ||
              (isEn
                ? 'Ask the student for the 6-character code on their profile.'
                : 'વિદ્યાર્થીના પ્રોફાઇલ પરનો ૬-અક્ષર કોડ પૂછો.')}
          </p>
        </div>
      </div>

      <CodeInput
        value={code}
        onChange={setCode}
        onSubmit={submit}
        submitting={submitting}
        error={error ? linkErrorMessage(error, isEn) : null}
        isEn={isEn}
        buttonLabel={isEn ? 'Link student' : 'વિદ્યાર્થી જોડો'}
      />

      {success && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success" aria-live="polite">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          {successText()}
        </p>
      )}
    </section>
  );
};
