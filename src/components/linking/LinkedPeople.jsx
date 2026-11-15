import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLinkedViewers, unlinkStudent, linkErrorMessage } from '../../lib/linking';
import { Users, Trash2, Loader2, AlertTriangle } from 'lucide-react';

const ROLE_LABEL = {
  parent: { en: 'Parent', gu: 'વાલી' },
  teacher: { en: 'Teacher', gu: 'શિક્ષક' }
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Who can currently see this student's progress.
export const LinkedPeople = ({ isEn = true }) => {
  const { user } = useAuth();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getLinkedViewers();
    if (result.ok) {
      setViewers(result.viewers);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (viewerId) => {
    setBusyId(viewerId);
    const result = await unlinkStudent(user?.id, viewerId);
    setBusyId(null);
    setConfirmId(null);
    if (result.ok) {
      setViewers(prev => prev.filter(v => v.viewer_id !== viewerId));
    } else {
      setError(result.error);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-action-soft text-action flex items-center justify-center">
          <Users className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold leading-tight">{isEn ? 'People who can see my progress' : 'મારી પ્રગતિ જોઈ શકે તેવા લોકો'}</h2>
          <p className="text-sm text-ink-muted">
            {isEn ? 'Remove someone to end their access immediately.' : 'કોઈની ઍક્સેસ બંધ કરવા તેમને દૂર કરો.'}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {isEn ? 'Loading…' : 'લોડ થઈ રહ્યું છે…'}
        </p>
      ) : error ? (
        <p className="flex items-start gap-2 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          {linkErrorMessage(error, isEn)}
        </p>
      ) : viewers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {isEn ? 'No one is linked yet.' : 'હજુ કોઈ જોડાયું નથી.'}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {viewers.map(viewer => {
            const role = ROLE_LABEL[viewer.viewer_role] || { en: 'Viewer', gu: 'જોનાર' };
            return (
              <li key={viewer.viewer_id} className="py-2.5 flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">
                    {viewer.display_name || (isEn ? 'Linked person' : 'જોડાયેલ વ્યક્તિ')}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {isEn ? role.en : role.gu}
                    {viewer.linked_at && ` · ${formatDate(viewer.linked_at)}`}
                  </span>
                </span>
                {confirmId === viewer.viewer_id ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => remove(viewer.viewer_id)}
                      disabled={busyId === viewer.viewer_id}
                      className="min-h-[36px] px-3 rounded-lg bg-danger text-white text-xs font-bold disabled:opacity-50"
                    >
                      {isEn ? 'Confirm' : 'પુષ્ટિ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="min-h-[36px] px-3 rounded-lg border border-line text-xs font-semibold"
                    >
                      {isEn ? 'Cancel' : 'રદ'}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(viewer.viewer_id)}
                    className="min-h-[36px] px-3 rounded-lg border border-line text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {isEn ? 'Remove' : 'દૂર કરો'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
