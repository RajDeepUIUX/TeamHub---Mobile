import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Globe,
  Handshake,
  LayoutGrid,
  ListChecks,
  Loader2,
  Megaphone,
  MonitorPlay,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { CLIENT_SERVICE_SECTIONS, ClientService } from '../data/clientDashboardData';

interface ClientServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Service (or section) id to scroll to and highlight when the sheet opens */
  focusId?: string | null;
}

/** Desktop megamenu icons (`sidebar.tpl`) mapped to lucide */
export const SERVICE_ICONS: Record<string, React.ElementType> = {
  erp: Handshake,
  mycpe: MonitorPlay,
  assessment: ListChecks,
  benchmark: BarChart3,
  wd: Globe,
  dg: Megaphone,
  bm: BarChart3,
  msp: Settings,
  mssp: ShieldCheck,
  assurepro: CircleDollarSign,
};

type SsoState = 'loading' | 'ready' | 'error';

const ACTION_BASE =
  'h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** Desktop "Other Modules & Services" megamenu → bottom sheet (Switch / Explore; AssureOne opens via SSO) */
export const ClientServicesSheet: React.FC<ClientServicesSheetProps> = ({ isOpen, onClose, focusId }) => {
  const [sso, setSso] = useState<Record<string, SsoState>>({});
  const [highlight, setHighlight] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const bodyRef = useRef<HTMLDivElement>(null);
  const activeCount = CLIENT_SERVICE_SECTIONS[0].services.length;

  // Scroll the tapped dashboard tile's service into view once the sheet has slid up, then fade the highlight
  useEffect(() => {
    if (!isOpen || !focusId) return;
    setHighlight(focusId);
    // Scroll the sheet body only (scrollIntoView would also shift the phone frame)
    const scroll = setTimeout(() => {
      const body = bodyRef.current;
      const item = itemRefs.current[focusId];
      if (!body || !item) return;
      const offset = item.getBoundingClientRect().top - body.getBoundingClientRect().top;
      body.scrollTo({ top: body.scrollTop + offset - 16, behavior: 'smooth' });
    }, 320);
    const fade = setTimeout(() => setHighlight(null), 1800);
    return () => {
      clearTimeout(scroll);
      clearTimeout(fade);
    };
  }, [isOpen, focusId]);

  const startSso = (s: ClientService) => {
    setSso((prev) => ({ ...prev, [s.id]: 'loading' }));
    // Mock of `dashboard&task=mycpeServiceSSO` → MyCPE ONE `mycpe-service-sso`
    setTimeout(() => setSso((prev) => ({ ...prev, [s.id]: 'ready' })), 900);
  };

  const action = (s: ClientService) => {
    if (s.state === 'current') return null;
    if (s.sso) {
      const state = sso[s.id];
      if (state === 'loading') {
        return (
          <span className={`${ACTION_BASE} border border-slate-200 text-slate-400 cursor-wait`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Connecting
          </span>
        );
      }
      if (state === 'ready') {
        return (
          <a href={s.url} target="_blank" rel="noreferrer" className={`${ACTION_BASE} bg-[#2F68FE] text-white active:bg-[#2558E6]`}>
            Open
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        );
      }
      return (
        <button type="button" onClick={() => startSso(s)} className={`${ACTION_BASE} border border-[#2F68FE] text-[#2F68FE] active:bg-blue-50`}>
          {state === 'error' ? 'Retry' : 'Explore'}
        </button>
      );
    }
    return (
      <a href={s.url} target="_blank" rel="noreferrer" className={`${ACTION_BASE} border border-[#2F68FE] text-[#2F68FE] active:bg-blue-50`}>
        {s.state === 'enabled' ? 'Switch' : 'Explore'}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
            <LayoutGrid className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1E293B] truncate">Services You May Need</h2>
            <p className="text-[11px] text-slate-400 truncate">Switch modules or explore more for your firm</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#F8FAFC] px-4 pt-4 pb-8 space-y-5">
        {CLIENT_SERVICE_SECTIONS.map((section) => (
          <section key={section.id} ref={(el) => { itemRefs.current[section.id] = el; }} aria-labelledby={`client-services-${section.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pl-2.5 border-l-[3px] border-[#2F68FE]">
                <h3 id={`client-services-${section.id}`} className="text-sm font-bold text-[#1E293B] leading-tight">
                  {section.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">{section.description}</p>
              </div>
              {section.id === 'current' && (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[11px] font-bold tabular-nums">{activeCount} Active</span>
              )}
            </div>

            <ul className="mt-2.5 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {section.services.map((s) => {
                const Icon = SERVICE_ICONS[s.id] ?? LayoutGrid;
                const current = s.state === 'current';
                const lit = highlight === s.id || (highlight === section.id && current);
                return (
                  <li
                    key={s.id}
                    ref={(el) => { itemRefs.current[s.id] = el; }}
                    className={`p-3.5 transition-colors duration-700 ${lit ? 'bg-blue-50' : current ? 'bg-[#F5F8FF]' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          current ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1E293B] leading-tight">{s.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{s.description}</p>
                      </div>
                      {action(s)}
                    </div>
                    {(current || s.tag) && (
                      <div className="mt-2 ml-[52px] flex flex-wrap gap-1.5">
                        {current && <span className="px-2 py-0.5 rounded-md bg-[#2F68FE] text-white text-[10px] font-bold">Currently Active</span>}
                        {s.tag && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] text-[10px] font-semibold">{s.tag}</span>}
                      </div>
                    )}
                    {sso[s.id] === 'error' && (
                      <p role="alert" className="mt-2 ml-[52px] flex items-start gap-1.5 text-[11px] text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                        Something went wrong. Please try again or contact your account manager.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
};
