// Shared presentational pieces of the Saket design system. No app state here.
import clsx from 'clsx';
import { ArrowLeft, BookOpen, Calculator, FlaskConical, Play } from 'lucide-react';

// Subject key (as used by AppContext: 'gujarati' | 'math' | 'science') -> look
export const SUBJECT_STYLES = {
  gujarati: { icon: BookOpen, text: 'text-gujarati', bg: 'bg-gujarati', soft: 'bg-gujarati-soft', border: 'border-gujarati', en: 'Gujarati', gu: 'ગુજરાતી' },
  math: { icon: Calculator, text: 'text-maths', bg: 'bg-maths', soft: 'bg-maths-soft', border: 'border-maths', en: 'Maths', gu: 'ગણિત' },
  science: { icon: FlaskConical, text: 'text-science', bg: 'bg-science', soft: 'bg-science-soft', border: 'border-science', en: 'Science', gu: 'વિજ્ઞાન' }
};

const BUTTON_VARIANTS = {
  primary: 'bg-action text-white hover:bg-action-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
  ghost: 'text-ink hover:bg-canvas',
  dark: 'bg-ink text-white hover:bg-ink/90'
};

// For links or labels that must look like buttons
export const buttonClass = (variant = 'primary', className) => clsx(
  'inline-flex items-center justify-center gap-2 min-h-tap px-4 rounded-xl font-semibold text-sm transition',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  BUTTON_VARIANTS[variant],
  className
);

export const Button = ({ variant = 'primary', className, type = 'button', ...props }) => (
  <button type={type} className={buttonClass(variant, className)} {...props} />
);

// Square 44px icon-only button: always pass a label for screen readers
export const IconButton = ({ label, className, children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={clsx(
      'inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl border border-line bg-surface text-ink hover:bg-canvas transition disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ as: Tag = 'section', className, ...props }) => (
  <Tag className={clsx('bg-surface border border-line rounded-2xl p-4 sm:p-5', className)} {...props} />
);

// Section title used inside cards
export const CardTitle = ({ icon: Icon, title, subtitle, action, iconClass = 'text-ink-muted' }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-2 min-w-0">
      {Icon && <Icon className={clsx('w-5 h-5 mt-0.5 shrink-0', iconClass)} aria-hidden="true" />}
      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-tight">{title}</h3>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// Progress with the number always written next to the bar (never colour alone)
export const ProgressBar = ({ value = 0, label, valueText, color = 'bg-action', className }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {(label || valueText !== null) && (
        <div className="flex items-center justify-between gap-2 text-sm mb-1">
          {label && <span className="font-medium text-ink">{label}</span>}
          {valueText !== null && <span className="font-semibold tabular-nums text-ink">{valueText ?? `${Math.round(pct)}%`}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === 'string' ? label : undefined}
        className="h-2.5 w-full rounded-full bg-line overflow-hidden"
      >
        <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// Screen title that replaces the old gradient banners
export const PageHeader = ({ title, subtitle, icon: Icon, tone, onBack, backLabel, actions }) => {
  const s = tone && SUBJECT_STYLES[tone];
  return (
    <header className="space-y-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-tap -ml-2 px-2 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface transition"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className={clsx('w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center', s ? `${s.soft} ${s.text}` : 'bg-action-soft text-action')}>
              <Icon className="w-6 h-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base text-ink-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};

// Segmented tabs. Selected tab: white card + bold text + underline bar, so it is not shown by colour alone.
export const Tabs = ({ items, value, onChange, label, className }) => (
  <div role="tablist" aria-label={label} className={clsx('flex gap-1 p-1 rounded-2xl bg-line/60', className)}>
    {items.map(item => {
      const active = item.id === value;
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.id)}
          className={clsx(
            'relative flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 min-h-[52px] sm:min-h-tap px-2 sm:px-3 py-1 rounded-xl text-sm text-center leading-tight transition',
            active ? 'bg-surface text-ink font-bold border border-line' : 'text-ink-muted font-medium hover:text-ink'
          )}
        >
          {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{item.label}</span>
          {active && <span className="absolute left-3 right-3 bottom-0.5 h-0.5 rounded-full bg-action" aria-hidden="true" />}
        </button>
      );
    })}
  </div>
);

// Small selectable chip (filters, lesson pickers). Selected = filled + check-like weight.
export const Chip = ({ active, className, ...props }) => (
  <button
    type="button"
    aria-pressed={active}
    className={clsx(
      'inline-flex items-center gap-1.5 min-h-tap px-3.5 rounded-xl text-sm whitespace-nowrap border transition',
      active ? 'bg-ink text-white border-ink font-bold' : 'bg-surface text-ink border-line font-medium hover:bg-canvas',
      className
    )}
    {...props}
  />
);

// The large sign-video panel at the top of a lesson. Opens the existing sign video player.
export const SignVideoButton = ({ onClick, label, sublabel, glyph }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative w-full aspect-video rounded-2xl bg-ink text-white overflow-hidden flex flex-col items-center justify-center gap-3 p-4 text-center"
  >
    {glyph && (
      <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-[9rem] sm:text-[11rem] leading-none text-white/10 select-none" aria-hidden="true">
        {glyph}
      </span>
    )}
    <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-action group-hover:bg-action-hover flex items-center justify-center transition">
      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white" aria-hidden="true" />
    </span>
    <span className="relative">
      <span className="block font-heading text-lg sm:text-xl font-bold">{label}</span>
      {sublabel && <span className="block text-sm text-white/80">{sublabel}</span>}
    </span>
  </button>
);
