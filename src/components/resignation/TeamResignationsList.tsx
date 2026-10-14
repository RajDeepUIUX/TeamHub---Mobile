import React, { useState } from 'react';
import { Check, X, FileText, ArrowRight, Paperclip, Inbox } from 'lucide-react';
import { ApprovalStatus, ResignationRecord, ReviewDecision } from '../../types/resignation';
import { formatResignationDate } from '../../data/resignationData';
import { ReviewResignationSheet, ResignationLetterSheet } from './ReviewResignationSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import {
  FilterIconButton,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
} from '../common/TeamFilterSheet';
import { RESIGNATION_REASONS } from '../../data/resignationData';

type Filter = 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
const FILTERS: Filter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Withdrawn'];

/** Which filter bucket a record belongs to, from the manager's point of view */
const bucketOf = (r: ResignationRecord): Exclude<Filter, 'All'> => {
  if (r.status === 'Withdrawn') return 'Withdrawn';
  if (r.managerApproval === 'Rejected') return 'Rejected';
  if (r.managerApproval === 'Approved') return 'Approved';
  return 'Pending';
};

const APPROVAL_CHIP: Record<ApprovalStatus, string> = {
  Pending: 'bg-violet-50 text-violet-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-rose-50 text-rose-600',
};

interface TeamResignationsListProps {
  records: ResignationRecord[];
  onReview: (id: string, decision: ReviewDecision, comment: string) => void;
}

export const TeamResignationsList: React.FC<TeamResignationsListProps> = ({ records, onReview }) => {
  const [filter, setFilter] = useState<Filter>('All');
  const [review, setReview] = useState<{ record: ResignationRecord; decision: ReviewDecision } | null>(null);
  const [letterRecord, setLetterRecord] = useState<ResignationRecord | null>(null);
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Member / department / reason filters from the filter sheet (reasons are multi-valued)
  const passesSheetFilters = (r: ResignationRecord) => {
    const members = filters.member ?? [];
    const departments = filters.department ?? [];
    const reasons = filters.reason ?? [];
    return (
      (members.length === 0 || members.includes(r.staffName)) &&
      (departments.length === 0 || departments.includes(r.department)) &&
      (reasons.length === 0 || r.reasons.some((reason) => reasons.includes(reason)))
    );
  };
  const sheetFiltered = records.filter(passesSheetFilters);
  const filterCount = activeFilterCount(filters);
  const filterSections = [
    { id: 'member', label: 'Team Member', options: Array.from(new Set(records.map((r) => r.staffName))).sort() },
    { id: 'department', label: 'Department', options: Array.from(new Set(records.map((r) => r.department))).sort() },
    { id: 'reason', label: 'Reason', options: RESIGNATION_REASONS },
  ];

  const counts = FILTERS.reduce(
    (acc, f) => ({
      ...acc,
      [f]: f === 'All' ? sheetFiltered.length : sheetFiltered.filter((r) => bucketOf(r) === f).length,
    }),
    {} as Record<Filter, number>
  );
  const visible = filter === 'All' ? sheetFiltered : sheetFiltered.filter((r) => bucketOf(r) === filter);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {filterCount ? 'Filtered' : 'Team resignations'} ({visible.length})
        </h3>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {/* Status chips */}
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const isOn = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 h-8 pl-3 pr-2 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOn ? 'bg-[#1E293B] border-[#1E293B] text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {f}
              <span
                className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isOn ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.map((r) => {
        const idx = Number(r.staffCode.replace(/\D/g, '')) || 0;
        const canReview = r.status === 'Notice' && r.managerApproval === 'Pending';
        const isWithdrawn = r.status === 'Withdrawn';
        return (
          <article
            key={r.id}
            className={`bg-white border rounded-2xl shadow-2xs overflow-hidden ${
              canReview ? 'border-violet-200' : 'border-[#EBF0F7]'
            }`}
          >
            {/* Staff header */}
            <div className="p-3.5 flex items-start gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(idx)}`}>
                {initialsOf(r.staffName)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#1E293B] truncate">{r.staffName}</h3>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">{r.staffCode}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {r.designation} · {r.department}
                </p>
              </div>
              {isWithdrawn ? (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold shrink-0">
                  Withdrawn
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[10px] font-bold shrink-0">Resign</span>
              )}
            </div>

            {/* Dates */}
            <div className="mx-3.5 px-3 py-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resigned</span>
                <span className="block font-bold text-[#1E293B]">{formatResignationDate(r.resignationDate)}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className="text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last Date</span>
                <span className="block font-bold text-[#1E293B]">{formatResignationDate(r.lastWorkingDate)}</span>
              </div>
            </div>

            {/* Reasons */}
            <div className="px-3.5 pt-3 flex flex-wrap gap-1.5">
              {r.reasons.map((reason) => (
                <span key={reason} className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2F68FE] text-[11px] font-semibold">
                  {reason}
                </span>
              ))}
            </div>

            {/* Approval statuses */}
            {!isWithdrawn && (
              <div className="px-3.5 pt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Reporting Mgr</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${APPROVAL_CHIP[r.managerApproval]}`}>
                    {r.managerApproval}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">CTM</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${APPROVAL_CHIP[r.ctmApproval]}`}>
                    {r.ctmApproval}
                  </span>
                </div>
              </div>
            )}

            {/* Comments / withdraw reason */}
            {r.managerComment && (
              <p className="mx-3.5 mt-2.5 px-3 py-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-500">Your comment: </span>“{r.managerComment}”
              </p>
            )}
            {isWithdrawn && r.withdrawReason && (
              <p className="mx-3.5 mt-3 px-3 py-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-500">Withdraw reason: </span>
                {r.withdrawReason}
                {r.withdrawnAt && <span className="text-slate-400"> · {formatResignationDate(r.withdrawnAt)}</span>}
              </p>
            )}

            {/* Footer actions */}
            <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLetterRecord(r)}
                className="h-9 px-3 rounded-xl text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                View Email
                {r.attachments.length > 0 && (
                  <span className="flex items-center gap-0.5 text-slate-400 font-medium">
                    <Paperclip className="w-3 h-3" />
                    {r.attachments.length}
                  </span>
                )}
              </button>
              {canReview && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReview({ record: r, decision: 'Rejected' })}
                    className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setReview({ record: r, decision: 'Approved' })}
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
        <div className="py-14 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">Nothing here</p>
          <p className="text-xs text-slate-500">
            {filterCount
              ? 'No resignations match your filters.'
              : filter === 'All'
                ? 'No resignations from your team.'
                : `No ${filter.toLowerCase()} resignations.`}
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

      <ReviewResignationSheet
        record={review?.record ?? null}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(id, decision, comment) => {
          setReview(null);
          onReview(id, decision, comment);
        }}
      />
      <ResignationLetterSheet record={letterRecord} onClose={() => setLetterRecord(null)} />
      <TeamFilterSheet
        isOpen={isFilterOpen}
        title="Filter Team's Resignations"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
};
