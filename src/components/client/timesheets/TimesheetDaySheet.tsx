import React from 'react';
import { Briefcase, Building2, ChevronLeft, ChevronRight, ClipboardX, Download, Moon } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  TimesheetRow,
  endsNextDay,
  entrySeconds,
  formatClock,
  formatHm,
  formatTimesheetDate,
  parseIso,
} from '../data/clientTimesheetsData';
import { HoursBar } from './TimesheetParts';

interface Props {
  isOpen: boolean;
  /** Kept while the sheet slides out */
  row: TimesheetRow | null;
  member: ClientStaffMember | undefined;
  tint: number;
  showAvailable: boolean;
  canDownload: boolean;
  /** Same staff's previous / next logged day in the period (Added by designer) */
  onPrev?: () => void;
  onNext?: () => void;
  onDownload: (row: TimesheetRow) => void;
  onClose: () => void;
}

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-[#1E293B]' }) => (
  <div className="px-3 py-2.5 min-w-0">
    <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</dt>
    <dd className={`mt-0.5 text-[15px] font-extrabold tabular-nums truncate ${tone}`}>{value}</dd>
  </div>
);

/** Desktop "View" modal: Date, Client, Type of Work, Total Time, Description per entry + row CSV download */
export const TimesheetDaySheet: React.FC<Props> = ({ isOpen, row, member, tint, showAvailable, canDownload, onPrev, onNext, onDownload, onClose }) => {
  const day = row ? parseIso(row.date) : null;
  const extra = row && showAvailable ? row.workingSeconds - row.availableSeconds : 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      {row && day && (
        <>
          <SheetHeader title="Timesheet Details" onClose={onClose} />

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
            {/* Staff + day stepper */}
            <div className="flex items-center gap-3">
              {member && <StaffAvatar name={member.name} tint={tint} />}
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-[#1E293B] truncate">{member?.name}</p>
                <p className="text-[11px] text-slate-500 tabular-nums truncate">
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}, {formatTimesheetDate(row.date)}
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
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:text-slate-200 disabled:border-slate-100 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <dl className={`mt-3 grid ${showAvailable ? 'grid-cols-3' : 'grid-cols-2'} rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100`}>
              <Stat label="Working Hrs" value={formatHm(row.workingSeconds)} tone="text-[#2F68FE]" />
              {showAvailable && <Stat label="Available Hrs" value={formatHm(row.availableSeconds)} />}
              <Stat label="Entries" value={String(row.entries.length)} />
            </dl>
            {showAvailable && (
              <div className="mt-2.5 flex items-center gap-2.5">
                <HoursBar working={row.workingSeconds} available={row.availableSeconds} className="flex-1" />
                <span className={`text-[10.5px] font-bold tabular-nums whitespace-nowrap ${extra > 0 ? 'text-[#D97706]' : 'text-slate-400'}`}>
                  {extra > 0 ? `+${formatHm(extra)} extra` : extra < 0 ? `${formatHm(-extra)} under` : 'On target'}
                </span>
              </div>
            )}

            <h3 className="mt-5 mb-2.5 px-0.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Time Entries</h3>
            {row.entries.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center rounded-2xl border border-[#EBF0F7]">
                <ClipboardX className="w-6 h-6 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-500">No Records Found</p>
              </div>
            ) : (
              <ol className="relative space-y-3">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" aria-hidden="true" />
                {row.entries.map((e) => (
                  <li key={e.id} className="relative pl-6">
                    <span className="absolute left-0 top-3.5 w-[15px] h-[15px] rounded-full bg-white border-[3px] border-[#2F68FE]" aria-hidden="true" />
                    <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#1E293B] tabular-nums">
                          {formatClock(e.start)} – {formatClock(e.end)}
                          {endsNextDay(e) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[9.5px] font-bold">
                              <Moon className="w-3 h-3" /> Next day
                            </span>
                          )}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] text-[10.5px] font-bold tabular-nums whitespace-nowrap">
                          {formatHm(entrySeconds(e))} hrs
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-600 truncate">{e.workType ?? '-'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{e.client ?? 'Internal'}</span>
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-[#1E293B] leading-relaxed break-words whitespace-pre-line select-text">{e.description || '-'}</p>
                    </div>
                  </li>
                ))}
              </ol>
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
};
