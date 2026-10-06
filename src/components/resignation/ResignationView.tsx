import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Undo2,
  Check,
  Clock,
  X as XIcon,
  ChevronDown,
  Paperclip,
  CalendarDays,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import { ResignationRecord, ApprovalStatus, ReviewDecision } from '../../types/resignation';
import { formatResignationDate, NOTICE_PERIOD_DAYS } from '../../data/resignationData';
import { WithdrawResignationSheet } from './WithdrawResignationSheet';
import { TeamResignationsList } from './TeamResignationsList';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';

interface ResignationViewProps {
  firstName: string;
  records: ResignationRecord[];
  onBack: () => void;
  onApply: () => void;
  onWithdraw: (id: string, reason: string) => void;
  /** Present for managers: enables the "My Team's Resignations" tab */
  team?: {
    records: ResignationRecord[];
    onReview: (id: string, decision: ReviewDecision, comment: string) => void;
  };
}

type ResignationTab = 'mine' | 'team';

/* ------------------------------ Illustration ------------------------------ */

/** Minimal themed illustration: a letter with a heart, a plant and soft sparkles */
const StayIllustration: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-52 h-auto" role="img" aria-label="A letter with a heart">
    <defs>
      <linearGradient id="resig-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="resig-heart" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="resig-leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="84" rx="82" ry="64" fill="url(#resig-bg)" />
    <ellipse cx="100" cy="142" rx="58" ry="5" fill="#E0E7FF" />
    <g transform="rotate(-6 96 84)">
      <rect x="60" y="38" width="72" height="92" rx="10" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
      <rect x="72" y="54" width="40" height="5" rx="2.5" fill="#C7D2FE" />
      <rect x="72" y="66" width="48" height="4" rx="2" fill="#E2E8F0" />
      <rect x="72" y="76" width="44" height="4" rx="2" fill="#E2E8F0" />
      <rect x="72" y="86" width="30" height="4" rx="2" fill="#E2E8F0" />
      <path d="M73 112c6-8 10 6 15-2s9 4 14-1" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
    </g>
    <circle cx="134" cy="52" r="17" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
    <path
      d="M134 61.5s-9-5.4-9-11.3a4.9 4.9 0 0 1 9-2.7 4.9 4.9 0 0 1 9 2.7c0 5.9-9 11.3-9 11.3Z"
      fill="url(#resig-heart)"
    />
    <path d="M42 122h20l-3 18H45l-3-18Z" fill="#C7D2FE" />
    <path d="M52 122c0-14-9-20-14-22 1 9 5 17 14 22Z" fill="url(#resig-leaf)" />
    <path d="M52 122c0-12 7-19 13-21-1 9-5 16-13 21Z" fill="url(#resig-leaf)" opacity="0.85" />
    <path d="M160 96l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#A78BFA" opacity="0.7" />
    <path d="M40 58l1.5 3.5L45 63l-3.5 1.5L40 68l-1.5-3.5L35 63l3.5-1.5L40 58Z" fill="#7DD3FC" opacity="0.8" />
    <circle cx="152" cy="126" r="2.5" fill="#C4B5FD" />
    <circle cx="30" cy="96" r="2" fill="#A5B4FC" />
  </svg>
);

/* -------------------------------- Helpers --------------------------------- */

const daysBetween = (fromISO: string, toISO: string) =>
  Math.round((new Date(`${toISO}T00:00:00`).getTime() - new Date(`${fromISO}T00:00:00`).getTime()) / 86400000);

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const APPROVAL_STYLES: Record<ApprovalStatus, { chip: string; dot: string; icon: React.ReactNode }> = {
  Pending: {
    chip: 'bg-violet-50 text-violet-600',
    dot: 'bg-white border-2 border-violet-300 text-violet-500',
    icon: <Clock className="w-3 h-3" />,
  },
  Approved: {
    chip: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-500 text-white',
    icon: <Check className="w-3 h-3 stroke-[3]" />,
  },
  Rejected: {
    chip: 'bg-rose-50 text-rose-600',
    dot: 'bg-rose-500 text-white',
    icon: <XIcon className="w-3 h-3 stroke-[3]" />,
  },
};

const ReasonChips: React.FC<{ reasons: string[]; muted?: boolean }> = ({ reasons, muted }) => (
  <div className="flex flex-wrap gap-1.5">
    {reasons.map((r) => (
      <span
        key={r}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
          muted ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-[#2F68FE]'
        }`}
      >
        {r}
      </span>
    ))}
  </div>
);

/* ------------------------------ Active card ------------------------------- */

const ActiveResignationCard: React.FC<{ record: ResignationRecord }> = ({ record }) => {
  const [showLetter, setShowLetter] = useState(false);
  const today = todayISO();
  const daysLeft = Math.max(0, daysBetween(today, record.lastWorkingDate));
  const served = Math.min(NOTICE_PERIOD_DAYS, Math.max(0, daysBetween(record.resignationDate, today) + 1));
  const progress = Math.round((served / NOTICE_PERIOD_DAYS) * 100);

  const steps: { title: string; subtitle: string; status: ApprovalStatus | 'Done'; comment?: string }[] = [
    { title: 'Resignation submitted', subtitle: formatResignationDate(record.resignationDate), status: 'Done' },
    {
      title: 'Reporting Manager',
      subtitle: record.reportingManager,
      status: record.managerApproval,
      comment: record.managerComment,
    },
    { title: 'CTM Approval', subtitle: 'Central Team Management', status: record.ctmApproval, comment: record.ctmComment },
  ];

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1E293B]">Resignation</h2>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[10px] font-bold">Resign</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted {formatResignationDate(record.resignationDate)}</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[11px] font-semibold shrink-0">
          Notice Period
        </span>
      </div>

      {/* Notice progress */}
      <div className="mx-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
        <div className="flex items-end justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last Working Day</span>
            <span className="block text-[15px] font-extrabold text-[#1E293B]">
              {formatResignationDate(record.lastWorkingDate)}
            </span>
          </div>
          <span className="text-right">
            <span className="block text-lg font-extrabold text-[#2F68FE] leading-none tabular-nums">{daysLeft}</span>
            <span className="block text-[10px] text-slate-400">days left</span>
          </span>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#6366F1]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400 tabular-nums">
          {served} of {NOTICE_PERIOD_DAYS} notice days served
        </p>
      </div>

      {/* Reasons */}
      <div className="px-4 pt-3.5">
        <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Reason for resignation</span>
        <ReasonChips reasons={record.reasons} />
      </div>

      {/* Approval timeline */}
      <div className="px-4 pt-4">
        <span className="block text-[11px] font-semibold text-slate-500 mb-2">Approval status</span>
        <ol>
          {steps.map((step, idx) => {
            const isDone = step.status === 'Done';
            const style = isDone ? APPROVAL_STYLES.Approved : APPROVAL_STYLES[step.status as ApprovalStatus];
            const isLast = idx === steps.length - 1;
            return (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${style.dot}`}>
                    {style.icon}
                  </span>
                  {!isLast && <span className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className={`flex-1 min-w-0 flex items-start justify-between gap-2 ${isLast ? '' : 'pb-3'}`}>
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-[#1E293B]">{step.title}</span>
                    <span className="block text-[11px] text-slate-400 truncate">{step.subtitle}</span>
                    {step.comment && <span className="block text-[11px] text-slate-500 mt-0.5">“{step.comment}”</span>}
                  </div>
                  {!isDone && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${style.chip}`}>{step.status}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Letter + attachments */}
      <div className="mt-3.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowLetter((v) => !v)}
          aria-expanded={showLetter}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#2F68FE] active:bg-slate-50 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {showLetter ? 'Hide resignation email' : 'View resignation email'}
            {record.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-slate-400 font-medium">
                · <Paperclip className="w-3 h-3" /> {record.attachments.length}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showLetter ? 'rotate-180' : ''}`} />
        </button>
        {showLetter && (
          <div className="px-4 pb-4 space-y-2.5 animate-in fade-in duration-200">
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line">
              {record.emailContent}
            </p>
            {record.attachments.map((name) => (
              <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 text-xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-700">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ------------------------------- History card ----------------------------- */

const HistoryCard: React.FC<{ record: ResignationRecord }> = ({ record }) => {
  const isRejected = record.status === 'Rejected';
  return (
  <div className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-2.5">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
        {formatResignationDate(record.resignationDate)}
      </div>
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          isRejected ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {isRejected ? 'Rejected by Manager' : 'Withdrawn'}
      </span>
    </div>
    <ReasonChips reasons={record.reasons} muted />
    {isRejected && (
      <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-rose-400">Manager's comment</span>
        <span className="block text-[11.5px] text-rose-700 leading-relaxed mt-0.5">
          {record.managerComment || 'No comment provided.'}
        </span>
      </div>
    )}
    {record.withdrawReason && (
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Withdraw reason</span>
        <span className="block text-[11.5px] text-slate-600 leading-relaxed mt-0.5">{record.withdrawReason}</span>
      </div>
    )}
    <div className="flex items-center justify-between text-[11px] text-slate-400">
      <span className="flex items-center gap-1">
        <UserRound className="w-3 h-3" />
        {record.reportingManager}
      </span>
      {record.withdrawnAt && <span>Withdrawn on {formatResignationDate(record.withdrawnAt)}</span>}
      {isRejected && record.managerReviewedAt && (
        <span>Rejected on {formatResignationDate(record.managerReviewedAt)}</span>
      )}
    </div>
  </div>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const ResignationView: React.FC<ResignationViewProps> = ({
  firstName,
  records,
  onBack,
  onApply,
  onWithdraw,
  team,
}) => {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  // Managers land on their team's queue first
  const [tab, setTab] = useState<ResignationTab>(team ? 'team' : 'mine');
  const showTeam = Boolean(team) && tab === 'team';
  const pendingTeamCount = team
    ? team.records.filter((r) => r.status === 'Notice' && r.managerApproval === 'Pending').length
    : 0;

  const active = records.find((r) => r.status === 'Notice');
  const history = records.filter((r) => r.status !== 'Notice');
  const isEmpty = records.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
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
          <h1 className="text-base font-bold screen-title">Resignation</h1>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Resignation view"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'mine', label: 'My Resignation' },
                { id: 'team', label: "Team's Resignations", badge: pendingTeamCount },
              ]}
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {showTeam && team ? (
          <TeamResignationsList records={team.records} onReview={team.onReview} />
        ) : isEmpty ? (
          /* Empty state */
          <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-10">
            <StayIllustration />
            <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#1E1B4B]">We'd really miss you, {firstName} 💙</h2>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[280px]">
              No resignation requests here — and honestly, we hope it stays that way. You're an important part of the
              team.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {active ? (
              <ActiveResignationCard record={active} />
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-r from-[#EEF2FF] to-[#F5F3FF] border border-indigo-100">
                <span className="w-9 h-9 rounded-xl bg-white text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </span>
                <span className="text-xs text-[#3730A3] leading-snug">
                  <strong className="font-bold">Glad you're staying, {firstName}!</strong> You have no active resignation.
                </span>
              </div>
            )}

            {history.length > 0 && (
              <section className="space-y-2">
                <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  History ({history.length})
                </h3>
                {history.map((r) => (
                  <HistoryCard key={r.id} record={r} />
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA: withdraw while serving notice, otherwise apply */}
      {!showTeam && (
      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {active ? (
          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
            Withdraw Resignation
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Apply For Resignation
          </button>
        )}
      </div>
      )}

      <WithdrawResignationSheet
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onWithdraw={(reason) => {
          setIsWithdrawOpen(false);
          if (active) onWithdraw(active.id, reason);
        }}
      />
    </div>
  );
};
