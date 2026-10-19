import React from 'react';
import { Briefcase, Building2, User } from 'lucide-react';
import { USER_ROLES, UserRole } from '../../types/user';

const ROLE_ICON: Record<UserRole, React.ReactNode> = {
  Staff: <User className="w-3.5 h-3.5" />,
  Manager: <Briefcase className="w-3.5 h-3.5" />,
  Client: <Building2 className="w-3.5 h-3.5" />,
};

/**
 * Prototype-only: lets reviewers on a phone switch between the Staff, Manager and Client
 * experiences from the side menu (the desktop studio has the same switch in its toolbar).
 */
export const RoleSwitcher: React.FC<{ role: UserRole; onChange: (role: UserRole) => void }> = ({ role, onChange }) => (
  <div className="px-4 pt-3 pb-1">
    <p className="px-0.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Viewing as</p>
    <div role="radiogroup" aria-label="Viewing as" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100">
      {USER_ROLES.map((r) => {
        const on = r === role;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && onChange(r)}
            className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${
              on ? 'bg-white text-[#2F68FE] shadow-2xs' : 'text-slate-500 active:bg-white/60'
            }`}
          >
            {ROLE_ICON[r]}
            {r}
          </button>
        );
      })}
    </div>
  </div>
);
