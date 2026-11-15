import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isMissingBackendError, SETUP_NOT_APPLIED_MESSAGE } from '../../lib/backendErrors';
import { GraduationCap, Users, UserRound, AlertCircle, Loader2 } from 'lucide-react';

const ROLES = [
  {
    id: 'student',
    icon: GraduationCap,
    en: 'Student',
    gu: 'વિદ્યાર્થી',
    descriptionEn: 'Learn letters, numbers, maths and science with ISL signs.',
    descriptionGu: 'સંકેતો સાથે અક્ષરો, અંકો, ગણિત અને વિજ્ઞાન શીખો.'
  },
  {
    id: 'parent',
    icon: Users,
    en: 'Parent',
    gu: 'વાલી',
    descriptionEn: 'Follow your child’s progress with their 6-character code.',
    descriptionGu: 'તમારા બાળકની પ્રગતિ તેમના ૬-અક્ષર કોડથી જુઓ.'
  },
  {
    id: 'teacher',
    icon: UserRound,
    en: 'Teacher',
    gu: 'શિક્ષક',
    descriptionEn: 'Link students, set practice and follow class progress.',
    descriptionGu: 'વિદ્યાર્થીઓ જોડો, મહાવરો આપો અને વર્ગની પ્રગતિ જુઓ.'
  }
];

export const RolePicker = () => {
  const { chooseRole, profile } = useAuth();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [setupMissing, setSetupMissing] = useState(false);

  const name = profile?.display_name || profile?.full_name || '';
  const isEn = true; // The picker is shown before the app language is chosen; labels carry both languages.

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await chooseRole(selected);
      if (!result.ok) {
        setSetupMissing(isMissingBackendError({ code: result.code, message: result.error }));
        setError(result);
        return;
      }
      // Success: App re-renders as soon as the refreshed profile arrives.
      setSetupMissing(false);
    } catch (err) {
      setError({ error: err?.message || 'unexpected' });
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = () => {
    if (!error) return null;
    if (setupMissing) return isEn ? SETUP_NOT_APPLIED_MESSAGE.en : SETUP_NOT_APPLIED_MESSAGE.gu;
    if (error.error === 'not_configured') {
      return 'Supabase is not configured in this build.';
    }
    return isEn
      ? 'We could not save your role. Please try again.'
      : 'તમારી ભૂમિકા સાચવી શકાઈ નહીં. ફરી પ્રયત્ન કરો.';
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface border border-line rounded-2xl p-5 sm:p-8 space-y-5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {isEn ? 'Choose your role' : 'ભૂમિકા પસંદ કરો'}
          </p>
          <h1 className="text-2xl font-bold text-ink">
            {name ? (isEn ? `Welcome, ${name}` : `સ્વાગત છે, ${name}`) : isEn ? 'Welcome to Saket' : 'સાકેતમાં સ્વાગત છે'}
          </h1>
          <p className="text-sm text-ink-muted">
            {isEn
              ? 'Pick the role that matches how you will use Saket.'
              : 'તમે સાકેત કેવી રીતે વાપરશો તે પ્રમાણે ભૂમિકા પસંદ કરો.'}
          </p>
        </header>

        <div role="radiogroup" aria-label={isEn ? 'Account role' : 'ખાતાની ભૂમિકા'} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={submitting}
                onClick={() => !submitting && setSelected(role.id)}
                className={`min-h-[132px] w-full text-left rounded-xl border-2 p-4 transition focus-visible:ring-2 focus-visible:ring-action disabled:opacity-60 ${
                  isSelected ? 'border-action bg-action-soft' : 'border-line bg-surface hover:border-ink-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-action' : 'text-ink-muted'}`} aria-hidden="true" />
                  <span className="font-bold text-ink">{role.en}</span>
                </span>
                <span lang="gu" className="block text-sm font-semibold text-ink-muted mt-0.5">{role.gu}</span>
                <span className="block text-xs text-ink-muted mt-2 leading-relaxed">
                  {isEn ? role.descriptionEn : role.descriptionGu}
                </span>
              </button>
            );
          })}
        </div>

        <p className="flex items-start gap-2 text-xs text-ink-muted bg-canvas border border-line rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {isEn
              ? 'You can’t change this later. Choose carefully.'
              : 'આ પછી બદલી શકાશે નહીં. ધ્યાનપૂર્વક પસંદ કરો.'}
          </span>
        </p>

        {error && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft text-danger text-sm p-3 space-y-2" aria-live="polite">
            <p className="font-semibold">{errorText()}</p>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="min-h-[44px] px-4 rounded-lg border border-danger/40 bg-surface text-danger text-sm font-semibold"
            >
              {isEn ? 'Retry' : 'ફરી પ્રયત્ન કરો'}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!selected || submitting}
          className="w-full min-h-[48px] rounded-xl bg-action text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {submitting
            ? isEn ? 'Saving…' : 'સાચવી રહ્યા છીએ…'
            : isEn ? 'Continue' : 'આગળ વધો'}
        </button>
      </div>
    </div>
  );
};
