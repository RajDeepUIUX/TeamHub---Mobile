import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { CLIENT_NEWS_LINKS } from '../data/clientDashboardData';

interface ClientNewsInsightsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Desktop sidebar static menu "News and Insights" → sheet; every item opens the MyCPE ONE page in a new tab */
export const ClientNewsInsightsSheet: React.FC<ClientNewsInsightsSheetProps> = ({ isOpen, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
      <h2 className="text-base font-bold text-[#1E293B]">News and Insights</h2>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-8 space-y-2.5">
      {CLIENT_NEWS_LINKS.map((n) => (
        <li key={n.id}>
          <a
            href={n.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs active:bg-slate-50"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-[#1E293B]">{n.label}</span>
              <span className="block text-[11px] text-slate-500">{n.hint}</span>
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#2F68FE] shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  </BottomSheet>
);
