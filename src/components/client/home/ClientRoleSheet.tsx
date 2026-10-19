import React from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { CLIENT_CONTACT_ROLES, ClientContactRole } from '../data/clientPermissionsData';

interface ClientRoleSheetProps {
  isOpen: boolean;
  activeRoleId: string;
  onSelect: (role: ClientContactRole) => void;
  onClose: () => void;
}

/** Prototype only: preview the app as another Client Contact Role (menus, no-access states, hidden actions) */
export const ClientRoleSheet: React.FC<ClientRoleSheetProps> = ({ isOpen, activeRoleId, onSelect, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
    <SheetHeader title="Preview as role" subtitle="Prototype only · real roles come from Contact Roles" onClose={onClose} />
    <div role="radiogroup" aria-label="Contact role" className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 space-y-2.5">
      {CLIENT_CONTACT_ROLES.map((r) => {
        const on = r.id === activeRoleId;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(r)}
            className={`relative w-full p-3 pr-10 rounded-2xl border text-left transition-all cursor-pointer ${
              on ? 'border-[#2F68FE] bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-200 bg-white'
            }`}
          >
            <span
              className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                on ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-300'
              }`}
            >
              {on && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="block text-[13px] font-bold text-[#1E293B] leading-snug">{r.name}</span>
            <span className="mt-0.5 block text-[11px] text-slate-500 leading-snug">{r.description}</span>
          </button>
        );
      })}
    </div>
  </BottomSheet>
);
