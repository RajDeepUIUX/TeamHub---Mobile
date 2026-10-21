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
            <span className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-[#F8FAFF] border border-[#E0EAFF] flex items-center gap-2 text-[11.5px] font-semibold text-slate-500 tabular-nums">
              <Clock3 className="w-4 h-4 text-[#2F68FE] shrink-0" aria-hidden="true" />
              <span className="truncate">
                {row.entries.length} {row.entries.length === 1 ? 'entry' : 'entries'} · Working Hours{' '}
                <span className="font-extrabold text-[#2F68FE]">{formatHm(row.workingSeconds)}</span>
              </span>
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
                className="w-11 h-11 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:text-slate-200 disabled:border-slate-100 disabled:cursor-not-allowed shrink-0 cursor-pointer"
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
                <li key={e.id} className="bg-white border border-[#DCE3ED] rounded-2xl shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] overflow-hidden">
                  <dl className="flex items-center gap-3 px-3.5 py-2.5 bg-[#FAFBFD] border-b border-slate-100">
                    <Field label="Date" className="flex-1">
                      <span className="tabular-nums font-semibold">{formatTimesheetDate(row.date)}</span>
                    </Field>
                    <div className="shrink-0 text-right">
                      <dt className="text-[10.5px] font-semibold text-slate-400">Total Time</dt>
                      <dd className="mt-0.5 inline-flex items-center h-6 px-2 rounded-md bg-[#EFF6FF] text-[12px] font-extrabold text-[#2F68FE] tabular-nums">
                        {formatHm(entrySeconds(e))} Hrs
                      </dd>
                    </div>
                  </dl>
                  <dl className="p-3.5 grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="Client">
                      <span className="font-semibold">{e.client ?? '-'}</span>
                    </Field>
                    <Field label="Type of Work">
                      <span className="font-semibold">{e.workType ?? '-'}</span>
                    </Field>
                    <div className="col-span-2 min-w-0 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <dt className="text-[10.5px] font-semibold text-slate-400">Description</dt>
                      <dd className="mt-0.5 text-[12px] text-slate-600 leading-relaxed break-words whitespace-pre-line select-text">{e.description || '-'}</dd>
                    </div>
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
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-[0_6px_16px_-6px_rgba(47,104,254,0.6)] flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
