import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  BookOpen,
  Car,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Pencil,
  Plus,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { CommentThreadSheet } from '../common/CommentThreadSheet';
import { todayIso } from '../common/DateWheelSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { AdvanceDecision, TeamAdvanceList, awaitsManager } from './TeamAdvanceList';
import {
  ADVANCE_STATUSES,
  AdvanceRequest,
  AdvanceRequestType,
  AdvanceStatus,
  REQUEST_LIMITS,
  REQUEST_TYPES,
  STATUS_TONE,
  canEditRequest,
  canWithdrawRequest,
  formatAdvanceDate,
  formatINR,
  isEvLoan,
  monthlyDeduction,
  requestAvailability,
} from '../../data/advanceSalaryData';

interface AdvanceSalaryViewProps {
  firstName: string;
  currentUser: string;
  requests: AdvanceRequest[];
  onBack: () => void;
  onOpenGuidelines: () => void;
  onRaise: () => void;
  onEdit: (id: string) => void;
  onWithdraw: (id: string) => void;
  onComment: (id: string, text: string) => void;
  /** Type of the request just submitted — shows the success sheet */
  submittedType: AdvanceRequestType | null;
  onDismissSubmitted: () => void;
  /** Present for managers: enables the "Team's Requests" tab */
  team?: { requests: AdvanceRequest[]; onReview: (id: string, decision: AdvanceDecision, comment: string) => void };
}

const TYPE_META: Record<AdvanceRequestType, { icon: React.ElementType; tint: string }> = {
  'Advance Salary': { icon: Wallet, tint: 'bg-blue-50 text-[#2F68FE]' },
  'EV Two-Wheeler Loan': { icon: Bike, tint: 'bg-emerald-50 text-emerald-600' },
  'EV Car Loan': { icon: Car, tint: 'bg-teal-50 text-teal-600' },
};

const WHATS_NEXT: Record<'advance' | 'ev', string> = {
  advance:
    "Upon your Reporting Manager and then CTM's approval, the HR & Finance team will process the request. You will receive the declaration to be signed in your personal email.",
  ev: "Upon your CTM's approval, the HR & Finance team will verify and process the request. You will receive the agreement to be signed in your personal email.",
};

type RcFilter = 'All' | 'Yes' | 'No';

const Detail: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <span className="block text-[10px] text-slate-400">{label}</span>
    <span className={`block text-[11.5px] font-semibold truncate ${value ? 'text-slate-700' : 'text-slate-300'}`}>{value ?? '—'}</span>
  </div>
);

const EmptyIllustration: React.FC = () => (
  <svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true">
    <ellipse cx="66" cy="96" rx="44" ry="6" fill="#EEF2FF" />
    <rect x="22" y="22" width="88" height="58" rx="12" fill="#E0E7FF" />
    <rect x="22" y="34" width="88" height="10" fill="#C7D2FE" />
    <rect x="32" y="56" width="30" height="6" rx="3" fill="#A5B4FC" />
    <rect x="32" y="66" width="18" height="5" rx="2.5" fill="#C7D2FE" />
    <circle cx="94" cy="26" r="16" fill="#4F46E5" />
    <path d="M94 18v16M88 24h9a3 3 0 010 6h-6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AdvanceSalaryView: React.FC<AdvanceSalaryViewProps> = ({
  firstName,
  currentUser,
  requests,
  onBack,
  onOpenGuidelines,
  onRaise,
  onEdit,
  onWithdraw,
  onComment,
  submittedType,
  onDismissSubmitted,
  team,
}) => {
  const [tab, setTab] = useState<'mine' | 'team'>(team ? 'team' : 'mine');
  const showTeam = Boolean(team) && tab === 'team';
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdvanceStatus | 'All'>('All');
  const [rcFilter, setRcFilter] = useState<RcFilter>('All');
  const [draftStatus, setDraftStatus] = useState<AdvanceStatus | 'All'>('All');
  const [draftRc, setDraftRc] = useState<RcFilter>('All');
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [commentsId, setCommentsId] = useState<string | null>(null);
  // Keep the last submitted type so the success copy doesn't change while the sheet slides away
  const [lastSubmitted, setLastSubmitted] = useState<AdvanceRequestType | null>(submittedType);
  if (submittedType && submittedType !== lastSubmitted) setLastSubmitted(submittedType);
  const submittedEv = lastSubmitted ? isEvLoan(lastSubmitted) : false;

  const availability = useMemo(() => requestAvailability(requests, todayIso()), [requests]);
  const canRaise = REQUEST_TYPES.some((t) => !availability[t]);
  const blockedReason = !canRaise ? availability['Advance Salary'] : null;

  const sorted = useMemo(() => [...requests].sort((a, b) => b.submittedOn.localeCompare(a.submittedOn)), [requests]);
  const shown = sorted.filter(
    (r) =>
      (statusFilter === 'All' || r.status === statusFilter) &&
      (rcFilter === 'All' || (isEvLoan(r.type) && (rcFilter === 'Yes') === Boolean(r.rcUploaded)))
  );
  const activeFilters = (statusFilter !== 'All' ? 1 : 0) + (rcFilter !== 'All' ? 1 : 0);
  const commentsFor = [...requests, ...(team?.requests ?? [])].find((r) => r.id === commentsId);
  const teamPending = team ? team.requests.filter(awaitsManager).length : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold ml-2 flex-1 truncate">Adv. Salary & EV Loan</h1>
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[#2F68FE] text-[11.5px] font-bold active:bg-blue-50 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Guidelines
          </button>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Advance request view"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'mine', label: 'My Requests' },
                { id: 'team', label: "Team's Requests", badge: teamPending },
              ]}
            />
          </div>
        )}
      </header>

      {showTeam && team ? (
        <TeamAdvanceList requests={team.requests} onReview={team.onReview} onOpenComments={setCommentsId} />
      ) : (
      <>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* What can be requested right now */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
          <h2 className="px-3.5 pt-3.5 pb-2 text-[12.5px] font-bold text-[#1E293B]">What you can request</h2>
          <ul className="divide-y divide-slate-100">
            {REQUEST_TYPES.map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              const limit = REQUEST_LIMITS[t];
              const blocked = availability[t];
              return (
                <li key={t} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[#1E293B]">{t}</span>
                    <span className="block text-[11px] text-slate-400">
                      Up to {formatINR(limit.maxAmount)} · {limit.maxMonths} months
                    </span>
                    {blocked && <span className="block text-[10.5px] text-amber-600 leading-snug mt-0.5">{blocked}</span>}
                  </span>
                  {blocked ? (
                    <Clock3 className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold shrink-0">Available</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Requests */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">My Requests ({shown.length})</h3>
            {requests.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDraftStatus(statusFilter);
                  setDraftRc(rcFilter);
                  setFilterOpen(true);
                }}
                className="relative h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:bg-slate-50"
                aria-label="Filter requests"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
                {activeFilters > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-[#2F68FE] text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs px-6 py-9 flex flex-col items-center text-center">
              <EmptyIllustration />
              <p className="mt-4 text-[15px] font-extrabold text-[#1E1B4B]">Nothing borrowed yet, {firstName}</p>
              <p className="mt-1 text-[12px] text-slate-500 leading-relaxed max-w-[270px]">
                If you ever need a salary advance or want to go electric, you can raise a request here.
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs px-6 py-8 text-center">
              <p className="text-[13px] font-bold text-[#1E293B]">No requests match these filters</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setRcFilter('All');
                }}
                className="mt-2 text-[12px] font-bold text-[#2F68FE] cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            shown.map((r) => {
              const meta = TYPE_META[r.type];
              const Icon = meta.icon;
              const ev = isEvLoan(r.type);
              const editable = canEditRequest(r);
              const withdrawable = canWithdrawRequest(r);
              return (
                <article key={r.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-[#1E293B]">{r.type}</span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {ev
                            ? `Purchase by ${formatAdvanceDate(r.expectedPurchaseDate)}`
                            : r.reason === 'Other'
                              ? r.otherReason
                              : r.reason}{' '}
                          · {formatAdvanceDate(r.submittedOn)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 max-w-[40%] text-right ${STATUS_TONE[r.status]}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span>
                        <span className="block text-[10px] text-slate-400">Requested Amount</span>
                        <span className="block text-[17px] font-extrabold text-[#1E293B] tabular-nums leading-tight">{formatINR(r.amount)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[12px] font-bold text-[#2F68FE] tabular-nums">
                          {formatINR(monthlyDeduction(r.amount, r.months))}/mo
                        </span>
                        <span className="block text-[10.5px] text-slate-400">
                          for {r.months} {r.months === 1 ? 'month' : 'months'}
                        </span>
                      </span>
                    </div>

                    <div className={`grid gap-2 ${ev ? 'grid-cols-4' : 'grid-cols-3'}`}>
                      <Detail label="Disbursed On" value={r.disbursedOn && formatAdvanceDate(r.disbursedOn)} />
                      <Detail label="Last EMI" value={r.lastEmiDate && formatAdvanceDate(r.lastEmiDate)} />
                      <Detail label="Closed On" value={r.closedOn && formatAdvanceDate(r.closedOn)} />
                      {ev && <Detail label="RC Uploaded" value={r.rcUploaded ? 'Yes' : 'No'} />}
                    </div>
                  </div>

                  <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                    <button
                      type="button"
                      onClick={() => setCommentsId(r.id)}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-slate-600 active:bg-slate-50 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Comments{r.comments.length ? ` (${r.comments.length})` : ''}
                    </button>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => onEdit(r.id)}
                        className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    {withdrawable && (
                      <button
                        type="button"
                        onClick={() => setWithdrawId(r.id)}
                        className="flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-rose-500 active:bg-rose-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {blockedReason && <p className="mb-2 text-center text-[11px] font-medium text-amber-600">{blockedReason}</p>}
        <button
          type="button"
          onClick={onRaise}
          disabled={!canRaise}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Raise Request
        </button>
      </div>
      </>
      )}

      {/* Filters */}
      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} maxHeight="max-h-[70%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-6 space-y-4">
          <h2 className="text-base font-bold text-[#1E293B]">Filter Requests</h2>
          <div>
            <span className="block mb-1 text-[10.5px] font-semibold text-slate-500">Status</span>
            <Dropdown<AdvanceStatus | 'All'>
              value={draftStatus}
              options={[{ value: 'All', label: 'All statuses' }, ...ADVANCE_STATUSES.map((s) => ({ value: s, label: s }))]}
              onChange={setDraftStatus}
              ariaLabel="Status"
              sheetTitle="Status"
            />
          </div>
          <div>
            <span className="block mb-1 text-[10.5px] font-semibold text-slate-500">RC Uploaded (EV loans)</span>
            <Dropdown<RcFilter>
              value={draftRc}
              options={[
                { value: 'All', label: 'All' },
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' },
              ]}
              onChange={setDraftRc}
              ariaLabel="RC uploaded"
            />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setRcFilter('All');
                setFilterOpen(false);
              }}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold active:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter(draftStatus);
                setRcFilter(draftRc);
                setFilterOpen(false);
              }}
              className="flex-[1.4] h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Withdraw */}
      <BottomSheet isOpen={Boolean(withdrawId)} onClose={() => setWithdrawId(null)} maxHeight="max-h-[55%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-6">
          <h2 className="text-base font-bold text-[#1E293B]">Withdraw this request?</h2>
          <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">
            Your manager, HR and Finance will stop processing it. You can raise a new request afterwards.
          </p>
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => {
                if (withdrawId) onWithdraw(withdrawId);
                setWithdrawId(null);
              }}
              className="w-full h-11 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold active:bg-rose-100 cursor-pointer"
            >
              Withdraw Request
            </button>
            <button
              type="button"
              onClick={() => setWithdrawId(null)}
              className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200 cursor-pointer"
            >
              Keep It
            </button>
          </div>
        </div>
      </BottomSheet>

      <CommentThreadSheet
        isOpen={Boolean(commentsFor)}
        title="Comments"
        subtitle={
          commentsFor
            ? `${commentsFor.staffName !== currentUser ? `${commentsFor.staffName} · ` : ''}${commentsFor.type} · ${formatINR(commentsFor.amount)}`
            : ''
        }
        comments={commentsFor?.comments ?? []}
        currentUser={currentUser}
        onClose={() => setCommentsId(null)}
        onSend={(text) => commentsId && onComment(commentsId, text)}
        placeholder={
          commentsFor && commentsFor.staffName !== currentUser
            ? `Write to ${commentsFor.staffName.split(' ')[0]}, HR or Finance`
            : 'Write to your manager, HR or Finance'
        }
      />

      {/* Submitted */}
      <BottomSheet isOpen={Boolean(submittedType)} onClose={onDismissSubmitted} maxHeight="max-h-[80%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-3 pb-6 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#4F46E5]" />
          </span>
          <h2 className="mt-4 text-[16px] font-extrabold text-[#1E293B]">Request Submitted Successfully!</h2>
          <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">
            Your {submittedEv ? 'EV loan' : 'salary advance'} request has been submitted successfully. A
            confirmation email has been sent to your registered email address.
          </p>
          <div className="mt-4 w-full text-left rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#1E293B]">
              <BadgeCheck className="w-4 h-4 text-[#4F46E5]" />
              What's Next?
            </p>
            <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
              {WHATS_NEXT[submittedEv ? 'ev' : 'advance']}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissSubmitted}
            className="mt-5 w-full h-11 rounded-xl bg-indigo-50 text-[#4F46E5] text-xs font-bold active:bg-indigo-100 cursor-pointer"
          >
            Great!
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
