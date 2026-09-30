import React, { useState } from 'react';
import { BarChart2, Calendar, Check, ChevronRight, IndianRupee, Inbox, LayoutGrid, MessageSquareText, Users, X } from 'lucide-react';
import { WFORecord, WFOStatus } from '../../types/wfo';
import { WFO_DAILY_ALLOWANCE, formatINR, wfoAllowanceFor } from '../../data/wfoData';
import { BottomSheet } from '../common/BottomSheet';
import { FilterIconButton, FilterSelection, TeamFilterSheet, activeFilterCount, matchesFilters } from '../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { textareaClass } from '../profile/reviewFormParts';

export type WFODecision = 'Approved' | 'Rejected';

const STATUS_CHIP: Record<WFOStatus, string> = {
  Pending: 'bg-[#FEF3C7] text-[#D97706]',
  Approved: 'bg-[#DCFCE7] text-[#16A34A]',
  Rejected: 'bg-[#FEE2E2] text-[#DC2626]',
};

const formatReviewDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const sheetHandle = (
  <div className="pt-3 pb-1 flex justify-center shrink-0">
    <div className="w-10 h-1 bg-slate-300 rounded-full" />
  </div>
);

/* ------------------------------- KPI card ------------------------------- */

const WFOKPIs: React.FC<{ records: WFORecord[]; onViewSummary: () => void }> = ({ records, onViewSummary }) => {
  const count = (s: WFOStatus) => records.filter((r) => r.status === s).length;
  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-3 gap-2 text-center">
        {(['Pending', 'Approved', 'Rejected'] as const).map((s) => (
          <div key={s} className="flex flex-col items-center">
            <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${STATUS_CHIP[s]}`}>
              {count(s)}
            </div>
            <span className="text-[11px] text-gray-500 font-medium">{s}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
        <button
          type="button"
          onClick={onViewSummary}
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
  );
};

const WFOSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; records: WFORecord[] }> = ({ isOpen, onClose, records }) => {
  const count = (fn: (r: WFORecord) => boolean) => records.filter(fn).length;
  const days = (fn: (r: WFORecord) => boolean) => records.filter(fn).reduce((n, r) => n + r.days, 0);
  const members = Array.from(new Set(records.map((r) => r.staffName))).sort();

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
      {sheetHandle}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Team WFO Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">WFO Days · Complete Breakdown</p>
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
            <Tile label="Total Requests" value={records.length} color="text-[#1E293B]" />
            <Tile label="Pending" value={count((r) => r.status === 'Pending')} color="text-[#D97706]" />
            <Tile label="Approved" value={count((r) => r.status === 'Approved')} color="text-[#10B981]" />
            <Tile label="Rejected" value={count((r) => r.status === 'Rejected')} color="text-rose-500" />
          </div>
        </Section>
        <Section icon={<IndianRupee className="w-4 h-4 text-[#10B981]" />} title={`Allowance · ${formatINR(WFO_DAILY_ALLOWANCE)}/day`}>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <Tile label="Awaiting your approval" value={formatINR(wfoAllowanceFor(days((r) => r.status === 'Pending')))} color="text-[#D97706]" />
            <Tile label="Approved" value={formatINR(wfoAllowanceFor(days((r) => r.status === 'Approved')))} color="text-[#10B981]" />
            <Tile label="Approved office days" value={days((r) => r.status === 'Approved')} />
          </div>
        </Section>
        <Section icon={<Users className="w-4 h-4 text-[#10B981]" />} title="By Team Member">
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const pending = count((r) => r.staffName === name && r.status === 'Pending');
              return (
                <div key={name} className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && <span className="px-1.5 py-0.5 rounded-md bg-[#FEF8E7] text-[#D97706] font-bold">{pending} pending</span>}
                    <span className="font-bold text-slate-700 tabular-nums">{days((r) => r.staffName === name && r.status === 'Approved')} days approved</span>
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

/* -------------------------------- Sheets -------------------------------- */

const ReviewSheet: React.FC<{
  record?: WFORecord;
  decision: WFODecision;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}> = ({ record, decision, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [lastId, setLastId] = useState<string | undefined>(record?.id);
  if (record && record.id !== lastId) {
    setLastId(record.id);
    setComment('');
    setError('');
  }
  const reject = decision === 'Rejected';
  return (
    <BottomSheet isOpen={Boolean(record)} onClose={onClose} maxHeight="max-h-[85%]">
      {sheetHandle}
      <div className="px-5 pt-2 pb-6 space-y-3.5">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{reject ? 'Reject WFO days' : 'Approve WFO days'}</h2>
          {record && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {record.staffName} · {record.monthYear} · {record.days} days ({formatINR(wfoAllowanceFor(record.days))})
            </p>
          )}
        </div>
        <div>
          <span className="block mb-1 text-[10.5px] font-semibold text-slate-500">
            Comment{reject ? <span className="text-rose-500"> *</span> : ' (optional)'}
          </span>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError('');
            }}
            rows={3}
            maxLength={300}
            placeholder={reject ? 'Let them know why, e.g. the day count doesn’t match attendance' : 'Add a note for them (optional)'}
            className={`${textareaClass} ${error ? 'border-rose-300' : ''}`}
          />
          {error && <p className="mt-1 text-[11px] font-medium text-rose-500">{error}</p>}
        </div>
        <div className="grid grid-cols-[1fr_1.6fr] gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (reject && !comment.trim()) {
                setError('Add a short reason for rejecting.');
                return;
              }
              onSubmit(comment.trim());
            }}
            className={`h-12 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
              reject ? 'bg-rose-500 active:bg-rose-600' : 'bg-[#10B981] active:bg-emerald-600'
            }`}
          >
            {reject ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {reject ? 'Reject' : 'Approve'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

const CommentSheet: React.FC<{ record?: WFORecord; onClose: () => void }> = ({ record, onClose }) => (
  <BottomSheet isOpen={Boolean(record?.review)} onClose={onClose} maxHeight="max-h-[60%]">
    {sheetHandle}
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-base font-bold text-[#1E293B]">Your comment</h2>
      {record?.review && (
        <>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {record.status} on {formatReviewDate(record.review.on)} · {record.staffName}, {record.monthYear}
          </p>
          <p className="mt-3 text-[12.5px] text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3.5 py-3">
            {record.review.comment || 'No comment was added.'}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200 cursor-pointer"
      >
        Close
      </button>
    </div>
  </BottomSheet>
);

/* ------------------------------- Team's tab ------------------------------- */

interface TeamWFOViewProps {
  records: WFORecord[];
  onReview: (id: string, decision: WFODecision, comment: string) => void;
}

/** Manager › Attendance & Leaves › WFO Days › Team's WFO Days */
export const TeamWFOView: React.FC<TeamWFOViewProps> = ({ records, onReview }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{ id: string; decision: WFODecision } | null>(null);
  const [lastDecision, setLastDecision] = useState<WFODecision>('Approved');
  if (reviewing && reviewing.decision !== lastDecision) setLastDecision(reviewing.decision);
  const [commentId, setCommentId] = useState<string | null>(null);

  // Pending first, then the most recent month
  const period = (r: WFORecord) => r.year * 100 + new Date(`${r.month} 1, ${r.year}`).getMonth();
  const sorted = [...records].sort(
    (a, b) => Number(b.status === 'Pending') - Number(a.status === 'Pending') || period(b) - period(a) || a.staffName.localeCompare(b.staffName)
  );
  const visible = sorted.filter((r) => matchesFilters(filters, { member: r.staffName, status: r.status, month: r.monthYear }));
  const filterCount = activeFilterCount(filters);

  const filterSections = [
    { id: 'member', label: 'Staff Name', options: Array.from(new Set(records.map((r) => r.staffName))).sort() },
    { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected'] },
    { id: 'month', label: 'Month', options: Array.from(new Set([...records].sort((a, b) => period(b) - period(a)).map((r) => r.monthYear))) },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
      <WFOKPIs records={records} onViewSummary={() => setIsSummaryOpen(true)} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1E293B]">Team Requests</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {visible.map((r) => {
        const isPending = r.status === 'Pending';
        return (
          <article key={r.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-3.5 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(
                    Number(r.staffCode.replace(/\D/g, '')) || 0
                  )}`}
                >
                  {initialsOf(r.staffName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-[#1E293B] truncate">{r.staffName}</span>
                  <span className="block text-[10.5px] text-slate-400">
                    {r.staffCode}
                    {r.submittedAt ? ` · Submitted ${r.submittedAt}` : ''}
                  </span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[r.status]}`}>{r.status}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-extrabold text-[#1E293B]">{r.monthYear}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {r.days} days × {formatINR(WFO_DAILY_ALLOWANCE)}
                  </span>
                </span>
                <span
                  className={`text-base font-extrabold tabular-nums shrink-0 ${
                    r.status === 'Approved' ? 'text-[#16A34A]' : isPending ? 'text-slate-600' : 'text-slate-300 line-through'
                  }`}
                >
                  {formatINR(wfoAllowanceFor(r.days))}
                </span>
              </div>
            </div>

            {(isPending || r.review) && (
              <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setReviewing({ id: r.id, decision: 'Rejected' })}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-rose-500 active:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewing({ id: r.id, decision: 'Approved' })}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#10B981] active:bg-emerald-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommentId(r.id)}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-slate-600 active:bg-slate-50 cursor-pointer"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    View Comment
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}

      {visible.length === 0 && (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">
            {filterCount ? 'No requests match your filters' : 'Your team hasn’t logged any WFO days yet'}
          </p>
          {filterCount > 0 && (
            <button type="button" onClick={() => setFilters({})} className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      )}

      <TeamFilterSheet
        isOpen={isFilterOpen}
        title="Filter Team's WFO Days"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <WFOSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} records={records} />
      <ReviewSheet
        record={records.find((r) => r.id === reviewing?.id)}
        decision={reviewing?.decision ?? lastDecision}
        onClose={() => setReviewing(null)}
        onSubmit={(comment) => {
          if (reviewing) onReview(reviewing.id, reviewing.decision, comment);
          setReviewing(null);
        }}
      />
      <CommentSheet record={records.find((r) => r.id === commentId)} onClose={() => setCommentId(null)} />
    </div>
  );
};
