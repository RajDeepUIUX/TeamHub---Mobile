import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Mail,
  CalendarDays,
  MapPin,
  Pencil,
  History,
  ChevronRight,
  Users,
  Palmtree,
  Timer,
  CalendarPlus,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { FilterIconButton } from '../common/TeamFilterSheet';
import {
  MY_TEAM_BRANCHES,
  MY_TEAM_MANAGERS,
  STAFF_STATUSES,
  StaffStatus,
  TeamMemberRecord,
  totalLeavesOf,
} from '../../data/myTeamData';

const STATUS_CHIP: Record<StaffStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  'Sabbatical Leave': 'bg-sky-50 text-sky-600',
  Notice: 'bg-amber-50 text-amber-700',
  'Red Flag': 'bg-rose-50 text-rose-600',
  Maternity: 'bg-violet-50 text-violet-600',
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

interface Filters {
  branches: string[];
  statuses: string[];
  managers: string[];
}
const NO_FILTERS: Filters = { branches: [], statuses: [], managers: [] };
const filterCount = (f: Filters) => f.branches.length + f.statuses.length + f.managers.length;

const SheetHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <>
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#1E293B] truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </>
);

/* ------------------------------ Leaves sheet ------------------------------ */

const fmtDays = (n: number) => n.toFixed(2);

const LeavesSheet: React.FC<{ member: TeamMemberRecord | null; onClose: () => void }> = ({ member, onClose }) => (
  <BottomSheet isOpen={Boolean(member)} onClose={onClose} maxHeight="max-h-[80%]">
    {member && (
      <>
        <SheetHeader title="Leaves" subtitle={`${member.staffName} · available / total`} onClose={onClose} />
        <div className="px-5 py-4 space-y-2.5">
          {[
            { label: 'PTO', sub: 'Paid time off', bal: member.leaves.pto, icon: Palmtree, tint: 'bg-blue-50 text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
            { label: 'OT', sub: 'Overtime leave', bal: member.leaves.ot, icon: Timer, tint: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
            {
              label: 'Additional Leave',
              sub: 'Special / extra leave',
              bal: member.leaves.additional,
              icon: CalendarPlus,
              tint: 'bg-violet-50 text-violet-600',
              bar: 'bg-violet-500',
            },
          ].map(({ label, sub, bal, icon: Icon, tint, bar }) => (
            <div key={label} className="rounded-2xl border border-[#EBF0F7] p-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-[#1E293B]">{label}</span>
                  <span className="block text-[10.5px] text-slate-400">{sub}</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="text-lg font-extrabold text-[#1E293B]">{fmtDays(bal.available)}</span>
                  <span className="text-xs font-semibold text-slate-400">/{fmtDays(bal.total)}</span>
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${bal.total ? (bal.available / bal.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 pt-1 text-xs">
            <span className="font-semibold text-slate-500">Total available</span>
            <span className="font-extrabold text-[#1E293B] tabular-nums">{fmtDays(totalLeavesOf(member))} days</span>
          </div>
        </div>
        <div className="p-4 pt-2 pb-6 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
          >
            Close
          </button>
        </div>
      </>
    )}
  </BottomSheet>
);

/* ------------------------------ Filter sheet ------------------------------ */

const FilterSheet: React.FC<{ isOpen: boolean; filters: Filters; onClose: () => void; onApply: (f: Filters) => void }> = ({
  isOpen,
  filters,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);
  const opts = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
  const count = filterCount(draft);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter My Team" subtitle="Pick one or more options in each dropdown" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <MultiSelectDropdown
          label="Branch"
          placeholder="All branches"
          options={opts(MY_TEAM_BRANCHES)}
          selected={draft.branches}
          onChange={(v) => setDraft({ ...draft, branches: v })}
        />
        <MultiSelectDropdown
          label="Reporting Manager"
          placeholder="All reporting managers"
          options={opts(MY_TEAM_MANAGERS)}
          selected={draft.managers}
          onChange={(v) => setDraft({ ...draft, managers: v })}
        />
        <MultiSelectDropdown
          label="Staff Status"
          placeholder="All statuses"
          options={opts(STAFF_STATUSES)}
          selected={draft.statuses}
          onChange={(v) => setDraft({ ...draft, statuses: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(NO_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          {count ? `Apply Filters (${count})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Screen --------------------------------- */

interface MyTeamViewProps {
  members: TeamMemberRecord[];
  onBack: () => void;
  /** Opens the member's full profile in edit mode */
  onEditDetails: (member: TeamMemberRecord) => void;
}

/** Manager-only: everyone in the hierarchy, with per-member actions */
export const MyTeamView: React.FC<MyTeamViewProps> = ({ members, onBack, onEditDetails }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [leavesOf, setLeavesOf] = useState<TeamMemberRecord | null>(null);

  const q = query.trim().toLowerCase();
  const visible = members.filter(
    (m) =>
      (!q || m.staffName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
      (!filters.branches.length || filters.branches.includes(m.branch)) &&
      (!filters.statuses.length || filters.statuses.includes(m.status)) &&
      (!filters.managers.length || filters.managers.includes(m.reportingManager))
  );
  const fCount = filterCount(filters);
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
          <h1 className="text-base font-bold screen-title">My Team</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
        {/* Search + filters */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <FilterIconButton count={fCount} onClick={() => setIsFilterOpen(true)} />
        </div>

        {/* List header */}
        <div className="flex items-center gap-2 px-1">
          <span className="font-bold text-sm text-[#1E293B]">Team Members</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
        </div>
        {visible.map((m) => {
          const avatarIdx = Number(m.staffCode.replace(/\D/g, '')) || 0;
          return (
            <article key={m.staffCode} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Who */}
                <div className="flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                    {initialsOf(m.staffName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1E293B] truncate">
                      {m.staffName}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 truncate">{m.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[m.status]}`}>{m.status}</span>
                </div>

                {/* Details: email on its own line, then branch and joining date side by side */}
                <div className="space-y-1.5 text-[11.5px] text-slate-600">
                  <p className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{m.branch}</span>
                    </p>
                    <p className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Joined {formatDate(m.joiningDate)}</span>
                    </p>
                  </div>
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#EFF4FF] px-2.5 py-2">
                    <span className="block text-[10px] font-semibold text-[#2F68FE]">Available FTE</span>
                    <span className="block mt-1 text-[15px] font-extrabold text-[#1E293B] tabular-nums leading-tight">{m.availableFte}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeavesOf(m)}
                    className="rounded-xl bg-[#ECFDF5] px-2.5 py-2 text-left active:bg-emerald-100 transition-colors cursor-pointer"
                    aria-label={`View ${m.staffName}'s leaves`}
                  >
                    <span className="flex items-center justify-between text-[10px] font-semibold text-[#059669]">
                      Total Leaves
                      <ChevronRight className="w-3.5 h-3.5 -mr-1" />
                    </span>
                    <span className="block mt-1 text-[15px] font-extrabold text-[#1E293B] tabular-nums leading-tight underline decoration-dotted decoration-emerald-400 underline-offset-4">
                      {totalLeavesOf(m)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
                <button
                  type="button"
                  onClick={() => onEditDetails(m)}
                  className="h-11 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Details
                </button>
                {/* No Past Reviews screen yet, so this is a plain label rather than a link */}
                <span className="h-11 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <History className="w-3.5 h-3.5" />
                  Past Reviews
                </span>
              </div>
            </article>
          );
        })}

        {visible.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No team members match</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilters(NO_FILTERS);
              }}
              className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer"
            >
              Clear search & filters
            </button>
          </div>
        )}

      </div>

      <LeavesSheet member={leavesOf} onClose={() => setLeavesOf(null)} />
      <FilterSheet
        isOpen={isFilterOpen}
        filters={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
};
