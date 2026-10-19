import React from 'react';
import { Home, UsersRound, Clock, ReceiptText } from 'lucide-react';

/** 'more' hosts the modules opened from the side drawer; it has no bottom-nav button */
export type ClientTab = 'home' | 'staff' | 'approvals' | 'timesheets' | 'invoices' | 'more';

type NavTab = Exclude<ClientTab, 'more'>;
type BottomTab = Exclude<NavTab, 'approvals'>;

const TABS: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'staff', label: 'My Staff', icon: UsersRound },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'invoices', label: 'Invoices', icon: ReceiptText },
];

export const CLIENT_TAB_LABEL: Record<NavTab, string> = {
  home: 'Dashboard',
  staff: 'My Staff',
  approvals: 'Attendance Approvals',
  timesheets: 'Timesheets',
  invoices: 'Invoices',
};

interface ClientAppBottomNavProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
}

/** Client bottom nav: Staff look (white bar, blue active tab) with Client tabs */
export const ClientAppBottomNav: React.FC<ClientAppBottomNavProps> = ({ activeTab, onTabChange }) => (
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
            <span className="relative">
              <Icon className={`w-5.5 h-5.5 ${isActive ? 'stroke-[2.2] fill-[#2F68FE]/15' : 'stroke-[1.8]'}`} />
            </span>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
