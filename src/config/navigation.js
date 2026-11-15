// One place that decides which tabs each role may open.
// Tab ids are fixed: startAssignment() and the modules rely on them.
import {
  Home,
  BookOpen,
  Calculator,
  Atom,
  Languages,
  BarChart3,
  ClipboardList
} from 'lucide-react';

export const NAV_BY_ROLE = {
  student: ['dashboard', 'gujarati', 'math', 'science', 'translator', 'report'],
  parent: ['dashboard', 'report', 'translator'],
  teacher: ['dashboard', 'report', 'assignments', 'translator']
};

export const HOME_TAB = 'dashboard';

export const NAV_ITEM_META = {
  dashboard: { labelEn: 'Home', labelGu: 'હોમ', icon: Home },
  gujarati: { labelEn: 'Gujarati', labelGu: 'ગુજરાતી', icon: BookOpen },
  math: { labelEn: 'Math', labelGu: 'ગણિત', icon: Calculator },
  science: { labelEn: 'Science', labelGu: 'વિજ્ઞાન', icon: Atom },
  translator: { labelEn: 'Translate', labelGu: 'અનુવાદ', icon: Languages, isTranslate: true },
  report: { labelEn: 'Report', labelGu: 'પ્રગતિ', icon: BarChart3 },
  assignments: { labelEn: 'Practice', labelGu: 'મહાવરો', icon: ClipboardList }
};

export const navItemsForRole = (role) =>
  (NAV_BY_ROLE[role] || NAV_BY_ROLE.student).map(id => ({ id, ...NAV_ITEM_META[id] }));

export const isTabAllowed = (role, tab) =>
  Boolean(NAV_BY_ROLE[role] && NAV_BY_ROLE[role].includes(tab));

// Unknown or forbidden tabs always fall back to the home tab.
export const safeTabForRole = (role, tab) =>
  isTabAllowed(role, tab) ? tab : HOME_TAB;
