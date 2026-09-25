import React from 'react';
import { Home, CalendarCheck, Bell, User, CheckSquare } from 'lucide-react';

export type NavTabId = 'home' | 'tasks' | 'approvals' | 'activity' | 'profile';

interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  unreadCount?: number;
  pendingApprovalsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
  pendingApprovalsCount = 0,
}) => {
  const tabs = [
    { id: 'home' as NavTabId, label: 'Today', icon: Home },
    { id: 'tasks' as NavTabId, label: 'Work', icon: CheckSquare },
    {
      id: 'approvals' as NavTabId,
      label: 'Approvals',
      icon: CalendarCheck,
      badge: pendingApprovalsCount,
    },
    {
      id: 'activity' as NavTabId,
      label: 'Activity',
      icon: Bell,
      badge: unreadCount,
    },
    { id: 'profile' as NavTabId, label: 'Me', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] select-none"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-colors group focus-visible:outline-none ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 font-medium transition-all ${
                  isActive ? 'font-semibold text-blue-600' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
      {/* iOS Home Indicator Spacer area */}
      <div className="h-5 w-full bg-white/95" />
    </nav>
  );
};
