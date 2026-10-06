import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  X,
  BarChart2,
  ChevronRight,
  LayoutGrid,
  GraduationCap,
  Plus,
  CalendarDays,
  UserRound,
  Monitor,
  Pencil,
  Trash2,
  Hourglass,
  Loader,
  CheckCircle2,
  BookOpen,
  StickyNote,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { FilterSelection, TeamFilterBar, TeamFilterSheet } from '../common/TeamFilterSheet';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { TRAINING_SOFTWARE, TRAINING_STATUSES, TrainingPerson, TrainingRequest, TrainingStatus } from '../../data/trainingRequestData';

export type TrainingScope = 'my' | 'team';

const STATUS_META: Record<TrainingStatus, { chip: string; dot: string; icon: React.ElementType }> = {
  Pending: { chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', icon: Hourglass },
  'In-Progress': { chip: 'bg-blue-50 text-[#2F68FE]', dot: 'bg-[#2F68FE]', icon: Loader },
  Completed: { chip: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 },
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const uniq = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
const countBy = (list: TrainingRequest[], key: 'learningStatus' | 'ldStatus', s: TrainingStatus) => list.filter((r) => r[key] === s).length;

const StatusChip: React.FC<{ label: string; status: TrainingStatus }> = ({ label, status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${STATUS_META[status].chip}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot}`} />
    <span className="font-semibold opacity-70">{label}</span>
    {status}
  </span>
);

/* ------------------------------ Illustration ------------------------------ */

const BooksIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-44 h-auto" role="img" aria-label="A stack of books with a graduation cap">
    <defs>
      <linearGradient id="tr-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="tr-cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="78" rx="80" ry="60" fill="url(#tr-bg)" />
    <ellipse cx="100" cy="134" rx="54" ry="5" fill="#E0E7FF" />
    {/* Books */}
    <rect x="58" y="112" width="84" height="16" rx="3" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
    <rect x="58" y="112" width="10" height="16" rx="2" fill="#A5B4FC" />
    <rect x="64" y="96" width="74" height="16" rx="3" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="2" />
    <rect x="128" y="96" width="10" height="16" rx="2" fill="#C4B5FD" />
    <rect x="54" y="80" width="80" height="16" rx="3" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
    <rect x="54" y="80" width="10" height="16" rx="2" fill="#818CF8" />
    {/* Cap */}
    <path d="M100 42l40 14-40 14-40-14 40-14Z" fill="url(#tr-cap)" />
    <path d="M78 62v10c0 5 10 8 22 8s22-3 22-8V62l-22 8-22-8Z" fill="#6D5DF6" />
    <path d="M136 57v14" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="136" cy="73" r="3" fill="#A78BFA" />
    {/* Sparkles */}
    <path d="M40 40l1.8 4.2L46 46l-4.2 1.8L40 52l-1.8-4.2L34 46l4.2-1.8L40 40Z" fill="#A78BFA" opacity="0.75" />
    <circle cx="164" cy="38" r="2.5" fill="#C4B5FD" />
    <circle cx="34" cy="100" r="2" fill="#A5B4FC" />
  </svg>
);

/* ------------------------------ Summary sheet ------------------------------ */

const SummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; list: TrainingRequest[]; scopeLabel: string }> = ({
  isOpen,
  onClose,
  list,
  scopeLabel,
}) => {
  const programmes = uniq(list.map((r) => r.mainProgramme));
  const statusSection = (title: string, key: 'ldStatus' | 'learningStatus', icon: React.ReactNode) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {TRAINING_STATUSES.map((s) => (
          <div key={s} className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[11px] text-slate-500 block mb-0.5">{s}</span>
            <span className={`text-base font-bold tabular-nums ${STATUS_META[s].chip.split(' ')[1]}`}>{countBy(list, key, s)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Training Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">{scopeLabel} · Complete Breakdown</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4 text-xs">
        <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
            <LayoutGrid className="w-4 h-4 text-[#2F68FE]" />
            Overview
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {[
              { label: 'Requests', value: list.length },
              { label: 'People', value: new Set(list.map((r) => r.staffCode)).size },
              { label: 'Programmes', value: programmes.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-[11px] text-slate-500 block mb-0.5">{label}</span>
                <span className="text-base font-bold tabular-nums text-[#1E293B]">{value}</span>
              </div>
            ))}
          </div>
        </div>
        {statusSection('L&D Status', 'ldStatus', <GraduationCap className="w-4 h-4 text-[#7C3AED]" />)}
        {statusSection('Learning Status', 'learningStatus', <BookOpen className="w-4 h-4 text-[#10B981]" />)}
        {programmes.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#1E293B]">
              <GraduationCap className="w-4 h-4 text-[#2F68FE]" />
              By Programme
            </div>
            <div className="space-y-2 pt-1">
              {programmes.map((p) => (
                <div key={p} className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium truncate">{p}</span>
                  <span className="text-sm font-bold text-[#1E293B] tabular-nums shrink-0">{list.filter((r) => r.mainProgramme === p).length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm active:bg-[#1D4ED8] cursor-pointer"
        >
          Close Summary
        </button>
      </div>
    </BottomSheet>
  );
};

/* ------------------------------ Detail sheet ------------------------------ */

const DetailSheet: React.FC<{
  request: TrainingRequest | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
}> = ({ request: r, canManage, onClose, onEdit, onWithdraw }) => {
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setConfirming(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={Boolean(r)} onClose={close} maxHeight="max-h-[90%]">
      {r && (
        <>
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E293B] leading-snug">{r.mainProgramme}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {r.staffName} ({r.staffCode}) · Requested {formatDate(r.requestedOn)}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['L&D Status', r.ldStatus],
                  ['Learning Status', r.learningStatus],
                ] as const
              ).map(([label, s]) => {
                const Icon = STATUS_META[s].icon;
                return (
                  <div key={label} className={`p-3 rounded-2xl ${STATUS_META[s].chip}`}>
                    <span className="block text-[10.5px] font-semibold opacity-75">{label}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[13px] font-bold">
                      <Icon className="w-4 h-4" />
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400">Sub Programmes</p>
              <div className="flex flex-wrap gap-1.5">
                {r.subProgrammes.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {[
                { label: 'Software', value: r.software.length ? r.software.join(', ') : 'Not specified' },
                { label: 'Reporting Manager', value: r.reportingManager },
                { label: 'Date of Request', value: formatDate(r.requestedOn) },
                { label: 'Raised By', value: r.raisedBy === r.staffName ? 'Self' : r.raisedBy },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">{label}</p>
                  <p className="mt-0.5 font-semibold text-[#1E293B]">{value}</p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <StickyNote className="w-3.5 h-3.5" />
                Remarks
              </p>
              <p className="mt-1 text-[12px] text-slate-700 leading-relaxed">{r.remarks}</p>
            </div>

            {!canManage && r.ldStatus !== 'Pending' && (
              <p className="text-[11px] text-slate-400 text-center">The L&D team has picked this up, so it can't be edited anymore.</p>
            )}
          </div>

          {canManage && (
            <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              {confirming ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-slate-600">Withdraw this training request? This can't be undone.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
                    >
                      Keep It
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                        onWithdraw();
                      }}
                      className="h-12 rounded-xl bg-rose-500 text-white text-xs font-bold active:bg-rose-600 cursor-pointer"
                    >
                      Yes, Withdraw
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="h-12 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold bg-white active:bg-rose-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Request
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
};

/* --------------------------------- Screen --------------------------------- */

interface TrainingRequestViewProps {
  firstName: string;
  me: TrainingPerson;
  requests: TrainingRequest[];
  /** Manager login: staff codes in their hierarchy (shows the Team tab). Staff: omitted */
  /** Managers get a Team's tab with every staff member's requests (branch is a filter there) */
  isManager: boolean;
  scope: TrainingScope;
  onScopeChange: (scope: TrainingScope) => void;
  onBack: () => void;
  onAdd: (scope: TrainingScope) => void;
  onEdit: (request: TrainingRequest) => void;
  onWithdraw: (request: TrainingRequest) => void;
}

/** L&D › Training Request: staff see only their own; managers switch between their own and all staff */
export const TrainingRequestView: React.FC<TrainingRequestViewProps> = ({
  firstName,
  me,
  requests,
  isManager,
  scope,
  onScopeChange,
  onBack,
  onAdd,
  onEdit,
  onWithdraw,
}) => {
  const [filters, setFilters] = useState<Record<TrainingScope, FilterSelection>>({ my: {}, team: {} });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const scoped = useMemo(
    () =>
      requests.filter((r) =>
        scope === 'my' ? r.staffCode === me.staffCode : r.staffCode !== me.staffCode
      ),
    [requests, scope, me.staffCode]
  );
  const selection = filters[scope];
  const has = (id: string, value: string) => !selection[id]?.length || selection[id].includes(value);
  const visible = scoped.filter(
    (r) =>
      has('branch', r.branch) &&
      has('manager', r.reportingManager) &&
      has('staff', r.staffName) &&
      (!selection.software?.length || r.software.some((s) => selection.software.includes(s))) &&
      has('learning', r.learningStatus) &&
      has('ld', r.ldStatus)
  );
  const scopeLabel = scope === 'my' ? 'My Training Requests' : "Team's Training Requests";

  const sections = [
    ...(scope === 'my'
      ? []
      : [
          { id: 'branch', label: 'Branch', options: uniq(scoped.map((r) => r.branch)) },
          { id: 'manager', label: 'Reporting Manager', options: uniq(scoped.map((r) => r.reportingManager)) },
          { id: 'staff', label: 'Staff Name', options: uniq(scoped.map((r) => r.staffName)) },
        ]),
    { id: 'software', label: 'Software', options: TRAINING_SOFTWARE.filter((s) => scoped.some((r) => r.software.includes(s))) },
    { id: 'learning', label: 'Learning Status', options: [...TRAINING_STATUSES] },
    { id: 'ld', label: 'L&D Status', options: [...TRAINING_STATUSES] },
  ];

  // Own requests, or ones this user raised for someone, while L&D hasn't picked them up
  const canManage = (r: TrainingRequest) => r.ldStatus === 'Pending' && (r.staffCode === me.staffCode || r.raisedBy === me.staffName);
  const open = requests.find((r) => r.id === openId) ?? null;

  const headline = [
    { label: 'Requests', value: visible.length, pill: 'bg-[#EFF6FF] text-[#2F68FE]' },
    { label: 'L&D Pending', value: countBy(visible, 'ldStatus', 'Pending'), pill: 'bg-[#FEF8E7] text-[#D97706]' },
    { label: 'Completed', value: countBy(visible, 'learningStatus', 'Completed'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
  ];


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
          <h1 className="text-base font-bold screen-title">Training Request</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-6 space-y-3.5">
        {isManager && (
          <SegmentedTabs
            ariaLabel="Training request view"
            value={scope}
            onChange={onScopeChange}
            options={[
              { id: 'my', label: 'My Requests' },
              { id: 'team', label: "Team's" },
            ]}
          />
        )}

        {scoped.length === 0 ? (
          <div className="pt-6 flex flex-col items-center text-center px-4">
            <BooksIllustration />
            {scope === 'my' ? (
              <>
                <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#1E1B4B]">Ready to level up, {firstName}? 📚</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Ask the L&D team for training on any programme or software. They'll schedule it and keep you posted here.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#1E1B4B]">All quiet on the learning front</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  No one in your team has asked for training yet. You can raise one on their behalf.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <TeamFilterBar
              selection={selection}
              placeholder={scope === 'my' ? 'All software & statuses' : 'All branches, managers, staff & statuses'}
              onClick={() => setIsFilterOpen(true)}
            />

            {/* KPIs */}
            <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="grid grid-cols-3 gap-2 text-center">
                {headline.map(({ label, value, pill }) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className={`min-w-14 h-9 px-2 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
                      {value}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">{label}</span>
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

            <div className="flex items-center gap-2 px-1">
              <h2 className="text-sm font-bold">Requests</h2>
              <span className="px-1.5 py-px rounded-md bg-blue-50 text-[10.5px] font-bold text-[#2F68FE] tabular-nums">{visible.length}</span>
            </div>

            {visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs py-8 px-6 flex flex-col items-center text-center">
                <p className="text-sm font-bold text-[#1E293B]">Nothing matches those filters</p>
                <p className="mt-1 text-[11.5px] text-slate-400">Try a different software or status.</p>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, [scope]: {} }))}
                  className="mt-4 h-9 px-4 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visible.map((r) => {
                  const avatarIdx = r.staffName.length + r.staffCode.charCodeAt(r.staffCode.length - 1);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOpenId(r.id)}
                      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-2xs p-3.5 active:bg-slate-50 cursor-pointer"
                    >
                      {scope !== 'my' && (
                        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                            {initialsOf(r.staffName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-bold truncate">
                              {r.staffName} <span className="font-medium text-slate-400">({r.staffCode})</span>
                            </p>
                            <p className="flex items-center gap-1 text-[10.5px] text-slate-400 truncate">
                              <UserRound className="w-3 h-3 shrink-0" />
                              {r.reportingManager}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold leading-snug">{r.mainProgramme}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                        {r.subProgrammes.length} sub programme{r.subProgrammes.length === 1 ? '' : 's'} · {r.subProgrammes.join(', ')}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <StatusChip label="L&D" status={r.ldStatus} />
                        <StatusChip label="Learning" status={r.learningStatus} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-3 text-[10.5px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(r.requestedOn)}
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                          <Monitor className="w-3 h-3 shrink-0" />
                          <span className="truncate">{r.software.length ? r.software.join(', ') : 'No software'}</span>
                        </span>
                        {r.raisedBy !== r.staffName && (
                          <span className="ml-auto shrink-0 px-1.5 py-px rounded-md bg-violet-50 text-violet-600 font-semibold">
                            {r.raisedBy === me.staffName ? 'Raised by you' : `By ${r.raisedBy.split(' ')[0]}`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => onAdd(scope)}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {scope === 'team' ? 'Request Training for Team' : 'Add New Request'}
        </button>
      </div>

      <TeamFilterSheet
        isOpen={isFilterOpen}
        title={`Filter ${scopeLabel}`}
        sections={sections}
        selection={selection}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters((f) => ({ ...f, [scope]: next }));
          setIsFilterOpen(false);
        }}
      />
      <SummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} list={visible} scopeLabel={scopeLabel} />
      <DetailSheet
        request={open}
        canManage={Boolean(open && canManage(open))}
        onClose={() => setOpenId(null)}
        onEdit={() => {
          if (open) onEdit(open);
          setOpenId(null);
        }}
        onWithdraw={() => {
          if (open) onWithdraw(open);
          setOpenId(null);
        }}
      />
    </div>
  );
};
