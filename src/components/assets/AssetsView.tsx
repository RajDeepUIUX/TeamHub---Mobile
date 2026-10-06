import React, { useState } from 'react';
import {
  ArrowLeft,
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Webcam,
  Smartphone,
  Cpu,
  Package,
  Check,
  X,
  Undo2,
  ListChecks,
  BarChart2,
  ChevronRight,
  LayoutGrid,
  Users,
  Inbox,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import type { AssetRecord, AssetStatus } from '../../types/assets';
import { ASSET_GROUPS, formatAssetDate } from '../../data/assetsData';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { BottomSheet } from '../common/BottomSheet';
import {
  FilterIconButton,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
  matchesFilters,
} from '../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

interface AssetsViewProps {
  firstName: string;
  /** The signed-in user's own assets */
  assets: AssetRecord[];
  onBack: () => void;
  onRequestReturn: (ids: string[]) => void;
  /** Present for managers: enables the "Team's Assets" tab */
  team?: { assets: AssetRecord[] };
}

const GROUP_ICON: Record<string, React.ElementType> = {
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Webcams: Webcam,
  'Mobile Phones': Smartphone,
  CPU: Cpu,
};

const STATUS_CHIP: Record<AssetStatus, string> = {
  Assigned: 'bg-[#E8F8F0] text-[#10B981]',
  'Return Requested': 'bg-[#FEF8E7] text-[#D97706]',
  Returned: 'bg-slate-100 text-slate-500',
};

/** Minimal themed illustration: a laptop and phone resting on an empty desk */
const EmptyDeskIllustration: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-52 h-auto" role="img" aria-label="An empty desk with a laptop outline">
    <defs>
      <linearGradient id="as-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="as-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="84" rx="82" ry="64" fill="url(#as-bg)" />
    <ellipse cx="100" cy="144" rx="62" ry="5" fill="#E0E7FF" />
    <rect x="36" y="128" width="128" height="6" rx="3" fill="#C7D2FE" />
    {/* Laptop */}
    <rect x="64" y="80" width="64" height="44" rx="5" fill="url(#as-screen)" />
    <rect x="70" y="86" width="52" height="32" rx="2.5" fill="#FFFFFF" opacity="0.18" />
    <path d="M86 102l6 6 14-14" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M56 124h80l-5 4H61l-5-4Z" fill="#94A3B8" />
    {/* Phone */}
    <rect x="142" y="100" width="16" height="26" rx="3.5" fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="2" />
    <rect x="147" y="103" width="6" height="1.6" rx="0.8" fill="#C4B5FD" />
    {/* Sparkles */}
    <path d="M44 44l1.6 3.8L49.5 49l-3.9 1.4L44 54l-1.6-3.6L38.5 49l3.9-1.2L44 44Z" fill="#A78BFA" opacity="0.8" />
    <circle cx="150" cy="40" r="2.2" fill="#C4B5FD" />
    <circle cx="164" cy="72" r="1.8" fill="#A5B4FC" />
  </svg>
);

/* ---------------------------------- Card ---------------------------------- */

export const AssetCard: React.FC<{
  asset: AssetRecord;
  showStaff?: boolean;
  selectable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onToggleSelect?: () => void;
}> = ({ asset: a, showStaff, selectable, selected, dimmed, onToggleSelect }) => {
  const Icon = GROUP_ICON[a.group] ?? Package;
  const details = [
    { icon: MapPin, label: 'Desk', value: a.deskNo },
    { icon: CalendarDays, label: 'Assigned', value: formatAssetDate(a.assignedOn) },
  ];
  return (
    <article
      onClick={selectable ? onToggleSelect : undefined}
      aria-pressed={selectable ? selected : undefined}
      className={`bg-white border rounded-2xl p-3.5 shadow-2xs space-y-3 transition-all ${
        selected ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-[#EBF0F7]'
      } ${selectable ? 'cursor-pointer' : ''} ${dimmed ? 'opacity-45' : ''}`}
    >
      {showStaff && (
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(
              Number(a.staffCode.replace(/\D/g, '')) || 0
            )}`}
          >
            {initialsOf(a.staffName)}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-[#1E293B] truncate">{a.staffName}</span>
            <span className="block text-[10.5px] text-slate-400">{a.staffCode}</span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {selectable !== undefined && !showStaff && (
          <span
            className={`mt-2.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
              selected ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
            } ${selectable ? '' : 'invisible'}`}
          >
            {selected && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
        )}
        <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[14px] font-extrabold text-[#1E293B] leading-tight">{a.group}</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[a.status]}`}>{a.status}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
            {a.brand ?? 'Brand not listed'} · <span className="font-mono text-[10.5px]">{a.code}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-slate-100 divide-x divide-slate-100">
        {details.map(({ icon: DIcon, label, value }) => (
          <div key={label} className="px-3 py-2 min-w-0">
            <span className="flex items-center gap-1 text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
              <DIcon className="w-3 h-3" />
              {label}
            </span>
            <span className="block mt-0.5 text-xs font-bold text-[#1E293B] truncate">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-[10.5px] text-slate-400">
        {a.department}
        {a.status === 'Return Requested' && a.returnRequestedOn && ` · Return requested ${formatAssetDate(a.returnRequestedOn)}`}
        {a.status === 'Returned' && ` · Returned ${formatAssetDate(a.returnedOn)}`}
      </p>
    </article>
  );
};

/* ----------------------------- Return confirm ----------------------------- */

const ReturnAssetsSheet: React.FC<{
  assets: AssetRecord[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ assets, isOpen, onClose, onConfirm }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <div>
        <h2 className="text-base font-bold text-[#1E293B]">Return {assets.length === 1 ? 'this asset' : `${assets.length} assets`}?</h2>
        <p className="text-[11px] text-slate-400">The IT team will reach out to collect them from your desk.</p>
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
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-2">
      {assets.map((a) => {
        const Icon = GROUP_ICON[a.group] ?? Package;
        return (
          <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[#1E293B]">
                {a.group}
                {a.brand ? ` · ${a.brand}` : ''}
              </span>
              <span className="block text-[10.5px] text-slate-400 font-mono truncate">{a.code}</span>
            </span>
          </div>
        );
      })}
    </div>
    <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
      >
        <Undo2 className="w-4 h-4" />
        Yes, Return
      </button>
    </div>
  </BottomSheet>
);

/* ------------------------------ Summary sheet ------------------------------ */

const AssetSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; assets: AssetRecord[] }> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const count = (fn: (a: AssetRecord) => boolean) => assets.filter(fn).length;
  const members = Array.from(new Set(assets.map((a) => a.staffName))).sort();
  const groups = ASSET_GROUPS.filter((g) => assets.some((a) => a.group === g));

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
          <h2 className="text-lg font-bold text-[#1E293B]">Team Asset Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Assets · Complete Breakdown</p>
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
        <Section icon={<LayoutGrid className="w-4 h-4 text-[#2F68FE]" />} title="Assets Overview">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Total Assets" value={assets.length} color="text-[#1E293B]" />
            <Tile label="Assigned" value={count((a) => a.status === 'Assigned')} color="text-[#10B981]" />
            <Tile label="Return Requested" value={count((a) => a.status === 'Return Requested')} color="text-[#D97706]" />
            <Tile label="Returned" value={count((a) => a.status === 'Returned')} color="text-slate-500" />
          </div>
        </Section>
        <Section icon={<Laptop className="w-4 h-4 text-[#7C3AED]" />} title="By Asset Group (in use)">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {groups.map((g) => (
              <Tile key={g} label={g} value={count((a) => a.group === g && a.status !== 'Returned')} />
            ))}
          </div>
        </Section>
        <Section icon={<Users className="w-4 h-4 text-[#10B981]" />} title="By Team Member">
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const pending = count((a) => a.staffName === name && a.status === 'Return Requested');
              return (
                <div
                  key={name}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#FEF8E7] text-[#D97706] font-bold">{pending} returning</span>
                    )}
                    <span className="font-bold text-slate-700 tabular-nums">
                      {count((a) => a.staffName === name && a.status !== 'Returned')} in use
                    </span>
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

/* ------------------------------- KPI card ------------------------------- */

const AssetKPIs: React.FC<{ assets: AssetRecord[]; onViewSummary?: () => void }> = ({ assets, onViewSummary }) => {
  const count = (s: AssetStatus) => assets.filter((a) => a.status === s).length;
  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Assigned', value: count('Assigned'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
          { label: 'Return Req.', value: count('Return Requested'), pill: 'bg-[#FEF8E7] text-[#D97706]' },
          { label: 'Returned', value: count('Returned'), pill: 'bg-slate-100 text-slate-500' },
        ].map(({ label, value, pill }) => (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
              {value}
            </div>
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

/* ------------------------------- Team's tab ------------------------------- */

const TeamAssetsList: React.FC<{ assets: AssetRecord[] }> = ({ assets }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const visible = assets.filter((a) => matchesFilters(filters, { member: a.staffName, status: a.status, group: a.group }));
  const filterCount = activeFilterCount(filters);

  const filterSections = [
    { id: 'member', label: 'Staff Name', options: Array.from(new Set(assets.map((a) => a.staffName))).sort() },
    { id: 'status', label: 'Status', options: ['Assigned', 'Return Requested', 'Returned'] },
    { id: 'group', label: 'Asset Group', options: ASSET_GROUPS.filter((g) => assets.some((a) => a.group === g)) },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
      <AssetKPIs assets={assets} onViewSummary={() => setIsSummaryOpen(true)} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1E293B]">Team Assets</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
      </div>

      {visible.map((a) => (
        <AssetCard key={a.id} asset={a} showStaff />
      ))}

      {visible.length === 0 && (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">
            {filterCount ? 'No assets match your filters' : 'Your team has no assets assigned yet'}
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
        title="Filter Team's Assets"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <AssetSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} assets={assets} />
    </div>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const AssetsView: React.FC<AssetsViewProps> = ({ firstName, assets, onBack, onRequestReturn, team }) => {
  const [tab, setTab] = useState<'mine' | 'team'>('mine');
  // Mirrors the web "Status Type" filter: Assigned (incl. return requested) vs Returned
  const [statusType, setStatusType] = useState<'current' | 'returned'>('current');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const showTeam = Boolean(team) && tab === 'team';
  const current = assets.filter((a) => a.status !== 'Returned');
  const returned = assets.filter((a) => a.status === 'Returned');
  const visible = statusType === 'current' ? current : returned;
  const returnable = current.filter((a) => a.status === 'Assigned');
  const allSelected = returnable.length > 0 && returnable.every((a) => selectedIds.has(a.id));
  const teamReturning = team ? team.assets.filter((a) => a.status === 'Return Requested').length : 0;

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
          <h1 className="text-base font-bold screen-title">Assets</h1>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Assets view"
              value={tab}
              onChange={(next) => {
                exitSelectMode();
                setTab(next);
              }}
              options={[
                { id: 'mine', label: 'My Assets' },
                { id: 'team', label: "Team's Assets", badge: teamReturning },
              ]}
            />
          </div>
        )}
      </header>

      {showTeam && team ? (
        <TeamAssetsList assets={team.assets} />
      ) : assets.length === 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6">
          <div className="min-h-full flex flex-col items-center justify-center text-center py-10">
            <EmptyDeskIllustration />
            <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#1E1B4B]">A clean slate, {firstName} ✨</h2>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[295px]">
              No devices or equipment are assigned to you right now. When IT hands you a laptop, monitor or anything else,
              it'll show up here.
            </p>
            <p className="mt-3 text-[12px] text-slate-400 leading-relaxed max-w-[280px]">
              Need something to get your work done? Raise a ticket with the IT team.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          <AssetKPIs assets={assets} />

          {/* Status type (web: Assigned / Returned) */}
          {!selectMode && (
            <div className="flex items-center gap-2 px-0.5">
              {(
                [
                  { id: 'current', label: 'Assigned', count: current.length },
                  { id: 'returned', label: 'Returned', count: returned.length },
                ] as const
              ).map(({ id, label, count }) => {
                const isOn = statusType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatusType(id)}
                    aria-pressed={isOn}
                    className={`h-8 px-3 rounded-full border text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isOn ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {label}
                    <span className={`tabular-nums ${isOn ? 'text-[#2F68FE]' : 'text-slate-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectMode && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-[#1E40AF]">
              <span>Tap the assets you want to return</span>
              <button
                type="button"
                onClick={() => setSelectedIds(allSelected ? new Set() : new Set(returnable.map((a) => a.id)))}
                className="font-bold text-[#2F68FE] shrink-0 cursor-pointer"
              >
                {allSelected ? 'Deselect all' : `Select all (${returnable.length})`}
              </button>
            </div>
          )}

          {visible.map((a) => {
            const selectable = selectMode && a.status === 'Assigned';
            return (
              <AssetCard
                key={a.id}
                asset={a}
                selectable={selectMode ? selectable : undefined}
                selected={selectedIds.has(a.id)}
                dimmed={selectMode && !selectable}
                onToggleSelect={() => toggleSelected(a.id)}
              />
            );
          })}

          {visible.length === 0 && (
            <div className="py-12 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">
                {statusType === 'returned' ? 'You haven’t returned any assets yet' : 'Everything’s been handed back'}
              </p>
            </div>
          )}
        </div>
      )}

      {!showTeam && current.length > 0 && statusType === 'current' && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {selectMode ? (
            <div className="grid grid-cols-[1fr_2fr] gap-2.5">
              <button
                type="button"
                onClick={exitSelectMode}
                className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setIsConfirmOpen(true)}
                className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-[#1D4ED8] cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="w-4 h-4" />
                {selectedIds.size ? `Return ${selectedIds.size} ${selectedIds.size === 1 ? 'asset' : 'assets'}` : 'Return'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={returnable.length === 0}
              onClick={() => setSelectMode(true)}
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 active:bg-[#1D4ED8] transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ListChecks className="w-4 h-4 stroke-[2.5]" />
              {returnable.length ? 'Return Assets' : 'All assets are pending return'}
            </button>
          )}
        </div>
      )}

      <ReturnAssetsSheet
        isOpen={isConfirmOpen}
        assets={assets.filter((a) => selectedIds.has(a.id))}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRequestReturn(Array.from(selectedIds));
          exitSelectMode();
        }}
      />
    </div>
  );
};
