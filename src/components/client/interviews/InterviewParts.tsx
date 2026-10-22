import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { BOOKING_HORIZON_DAYS, CandidateStatus, ShortlistedCandidate, isBookableDay, isoOfDate, statusTone } from '../data/clientInterviewsData';

export const CandidateStatusPill: React.FC<{ status: CandidateStatus }> = ({ status }) => <Pill tone={statusTone(status)}>{status}</Pill>;

/** V1: soft card — accent bar, avatar row, profile line, interview band, 2-up tiles, pill footer */
export const CandidateListSkeletonV1: React.FC = () => (
  <div className="space-y-3.5" aria-busy="true" aria-label="Loading candidates">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl pl-5 pr-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-28 h-3.5" />
            <StaffSkeleton className="w-36 h-3" />
          </div>
          <StaffSkeleton className="w-20 h-5 rounded-full" />
        </div>
        <StaffSkeleton className="w-48 h-3.5" />
        <StaffSkeleton className="w-full h-14 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <StaffSkeleton className="h-14 rounded-xl" />
          <StaffSkeleton className="h-14 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <StaffSkeleton className="flex-1 h-10 rounded-full" />
          <StaffSkeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/** V2: compact ticket — status band, name + profile, dashed rows, segmented footer */
export const CandidateListSkeletonV2: React.FC = () => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Loading candidates">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="h-9 px-3.5 flex items-center justify-between bg-[#F8FAFC] border-b border-[#EBF0F7]">
          <StaffSkeleton className="w-24 h-3" />
          <StaffSkeleton className="w-20 h-3" />
        </div>
        <div className="px-3.5 py-3 space-y-3">
          <div className="flex items-center gap-2.5">
            <StaffSkeleton className="w-9 h-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-32 h-3.5" />
              <StaffSkeleton className="w-44 h-3" />
            </div>
          </div>
          <div className="space-y-2.5">
            <StaffSkeleton className="w-full h-3" />
            <StaffSkeleton className="w-full h-3" />
            <StaffSkeleton className="w-full h-3" />
          </div>
        </div>
        <div className="h-11 border-t border-slate-100" />
      </div>
    ))}
  </div>
);

/** "More" actions of a card (Reschedule / Cancel Interview) */
export const CardActionsSheet: React.FC<{
  isOpen: boolean;
  title: string;
  subtitle?: string;
  actions: { key: string; label: string; icon: React.ElementType; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}> = ({ isOpen, title, subtitle, actions, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
    <ul className="px-4 py-3 pb-6 space-y-1.5">
      {actions.map((a) => (
        <li key={a.key}>
          <button
            type="button"
            onClick={a.onClick}
            className="w-full h-12 px-3 rounded-xl flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
          >
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.danger ? 'bg-[#FEF2F2] text-rose-500' : 'bg-slate-100 text-slate-600'}`}>
              <a.icon className="w-4 h-4" />
            </span>
            <span className={`text-[13px] font-bold ${a.danger ? 'text-rose-600' : 'text-[#1E293B]'}`}>{a.label}</span>
          </button>
        </li>
      ))}
    </ul>
  </BottomSheet>
);

/** Confirm popup with a custom "go back" label (desktop Cancel Interview / Remove Candidate modals) */
export const InterviewConfirmSheet: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  question?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ isOpen, title, message, question = 'Do you want to proceed?', confirmLabel, cancelLabel, danger, onConfirm, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title={title} onClose={onClose} />
    <div className="px-5 py-4">
      <p className="text-[13px] text-[#1E293B] leading-relaxed">{message}</p>
      <p className="mt-2 text-[13px] font-bold text-[#1E293B]">{question}</p>
    </div>
    <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
      <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`h-12 rounded-xl text-white text-xs font-bold cursor-pointer ${danger ? 'bg-rose-500 active:bg-rose-600' : 'bg-[#2F68FE] active:bg-[#1D4ED8]'}`}
      >
        {confirmLabel}
      </button>
    </div>
  </BottomSheet>
);

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Desktop interview scheduler calendar: month navigation, selectable days, "Unavailable" days greyed out
 * (past days, today, weekends, beyond 60 days).
 */
export const SlotCalendar: React.FC<{ selected: string | null; onSelect: (iso: string) => void }> = ({ selected, onSelect }) => {
  const today = isoOfDate(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const nowD = new Date();
  const atFirstMonth = cursor.y === nowD.getFullYear() && cursor.m === nowD.getMonth();
  const last = new Date();
  last.setDate(last.getDate() + BOOKING_HORIZON_DAYS);
  const atLastMonth = cursor.y === last.getFullYear() && cursor.m === last.getMonth();

  const move = (delta: number) => setCursor((c) => ({ y: c.y + Math.floor((c.m + delta) / 12), m: (c.m + delta + 12) % 12 }));
  const title = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={atFirstMonth}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-[13px] font-bold text-[#1E293B]" aria-live="polite">
          {title}
        </p>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={atLastMonth}
          aria-label="Next month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center" role="grid" aria-label={title}>
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1.5 text-[10px] font-bold text-slate-400" role="columnheader">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const ok = isBookableDay(iso, today);
          const on = selected === iso;
          return (
            <span key={iso} className="flex items-center justify-center py-0.5" role="gridcell">
              <button
                type="button"
                disabled={!ok}
                aria-pressed={on}
                aria-label={new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + (ok ? '' : ', unavailable')}
                onClick={() => onSelect(iso)}
                className={`w-9 h-9 rounded-full text-[12px] font-semibold tabular-nums transition-colors ${
                  on
                    ? 'bg-[#2F68FE] text-white'
                    : ok
                      ? 'text-[#1E293B] bg-slate-50 active:bg-blue-50 cursor-pointer'
                      : `text-slate-300 cursor-not-allowed ${iso === today ? 'ring-1 ring-slate-200' : ''}`
                }`}
              >
                {day}
              </button>
            </span>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F68FE]" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Unavailable
        </span>
      </div>
    </div>
  );
};

/** Recruiter-sourced candidates: desktop opens the uploaded CV in a new tab */
export const CandidateCvSheet: React.FC<{
  isOpen: boolean;
  candidate: ShortlistedCandidate | null;
  onClose: () => void;
  onOpen: (fileName: string) => void;
}> = ({ isOpen, candidate, onClose, onOpen }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title="Candidate Resume" subtitle={candidate ? `${candidate.name} · ${candidate.profile}` : undefined} onClose={onClose} />
    <div className="px-5 py-5 pb-7">
      <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-[#FEF2F2] text-rose-500 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] truncate">{candidate?.cvFile}</span>
          <span className="block text-[11px] text-slate-500">CV shared by the recruiter</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => candidate?.cvFile && onOpen(candidate.cvFile)}
        className="mt-4 w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer"
      >
        <ExternalLink className="w-4 h-4" />
        Open CV
      </button>
    </div>
  </BottomSheet>
);
