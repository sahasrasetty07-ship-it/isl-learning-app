import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getLinkedStudents, unlinkStudent, linkErrorMessage } from '../../lib/linking';
import { loadProgress } from '../../lib/progress';
import { StudentReportView } from '../student/ReportCard';
import { LinkStudentCard } from '../linking/LinkStudentCard';
import { PageHeader } from '../ui';
import { Users, RefreshCw, Loader2, Trash2, AlertTriangle } from 'lucide-react';

const RELOAD_MS = 30000;

const timeAgo = (iso, isEn) => {
  if (!iso) return isEn ? 'not updated yet' : 'હજુ અપડેટ નથી';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return isEn ? 'Last updated just now' : 'હમણાં જ અપડેટ થયું';
  return isEn ? `Last updated ${minutes} min ago` : `છેલ્લે ${minutes} મિનિટ પહેલાં અપડેટ`;
};

export const ParentDashboard = () => {
  const { showToast, uiLanguage } = useApp();
  const { profile, user } = useAuth();
  const isEn = uiLanguage === 'en';

  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [progressById, setProgressById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const mounted = useRef(true);

  const loadChildProgress = useCallback(async (studentId) => {
    const result = await loadProgress(studentId);
    if (!mounted.current) return;
    if (result.data) {
      setProgressById(prev => ({ ...prev, [studentId]: result.data }));
    }
  }, []);

  const load = useCallback(async () => {
    const result = await getLinkedStudents();
    if (!mounted.current) return;
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setChildren(result.students);
    setError(null);
    setSelectedId(prev => prev || result.students[0]?.student_id || null);
    await Promise.all(result.students.map(s => loadChildProgress(s.student_id)));
    setLoading(false);
  }, [loadChildProgress]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, RELOAD_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  const selected = children.find(c => c.student_id === selectedId) || null;
  const selectedProgress = selected ? progressById[selected.student_id] : null;
  const childName = (child) =>
    child?.display_name || child?.name || (isEn ? 'Student' : 'વિદ્યાર્થી');

  const remove = async (studentId) => {
    const result = await unlinkStudent(studentId, user?.id);
    setConfirmRemove(null);
    if (result.ok) {
      setChildren(prev => prev.filter(c => c.student_id !== studentId));
      setSelectedId(prev => (prev === studentId ? null : prev));
      showToast?.(isEn ? 'Child removed' : 'બાળક દૂર કર્યું', 'success');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={isEn ? `Welcome, ${profile?.full_name || profile?.display_name || 'parent'}` : `નમસ્તે, ${profile?.full_name || profile?.display_name || 'વાલી'}`}
        subtitle={isEn
          ? 'Follow your child’s progress and use their signs at home.'
          : 'તમારા બાળકની પ્રગતિ જુઓ અને ઘરે સંકેતો વાપરો.'}
        actions={
          <button
            type="button"
            onClick={load}
            className="min-h-[40px] px-3 rounded-xl border border-line bg-surface text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {isEn ? 'Refresh' : 'તાજું કરો'}
          </button>
        }
      />

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          {linkErrorMessage(error, isEn)}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {isEn ? 'Loading your children…' : 'તમારા બાળકો લોડ થઈ રહ્યા છે…'}
        </p>
      ) : children.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-ink-muted" aria-hidden="true" />
          <h2 className="font-bold">{isEn ? 'No child linked yet' : 'હજુ કોઈ બાળક જોડાયું નથી'}</h2>
          <p className="text-sm text-ink-muted">
            {isEn
              ? 'Ask your child for their 6-character code and add it below.'
              : 'તમારા બાળકનો ૬-અક્ષર કોડ લઈ નીચે ઉમેરો.'}
          </p>
        </div>
      ) : (
        <section className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={isEn ? 'Children' : 'બાળકો'}>
            {children.map(child => {
              const isSelected = child.student_id === selectedId;
              return (
                <button
                  key={child.student_id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(child.student_id)}
                  className={`min-h-[44px] px-3 rounded-xl border text-sm font-semibold transition ${
                    isSelected ? 'border-action bg-action-soft text-action' : 'border-line bg-surface text-ink hover:border-ink-muted'
                  }`}
                >
                  {childName(child)}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">{timeAgo(selected.updated_at, isEn)}</span>
              {confirmRemove === selected.student_id ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{isEn ? 'Remove this child?' : 'આ બાળક દૂર કરવું?'}</span>
                  <button
                    type="button"
                    onClick={() => remove(selected.student_id)}
                    className="min-h-[36px] px-3 rounded-lg bg-danger text-white text-xs font-bold"
                  >
                    {isEn ? 'Confirm' : 'પુષ્ટિ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="min-h-[36px] px-3 rounded-lg border border-line text-xs font-semibold"
                  >
                    {isEn ? 'Cancel' : 'રદ'}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(selected.student_id)}
                  className="min-h-[36px] px-3 rounded-lg border border-line text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {isEn ? 'Remove' : 'દૂર કરો'}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Child's report, same component the student and teacher see */}
      {selected && (
        <StudentReportView
          key={selected.student_id}
          student={selectedProgress || { totalStars: Number(selected.total_stars) || 0, currentStreak: Number(selected.current_streak) || 0 }}
          profile={{ display_name: childName(selected) }}
          isEn={isEn}
          showToast={showToast}
        />
      )}

      <LinkStudentCard
        isEn={isEn}
        title={isEn ? 'Add another child' : 'બીજું બાળક ઉમેરો'}
        subtitle={isEn
          ? 'Enter the 6-character code from your child’s profile.'
          : 'તમારા બાળકના પ્રોફાઇલ પરનો ૬-અક્ષર કોડ દાખલ કરો.'}
        onLinked={(result) => {
          if (result?.alreadyLinked) return;
          load();
        }}
      />
    </div>
  );
};
