import React, { useState } from 'react';
import {
  BarChart2,
  ChevronRight,
  Calendar,
  Fingerprint,
  Info,
  X,
  Check,
  List,
  ArrowRight,
  LayoutGrid,
  FileText,
  Users,
  Inbox,
  CalendarDays,
  CheckCheck,
  ListChecks,
} from 'lucide-react';
import { AttendanceRecord } from '../../types/attendance';
import { BottomSheet } from '../common/BottomSheet';
import {
  TeamAttendanceFilterSheet,
  TeamAttendanceFilters,
  DEFAULT_TEAM_ATTENDANCE_FILTERS,
  teamAttendanceFilterCount,
} from './TeamAttendanceFilterSheet';
import { AttendanceReviewSheet, AttendanceDecision } from './AttendanceReviewSheet';
import { BulkReviewSheet } from './BulkReviewSheet';
import { ATTENDANCE_EDIT_REASONS, reasonAllowsNote, reportingManagerOf, branchOf } from '../../data/teamAttendanceData';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

import { FilterIconButton } from '../common/TeamFilterSheet';
type RequestState = 'Pending' | 'Approved' | 'Rejected';

const stateOf = (r: AttendanceRecord): RequestState =>
  r.editStatus === 'approved' ? 'Approved' : r.editStatus === 'rejected' ? 'Rejected' : 'Pending';

const STATE_CHIP: Record<RequestState, string> = {
  Pending: 'bg-violet-50 text-violet-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-rose-50 text-rose-600',
};

const DAY_STATUS_CHIP: Record<string, string> = {
  half_day: 'bg-[#FEF8E7] text-[#D97706]',
  absent: 'bg-[#EDE9FE] text-[#6366F1]',
  full_day: 'bg-[#E8F8F0] text-[#10B981]',
  weekly_off: 'bg-slate-100 text-slate-500',
  holiday: 'bg-slate-100 text-slate-500',
};

interface TeamAttendanceViewProps {
  requests: AttendanceRecord[];
  /** Regular (non-edit) attendance for the team; listed when "Only see Edit Requests" is off */
  dailyRecords: AttendanceRecord[];
  onReview: (id: string, decision: AttendanceDecision, comment: string) => void;
  onBulkReview: (ids: string[], decision: AttendanceDecision, comment: string) => void;
  onViewLogs: (record: AttendanceRecord) => void;
}

/* ------------------------------ Summary sheet ------------------------------ */

const TeamAttendanceSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: AttendanceRecord[] }> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const count = (fn: (r: AttendanceRecord) => boolean) => requests.filter(fn).length;
  const members = Array.from(new Set(requests.map((r) => r.staffName))).sort();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Team Requests Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Attendance Edit Requests · Complete Breakdown</p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
        <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
            <LayoutGrid className="w-4 h-4 text-[#2F68FE]" />
            <span>Requests Overview</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: 'Total Requests', value: requests.length, color: 'text-[#1E293B]' },
              { label: 'Pending', value: count((r) => stateOf(r) === 'Pending'), color: 'text-[#7C3AED]' },
              { label: 'Approved', value: count((r) => stateOf(r) === 'Approved'), color: 'text-[#10B981]' },
              { label: 'Rejected', value: count((r) => stateOf(r) === 'Rejected'), color: 'text-[#F43F5E]' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
              >
                <span className="text-slate-600 font-medium">{label}</span>
                <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
            <FileText className="w-4 h-4 text-[#F59E0B]" />
            <span>By Reason</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {ATTENDANCE_EDIT_REASONS.map((reason) => (
              <div
                key={reason}
                className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
              >
                <span className="text-slate-600 font-medium truncate">{reason}</span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                  {count((r) => r.editReason === reason)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
            <Users className="w-4 h-4 text-[#10B981]" />
            <span>By Team Member</span>
          </div>
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const mine = requests.filter((r) => r.staffName === name);
              const pending = mine.filter((r) => stateOf(r) === 'Pending').length;
              return (
                <div
                  key={name}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 font-bold">{pending} pending</span>
                    )}
                    <span className="font-bold text-slate-700 tabular-nums">{mine.length}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          Close Summary
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------- Regular attendance card --------------------------- */

const DailyRecordCard: React.FC<{ record: AttendanceRecord; dimmed: boolean; onViewLogs: () => void }> = ({
  record: r,
  dimmed,
  onViewLogs,
}) => {
  const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
  return (
    <article
      className={`bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-opacity ${
        dimmed ? 'opacity-45' : ''
      }`}
    >
      <div className="p-3.5 pb-3 flex items-start gap-3">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
          {initialsOf(r.staffName)}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1E293B] truncate">{r.staffName}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
            <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
            {r.dayOfWeek.slice(0, 3)}, {r.dateFormatted}
            <span className="text-slate-300">·</span>
            {r.workMode}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${DAY_STATUS_CHIP[r.status] ?? DAY_STATUS_CHIP.holiday}`}>
          {r.statusLabel}
        </span>
      </div>
      <div className="mx-3.5 grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Office', value: r.totalOfficeTime },
          { label: 'Working', value: r.totalWorkingTime },
        ].map((t) => (
          <div key={t.label} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.label}</span>
            <span className="block font-bold text-[#1E293B] tabular-nums">{t.value}</span>
          </div>
        ))}
      </div>
      {/* Same punch-log button as the staff attendance card */}
      <div className="p-3.5 pt-3">
        {r.punches.length > 0 ? (
          <button
            type="button"
            onClick={onViewLogs}
            disabled={dimmed}
            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-xl border border-[#DBE6FE] bg-[#F5F8FF] active:scale-[0.99] transition-all cursor-pointer disabled:cursor-default group"
          >
            <span className="w-7 h-7 rounded-lg bg-white text-[#2F68FE] flex items-center justify-center shadow-2xs">
              <Fingerprint className="w-4 h-4" />
            </span>
            <span className="flex-1 text-left text-xs font-semibold text-[#2F68FE]">View Punch Logs</span>
            <span className="px-1.5 py-px rounded-md bg-white text-[10px] font-bold text-[#2F68FE]">{r.punches.length}</span>
            <ChevronRight className="w-4 h-4 text-[#2F68FE] transition-transform" />
          </button>
        ) : (
          <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Info className="w-3.5 h-3.5" />
            {r.status === 'weekly_off' ? 'Weekly Off' : 'No attendance logged'}
          </p>
        )}
      </div>
    </article>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const TeamAttendanceView: React.FC<TeamAttendanceViewProps> = ({ requests, dailyRecords, onReview, onBulkReview, onViewLogs }) => {
  // Bulk selection mode: only pending requests can be picked
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState<AttendanceDecision | null>(null);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };
  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [filters, setFilters] = useState<TeamAttendanceFilters>(DEFAULT_TEAM_ATTENDANCE_FILTERS);
  // Long lists (31 days × whole team) render in pages
  const PAGE_SIZE = 20;
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
  const applyFilters = (next: TeamAttendanceFilters) => {
    setFilters(next);
    setShownCount(PAGE_SIZE);
  };
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [review, setReview] = useState<{ record: AttendanceRecord; decision: AttendanceDecision } | null>(null);

  const pool = filters.editOnly
    ? requests
    : [...requests, ...dailyRecords].sort((a, b) => b.date.localeCompare(a.date) || a.staffName.localeCompare(b.staffName));
  const any = (selected: string[], value: string | undefined) =>
    selected.length === 0 || (value !== undefined && selected.includes(value));
  const visible = pool.filter((r) => {
    const isEdit = Boolean(r.editRequested);
    return (
      any(filters.branches, branchOf(r.staffName)) &&
      any(filters.managers, reportingManagerOf(r.staffName)?.name) &&
      any(filters.staff, r.staffName) &&
      (!filters.from || r.date >= filters.from) &&
      (!filters.to || r.date <= filters.to) &&
      any(filters.status, isEdit ? stateOf(r) : undefined) &&
      any(filters.workMode, r.workMode)
    );
  });
  const filterCount = teamAttendanceFilterCount(filters);
  const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  // Date range shown in the top row (same as the staff view)
  const dateRangeLabel = `${shortDate(filters.from)} - ${shortDate(filters.to)}`;
  const selectablePending = visible.filter((r) => r.editRequested && stateOf(r) === 'Pending');
  const selectedRecords = requests.filter((r) => selectedIds.has(r.id));
  const allPendingSelected =
    selectablePending.length > 0 && selectablePending.every((r) => selectedIds.has(r.id));
  const countState = (s: RequestState) => requests.filter((r) => stateOf(r) === s).length;

  const staffNames = Array.from(new Set([...requests, ...dailyRecords].map((r) => r.staffName))).sort();
  const staffCodes = Object.fromEntries([...requests, ...dailyRecords].filter((r) => r.staffCode).map((r) => [r.staffName, r.staffCode as string]));

  return (
    <div className="flex-1 min-h-0 flex flex-col">
    <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-8 space-y-3.5 no-scrollbar">
      {/* Filters on top */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{dateRangeLabel}</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {/* KPI card (same pattern as the Attendance summary) */}
      <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Pending', value: countState('Pending'), pill: 'bg-[#F5F3FF] text-[#7C3AED]' },
            { label: 'Approved', value: countState('Approved'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
            { label: 'Rejected', value: countState('Rejected'), pill: 'bg-[#FDECEC] text-[#F43F5E]' },
          ].map(({ label, value, pill }) => (
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
            onClick={() => setIsSummaryOpen(true)}
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

      {/* List header + select */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1E293B]">{filters.editOnly ? 'Edit Requests' : 'Attendance Records'}</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <button
              type="button"
              onClick={exitSelectMode}
              className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 active:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            selectablePending.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center gap-1.5 shadow-2xs active:bg-slate-50 cursor-pointer"
              >
                <ListChecks className="w-4 h-4" />
                Select
              </button>
            )
          )}
        </div>
      </div>

      {/* Bulk hint */}
      {selectMode && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-[#1E40AF]">
          <span>Tap pending requests to select them</span>
          <button
            type="button"
            onClick={() =>
              setSelectedIds(allPendingSelected ? new Set() : new Set(selectablePending.map((r) => r.id)))
            }
            className="font-bold text-[#2F68FE] shrink-0 cursor-pointer"
          >
            {allPendingSelected ? 'Deselect all' : `Select all pending (${selectablePending.length})`}
          </button>
        </div>
      )}

      {visible.slice(0, shownCount).map((r) => {
        if (!r.editRequested) {
          return <DailyRecordCard key={r.id} record={r} dimmed={selectMode} onViewLogs={() => onViewLogs(r)} />;
        }
        const state = stateOf(r);
        const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
        const selectable = selectMode && state === 'Pending';
        const isSelected = selectedIds.has(r.id);
        return (
          <article
            key={r.id}
            onClick={selectable ? () => toggleSelected(r.id) : undefined}
            aria-selected={selectable ? isSelected : undefined}
            className={`bg-white border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all ${
              isSelected
                ? 'border-[#2F68FE] ring-2 ring-[#2F68FE]/20'
                : state === 'Pending'
                  ? 'border-violet-200'
                  : 'border-[#EBF0F7]'
            } ${selectMode && !selectable ? 'opacity-45' : ''} ${selectable ? 'cursor-pointer' : ''}`}
          >
            {/* Staff + request state */}
            <div className="p-3.5 pb-3 flex items-start gap-3">
              {selectable && (
                <span
                  className={`mt-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              )}
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                {initialsOf(r.staffName)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#1E293B] truncate">{r.staffName}</h3>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap min-w-0">
                  <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="shrink-0">
                    {r.dayOfWeek.slice(0, 3)}, {r.dateFormatted}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate ${DAY_STATUS_CHIP[r.status] ?? DAY_STATUS_CHIP.holiday}`}
                  >
                    {r.statusLabel}
                  </span>
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${STATE_CHIP[state]}`}>{state}</span>
            </div>

            {/* Actual vs requested */}
            <div className="mx-3.5 rounded-xl border border-slate-100 overflow-hidden text-xs">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-1.5 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Actual</span>
                <span />
                <span className="text-right">Requested</span>
              </div>
              {[
                { label: 'Office', actual: r.totalOfficeTime, requested: r.reqOfficeHrs },
                { label: 'Working', actual: r.totalWorkingTime, requested: r.reqWorkHrs },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-1.5 border-t border-slate-100">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-slate-400 w-11">{row.label}</span>
                    <span className="font-bold text-slate-600 tabular-nums">{row.actual}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-2" />
                  <span className="text-right font-bold text-[#2F68FE] tabular-nums">{row.requested ?? '—'}</span>
                </div>
              ))}
            </div>

            {/* Reason + note */}
            <div className="px-3.5 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500 font-medium">Reason</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] font-semibold">{r.editReason ?? '—'}</span>
                {r.editRequestedAt && <span className="ml-auto text-[10px] text-slate-400">Requested {r.editRequestedAt}</span>}
              </div>
              {r.editNote && reasonAllowsNote(r.editReason) && (
                <p className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-500">Note: </span>“{r.editNote}”
                </p>
              )}
              {state !== 'Pending' && r.managerRemark && (
                <p
                  className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                    state === 'Rejected' ? 'bg-rose-50/70 text-rose-700' : 'bg-emerald-50/70 text-emerald-700'
                  }`}
                >
                  <span className="font-semibold">{state === 'Rejected' ? 'Rejection reason' : 'Your note'}: </span>
                  {r.managerRemark}
                  {r.editReviewedAt && <span className="opacity-70"> · {r.editReviewedAt}</span>}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLogs(r);
                }}
                disabled={r.punches.length === 0}
                className="h-9 px-3 rounded-xl text-[11px] font-semibold text-[#2F68FE] disabled:text-slate-300 flex items-center gap-1.5 active:bg-blue-50 cursor-pointer disabled:cursor-default"
              >
                <List className="w-4 h-4" />
                {r.punches.length ? `View Logs (${r.punches.length})` : 'No logs'}
              </button>
              {state === 'Pending' && !selectMode && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReview({ record: r, decision: 'rejected' })}
                    className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setReview({ record: r, decision: 'approved' })}
                    className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 active:bg-emerald-700 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {visible.length > shownCount && (
        <button
          type="button"
          onClick={() => setShownCount((n) => n + PAGE_SIZE)}
          className="w-full h-11 rounded-xl border border-[#DBE6FE] bg-[#F5F8FF] text-xs font-semibold text-[#2F68FE] active:bg-[#EEF4FF] cursor-pointer"
        >
          Load more · showing {shownCount} of {visible.length}
        </button>
      )}

      {visible.length === 0 && (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">
            {filterCount ? 'No records match your filters' : 'No edit requests from your team'}
          </p>
          {filterCount > 0 && (
            <button
              type="button"
              onClick={() => applyFilters(DEFAULT_TEAM_ATTENDANCE_FILTERS)}
              className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

    </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="shrink-0 px-4 pt-3 pb-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-xs font-bold text-[#1E293B]">
              {selectedIds.size} selected
              <span className="font-medium text-slate-400"> of {selectablePending.length} pending</span>
            </span>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] font-semibold text-slate-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDecision('rejected')}
              className="h-12 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 active:bg-rose-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDecision('approved')}
              className="h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              {selectedIds.size ? `Approve ${selectedIds.size} ${selectedIds.size === 1 ? 'request' : 'requests'}` : 'Approve'}
            </button>
          </div>
        </div>
      )}

      <BulkReviewSheet
        records={selectedRecords}
        decision={bulkDecision}
        onClose={() => setBulkDecision(null)}
        onConfirm={(ids, decision, comment) => {
          setBulkDecision(null);
          exitSelectMode();
          onBulkReview(ids, decision, comment);
        }}
      />
      <TeamAttendanceFilterSheet
        isOpen={isFilterOpen}
        filters={filters}
        staffNames={staffNames}
        staffCodes={staffCodes}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          applyFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <TeamAttendanceSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} requests={requests} />
      <AttendanceReviewSheet
        record={review?.record ?? null}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(id, decision, comment) => {
          setReview(null);
          onReview(id, decision, comment);
        }}
      />
    </div>
  );
};
