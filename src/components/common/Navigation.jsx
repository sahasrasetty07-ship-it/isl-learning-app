import React from 'react';
import { useApp } from '../../context/AppContext';
import { navItemsForRole } from '../../config/navigation';

// The same bottom bar for every role; the items come from NAV_BY_ROLE.
export const Navigation = () => {
  const { activeTab, setActiveTab, uiLanguage, currentRole } = useApp();
  const isEn = uiLanguage === 'en';
  const items = navItemsForRole(currentRole);

  return (
    <nav
      aria-label="Main"
      className="w-full flex items-center justify-around px-1 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const label = isEn ? item.labelEn : item.labelGu;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex-1 min-h-[56px] min-w-[44px] pt-1.5 pb-2 px-1 flex flex-col items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-lg ${
              isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span
              className={`absolute top-0 left-2 right-2 h-[2px] rounded-full transition-all duration-150 ${
                isActive ? 'bg-accent' : 'bg-transparent'
              }`}
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-center">
              <Icon
                className="w-[22px] h-[22px] shrink-0 transition-transform duration-150 group-active:scale-95"
                aria-hidden="true"
              />

              {item.isTranslate && !isActive && (
                <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              )}
            </div>

            <span
              lang={isEn ? undefined : 'gu'}
              className={`text-[12px] leading-tight mt-1 truncate max-w-full tracking-normal ${
                isActive ? 'font-semibold text-accent' : 'font-medium'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
