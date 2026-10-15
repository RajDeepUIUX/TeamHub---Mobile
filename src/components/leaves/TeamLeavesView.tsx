import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, X, Check, Paperclip, Inbox } from 'lucide-react';
import { LeaveRequest } from '../../types/leaves';
import {
  TeamFilterBar,
  FilterSection,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
  matchesFilters,
  toRangeValue,
} from '../common/TeamFilterSheet';
import { LeaveReviewSheet, LeaveDecision } from './LeaveReviewSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { LeaveBreakdownSheet } from './LeaveBreakdownSheet';

/** Staff note capped at two lines, with Show more / Show less when it runs longer */
const ClampedQuote: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
      <p ref={ref} className={`break-words ${expanded ? '' : 'line-clamp-2'}`}>
        “{text}”
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-0.5 -mx-1 px-1 rounded text-[11px] font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

type LeaveState = LeaveRequest['status'];

const STATE_CHIP: Record<LeaveState, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
};

interface TeamLeavesViewProps {
  requests: LeaveRequest[];
  onReview: (ids: string[], decision: LeaveDecision, comment: string) => void;
  onViewDetails: (request: LeaveRequest) => void;
}

export const TeamLeavesView: React.FC<TeamLeavesViewProps> = ({ requests, onReview, onViewDetails }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [review, setReview] = useState<{ id: string; decision: LeaveDecision } | null>(null);
  const [breakdownFor, setBreakdownFor] = useState<LeaveRequest | null>(null);

  const leaveRange = (r: LeaveRequest) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate || r.startDate);
    return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? '' : toRangeValue(start, end);
  };
  const visible = requests.filter((r) =>
    matchesFilters(filters, { member: r.staffName ?? '', dates: leaveRange(r), status: r.status })
  );
  const filterCount = activeFilterCount(filters);

  const filterSections: FilterSection[] = [
    { id: 'member', label: 'Team Member', options: Array.from(new Set(requests.map((r) => r.staffName ?? ''))).sort() },
    { id: 'dates', label: 'Date Range', options: [], kind: 'dateRange' },
    { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected'] },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-8 space-y-3.5 no-scrollbar">
        {/* Filters on top */}
        <TeamFilterBar selection={filters} placeholder="All team members" onClick={() => setIsFilterOpen(true)} />

        {/* List header */}
        <div className="flex items-center gap-2 px-1">
          <span className="font-bold text-sm text-[#1E293B]">Leave Requests</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>

        {visible.map((r) => {
          const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
          return (
            <article
              key={r.id}
              className={`bg-white border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden ${
                r.status === 'Pending' ? 'border-amber-200' : 'border-[#EBF0F7]'
              }`}
            >
              {/* Staff + status */}
              <div className="p-3.5 pb-3 flex items-center gap-3">
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
              <button
                type="button"
                onClick={() => setBreakdownFor(r)}
                aria-label={`Leave duration for ${r.dateRange}`}
                className="mx-3.5 w-[calc(100%-1.75rem)] p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3 text-left active:bg-slate-100 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#1E293B]">{r.dateRange}</span>
                  {r.dayItems && r.dayItems.length > 0 && (
                    <span className="block text-[11px] text-slate-500 truncate">
                      {r.dayItems.every((d) => d.duration === r.dayItems![0].duration)
                        ? r.dayItems[0].duration
                        : 'Mixed durations'}
                    </span>
                  )}
                </div>
                <span className="text-right shrink-0">
                  <span className="block text-base font-extrabold text-[#1E293B] leading-none tabular-nums">{r.daysCount}</span>
                  <span className="block text-[10px] text-slate-400">{r.daysCount === 1 ? 'day' : 'days'}</span>
                </span>
              </button>

              {/* Reason, short description, attachment, manager note */}
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
                {r.description && <ClampedQuote text={r.description} />}
                {r.status !== 'Pending' && r.managerComment && (
                  <p
                    className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                      r.status === 'Rejected' ? 'bg-rose-50/70 text-rose-700' : 'bg-emerald-50/70 text-emerald-700'
                    }`}
                  >
                    <span className="font-semibold">{r.status === 'Rejected' ? 'Rejection reason' : 'Your note'}: </span>
                    {r.managerComment}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(r)}
                  className="h-9 pl-2 pr-1.5 -ml-1 rounded-xl text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-blue-50 cursor-pointer"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
                {r.status === 'Pending' && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReview({ id: r.id, decision: 'Rejected' })}
                      className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReview({ id: r.id, decision: 'Approved' })}
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

      <LeaveReviewSheet
        requests={review ? requests.filter((r) => r.id === review.id) : []}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(ids, decision, comment) => {
          setReview(null);
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

      <LeaveBreakdownSheet request={breakdownFor} onClose={() => setBreakdownFor(null)} />
    </div>
  );
};
