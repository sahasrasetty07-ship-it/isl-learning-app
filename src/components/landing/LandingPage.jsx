import { useApp } from '../../context/AppContext';
import { Logo, LanguageSwitch, ROLE_OPTIONS } from '../common/Header';
import { Button } from '../ui';
import { ArrowRight, PenLine, Calculator, FlaskConical, Languages, Hand, Volume2 } from 'lucide-react';

const ROLE_TEXT = {
  student: {
    en: 'Learn letters, numbers, maths and science with sign videos and writing practice.',
    gu: 'સાઇન વિડીયો અને લેખન મહાવરા સાથે અક્ષરો, અંકો, ગણિત અને વિજ્ઞાન શીખો.'
  },
  teacher: {
    en: 'Teach lessons in class, assign practice and see how each student is doing.',
    gu: 'વર્ગમાં પાઠ ભણાવો, મહાવરો આપો અને દરેક વિદ્યાર્થીની પ્રગતિ જુઓ.'
  },
  parent: {
    en: "Follow your child's progress and learn simple signs to use at home.",
    gu: 'બાળકની પ્રગતિ જુઓ અને ઘરે વાપરવા માટેના સરળ સંકેતો શીખો.'
  }
};

const COVERS = [
  {
    icon: PenLine, tone: 'bg-gujarati-soft text-gujarati',
    en: ['Gujarati letters and numbers', 'Every letter and number with its sign, how to say it, and a writing pad that checks each stroke.'],
    gu: ['ગુજરાતી અક્ષરો અને અંકો', 'દરેક અક્ષર અને અંકનો સંકેત, ઉચ્ચાર અને દરેક રેખા તપાસતું લેખન પેડ.']
  },
  {
    icon: Calculator, tone: 'bg-maths-soft text-maths',
    en: ['Maths', 'Tables, addition, subtraction, multiplication and division, with practice questions.'],
    gu: ['ગણિત', 'ઘડિયા, સરવાળો, બાદબાકી, ગુણાકાર અને ભાગાકાર, મહાવરાના પ્રશ્નો સાથે.']
  },
  {
    icon: FlaskConical, tone: 'bg-science-soft text-science',
    en: ['Science', 'Short lessons with key words in sign, writing practice and a quiz.'],
    gu: ['વિજ્ઞાન', 'મુખ્ય શબ્દોના સંકેત, લેખન મહાવરો અને ક્વિઝ સાથેના ટૂંકા પાઠ.']
  },
  {
    icon: Languages, tone: 'bg-action-soft text-action',
    en: ['Two-way translation', 'Turn Gujarati text or speech into sign language, and signs back into Gujarati text.'],
    gu: ['બંને તરફ અનુવાદ', 'ગુજરાતી લખાણ કે અવાજને સાંકેતિક ભાષામાં, અને સંકેતોને ગુજરાતી લખાણમાં ફેરવો.']
  }
];

export const LandingPage = ({ onEnter }) => {
  const { uiLanguage, setUiLanguage, setCurrentRole } = useApp();
  const isEn = uiLanguage === 'en';

  const enterAs = (role) => {
    setCurrentRole(role);
    onEnter();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo onClick={() => window.scrollTo({ top: 0 })} isEn={isEn} />
          <LanguageSwitch uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {isEn
                ? 'Saket helps deaf and mute primary students learn Gujarati, Maths and Science in Indian Sign Language.'
                : 'સાકેત બધિર અને મૂક પ્રાથમિક વિદ્યાર્થીઓને ભારતીય સાંકેતિક ભાષામાં ગુજરાતી, ગણિત અને વિજ્ઞાન શીખવામાં મદદ કરે છે.'}
            </h1>
            <Button onClick={() => enterAs('student')} className="min-h-[52px] px-6 text-base">
              {isEn ? 'Start learning' : 'શીખવાનું શરૂ કરો'}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>

          {/* A lesson card as it appears in the app: sign, letter, word */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4" aria-hidden="true">
            <div className="aspect-video rounded-2xl bg-ink flex flex-col items-center justify-center gap-2 text-white">
              <Hand className="w-14 h-14" />
              <span className="text-sm font-medium text-white/80">ISL</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 h-20 rounded-2xl bg-gujarati-soft text-gujarati flex items-center justify-center font-heading font-bold text-5xl leading-none pt-2">ક</span>
              <div>
                <p className="font-heading text-3xl font-bold">કમળ</p>
                <p className="text-ink-muted">Kamal · Lotus</p>
              </div>
              <span className="ml-auto w-11 h-11 rounded-xl border border-line flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </span>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="bg-surface border-y border-line" aria-labelledby="roles-title">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
            <h2 id="roles-title" className="text-2xl sm:text-3xl font-bold">
              {isEn ? 'Who is using Saket?' : 'સાકેત કોણ વાપરે છે?'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => enterAs(r.id)}
                  className="group text-left bg-canvas border border-line rounded-2xl p-5 flex flex-col gap-3 hover:border-action transition"
                >
                  <span className="w-12 h-12 rounded-xl bg-surface border border-line flex items-center justify-center">
                    <r.icon className="w-6 h-6 text-action" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-xl font-bold">{isEn ? r.en : r.gu}</span>
                  <span className="text-ink-muted flex-1">{isEn ? ROLE_TEXT[r.id].en : ROLE_TEXT[r.id].gu}</span>
                  <span className="inline-flex items-center gap-1.5 min-h-tap font-semibold text-action">
                    {isEn ? `Open ${r.en.toLowerCase()} view` : `${r.gu} તરીકે ખોલો`}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* What it covers */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6" aria-labelledby="covers-title">
          <h2 id="covers-title" className="text-2xl sm:text-3xl font-bold">
            {isEn ? 'What Saket covers' : 'સાકેતમાં શું છે'}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {COVERS.map(c => {
              const [title, text] = isEn ? c.en : c.gu;
              return (
                <li key={c.en[0]} className="bg-surface border border-line rounded-2xl p-5 flex gap-4">
                  <span className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${c.tone}`}>
                    <c.icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-ink-muted">{text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-sm text-ink-muted">
          {isEn
            ? 'Saket · Gujarati learning with Indian Sign Language'
            : 'સાકેત · ભારતીય સાંકેતિક ભાષા સાથે ગુજરાતી શિક્ષણ'}
        </div>
      </footer>
    </div>
  );
};
