import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { Home, BookOpen, Languages, BarChart3 } from 'lucide-react';

// Student bottom navigation. Gujarati, Maths and Science live inside Learn.
export const Navigation = () => {
  const { activeTab, setActiveTab, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const navItems = [
    { id: 'dashboard', label: isEn ? 'Home' : 'હોમ', icon: Home, tabs: ['dashboard'] },
    { id: 'learn', label: isEn ? 'Learn' : 'શીખો', icon: BookOpen, tabs: ['learn', 'gujarati', 'math', 'science'] },
    { id: 'translator', label: isEn ? 'Translate' : 'અનુવાદ', icon: Languages, tabs: ['translator'] },
    { id: 'report', label: isEn ? 'Report' : 'પ્રગતિ', icon: BarChart3, tabs: ['report'] }
  ];

  return (
    <nav
      aria-label={isEn ? 'Student menu' : 'વિદ્યાર્થી મેનુ'}
      className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-md mx-auto grid grid-cols-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.tabs.includes(activeTab);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'relative w-full min-h-[60px] flex flex-col items-center justify-center gap-0.5 text-xs transition',
                  isActive ? 'text-action font-bold' : 'text-ink-muted font-medium hover:text-ink'
                )}
              >
                {/* Bar on top marks the current item, so it is not shown by colour alone */}
                {isActive && <span className="absolute top-0 inset-x-5 h-1 rounded-b-full bg-action" aria-hidden="true" />}
                <Icon className="w-6 h-6" aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
