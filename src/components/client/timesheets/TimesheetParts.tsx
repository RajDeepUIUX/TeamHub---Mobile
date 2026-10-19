import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';

/** Staff Utilization Report buckets: ≤50, 51–70, 71–90, ≥90 % */
export const utilizationTone = (pct: number) =>
  pct >= 90
    ? { ring: '#10B981', text: 'text-[#10B981]', pill: 'bg-[#E8F8F0] text-[#10B981]' }
    : pct > 70
      ? { ring: '#2F68FE', text: 'text-[#2F68FE]', pill: 'bg-[#EFF6FF] text-[#1D4ED8]' }
      : pct > 50
        ? { ring: '#D97706', text: 'text-[#D97706]', pill: 'bg-[#FEF8E7] text-[#D97706]' }
        : { ring: '#E11D48', text: 'text-rose-600', pill: 'bg-[#FEF2F2] text-rose-600' };

export const utilizationPct = (working: number, available: number) => (available > 0 ? Math.round((working / available) * 100) : 0);

export const UtilizationRing: React.FC<{ pct: number }> = ({ pct }) => (
  <span
    className="w-[76px] h-[76px] rounded-full flex items-center justify-center shrink-0"
    style={{ background: `conic-gradient(${utilizationTone(pct).ring} ${Math.min(100, pct) * 3.6}deg, #E2E8F0 0deg)` }}
    role="img"
    aria-label={`${pct}% of available hours worked`}
  >
    <span className="w-[62px] h-[62px] rounded-full bg-white flex flex-col items-center justify-center">
      <span className="text-[17px] font-extrabold text-[#1E293B] tabular-nums leading-none">{pct}%</span>
      <span className="mt-0.5 text-[9.5px] font-semibold text-slate-400">Utilized</span>
    </span>
  </span>
);

/** Working vs available: blue up to available, amber for extra hours */
export const HoursBar: React.FC<{ working: number; available: number; className?: string }> = ({ working, available, className = '' }) => {
  if (available <= 0) return null;
  const max = Math.max(working, available);
  const within = (Math.min(working, available) / max) * 100;
  const extra = working > available ? ((working - available) / max) * 100 : 0;
  return (
    <span className={`flex h-1.5 rounded-full bg-slate-100 overflow-hidden ${className}`} aria-hidden="true">
      <span className="h-full bg-[#2F68FE]" style={{ width: `${within}%` }} />
      {extra > 0 && <span className="h-full bg-[#F59E0B] border-l border-white" style={{ width: `${extra}%` }} />}
    </span>
  );
};

export const TimesheetListSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading timesheets">
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 flex items-center gap-4">
      <div className="flex-1 space-y-2">
        <StaffSkeleton className="w-24 h-3" />
        <StaffSkeleton className="w-36 h-7" />
        <StaffSkeleton className="w-40 h-3" />
      </div>
      <StaffSkeleton className="w-[76px] h-[76px] rounded-full" />
    </div>
    <StaffSkeleton className="w-full h-10 rounded-2xl" />
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <StaffSkeleton className="w-40 h-3.5" />
        <div className="bg-white border border-[#EBF0F7] rounded-2xl divide-y divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3.5 flex items-center gap-3">
              <StaffSkeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <StaffSkeleton className="w-28 h-3.5" />
                <StaffSkeleton className="w-full h-1.5" />
              </div>
              <StaffSkeleton className="w-12 h-5" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Floating banner over the list (desktop toastr success / error) */
export const useTimesheetNotice = () => {
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((text: string, error?: boolean) => {
    clearTimeout(timer.current);
    setNotice({ text, error });
    timer.current = setTimeout(() => setNotice(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = notice ? (
    <div className="absolute top-3 inset-x-4 z-30 pointer-events-none">
      <div
        role="status"
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-semibold shadow-xs animate-in fade-in slide-in-from-top-1 duration-200 ${
          notice.error ? 'bg-[#FEF2F2] border-[#FECACA] text-rose-600' : 'bg-[#E8F8F0] border-[#A7F3D0] text-emerald-700'
        }`}
      >
        {notice.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
        <span className="flex-1 min-w-0 break-words">{notice.text}</span>
      </div>
    </div>
  ) : null;
  return [node, show] as const;
};

export type TimesheetExportType = 'summary_csv' | 'detailed_csv';

/** Desktop Export dropdown: summary CSV or detailed CSV for the current filters */
export const TimesheetExportSheet: React.FC<{
  isOpen: boolean;
  rangeLabel: string;
  rowCount: number;
  entryCount: number;
  staffCount: number;
  onClose: () => void;
  onExport: (type: TimesheetExportType) => void;
}> = ({ isOpen, rangeLabel, rowCount, entryCount, staffCount, onClose, onExport }) => {
  const [busy, setBusy] = useState<TimesheetExportType | null>(null);
  useEffect(() => {
    if (isOpen) setBusy(null);
  }, [isOpen]);

  const options: { type: TimesheetExportType; icon: React.ElementType; title: string; hint: string; count: string }[] = [
    {
      type: 'summary_csv',
      icon: FileSpreadsheet,
      title: 'Download report as CSV',
      hint: 'Date, staff and hours for each day',
      count: `${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`,
    },
    {
      type: 'detailed_csv',
      icon: FileText,
      title: 'Download detailed report as CSV',
      hint: 'Every entry with client, type of work and description',
      count: `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`,
    },
  ];

  const empty = rowCount === 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[70%]">
      <SheetHeader title="Export Timesheets" subtitle={`${rangeLabel} · ${staffCount} staff`} onClose={onClose} />
      <div className="px-5 py-4 pb-7 space-y-2.5">
        {empty && (
          <p className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] font-medium text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No timesheets found to export for this period.
          </p>
        )}
        {options.map(({ type, icon: Icon, title, hint, count }) => {
          const loading = busy === type;
          return (
            <button
              key={type}
              type="button"
              disabled={empty || busy !== null}
              onClick={() => {
                setBusy(type);
                setTimeout(() => onExport(type), 650);
              }}
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center gap-3 text-left active:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B]">{title}</span>
                <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">{hint}</span>
                <span className="block mt-1 text-[10.5px] font-semibold text-slate-400 tabular-nums">CSV · {count}</span>
              </span>
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 text-[#2F68FE] animate-spin shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
