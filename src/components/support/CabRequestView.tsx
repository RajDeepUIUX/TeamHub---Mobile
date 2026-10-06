import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart2,
  CalendarDays,
  CalendarClock,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  LayoutGrid,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Repeat,
  Square,
  Users,
  X,
} from 'lucide-react';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { BottomSheet } from '../common/BottomSheet';
import { todayIso } from '../common/DateWheelSheet';
import { FilterIconButton, FilterSelection, TeamFilterSheet, activeFilterCount, matchesFilters } from '../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { textareaClass } from '../profile/reviewFormParts';
import {
  CAB_STATUSES,
  CabRequest,
  CabStatus,
  STATUS_CHIP,
  cabTitle,
  canCancel,
  canStop,
  formatCabDate,
  isRunningDaily,
  prettyArea,
  shortDays,
} from '../../data/cabRequestData';

export type CabDecision = 'Approved' | 'Rejected';

interface CabRequestViewProps {
  firstName: string;
  /** The signed-in user's own requests */
  requests: CabRequest[];
  onBack: () => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onStop: (id: string) => void;
  /** Shows the "Request submitted" sheet */
  submitted: boolean;
  onDismissSubmitted: () => void;
  /** Present for managers: enables the "Team's Requests" tab */
  team?: { requests: CabRequest[]; onReview: (id: string, decision: CabDecision, comment: string) => void };
}

type MyFilter = 'All' | 'Pending' | 'Approved' | 'Closed';
const CLOSED: CabStatus[] = ['Rejected', 'Cancelled', 'Terminated'];

const sheetHandle = (
  <div className="pt-3 pb-1 flex justify-center shrink-0">
    <div className="w-10 h-1 bg-slate-300 rounded-full" />
  </div>
);

/** Minimal themed illustration: a cab waiting at a pin */
const CabIllustration: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-52 h-auto" role="img" aria-label="A cab parked next to a location pin">
    <defs>
      <linearGradient id="cab-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="cab-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="84" rx="82" ry="64" fill="url(#cab-bg)" />
    <ellipse cx="96" cy="140" rx="64" ry="5" fill="#E0E7FF" />
    {/* Road dashes */}
    <rect x="30" y="146" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    <rect x="62" y="146" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    <rect x="94" y="146" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    <rect x="126" y="146" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    {/* Car */}
    <path d="M52 112l10-22a8 8 0 017.3-4.7h37.4a8 8 0 017.3 4.7l10 22" fill="url(#cab-body)" />
    <rect x="42" y="108" width="100" height="26" rx="9" fill="url(#cab-body)" />
    <path d="M66 108l6-14h16v14H66Z M94 108V94h14l7 14H94Z" fill="#FFFFFF" opacity="0.85" />
    <rect x="80" y="78" width="24" height="9" rx="3" fill="#FBBF24" />
    <circle cx="64" cy="134" r="9" fill="#1E1B4B" />
    <circle cx="64" cy="134" r="3.5" fill="#C7D2FE" />
    <circle cx="120" cy="134" r="9" fill="#1E1B4B" />
    <circle cx="120" cy="134" r="3.5" fill="#C7D2FE" />
    <rect x="134" y="116" width="8" height="5" rx="2" fill="#FDE68A" />
    {/* Pin */}
    <path d="M160 58c0-9 7-16 16-16s16 7 16 16c0 12-16 28-16 28s-16-16-16-28Z" fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="2.5" />
    <circle cx="176" cy="58" r="6" fill="#8B5CF6" />
    {/* Sparkles */}
    <path d="M38 44l1.6 3.8L43.5 49l-3.9 1.4L38 54l-1.6-3.6L32.5 49l3.9-1.2L38 44Z" fill="#A78BFA" opacity="0.8" />
    <circle cx="140" cy="38" r="2.2" fill="#C4B5FD" />
  </svg>
);

/* ---------------------------------- Card ---------------------------------- */

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="px-3 py-2 min-w-0">
    <span className="flex items-center gap-1 text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
      <Icon className="w-3 h-3" />
      {label}
    </span>
    <span className="block mt-0.5 text-xs font-bold text-[#1E293B] truncate">{value}</span>
  </div>
);

const dateValue = (r: CabRequest) =>
  r.cabFor === 'One Time'
    ? formatCabDate(r.fromDate)
    : r.requestType === 'Permanent'
      ? `From ${formatCabDate(r.submittedOn)}`
      : `${formatCabDate(r.fromDate).replace(/, \d{4}$/, '')} – ${formatCabDate(r.toDate)}`;

interface CardAction {
  label: string;
  icon: React.ElementType;
  tone: string;
  onClick: () => void;
}

const CabCard: React.FC<{ request: CabRequest; showStaff?: boolean; actions: CardAction[] }> = ({ request: r, showStaff, actions }) => {
  const Icon = r.cabFor === 'One Time' ? CalendarClock : Repeat;
  return (
    <article className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <div className="p-3.5 space-y-3">
        {showStaff && (
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
                {r.staffCode} · Requested {formatCabDate(r.submittedOn)}
              </span>
            </span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-[13.5px] font-extrabold text-[#1E293B] leading-tight">{cabTitle(r)}</h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[r.status]}`}>{r.status}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
              {prettyArea(r.dropArea)}, {r.city}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-slate-100 divide-x divide-slate-100">
          <Detail icon={CalendarDays} label={r.cabFor === 'One Time' ? 'Date' : 'Duration'} value={dateValue(r)} />
          <Detail icon={Clock3} label="Pickup" value={r.pickupTime} />
        </div>

        {(r.days.length > 0 || r.terminatedOn || (!showStaff && r.status !== 'Pending')) && (
          <p className="text-[10.5px] text-slate-400">
            {[
              r.days.length > 0 && shortDays(r.days),
              r.terminatedOn && `Stopped ${formatCabDate(r.terminatedOn)}`,
              !showStaff && `Requested ${formatCabDate(r.submittedOn)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex border-t border-slate-100 divide-x divide-slate-100">
          {actions.map(({ label, icon: AIcon, tone, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-[11.5px] font-bold cursor-pointer ${tone}`}
            >
              <AIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};

/* ------------------------------- KPI card ------------------------------- */

const CabKPIs: React.FC<{ requests: CabRequest[]; onViewSummary?: () => void }> = ({ requests, onViewSummary }) => {
  const count = (s: CabStatus) => requests.filter((r) => r.status === s).length;
  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Pending', value: count('Pending'), pill: STATUS_CHIP.Pending },
          { label: 'Approved', value: count('Approved'), pill: STATUS_CHIP.Approved },
          { label: 'Rejected', value: count('Rejected'), pill: STATUS_CHIP.Rejected },
        ].map(({ label, value, pill }) => (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>{value}</div>
            <span className="text-[11px] text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
      {onViewSummary && (
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
      )}
    </div>
  );
};

const CabSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: CabRequest[] }> = ({ isOpen, onClose, requests }) => {
  const count = (fn: (r: CabRequest) => boolean) => requests.filter(fn).length;
  const today = todayIso();
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
          <h2 className="text-lg font-bold text-[#1E293B]">Team Cab Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Cab Requests · Complete Breakdown</p>
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
            <Tile label="Pending" value={count((r) => r.status === 'Pending')} color="text-[#D97706]" />
            <Tile label="Approved" value={count((r) => r.status === 'Approved')} color="text-[#10B981]" />
            <Tile label="Rejected" value={count((r) => r.status === 'Rejected')} color="text-rose-500" />
            <Tile label="Cancelled" value={count((r) => r.status === 'Cancelled')} color="text-slate-500" />
            <Tile label="Stopped" value={count((r) => r.status === 'Terminated')} color="text-violet-600" />
          </div>
        </Section>
        <Section icon={<Car className="w-4 h-4 text-cyan-600" />} title="By Request Type">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="One Time" value={count((r) => r.cabFor === 'One Time')} />
            <Tile label="Daily · Temporary" value={count((r) => r.requestType === 'Temporary')} />
            <Tile label="Daily · Permanent" value={count((r) => r.requestType === 'Permanent')} />
            <Tile label="Running daily" value={count((r) => isRunningDaily(r, today))} color="text-[#10B981]" />
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

/* -------------------------------- Sheets -------------------------------- */

const CommentSheet: React.FC<{ request?: CabRequest; onClose: () => void }> = ({ request, onClose }) => (
  <BottomSheet isOpen={Boolean(request?.review)} onClose={onClose} maxHeight="max-h-[60%]">
    {sheetHandle}
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-base font-bold text-[#1E293B]">Manager's Comment</h2>
      {request?.review && (
        <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">
              {initialsOf(request.review.by)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-[#1E293B]">{request.review.by}</span>
              <span className="block text-[10.5px] text-slate-400">
                {request.status === 'Rejected' ? 'Rejected' : 'Approved'} on {formatCabDate(request.review.on)}
              </span>
            </span>
          </div>
          <p className="mt-2.5 text-[12.5px] text-slate-600 leading-relaxed">
            {request.review.comment || 'No comment was added.'}
          </p>
        </div>
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

const ConfirmSheet: React.FC<{
  kind: 'cancel' | 'stop' | null;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ kind, onClose, onConfirm }) => {
  // Keep the copy stable while the sheet slides away
  const [last, setLast] = useState<'cancel' | 'stop'>('cancel');
  if (kind && kind !== last) setLast(kind);
  const stop = last === 'stop';
  return (
    <BottomSheet isOpen={Boolean(kind)} onClose={onClose} maxHeight="max-h-[55%]">
      {sheetHandle}
      <div className="px-5 pt-2 pb-6">
        <h2 className="text-base font-bold text-[#1E293B]">{stop ? 'Stop your daily cab?' : 'Cancel this cab request?'}</h2>
        <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">
          {stop
            ? 'The transport desk will stop your pickups from today. You can raise a new request whenever you need it again.'
            : 'Your manager and the transport desk will stop processing it. You can raise a new request afterwards.'}
        </p>
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full h-11 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold active:bg-rose-100 cursor-pointer"
          >
            {stop ? 'Stop Cab' : 'Cancel Request'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200 cursor-pointer"
          >
            Keep It
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

const ReviewSheet: React.FC<{
  request?: CabRequest;
  decision: CabDecision;
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
          <h2 className="text-base font-bold text-[#1E293B]">{reject ? 'Reject cab request' : 'Approve cab request'}</h2>
          {request && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {request.staffName} · {cabTitle(request)} · {request.pickupTime}
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
            placeholder={reject ? 'Let them know why, and what they can do instead' : 'Anything the transport desk should know?'}
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

const TeamCabList: React.FC<{
  requests: CabRequest[];
  onReview: (id: string, decision: CabDecision, comment: string) => void;
  onViewComment: (id: string) => void;
}> = ({ requests, onReview, onViewComment }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{ id: string; decision: CabDecision } | null>(null);
  const [lastDecision, setLastDecision] = useState<CabDecision>('Approved');
  if (reviewing && reviewing.decision !== lastDecision) setLastDecision(reviewing.decision);

  // Pending first, then newest
  const sorted = [...requests].sort(
    (a, b) => Number(b.status === 'Pending') - Number(a.status === 'Pending') || b.submittedOn.localeCompare(a.submittedOn)
  );
  const visible = sorted.filter((r) =>
    matchesFilters(filters, { member: r.staffName, status: r.status, cabFor: r.cabFor, city: r.city })
  );
  const filterCount = activeFilterCount(filters);

  const filterSections = [
    { id: 'member', label: 'Staff Name', options: Array.from(new Set(requests.map((r) => r.staffName))).sort() },
    { id: 'status', label: 'Status', options: CAB_STATUSES },
    { id: 'cabFor', label: 'Requesting Cab For', options: ['One Time', 'Daily Basis'] },
    { id: 'city', label: 'City', options: Array.from(new Set(requests.map((r) => r.city))).sort() },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
      <CabKPIs requests={requests} onViewSummary={() => setIsSummaryOpen(true)} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1E293B]">Team Requests</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {visible.map((r) => (
        <CabCard
          key={r.id}
          request={r}
          showStaff
          actions={
            r.status === 'Pending'
              ? [
                  {
                    label: 'Reject',
                    icon: X,
                    tone: 'text-rose-500 active:bg-rose-50',
                    onClick: () => setReviewing({ id: r.id, decision: 'Rejected' }),
                  },
                  {
                    label: 'Approve',
                    icon: Check,
                    tone: 'text-[#10B981] active:bg-emerald-50',
                    onClick: () => setReviewing({ id: r.id, decision: 'Approved' }),
                  },
                ]
              : r.review
                ? [{ label: 'View Comment', icon: MessageSquareText, tone: 'text-slate-600 active:bg-slate-50', onClick: () => onViewComment(r.id) }]
                : []
          }
        />
      ))}

      {visible.length === 0 && (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">
            {filterCount ? 'No requests match your filters' : 'Your team hasn’t asked for a cab yet'}
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
        title="Filter Team's Cab Requests"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <CabSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} requests={requests} />
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

/* --------------------------------- Screen --------------------------------- */

export const CabRequestView: React.FC<CabRequestViewProps> = ({
  firstName,
  requests,
  onBack,
  onNew,
  onEdit,
  onCancel,
  onStop,
  submitted,
  onDismissSubmitted,
  team,
}) => {
  const today = todayIso();
  const [tab, setTab] = useState<'mine' | 'team'>('mine');
  const [filter, setFilter] = useState<MyFilter>('All');
  const [commentId, setCommentId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; kind: 'cancel' | 'stop' } | null>(null);

  const showTeam = Boolean(team) && tab === 'team';
  const sorted = [...requests].sort((a, b) => b.submittedOn.localeCompare(a.submittedOn));
  const running = sorted.find((r) => isRunningDaily(r, today));
  const matches = (r: CabRequest, f: MyFilter) =>
    f === 'All' || (f === 'Closed' ? CLOSED.includes(r.status) : r.status === f);
  const visible = sorted.filter((r) => matches(r, filter));
  const teamPending = team ? team.requests.filter((r) => r.status === 'Pending').length : 0;
  const commentFor = [...requests, ...(team?.requests ?? [])].find((r) => r.id === commentId);

  const actionsFor = (r: CabRequest): CardAction[] => {
    const list: CardAction[] = [];
    if (r.review) {
      list.push({ label: 'Comment', icon: MessageSquareText, tone: 'text-slate-600 active:bg-slate-50', onClick: () => setCommentId(r.id) });
    }
    if (r.status === 'Pending') {
      list.push({ label: 'Edit', icon: Pencil, tone: 'text-[#2F68FE] active:bg-blue-50', onClick: () => onEdit(r.id) });
    }
    if (canStop(r, today)) {
      list.push({ label: 'Stop Cab', icon: Square, tone: 'text-rose-500 active:bg-rose-50', onClick: () => setConfirm({ id: r.id, kind: 'stop' }) });
    } else if (canCancel(r, today)) {
      list.push({ label: 'Cancel', icon: X, tone: 'text-rose-500 active:bg-rose-50', onClick: () => setConfirm({ id: r.id, kind: 'cancel' }) });
    }
    return list;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title">Cab Request</h1>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Cab request view"
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
        <TeamCabList requests={team.requests} onReview={team.onReview} onViewComment={setCommentId} />
      ) : requests.length === 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6">
          <div className="min-h-full flex flex-col items-center justify-center text-center py-10">
            <CabIllustration />
            <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#1E1B4B]">Heading home late, {firstName}?</h2>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[295px]">
              Book an office cab for a one-off late night, or set up a regular drop for the days you work late.
            </p>
            <p className="mt-3 text-[12px] text-slate-400 leading-relaxed max-w-[280px]">
              Your manager approves it and the transport desk takes care of the rest.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {running ? (
            <div className="rounded-[20px] p-4 bg-gradient-to-br from-[#2F68FE] to-[#7C3AED] text-white shadow-[0_6px_20px_rgba(47,104,254,0.25)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Your daily cab · {running.requestType}
                </span>
                <Car className="w-5 h-5 text-white/70" />
              </div>
              <p className="mt-2 text-[22px] font-extrabold tabular-nums leading-none">{running.pickupTime}</p>
              <p className="mt-1.5 text-[12px] text-white/85 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {prettyArea(running.dropArea)}, {running.city}
                {running.days.length > 0 && ` · ${shortDays(running.days)}`}
              </p>
              {running.requestType === 'Temporary' && (
                <p className="mt-1 text-[11px] text-white/70">Until {formatCabDate(running.toDate)}</p>
              )}
            </div>
          ) : (
            <CabKPIs requests={requests} />
          )}

          <div className="flex items-center gap-2 px-0.5 overflow-x-auto no-scrollbar">
            {(['All', 'Pending', 'Approved', 'Closed'] as const).map((f) => {
              const isOn = filter === f;
              const count = sorted.filter((r) => matches(r, f)).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={isOn}
                  className={`h-8 px-3 rounded-full border text-[11.5px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                    isOn ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {f}
                  <span className={`tabular-nums ${isOn ? 'text-[#2F68FE]' : 'text-slate-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {visible.map((r) => (
            <CabCard key={r.id} request={r} actions={actionsFor(r)} />
          ))}

          {visible.length === 0 && (
            <div className="py-12 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">
                {filter === 'Pending'
                  ? 'Nothing waiting on your manager'
                  : filter === 'Approved'
                    ? 'No approved cabs right now'
                    : 'No closed requests yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {!showTeam && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onNew}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Request a Cab
          </button>
        </div>
      )}

      <CommentSheet request={commentFor} onClose={() => setCommentId(null)} />
      <ConfirmSheet
        kind={confirm?.kind ?? null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) (confirm.kind === 'stop' ? onStop : onCancel)(confirm.id);
          setConfirm(null);
        }}
      />

      {/* Submitted */}
      <BottomSheet isOpen={submitted} onClose={onDismissSubmitted} maxHeight="max-h-[80%]">
        {sheetHandle}
        <div className="px-5 pt-3 pb-6 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#4F46E5]" />
          </span>
          <h2 className="mt-4 text-[16px] font-extrabold text-[#1E293B]">Cab Request Submitted!</h2>
          <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">
            Your reporting manager has been notified. You'll get an update here as soon as they respond.
          </p>
          <div className="mt-4 w-full text-left rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#1E293B]">
              <BadgeCheck className="w-4 h-4 text-[#4F46E5]" />
              What's Next?
            </p>
            <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
              Once approved, the transport desk will share your route, driver and vehicle details before the first pickup.
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
