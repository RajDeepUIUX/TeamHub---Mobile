import React from 'react';
import { Home, CalendarCheck, GraduationCap, Luggage } from 'lucide-react';

/** 'more' hosts the modules opened from the side drawer; it has no bottom-nav button */
export type AppTab = 'home' | 'attendance' | 'learning' | 'leaves' | 'more';

const TABS: { id: Exclude<AppTab, 'more'>; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'leaves', label: 'Leaves', icon: Luggage },
];

interface AppBottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeTab, onTabChange }) => (
  <nav
    className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_16px_rgba(15,23,42,0.04)] z-20 select-none"
    aria-label="Main navigation"
  >
    <div className="grid grid-cols-4 h-16 px-2">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              isActive ? 'text-[#2F68FE]' : 'text-slate-400'
            }`}
          >
            <Icon
              className={`w-5.5 h-5.5 ${isActive ? 'stroke-[2.2] fill-[#2F68FE]/15' : 'stroke-[1.8]'}`}
            />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
