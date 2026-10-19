import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  X,
  BarChart2,
  ChevronRight,
  LayoutGrid,
  GraduationCap,
  Plus,
  CalendarDays,
  UserRound,
  Pencil,
  Trash2,
  Lightbulb,
  Send,
  CheckCircle2,
  StickyNote,
  Flag,
  ClipboardCheck,
  UserCheck,
  CalendarClock,
  Info,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { FilterSelection, TeamFilterBar, TeamFilterSheet } from '../common/TeamFilterSheet';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import {
  NEED_PRIORITIES,
  NEED_SOURCES,
  NEED_STATUSES,
  NeedPriority,
  NeedSource,
  NeedStatus,
  TrainingNeed,
  levelLabel,
} from '../../data/trainingNeedData';
import { TrainingPerson } from '../../data/trainingRequestData';

export type NeedScope = 'my' | 'team';

export const PRIORITY_META: Record<NeedPriority, { chip: string; dot: string; solid: string; soft: string; text: string }> = {
  High: { chip: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500', solid: 'bg-rose-500', soft: 'bg-rose-200/80', text: 'text-rose-600' },
  Medium: { chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', solid: 'bg-amber-500', soft: 'bg-amber-200/80', text: 'text-amber-700' },
  Low: { chip: 'bg-sky-50 text-sky-600', dot: 'bg-sky-500', solid: 'bg-sky-500', soft: 'bg-sky-200/80', text: 'text-sky-600' },
};

const STATUS_META: Record<NeedStatus, { chip: string; icon: React.ElementType; text: string }> = {
  Identified: { chip: 'bg-violet-50 text-violet-600', icon: Lightbulb, text: 'text-violet-600' },
  'Training Requested': { chip: 'bg-blue-50 text-[#2F68FE]', icon: Send, text: 'text-[#2F68FE]' },
  Addressed: { chip: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2, text: 'text-emerald-600' },
};

const SOURCE_META: Record<NeedSource, { icon: React.ElementType; short: string }> = {
  'Skill Assessment': { icon: ClipboardCheck, short: 'Assessment' },
  'Manager Review': { icon: UserCheck, short: 'Manager' },
  Self: { icon: UserRound, short: 'Self' },
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const uniq = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
const gapOf = (n: TrainingNeed) => n.requiredLevel - n.currentLevel;
const open = (n: TrainingNeed) => n.status !== 'Addressed';

/* --------------------------------- Pieces --------------------------------- */

/** Five-step proficiency bar: solid = where they are, tinted = the gap to close, grey = beyond the target */
export const LevelMeter: React.FC<{ current: number; required: number; priority: NeedPriority; large?: boolean }> = ({
  current,
  required,
  priority,
  large,
}) => {
  const meta = PRIORITY_META[priority];
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`Currently ${levelLabel(current) || 'not set'}, required ${levelLabel(required) || 'not set'}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`flex-1 rounded-full ${large ? 'h-2.5' : 'h-1.5'} ${i <= current ? meta.solid : i <= required ? meta.soft : 'bg-slate-200/80'}`}
        />
      ))}
    </div>
  );
};

const PriorityChip: React.FC<{ priority: NeedPriority }> = ({ priority }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${PRIORITY_META[priority].chip}`}>
    <Flag className="w-3 h-3" />
    {priority}
  </span>
);

const StatusChip: React.FC<{ status: NeedStatus }> = ({ status }) => {
  const Icon = STATUS_META[status].icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${STATUS_META[status].chip}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

/* ------------------------------ Illustration ------------------------------ */

const TargetIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-44 h-auto" role="img" aria-label="A target with an arrow and skill bars">
    <defs>
      <linearGradient id="tn-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="tn-arrow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="78" rx="80" ry="60" fill="url(#tn-bg)" />
    <ellipse cx="100" cy="136" rx="52" ry="5" fill="#E0E7FF" />
    {/* Target */}
    <circle cx="86" cy="76" r="40" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
    <circle cx="86" cy="76" r="28" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2" />
    <circle cx="86" cy="76" r="16" fill="#FFFFFF" stroke="#818CF8" strokeWidth="2" />
    <circle cx="86" cy="76" r="6" fill="#6D5DF6" />
    {/* Arrow */}
    <path d="M86 76 L142 34" stroke="url(#tn-arrow)" strokeWidth="4" strokeLinecap="round" />
    <path d="M142 34 l-2 -13 M142 34 l13 -2" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
    <path d="M132 41 l-3 -10 M132 41 l10 -3" stroke="#C4B5FD" strokeWidth="3" strokeLinecap="round" />
    {/* Skill bars */}
    <rect x="132" y="92" width="38" height="6" rx="3" fill="#E0E7FF" />
    <rect x="132" y="92" width="26" height="6" rx="3" fill="#818CF8" />
    <rect x="132" y="104" width="38" height="6" rx="3" fill="#E0E7FF" />
    <rect x="132" y="104" width="16" height="6" rx="3" fill="#A78BFA" />
    <rect x="132" y="116" width="38" height="6" rx="3" fill="#E0E7FF" />
    <rect x="132" y="116" width="32" height="6" rx="3" fill="#6D5DF6" />
    {/* Sparkles */}
    <path d="M40 40l1.8 4.2L46 46l-4.2 1.8L40 52l-1.8-4.2L34 46l4.2-1.8L40 40Z" fill="#A78BFA" opacity="0.75" />
    <circle cx="164" cy="62" r="2.5" fill="#C4B5FD" />
    <circle cx="32" cy="104" r="2" fill="#A5B4FC" />
  </svg>
);

/* ------------------------------ Summary sheet ------------------------------ */

const SummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; list: TrainingNeed[]; scopeLabel: string }> = ({
  isOpen,
  onClose,
  list,
  scopeLabel,
}) => {
  const programmes = uniq(list.map((n) => n.mainProgramme));

  const section = (title: string, icon: React.ReactNode, tiles: { label: string; value: number; tone: string }[]) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {tiles.map(({ label, value, tone }) => (
          <div key={label} className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs min-w-0">
            <span className="text-[11px] text-slate-500 block mb-0.5 truncate">{label}</span>
            <span className={`text-base font-bold tabular-nums ${tone}`}>{value}</span>
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
          <h2 className="text-lg font-bold text-[#1E293B]">Training Need Summary</h2>
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
        {section('Overview', <LayoutGrid className="w-4 h-4 text-[#2F68FE]" />, [
          { label: 'Needs', value: list.length, tone: 'text-[#1E293B]' },
          { label: 'People', value: new Set(list.map((n) => n.staffCode)).size, tone: 'text-[#1E293B]' },
          { label: 'Programmes', value: programmes.length, tone: 'text-[#1E293B]' },
        ])}
        {section(
          'By Status',
          <Lightbulb className="w-4 h-4 text-[#7C3AED]" />,
          NEED_STATUSES.map((s) => ({ label: s === 'Training Requested' ? 'Requested' : s, value: list.filter((n) => n.status === s).length, tone: STATUS_META[s].text }))
        )}
        {section(
          'By Priority',
          <Flag className="w-4 h-4 text-rose-500" />,
          NEED_PRIORITIES.map((p) => ({ label: p, value: list.filter((n) => open(n) && n.priority === p).length, tone: PRIORITY_META[p].text }))
        )}
        {section(
          'By Source',
          <ClipboardCheck className="w-4 h-4 text-[#10B981]" />,
          NEED_SOURCES.map((s) => ({ label: SOURCE_META[s].short, value: list.filter((n) => n.source === s).length, tone: 'text-[#1E293B]' }))
        )}
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
                  <span className="text-sm font-bold text-[#1E293B] tabular-nums shrink-0">{list.filter((n) => n.mainProgramme === p).length}</span>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-slate-400">Priority counts exclude needs that are already addressed.</p>
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

type Confirming = null | 'remove' | 'request';

const DetailSheet: React.FC<{
  need: TrainingNeed | null;
  canRequest: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onRequest: () => void;
}> = ({ need: n, canRequest, canEdit, onClose, onEdit, onRemove, onRequest }) => {
  const [confirming, setConfirming] = useState<Confirming>(null);
  const close = () => {
    setConfirming(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={Boolean(n)} onClose={close} maxHeight="max-h-[90%]">
      {n && (
        <>
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E293B] leading-snug">{n.skill}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {n.mainProgramme} · {n.staffName} ({n.staffCode})
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
                  ['Status', n.status, STATUS_META[n.status].chip, STATUS_META[n.status].icon],
                  ['Priority', n.priority, PRIORITY_META[n.priority].chip, Flag],
                ] as const
              ).map(([label, value, tone, Icon]) => (
                <div key={label} className={`p-3 rounded-2xl ${tone}`}>
                  <span className="block text-[10.5px] font-semibold opacity-75">{label}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[13px] font-bold">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{value}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EBF0F7] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold text-slate-400">Current level</p>
                  <p className="text-[13px] font-bold text-[#1E293B]">{levelLabel(n.currentLevel)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="min-w-0 text-right">
                  <p className="text-[10.5px] font-semibold text-slate-400">Required level</p>
                  <p className="text-[13px] font-bold text-[#1E293B]">{levelLabel(n.requiredLevel)}</p>
                </div>
              </div>
              <LevelMeter current={n.currentLevel} required={n.requiredLevel} priority={n.priority} large />
              <p className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Level {n.currentLevel} of 5 · target {n.requiredLevel}
                </span>
                <span className={`font-bold ${PRIORITY_META[n.priority].text}`}>
                  {gapOf(n)} level{gapOf(n) === 1 ? '' : 's'} to close
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {[
                { label: 'Source', value: n.source },
                { label: 'Identified By', value: n.identifiedBy === n.staffName ? 'Self' : n.identifiedBy },
                { label: 'Identified On', value: formatDate(n.identifiedOn) },
                { label: 'Target Date', value: formatDate(n.targetDate) },
                { label: 'Reporting Manager', value: n.reportingManager },
                { label: 'Branch', value: n.branch },
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
              <p className="mt-1 text-[12px] text-slate-700 leading-relaxed">{n.remarks}</p>
            </div>

            {n.status === 'Training Requested' && (
              <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                Training has been requested for this skill. Track its progress under Training Request.
              </p>
            )}
            {n.status === 'Identified' && !canEdit && n.source === 'Skill Assessment' && (
              <p className="text-[11px] text-slate-400 text-center">Needs from a skill assessment can't be edited.</p>
            )}
          </div>

          {(canRequest || canEdit) && (
            <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              {confirming === 'remove' ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-slate-600">Remove this training need? This can't be undone.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
                    >
                      Keep It
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(null);
                        onRemove();
                      }}
                      className="h-12 rounded-xl bg-rose-500 text-white text-xs font-bold active:bg-rose-600 cursor-pointer"
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              ) : confirming === 'request' ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-slate-600">
                    Send a training request for <span className="font-bold text-[#1E293B]">{n.skill}</span> to the L&D team?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
                    >
                      Not Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(null);
                        onRequest();
                      }}
                      className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {canRequest && (
                    <button
                      type="button"
                      onClick={() => setConfirming('request')}
                      className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Request Training
                    </button>
                  )}
                  {canEdit && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirming('remove')}
                        className="h-12 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold bg-white active:bg-rose-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={onEdit}
                        className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Need
                      </button>
                    </div>
                  )}
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

interface TrainingNeedViewProps {
  firstName: string;
  me: TrainingPerson;
  needs: TrainingNeed[];
  /** Managers get a Team's tab with every staff member's needs (branch is a filter there) */
  isManager: boolean;
  scope: NeedScope;
  onScopeChange: (scope: NeedScope) => void;
  onBack: () => void;
  onAdd: (scope: NeedScope) => void;
  onEdit: (need: TrainingNeed) => void;
  onRemove: (need: TrainingNeed) => void;
  onRequestTraining: (need: TrainingNeed) => void;
}

/** L&D › Training Need Identification: staff see only their own gaps; managers switch between their own and the team's */
export const TrainingNeedView: React.FC<TrainingNeedViewProps> = ({
  firstName,
  me,
  needs,
  isManager,
  scope,
  onScopeChange,
  onBack,
  onAdd,
  onEdit,
  onRemove,
  onRequestTraining,
}) => {
  const [filters, setFilters] = useState<Record<NeedScope, FilterSelection>>({ my: {}, team: {} });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const scoped = useMemo(
    () => needs.filter((n) => (scope === 'my' ? n.staffCode === me.staffCode : n.staffCode !== me.staffCode)),
    [needs, scope, me.staffCode]
  );
  const selection = filters[scope];
  const has = (id: string, value: string) => !selection[id]?.length || selection[id].includes(value);
  const visible = scoped.filter(
    (n) =>
      has('branch', n.branch) &&
      has('manager', n.reportingManager) &&
      has('staff', n.staffName) &&
      has('programme', n.mainProgramme) &&
      has('priority', n.priority) &&
      has('status', n.status) &&
      has('source', n.source)
  );
  const scopeLabel = scope === 'my' ? 'My Training Needs' : "Team's Training Needs";

  const sections = [
    ...(scope === 'my'
      ? []
      : [
          { id: 'branch', label: 'Branch', options: uniq(scoped.map((n) => n.branch)) },
          { id: 'manager', label: 'Reporting Manager', options: uniq(scoped.map((n) => n.reportingManager)) },
          { id: 'staff', label: 'Staff Name', options: uniq(scoped.map((n) => n.staffName)) },
        ]),
    { id: 'programme', label: 'Programme', options: uniq(scoped.map((n) => n.mainProgramme)) },
    { id: 'priority', label: 'Priority', options: [...NEED_PRIORITIES] },
    { id: 'status', label: 'Status', options: [...NEED_STATUSES] },
    { id: 'source', label: 'Source', options: [...NEED_SOURCES] },
  ];

  // Staff request training for their own needs; a manager can do it for anyone in the team
  const canRequest = (n: TrainingNeed) => n.status === 'Identified' && (n.staffCode === me.staffCode || isManager);
  // Only the person who recorded a need can change it, and only while nothing has been done about it
  const canEdit = (n: TrainingNeed) => n.status === 'Identified' && n.source !== 'Skill Assessment' && n.identifiedBy === me.staffName;
  const current = needs.find((n) => n.id === openId) ?? null;

  const headline = [
    { label: 'Needs', value: visible.length, pill: 'bg-[#EFF6FF] text-[#2F68FE]' },
    { label: 'High Priority', value: visible.filter((n) => open(n) && n.priority === 'High').length, pill: 'bg-[#FEF2F2] text-[#EF4444]' },
    { label: 'Addressed', value: visible.filter((n) => n.status === 'Addressed').length, pill: 'bg-[#E8F8F0] text-[#10B981]' },
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
          <h1 className="text-base font-bold screen-title">Training Need Identification</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-6 space-y-3.5">
        {isManager && (
          <SegmentedTabs
            ariaLabel="Training need view"
            value={scope}
            onChange={onScopeChange}
            options={[
              { id: 'my', label: 'My Needs' },
              { id: 'team', label: "Team's" },
            ]}
          />
        )}

        {scoped.length === 0 ? (
          <div className="pt-6 flex flex-col items-center text-center px-4">
            <TargetIllustration />
            {scope === 'my' ? (
              <>
                <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#1E1B4B]">No skill gaps yet, {firstName} 🎯</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Spotted something you want to get better at? Note it here and request training in a tap. Assessments and your manager may add some too.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#1E1B4B]">Your team's skills look sharp</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  No training needs have been identified for your team yet. Record one after a review or an assessment.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <TeamFilterBar
              selection={selection}
              placeholder={scope === 'my' ? 'All programmes, priorities & statuses' : 'All branches, managers, staff & priorities'}
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
              <h2 className="text-sm font-bold">Training Needs</h2>
              <span className="px-1.5 py-px rounded-md bg-blue-50 text-[10.5px] font-bold text-[#2F68FE] tabular-nums">{visible.length}</span>
            </div>

            {visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs py-8 px-6 flex flex-col items-center text-center">
                <p className="text-sm font-bold text-[#1E293B]">Nothing matches those filters</p>
                <p className="mt-1 text-[11.5px] text-slate-400">Try a different programme, priority or status.</p>
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
                {visible.map((n) => {
                  const avatarIdx = n.staffName.length + n.staffCode.charCodeAt(n.staffCode.length - 1);
                  const SourceIcon = SOURCE_META[n.source].icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setOpenId(n.id)}
                      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-2xs p-3.5 active:bg-slate-50 cursor-pointer"
                    >
                      {scope !== 'my' && (
                        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                            {initialsOf(n.staffName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-bold truncate">
                              {n.staffName} <span className="font-medium text-slate-400">({n.staffCode})</span>
                            </p>
                            <p className="flex items-center gap-1 text-[10.5px] text-slate-400 truncate">
                              <UserRound className="w-3 h-3 shrink-0" />
                              {n.reportingManager}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold leading-snug">{n.skill}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
                        <GraduationCap className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{n.mainProgramme}</span>
                      </p>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <LevelMeter current={n.currentLevel} required={n.requiredLevel} priority={n.priority} />
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1 min-w-0 text-slate-500">
                            <span className="font-semibold text-[#1E293B] truncate">{levelLabel(n.currentLevel)}</span>
                            <ArrowRight className="w-3 h-3 shrink-0 text-slate-300" />
                            <span className="font-semibold text-[#1E293B] truncate">{levelLabel(n.requiredLevel)}</span>
                          </span>
                          <span className={`shrink-0 font-bold ${PRIORITY_META[n.priority].text}`}>+{gapOf(n)} level{gapOf(n) === 1 ? '' : 's'}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <PriorityChip priority={n.priority} />
                        <StatusChip status={n.status} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-3 text-[10.5px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          Target {formatDate(n.targetDate)}
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                          <SourceIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{SOURCE_META[n.source].short}</span>
                        </span>
                        {n.source === 'Manager Review' && n.identifiedBy === me.staffName && n.staffCode !== me.staffCode && (
                          <span className="ml-auto shrink-0 px-1.5 py-px rounded-md bg-violet-50 text-violet-600 font-semibold">Added by you</span>
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
          {scope === 'team' ? 'Identify Need for Team' : 'Identify a Training Need'}
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
        need={current}
        canRequest={Boolean(current && canRequest(current))}
        canEdit={Boolean(current && canEdit(current))}
        onClose={() => setOpenId(null)}
        onEdit={() => {
          if (current) onEdit(current);
          setOpenId(null);
        }}
        onRemove={() => {
          if (current) onRemove(current);
          setOpenId(null);
        }}
        onRequest={() => {
          if (current) onRequestTraining(current);
          setOpenId(null);
        }}
      />
    </div>
  );
};
