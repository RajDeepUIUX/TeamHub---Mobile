import React, { useState } from 'react';
import {
  BarChart2,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  CheckCheck,
  ListChecks,
  Calendar,
  FileText,
  Paperclip,
  LayoutGrid,
  Users,
  Inbox,
} from 'lucide-react';
import { LeaveRequest } from '../../types/leaves';
import { BottomSheet } from '../common/BottomSheet';
import {
  FilterIconButton,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
  matchesFilters,
} from '../common/TeamFilterSheet';
import { LeaveReviewSheet, LeaveDecision } from './LeaveReviewSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

type LeaveState = LeaveRequest['status'];

const STATE_CHIP: Record<LeaveState, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
};

interface TeamLeavesViewProps {
  requests: LeaveRequest[];
  onReview: (ids: string[], decision: LeaveDecision, comment: string) => void;
}

/* ------------------------------ Summary sheet ------------------------------ */

const TeamLeavesSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: LeaveRequest[] }> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const days = (fn: (r: LeaveRequest) => boolean) => requests.filter(fn).reduce((n, r) => n + r.daysCount, 0);
  const types = Array.from(new Set(requests.map((r) => r.type)));
  const members = Array.from(new Set(requests.map((r) => r.staffName ?? ''))).sort();

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  const Tile: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color = 'text-slate-700' }) => (
    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 shadow-2xs">
      <span className="text-slate-600 font-medium truncate">{label}</span>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${color}`}>{value}</span>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Team Leaves Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Leave Requests · Complete Breakdown</p>
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
        <Section icon={<LayoutGrid className="w-4 h-4 text-[#2F68FE]" />} title="Requests Overview">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Total Requests" value={requests.length} color="text-[#1E293B]" />
            <Tile label="Days Requested" value={days(() => true)} color="text-[#1E293B]" />
            <Tile label="Pending Days" value={days((r) => r.status === 'Pending')} color="text-[#D97706]" />
            <Tile label="Approved Days" value={days((r) => r.status === 'Approved')} color="text-[#10B981]" />
          </div>
        </Section>

        <Section icon={<FileText className="w-4 h-4 text-[#F59E0B]" />} title="By Leave Type">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {types.map((t) => (
              <Tile key={t} label={t} value={`${days((r) => r.type === t)}d`} />
            ))}
          </div>
        </Section>

        <Section icon={<Users className="w-4 h-4 text-[#10B981]" />} title="By Team Member">
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const pending = requests.filter((r) => r.staffName === name && r.status === 'Pending').length;
              return (
                <div
                  key={name}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#FEF8E7] text-[#D97706] font-bold">{pending} pending</span>
                    )}
                    <span className="font-bold text-slate-700 tabular-nums">{days((r) => r.staffName === name)}d</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
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

/* --------------------------------- Screen --------------------------------- */

export const TeamLeavesView: React.FC<TeamLeavesViewProps> = ({ requests, onReview }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Review target: one request (inline buttons) or the bulk selection
  const [review, setReview] = useState<{ ids: string[]; decision: LeaveDecision } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visible = requests.filter((r) =>
    matchesFilters(filters, { member: r.staffName ?? '', status: r.status, type: r.type })
  );
  const filterCount = activeFilterCount(filters);
  const countState = (s: LeaveState) => requests.filter((r) => r.status === s).length;
  const selectablePending = visible.filter((r) => r.status === 'Pending');
  const allPendingSelected = selectablePending.length > 0 && selectablePending.every((r) => selectedIds.has(r.id));

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

  const filterSections = [
    { id: 'member', label: 'Team Member', options: Array.from(new Set(requests.map((r) => r.staffName ?? ''))).sort() },
    { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected'] },
    { id: 'type', label: 'Leave Type', options: Array.from(new Set(requests.map((r) => r.type))) },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-8 space-y-3.5 no-scrollbar">
        {/* KPI card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Pending', value: countState('Pending'), pill: 'bg-[#FEF8E7] text-[#D97706]' },
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

        {/* List header: Select + filter */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1E293B]">Leave Requests</span>
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
            <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
          </div>
        </div>

        {selectMode && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-[#1E40AF]">
            <span>Tap pending requests to select them</span>
            <button
              type="button"
              onClick={() => setSelectedIds(allPendingSelected ? new Set() : new Set(selectablePending.map((r) => r.id)))}
              className="font-bold text-[#2F68FE] shrink-0 cursor-pointer"
            >
              {allPendingSelected ? 'Deselect all' : `Select all pending (${selectablePending.length})`}
            </button>
          </div>
        )}

        {visible.map((r) => {
          const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
          const selectable = selectMode && r.status === 'Pending';
          const isSelected = selectedIds.has(r.id);
          const isExpanded = expandedId === r.id;
          const isAdditional = r.type === 'Additional Leave';
          return (
            <article
              key={r.id}
              onClick={selectable ? () => toggleSelected(r.id) : undefined}
              aria-selected={selectable ? isSelected : undefined}
              className={`bg-white border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all ${
                isSelected
                  ? 'border-[#2F68FE] ring-2 ring-[#2F68FE]/20'
                  : r.status === 'Pending'
                    ? 'border-amber-200'
                    : 'border-[#EBF0F7]'
              } ${selectMode && !selectable ? 'opacity-45' : ''} ${selectable ? 'cursor-pointer' : ''}`}
            >
              {/* Staff + status */}
              <div className="p-3.5 pb-3 flex items-center gap-3">
                {selectable && (
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                )}
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                  {initialsOf(r.staffName ?? '')}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1E293B] truncate">{r.staffName}</h3>
                  <p className="text-[11px] text-slate-400">Applied on {r.appliedOn}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${STATE_CHIP[r.status]}`}>{r.status}</span>
              </div>

              {/* Leave summary */}
              <div className="mx-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isAdditional ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-[#2F68FE]'
                  }`}
                >
                  {isAdditional ? <FileText className="w-4.5 h-4.5" /> : <Calendar className="w-4.5 h-4.5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#1E293B]">{r.type}</span>
                  <span className="block text-[11px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{r.dateRange}</span>
                </div>
                <span className="text-right shrink-0">
                  <span className="block text-base font-extrabold text-[#1E293B] leading-none tabular-nums">{r.daysCount}</span>
                  <span className="block text-[10px] text-slate-400">{r.daysCount === 1 ? 'day' : 'days'}</span>
                </span>
              </div>

              {/* Reason, description, attachment, manager note */}
              <div className="px-3.5 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Reason</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] font-semibold">{r.reason}</span>
                  {r.attachmentName && (
                    <span className="ml-auto flex items-center gap-1 text-slate-400 min-w-0">
                      <Paperclip className="w-3 h-3 shrink-0" />
                      <span className="truncate">{r.attachmentName}</span>
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                    “{r.description}”
                  </p>
                )}
                {r.status !== 'Pending' && r.managerComment && (
                  <p
                    className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                      r.status === 'Rejected' ? 'bg-rose-50/70 text-rose-700' : 'bg-emerald-50/70 text-emerald-700'
                    }`}
                  >
                    <span className="font-semibold">{r.status === 'Rejected' ? 'Rejection reason' : 'Your note'}: </span>
                    {r.managerComment}
                    {r.reviewedAt && <span className="opacity-70"> · {r.reviewedAt}</span>}
                  </p>
                )}

                {/* Day-wise breakdown */}
                {isExpanded && r.dayItems && (
                  <ul className="rounded-xl border border-slate-100 divide-y divide-slate-100 animate-in fade-in duration-200">
                    {r.dayItems.map((d) => (
                      <li key={d.date} className="flex items-center justify-between px-3 py-2 text-[11px]">
                        <span>
                          <span className="font-bold text-[#1E293B]">{d.date}</span>
                          <span className="text-slate-400"> · {d.dayOfWeek}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] font-semibold">{d.duration}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
                {r.dayItems && r.dayItems.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : r.id);
                    }}
                    className="h-9 px-3 rounded-xl text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    {isExpanded ? 'Hide days' : 'View days'}
                  </button>
                )}
                {r.status === 'Pending' && !selectMode && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReview({ ids: [r.id], decision: 'Rejected' })}
                      className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReview({ ids: [r.id], decision: 'Approved' })}
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

        {visible.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">
              {filterCount ? 'No leave requests match your filters' : 'No leave requests from your team'}
            </p>
            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({})}
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
              <button type="button" onClick={() => setSelectedIds(new Set())} className="text-[11px] font-semibold text-slate-500 cursor-pointer">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setReview({ ids: Array.from(selectedIds), decision: 'Rejected' })}
              className="h-12 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 active:bg-rose-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setReview({ ids: Array.from(selectedIds), decision: 'Approved' })}
              className="h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              {selectedIds.size ? `Approve ${selectedIds.size} ${selectedIds.size === 1 ? 'request' : 'requests'}` : 'Approve'}
            </button>
          </div>
        </div>
      )}

      <LeaveReviewSheet
        requests={review ? requests.filter((r) => review.ids.includes(r.id)) : []}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(ids, decision, comment) => {
          setReview(null);
          exitSelectMode();
          onReview(ids, decision, comment);
        }}
      />
      <TeamFilterSheet
        isOpen={isFilterOpen}
        title="Filter Team's Leaves"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <TeamLeavesSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} requests={requests} />
    </div>
  );
};
