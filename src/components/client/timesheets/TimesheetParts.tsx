import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';

export const TimesheetListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading timesheets">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-3.5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="space-y-1.5">
              <StaffSkeleton className="w-20 h-2.5" />
              <StaffSkeleton className="w-24 h-3.5" />
            </div>
          ))}
        </div>
        <StaffSkeleton className="w-full h-9 rounded-xl" />
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
