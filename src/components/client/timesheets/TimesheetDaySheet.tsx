import React from 'react';
import { ChevronLeft, ChevronRight, ClipboardX, Clock3, Download } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { TimesheetRow, entrySeconds, formatHm, formatTimesheetDate } from '../data/clientTimesheetsData';

interface Props {
  isOpen: boolean;
  /** Kept while the sheet slides out */
  row: TimesheetRow | null;
  staffName: string;
  canDownload: boolean;
  /** Same staff's previous / next logged day in the period (Added by designer) */
  onPrev?: () => void;
  onNext?: () => void;
  onDownload: (row: TimesheetRow) => void;
  onClose: () => void;
}

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-[11px] font-medium text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-xs text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Desktop "View" modal: one row per entry — Date, Client, Type of Work, Total Time, Description */
export const TimesheetDaySheet: React.FC<Props> = ({ isOpen, row, staffName, canDownload, onPrev, onNext, onDownload, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
    {row && (
      <>
        <SheetHeader title="View" subtitle={`${staffName} · ${formatTimesheetDate(row.date)}`} onClose={onClose} />

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
          <div className="p-4 rounded-2xl bg-[#2F68FE] text-white flex items-center gap-3 shadow-xs">
            <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-blue-100">Working Hours</p>
              <p className="mt-0.5 text-xl font-extrabold leading-none tabular-nums">{formatHm(row.workingSeconds)}</p>
              <p className="mt-1.5 text-[11px] font-medium text-blue-100 tabular-nums truncate">
                {row.entries.length} {row.entries.length === 1 ? 'entry' : 'entries'} · {formatTimesheetDate(row.date)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { label: 'Previous logged day', icon: ChevronLeft, onClick: onPrev },
                { label: 'Next logged day', icon: ChevronRight, onClick: onNext },
              ].map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  disabled={!onClick}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center active:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {row.entries.length === 0 ? (
            <div className="mt-3 p-8 flex flex-col items-center text-center bg-white rounded-2xl border border-slate-200/80">
              <ClipboardX className="w-6 h-6 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-500">No Records Found</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {row.entries.map((e, i) => (
                <li key={e.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <dl className="flex-1 min-w-0">
                      <dt className="sr-only">Client</dt>
                      <dd className="text-sm font-bold text-[#1E293B] leading-snug break-words">{e.client ?? '-'}</dd>
                      <dt className="sr-only">Type of Work</dt>
                      <dd className="mt-1 inline-flex items-center h-5 px-2 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {e.workType ?? '-'}
                      </dd>
                    </dl>
                    <dl className="shrink-0 text-right">
                      <dt className="text-[10px] font-medium text-slate-400">Total Time</dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#2F68FE] tabular-nums">{formatHm(entrySeconds(e))} Hrs</dd>
                    </dl>
                  </div>
                  <dl className="mt-3 pt-3 border-t border-dashed border-slate-200">
                    <Field label="Description">
                      <span className="block text-slate-600 leading-relaxed whitespace-pre-line select-text">{e.description || '-'}</span>
                    </Field>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canDownload && (
          <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(row)}
              disabled={row.entries.length === 0}
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:bg-[#1D4ED8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        )}
      </>
    )}
  </BottomSheet>
);
