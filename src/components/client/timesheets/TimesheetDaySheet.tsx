import React from 'react';
import { ChevronLeft, ChevronRight, ClipboardX, Download } from 'lucide-react';
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
    <dt className="text-[10.5px] font-semibold text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Desktop "View" modal: one row per entry — Date, Client, Type of Work, Total Time, Description */
export const TimesheetDaySheet: React.FC<Props> = ({ isOpen, row, staffName, canDownload, onPrev, onNext, onDownload, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
    {row && (
      <>
        <SheetHeader title="View" subtitle={`${staffName} · ${formatTimesheetDate(row.date)}`} onClose={onClose} />

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[11px] font-semibold text-slate-500 tabular-nums">
              {row.entries.length} {row.entries.length === 1 ? 'entry' : 'entries'} · Working Hours {formatHm(row.workingSeconds)}
            </span>
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
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:text-slate-200 disabled:border-slate-100 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {row.entries.length === 0 ? (
            <div className="mt-3 py-8 flex flex-col items-center text-center rounded-2xl border border-[#DCE3ED]">
              <ClipboardX className="w-6 h-6 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-500">No Records Found</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {row.entries.map((e) => (
                <li key={e.id} className="bg-white border border-[#DCE3ED] rounded-2xl shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] p-3.5">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="Date">
                      <span className="tabular-nums">{formatTimesheetDate(row.date)}</span>
                    </Field>
                    <Field label="Total Time">
                      <span className="tabular-nums font-semibold">{formatHm(entrySeconds(e))} Hrs</span>
                    </Field>
                    <Field label="Client">{e.client ?? '-'}</Field>
                    <Field label="Type of Work">{e.workType ?? '-'}</Field>
                    <Field label="Description" className="col-span-2">
                      <span className="whitespace-pre-line select-text">{e.description || '-'}</span>
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
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
