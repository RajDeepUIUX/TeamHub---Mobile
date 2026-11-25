import React from 'react';
import { NavCoursesIcon, NavHomeIcon, NavInsightsIcon, NavLibraryIcon, NavPlanIcon } from '../common/McIcons';

export type McTab = 'Home' | 'Library' | 'Plan' | 'My Courses' | 'Insights';

const TABS: { id: McTab; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Home', icon: NavHomeIcon },
  { id: 'Library', icon: NavLibraryIcon },
  { id: 'Plan', icon: NavPlanIcon },
  { id: 'My Courses', icon: NavCoursesIcon },
  { id: 'Insights', icon: NavInsightsIcon },
];

/** Overlaps the page by its corner radius so the rounded corners sit on the content */
export const McBottomNav: React.FC<{ active: McTab; onChange: (tab: McTab) => void }> = ({ active, onChange }) => (
  <nav
    className="relative z-[5] shrink-0 -mt-4 rounded-t-2xl bg-mc-line shadow-[0_-4px_16px_rgba(16,24,40,0.05)]"
    style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}
    aria-label="MyCPE"
  >
    <div className="px-1.5 grid grid-cols-5">
      {TABS.map(({ id, icon: Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(id)}
            className="pt-3.5 pb-2 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Icon className={`w-6 h-6 ${on ? 'text-mc-primary' : 'text-[#98A2B3]'}`} />
            <span className={`text-xs leading-[18px] whitespace-nowrap ${on ? 'font-medium text-mc-primary' : 'text-mc-muted'}`}>{id}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
