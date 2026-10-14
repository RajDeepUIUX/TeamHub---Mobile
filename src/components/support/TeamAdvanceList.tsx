import React, { useState } from 'react';
import { BarChart2, Check, ChevronRight, Coins, Inbox, LayoutGrid, MessageSquare, Users, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { FilterIconButton, FilterSelection, TeamFilterSheet, activeFilterCount, matchesFilters } from '../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { textareaClass } from '../profile/reviewFormParts';
import {
  ADVANCE_STATUSES,
  AdvanceRequest,
  AdvanceStatus,
  REQUEST_TYPES,
  STATUS_TONE,
  formatAdvanceDate,
  formatINR,
  isEvLoan,
  monthlyDeduction,
} from '../../data/advanceSalaryData';

export type AdvanceDecision = 'Approved' | 'Rejected';

/** Only Advance Salary requests wait on the reporting manager; EV loans go straight to the CTM */
export const awaitsManager = (r: AdvanceRequest) => r.status === 'Manager Review Pending';

const REJECTED: AdvanceStatus[] = ['Manager Rejected', 'CTM Rejected', 'Terminate'];
const ENDED: AdvanceStatus[] = [...REJECTED, 'Closed', 'Withdrawn'];
const inProcess = (r: AdvanceRequest) => !awaitsManager(r) && !ENDED.includes(r.status);

const sheetHandle = (
  <div className="pt-3 pb-1 flex justify-center shrink-0">
    <div className="w-10 h-1 bg-slate-300 rounded-full" />
  </div>
);

/* ------------------------------- KPI card ------------------------------- */

const AdvanceKPIs: React.FC<{ requests: AdvanceRequest[]; onViewSummary: () => void }> = ({ requests, onViewSummary }) => (
  <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { label: 'Awaiting You', value: requests.filter(awaitsManager).length, pill: 'bg-amber-50 text-amber-600' },
        { label: 'In Process', value: requests.filter(inProcess).length, pill: 'bg-blue-50 text-[#2F68FE]' },
        { label: 'Rejected', value: requests.filter((r) => REJECTED.includes(r.status)).length, pill: 'bg-rose-50 text-rose-600' },
      ].map(({ label, value, pill }) => (
        <div key={label} className="flex flex-col items-center">
          <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>{value}</div>
          <span className="text-[11px] text-gray-500 font-medium">{label}</span>
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

const AdvanceSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: AdvanceRequest[] }> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const count = (fn: (r: AdvanceRequest) => boolean) => requests.filter(fn).length;
  const sum = (fn: (r: AdvanceRequest) => boolean) => requests.filter(fn).reduce((n, r) => n + r.amount, 0);
  const members = Array.from(new Set(requests.map((r) => r.staffName))).sort();

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
          <h2 className="text-lg font-bold text-[#1E293B]">Team Advance Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Adv. Salary & EV Loan · Complete Breakdown</p>
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
            <Tile label="Awaiting You" value={count(awaitsManager)} color="text-[#D97706]" />
            <Tile label="With CTM / HR" value={count(inProcess)} color="text-[#2F68FE]" />
            <Tile label="Disbursed" value={count((r) => r.status === 'Disbursed')} color="text-[#10B981]" />
            <Tile label="Closed" value={count((r) => r.status === 'Closed')} color="text-slate-500" />
            <Tile label="Rejected" value={count((r) => REJECTED.includes(r.status))} color="text-rose-500" />
          </div>
        </Section>
        <Section icon={<Coins className="w-4 h-4 text-amber-500" />} title="Amounts">
          <div className="grid grid-cols-1 gap-2 pt-1">
            <Tile label="Awaiting your review" value={formatINR(sum(awaitsManager))} color="text-[#D97706]" />
            <Tile label="In process" value={formatINR(sum(inProcess))} color="text-[#2F68FE]" />
            <Tile label="Being repaid" value={formatINR(sum((r) => r.status === 'Disbursed'))} color="text-[#10B981]" />
          </div>
        </Section>
        <Section icon={<LayoutGrid className="w-4 h-4 text-teal-600" />} title="By Request Type">
          <div className="grid grid-cols-1 gap-2 pt-1">
            {REQUEST_TYPES.map((t) => (
              <Tile key={t} label={t} value={count((r) => r.type === t)} />
            ))}
          </div>
        </Section>
        <Section icon={<Users className="w-4 h-4 text-[#10B981]" />} title="By Team Member">
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const pending = count((r) => r.staffName === name && awaitsManager(r));
              return (
                <div key={name} className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && <span className="px-1.5 py-0.5 rounded-md bg-[#FEF8E7] text-[#D97706] font-bold">{pending} to review</span>}
                    <span className="font-bold text-slate-700 tabular-nums">{count((r) => r.staffName === name)} total</span>
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

/* ------------------------------ Review sheet ------------------------------ */

const ReviewSheet: React.FC<{
  request?: AdvanceRequest;
  decision: AdvanceDecision;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}> = ({ request, decision, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [lastId, setLastId] = useState<string | undefined>(request?.id);
  if (request && request.id !== lastId) {
    setLastId(request.id);
    setComment('');
    setError('');
  }
  const reject = decision === 'Rejected';
  return (
    <BottomSheet isOpen={Boolean(request)} onClose={onClose} maxHeight="max-h-[85%]">
      {sheetHandle}
      <div className="px-5 pt-2 pb-6 space-y-3.5">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{reject ? 'Reject advance request' : 'Approve advance request'}</h2>
          {request && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {request.staffName} · {formatINR(request.amount)} over {request.months} months
            </p>
          )}
        </div>
        {!reject && (
          <p className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-[11.5px] text-[#1E40AF] leading-relaxed">
            Once you approve, it moves to the CTM and then HR & Finance for processing.
          </p>
        )}
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
            placeholder={reject ? 'Let them know why, and what they can do instead' : 'Anything the CTM or HR should know?'}
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

/* ------------------------------- Team's tab ------------------------------- */

const Detail: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <span className="block text-[10px] text-slate-400">{label}</span>
    <span className={`block text-[11.5px] font-semibold truncate ${value ? 'text-slate-700' : 'text-slate-300'}`}>{value ?? '—'}</span>
  </div>
);

export const TeamAdvanceList: React.FC<{
  requests: AdvanceRequest[];
  onReview: (id: string, decision: AdvanceDecision, comment: string) => void;
  onOpenComments: (id: string) => void;
}> = ({ requests, onReview, onOpenComments }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{ id: string; decision: AdvanceDecision } | null>(null);
  const [lastDecision, setLastDecision] = useState<AdvanceDecision>('Approved');
  if (reviewing && reviewing.decision !== lastDecision) setLastDecision(reviewing.decision);

  // Awaiting the manager first, then newest
  const sorted = [...requests].sort(
    (a, b) => Number(awaitsManager(b)) - Number(awaitsManager(a)) || b.submittedOn.localeCompare(a.submittedOn)
  );
  const visible = sorted.filter((r) => matchesFilters(filters, { member: r.staffName, type: r.type, status: r.status }));
  const filterCount = activeFilterCount(filters);

  const filterSections = [
    { id: 'member', label: 'Staff Name', options: Array.from(new Set(requests.map((r) => r.staffName))).sort() },
    { id: 'type', label: 'Request Type', options: [...REQUEST_TYPES] },
    { id: 'status', label: 'Status', options: ADVANCE_STATUSES.filter((s) => requests.some((r) => r.status === s)) },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
      <AdvanceKPIs requests={requests} onViewSummary={() => setIsSummaryOpen(true)} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1E293B]">Team Requests</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {visible.map((r) => {
        const ev = isEvLoan(r.type);
        const pending = awaitsManager(r);
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
                    {r.staffCode} · Requested {formatAdvanceDate(r.submittedOn)}
                  </span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 max-w-[42%] text-right ${STATUS_TONE[r.status]}`}>
                  {r.status}
                </span>
              </div>

              <div className="flex items-end justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[#1E293B]">{r.type}</span>
                  <span className="block text-[11px] text-slate-400 truncate">
                    {ev
                      ? `Purchase by ${formatAdvanceDate(r.expectedPurchaseDate)}`
                      : r.reason === 'Other'
                        ? r.otherReason
                        : r.reason}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-[17px] font-extrabold text-[#1E293B] tabular-nums leading-tight">{formatINR(r.amount)}</span>
                  <span className="block text-[10.5px] text-slate-400 tabular-nums">
                    {formatINR(monthlyDeduction(r.amount, r.months))}/mo · {r.months} mo
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 px-3 py-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <Detail label="Salary Bank" value={r.bank} />
                <Detail label="Cheques" value={r.cheques.length ? String(r.cheques.length) : undefined} />
                <Detail
                  label="Documents"
                  value={Object.values(r.documents).flat().length ? String(Object.values(r.documents).flat().length) : undefined}
                />
              </div>

              {ev && !ENDED.includes(r.status) && (
                <p className="text-[10.5px] text-slate-400">EV loans go straight to the CTM — shown here so you can keep track.</p>
              )}
            </div>

            <div className="flex border-t border-slate-100 divide-x divide-slate-100">
              <button
                type="button"
                onClick={() => onOpenComments(r.id)}
                className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-slate-600 active:bg-slate-50 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments{r.comments.length ? ` (${r.comments.length})` : ''}
              </button>
              {pending && (
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
            {filterCount ? 'No requests match your filters' : 'Nobody on your team has asked for an advance'}
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
        title="Filter Team's Advance Requests"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <AdvanceSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} requests={requests} />
      <ReviewSheet
        request={requests.find((r) => r.id === reviewing?.id)}
        decision={reviewing?.decision ?? lastDecision}
        onClose={() => setReviewing(null)}
        onSubmit={(comment) => {
          if (reviewing) onReview(reviewing.id, reviewing.decision, comment);
          setReviewing(null);
        }}
      />
    </div>
  );
};
