import React from 'react';
import {
  X,
  BarChart2,
  ChevronRight,
  LayoutGrid,
  Activity,
  ClipboardCheck,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Ticket, TicketStatus } from '../../types/tickets';
import { TICKET_STATUS_GROUPS, TicketStatusGroup } from '../../data/ticketsData';

const countOf = (tickets: Ticket[], s: TicketStatus) => tickets.filter((t) => t.status === s).length;
const groupCount = (tickets: Ticket[], id: TicketStatusGroup['id']) =>
  TICKET_STATUS_GROUPS.find((g) => g.id === id)!.statuses.reduce((n, s) => n + countOf(tickets, s), 0);

/* ------------------------- Compact card (on screen) ------------------------ */

/** Same structure as the Attendance KPI card: 3 headline pills + "View Full Summary" */
export const TicketKPICard: React.FC<{ tickets: Ticket[]; onOpenSummary: () => void }> = ({ tickets, onOpenSummary }) => {
  const headline = [
    { label: 'Active', value: groupCount(tickets, 'active'), pill: 'bg-[#EFF6FF] text-[#2F68FE]' },
    {
      label: 'In Review',
      value: groupCount(tickets, 'review') + groupCount(tickets, 'payment'),
      pill: 'bg-[#F5F3FF] text-[#7C3AED]',
    },
    { label: 'Completed', value: groupCount(tickets, 'done'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
  ];

  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-3 gap-2 text-center">
        {headline.map(({ label, value, pill }) => (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
              {value}
            </div>
            <span className="text-xs text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
        <button
          type="button"
          onClick={onOpenSummary}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#1E293B] cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
            View Full Summary
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------ Summary sheet ------------------------------ */

const SECTION_META: Record<TicketStatusGroup['id'], { icon: React.ElementType; iconColor: string; valueColor: string }> = {
  active: { icon: Activity, iconColor: 'text-[#2F68FE]', valueColor: 'text-[#2F68FE]' },
  review: { icon: ClipboardCheck, iconColor: 'text-[#7C3AED]', valueColor: 'text-[#7C3AED]' },
  payment: { icon: IndianRupee, iconColor: 'text-[#F59E0B]', valueColor: 'text-[#D97706]' },
  done: { icon: CheckCircle2, iconColor: 'text-[#10B981]', valueColor: 'text-[#10B981]' },
};

interface TicketSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  scopeLabel: string;
  activeStatus: TicketStatus | null;
  /** Tapping a status filters the list and closes the sheet */
  onSelectStatus: (status: TicketStatus) => void;
}

export const TicketSummarySheet: React.FC<TicketSummarySheetProps> = ({
  isOpen,
  onClose,
  tickets,
  scopeLabel,
  activeStatus,
  onSelectStatus,
}) => {
  const reopened = tickets.filter((t) => t.comments.some((c) => c.role === 'System' && c.text.startsWith('Reopened'))).length;
  const overview = [
    { label: 'Total', value: tickets.length, color: 'text-[#1E293B]' },
    { label: 'High Priority', value: tickets.filter((t) => t.priority === 'High').length, color: 'text-[#F43F5E]' },
    { label: 'Reopened', value: reopened, color: 'text-slate-700' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Tickets Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">{scopeLabel} · Complete Status Breakdown</p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
        {/* Overview */}
        <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
            <LayoutGrid className="w-4 h-4 text-[#2F68FE]" />
            <span>Overview</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {overview.map(({ label, value, color }) => (
              <div key={label} className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-[11px] text-slate-500 block mb-0.5">{label}</span>
                <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* One section per stage */}
        {TICKET_STATUS_GROUPS.map((g) => {
          const meta = SECTION_META[g.id];
          const Icon = meta.icon;
          return (
            <div key={g.id} className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                  <Icon className={`w-4 h-4 ${meta.iconColor}`} />
                  <span>{g.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                  {groupCount(tickets, g.id)} tickets
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {g.statuses.map((s) => {
                  const n = countOf(tickets, s);
                  const isOn = activeStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSelectStatus(s)}
                      aria-pressed={isOn}
                      className={`bg-white p-2.5 rounded-xl border flex items-center justify-between gap-2 text-left shadow-2xs cursor-pointer ${
                        isOn ? 'border-[#2F68FE] ring-2 ring-blue-100' : 'border-slate-200/60'
                      }`}
                    >
                      <span className="text-slate-600 font-medium truncate">{s}</span>
                      <span className={`text-sm font-bold tabular-nums ${n ? meta.valueColor : 'text-slate-400'}`}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-center text-[11px] text-slate-400">Tap a status to filter your tickets</p>
      </div>

      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          Close Summary
        </button>
      </div>
    </BottomSheet>
  );
};
