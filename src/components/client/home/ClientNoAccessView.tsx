import React from 'react';
import { Lock } from 'lucide-react';

interface ClientNoAccessViewProps {
  title: string;
  roleName: string;
  onGoHome: () => void;
}

/** Module without `is_list` for the contact's role (desktop: menu hidden, direct URL → Dashboard + error) */
export const ClientNoAccessView: React.FC<ClientNoAccessViewProps> = ({ title, roleName, onGoHome }) => (
  <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
    <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
      <h1 className="text-base font-bold screen-title">{title}</h1>
    </header>
    <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
      <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] text-rose-500 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7" />
      </div>
      <h2 className="text-base font-bold">You don't have access to {title}</h2>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        Your role <span className="font-semibold text-slate-600">{roleName}</span> doesn't include this module. Ask your firm admin to update your
        contact role.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="mt-5 h-11 px-6 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#2558E6] transition-colors cursor-pointer"
      >
        Back to Home
      </button>
    </div>
  </div>
);
