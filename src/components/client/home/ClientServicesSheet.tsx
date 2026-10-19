import React, { useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Briefcase,
  ClipboardCheck,
  Globe,
  LayoutGrid,
  Loader2,
  Megaphone,
  Server,
  ShieldCheck,
  Users,
  Workflow,
  BookText,
  X,
  AlertCircle,
} from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { CLIENT_SERVICE_SECTIONS, ClientService } from '../data/clientDashboardData';

interface ClientServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<string, React.ElementType> = {
  erp: Users,
  mycpe: BookOpenCheck,
  assessment: ClipboardCheck,
  wd: Globe,
  dg: Megaphone,
  bm: BarChart3,
  msp: Server,
  mssp: ShieldCheck,
  assurepro: Briefcase,
  assurebooks: BookText,
  assureflow: Workflow,
};

type SsoState = 'loading' | 'ready' | 'error';

/** Desktop "Other Modules & Services" megamenu → bottom sheet (Switch / Explore; AssureOne opens via SSO) */
export const ClientServicesSheet: React.FC<ClientServicesSheetProps> = ({ isOpen, onClose }) => {
  const [sso, setSso] = useState<Record<string, SsoState>>({});
  const activeCount = CLIENT_SERVICE_SECTIONS[0].services.length;

  const startSso = (s: ClientService) => {
    setSso((prev) => ({ ...prev, [s.id]: 'loading' }));
    // Mock of `dashboard&task=mycpeServiceSSO`: AssureFlow isn't set up for this demo firm
    setTimeout(() => setSso((prev) => ({ ...prev, [s.id]: s.id === 'assureflow' ? 'error' : 'ready' })), 900);
  };

  const action = (s: ClientService) => {
    const base = 'h-8 px-3 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer';
    if (s.state === 'current') {
      return <span className="px-2 py-1 rounded-full bg-[#E8F8F0] text-[#059669] text-[10px] font-bold shrink-0">Currently Active</span>;
    }
    if (s.sso) {
      const state = sso[s.id];
      if (state === 'loading') {
        return (
          <span className={`${base} border border-slate-200 text-slate-400 cursor-wait`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Connecting
          </span>
        );
      }
      if (state === 'ready') {
        return (
          <a href={s.url} target="_blank" rel="noreferrer" className={`${base} bg-[#2F68FE] text-white active:bg-[#2558E6]`}>
            Open
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        );
      }
      return (
        <button type="button" onClick={() => startSso(s)} className={`${base} border border-[#2F68FE] text-[#2F68FE] active:bg-blue-50`}>
          {state === 'error' ? 'Retry' : 'Explore'}
        </button>
      );
    }
    return (
      <a
        href={s.url}
        target="_blank"
        rel="noreferrer"
        className={`${base} border ${s.state === 'enabled' ? 'border-[#2F68FE] text-[#2F68FE] active:bg-blue-50' : 'border-slate-200 text-slate-600 active:bg-slate-50'}`}
      >
        {s.state === 'enabled' ? 'Switch' : 'Explore'}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-[#1E293B]">Other Modules &amp; Services</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-6 space-y-4">
        {CLIENT_SERVICE_SECTIONS.map((section) => (
          <section key={section.id}>
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                <h3 className="text-[13px] font-extrabold text-[#1E293B]">{section.title}</h3>
                <p className="text-[11px] text-slate-400 leading-snug">{section.description}</p>
              </div>
              {section.id === 'current' && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold">{activeCount} Active</span>
              )}
            </div>
            <div className="mt-2 bg-white border border-[#EBF0F7] rounded-2xl divide-y divide-slate-100">
              {section.services.map((s) => {
                const Icon = ICONS[s.id] ?? LayoutGrid;
                return (
                  <div key={s.id} className={`p-3 ${s.state === 'current' ? 'bg-[#F5F8FF] first:rounded-t-2xl' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          s.state === 'current' ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-[#1E293B] leading-tight">{s.title}</span>
                        <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">{s.description}</span>
                      </span>
                      {action(s)}
                    </div>
                    {s.tag && <span className="inline-block mt-2 ml-12 px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] text-[10px] font-semibold">{s.tag}</span>}
                    {sso[s.id] === 'error' && (
                      <p role="alert" className="mt-2 ml-12 flex items-start gap-1.5 text-[11px] text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                        Something went wrong. Please try again or contact your account manager.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
};
