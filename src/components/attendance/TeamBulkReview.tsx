import React from 'react';
import { ArrowRight, Check, CheckCheck, ChevronLeft, ClipboardCheck, Minus, X } from 'lucide-react';
import { AttendanceRecord } from '../../types/attendance';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

const avatarIdxOf = (r: AttendanceRecord) => Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;

const Tick: React.FC<{ state: 'on' | 'off' | 'some'; size?: 'sm' | 'md' }> = ({ state, size = 'md' }) => (
  <span
    aria-hidden="true"
    className={`${size === 'sm' ? 'w-4.5 h-4.5' : 'w-5 h-5'} rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
      state === 'off' ? 'border-slate-300 bg-white' : 'bg-[#2F68FE] border-[#2F68FE] text-white'
    }`}
  >
    {state === 'on' && <Check className="w-3 h-3 stroke-[3.5]" />}
    {state === 'some' && <Minus className="w-3 h-3 stroke-[3.5]" />}
  </span>
);

/* ------------------------------ Entry banner ------------------------------ */

/** Shown above the list whenever something waits for the manager; opens the bulk review screen */
export const PendingApprovalsBanner: React.FC<{
  records: AttendanceRecord[];
  /** Set when the banner covers one team member (V2 member detail, V3) */
  staffName?: string | null;
  onReview: () => void;
  /** V3: jump to every pending request across the team */
  teamCount?: number;
  onReviewTeam?: () => void;
}> = ({ records, staffName, onReview, teamCount, onReviewTeam }) => {
  const n = records.length;
  const people = new Set(records.map((r) => r.staffName)).size;
  const first = staffName?.split(' ')[0];
  if (n === 0 && !(onReviewTeam && teamCount)) return null;
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-3.5 shadow-2xs">
      {n > 0 ? (
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1E293B] leading-snug">
              {n} {n === 1 ? 'request needs' : 'requests need'} your approval
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {staffName ? `Attendance edits from ${first}` : `Attendance edits from ${people} team ${people === 1 ? 'member' : 'members'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onReview}
            className="h-9 px-3.5 rounded-xl bg-violet-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 active:bg-violet-700 cursor-pointer"
          >
            Review
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">
          <span className="font-semibold text-[#1E293B]">{first} is all caught up.</span> Nothing waiting for approval.
        </p>
      )}
      {onReviewTeam && teamCount !== undefined && teamCount > n && (
        <button
          type="button"
          onClick={onReviewTeam}
          className="mt-2.5 pt-2.5 w-full border-t border-violet-100 flex items-center justify-between text-[11px] font-semibold text-violet-700 cursor-pointer"
        >
          <span>Review all pending requests across the team</span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-px rounded-md bg-violet-100 tabular-nums">{teamCount}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}
    </div>
  );
};

/* ------------------------------ Review screen ------------------------------ */

export const BulkReviewList: React.FC<{
  records: AttendanceRecord[];
  selectedIds: Set<string>;
  /** Shown in the title when the review covers one team member */
  staffName?: string | null;
  onSetSelected: (ids: string[], selected: boolean) => void;
  onExit: () => void;
}> = ({ records, selectedIds, staffName, onSetSelected, onExit }) => {
  const groups = Array.from(
    records.reduce((m, r) => m.set(r.staffName, [...(m.get(r.staffName) ?? []), r]), new Map<string, AttendanceRecord[]>())
  );
  const allIds = records.map((r) => r.id);
  const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
  const stateOfIds = (ids: string[]) => {
    const k = ids.filter((id) => selectedIds.has(id)).length;
    return k === 0 ? 'off' : k === ids.length ? 'on' : 'some';
  };
  const allOn = selectedCount === allIds.length;

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-200 cursor-pointer"
          aria-label="Back to records"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[#1E293B] truncate">
            {staffName ? `${staffName.split(' ')[0]}'s pending requests` : 'Pending approvals'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {records.length} {records.length === 1 ? 'request' : 'requests'}
            {!staffName && ` · ${groups.length} ${groups.length === 1 ? 'person' : 'people'}`}
          </p>
        </div>
        {records.length > 1 && (
          <button
            type="button"
            onClick={() => onSetSelected(allIds, !allOn)}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer shrink-0"
          >
            {allOn ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>

      {/* One card per person; a request row is the only thing to tick */}
      {groups.map(([name, items]) => {
        const ids = items.map((r) => r.id);
        const groupState = stateOfIds(ids);
        return (
          <section key={name} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
            <header className="px-3.5 pt-3 pb-2 flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(avatarIdxOf(items[0]))}`}>
                {initialsOf(name)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] truncate">{name}</span>
                <span className="block text-[10.5px] text-slate-400">
                  {items.length} {items.length === 1 ? 'request' : 'requests'}
                </span>
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onSetSelected(ids, groupState !== 'on')}
                  className="h-7 px-2 rounded-lg text-[11px] font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer shrink-0"
                >
                  {groupState === 'on' ? 'Clear' : 'Select all'}
                </button>
              )}
            </header>

            <ul className="px-2 pb-2 space-y-1.5">
              {items.map((r) => {
                const on = selectedIds.has(r.id);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => onSetSelected([r.id], !on)}
                      className={`w-full p-2.5 rounded-xl border flex items-start gap-2.5 text-left transition-colors cursor-pointer ${
                        on ? 'border-blue-200 bg-[#F5F8FF] active:bg-[#EEF4FF]' : 'border-slate-100 bg-white active:bg-slate-50'
                      }`}
                    >
                      <span className="mt-px">
                        <Tick state={on ? 'on' : 'off'} size="sm" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1E293B] truncate">
                            {r.dayOfWeek.slice(0, 3)}, {r.dateFormatted}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] text-[10px] font-semibold shrink-0">
                            {r.editReason ?? '—'}
                          </span>
                        </span>
                        {/* Logged → requested hours */}
                        <span className="mt-2 grid grid-cols-2 gap-1.5 tabular-nums">
                          {[
                            { label: 'Office', from: r.totalOfficeTime, to: r.reqOfficeHrs },
                            { label: 'Work', from: r.totalWorkingTime, to: r.reqWorkHrs },
                          ].map((t) => (
                            <span key={t.label} className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="block text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">{t.label}</span>
                              <span className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-500">{t.from}</span>
                                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                                <span className="font-bold text-[#2F68FE]">{t.to ?? '—'}</span>
                              </span>
                            </span>
                          ))}
                        </span>
                        {r.editNote && (
                          <span className="mt-1.5 block text-[11px] text-slate-500 leading-relaxed line-clamp-2">“{r.editNote}”</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

/* ------------------------------ Sticky action bar ------------------------------ */

export const BulkActionBar: React.FC<{
  selected: AttendanceRecord[];
  onDecide: (decision: 'approved' | 'rejected') => void;
}> = ({ selected, onDecide }) => {
  const n = selected.length;
  const people = new Set(selected.map((r) => r.staffName)).size;
  return (
    <div className="shrink-0 px-4 pt-3 pb-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] animate-in slide-in-from-bottom-2 fade-in duration-200">
      <p className="mb-2.5 px-0.5 text-xs font-bold text-[#1E293B]">
        {n === 0 ? (
          <span className="font-medium text-slate-400">Select at least one request</span>
        ) : (
          <>
            {n} selected
            <span className="font-medium text-slate-400">
              {' '}
              · {people} {people === 1 ? 'person' : 'people'}
            </span>
          </>
        )}
      </p>
      <div className="grid grid-cols-[1fr_2fr] gap-2.5">
        <button
          type="button"
          disabled={n === 0}
          onClick={() => onDecide('rejected')}
          className="h-12 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 active:bg-rose-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Reject{n ? ` ${n}` : ''}
        </button>
        <button
          type="button"
          disabled={n === 0}
          onClick={() => onDecide('approved')}
          className="h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          {n ? `Approve ${n} ${n === 1 ? 'request' : 'requests'}` : 'Approve'}
        </button>
      </div>
    </div>
  );
};
