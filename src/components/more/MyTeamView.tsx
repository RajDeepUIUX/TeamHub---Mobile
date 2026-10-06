import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
  CalendarDays,
  MapPin,
  Pencil,
  ClipboardCheck,
  History,
  BarChart2,
  ChevronRight,
  Star,
  Users,
  ShieldCheck,
  Palmtree,
  Timer,
  CalendarPlus,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import {
  MY_TEAM_BRANCHES,
  MY_TEAM_MANAGERS,
  STAFF_STATUSES,
  StaffStatus,
  TeamMemberRecord,
  formatCtc,
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

/* ------------------------------ Password sheet ------------------------------ */

const PasswordSheet: React.FC<{ isOpen: boolean; onClose: () => void; onVerified: () => void }> = ({ isOpen, onClose, onVerified }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShow(false);
      setVerifying(false);
    }
  }, [isOpen]);

  const verify = () => {
    if (!password) return setError('Enter your password.');
    // Prototype check: any password of 6+ characters counts as the signed-in user's password
    if (password.length < 6) return setError('Incorrect password. Please try again.');
    setVerifying(true);
    setTimeout(onVerified, 500);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[70%]">
      <SheetHeader title="Enter Your Password to View CTC" subtitle="CTC is confidential and only visible after verification" onClose={onClose} />
      <div className="px-5 py-4 space-y-1.5">
        <label className="block text-xs font-bold text-[#1E293B]">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            autoFocus
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="Enter your password"
            className={`w-full h-12 pl-10 pr-11 bg-white border rounded-xl text-sm font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
              error ? 'border-rose-300' : 'border-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-2 pb-6 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={verify}
          disabled={verifying}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
        >
          {verifying ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* ------------------------------ Previous reviews sheet ------------------------------ */

const PastReviewsSheet: React.FC<{ member: TeamMemberRecord | null; onClose: () => void }> = ({ member, onClose }) => (
  <BottomSheet isOpen={Boolean(member)} onClose={onClose} maxHeight="max-h-[85%]">
    {member && (
      <>
        <SheetHeader title="Previous Reviews" subtitle={`${member.staffName} (${member.staffCode})`} onClose={onClose} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
          {member.pastReviews.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <History className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">No reviews yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
                {member.staffName.split(' ')[0]} joined on {formatDate(member.joiningDate)}, so their first review is still to come.
              </p>
            </div>
          ) : (
            member.pastReviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-[#EBF0F7] p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1E293B]">{r.cycle}</p>
                    <p className="text-[11px] text-slate-400">
                      Submitted {formatDate(r.submittedOn)} · by {r.reviewer}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold shrink-0 tabular-nums">
                    <Star className="w-3 h-3 fill-current" />
                    {r.rating} / 5
                  </span>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{r.summary}</p>
              </article>
            ))
          )}
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

/* ------------------------------ Leaves sheet ------------------------------ */

const fmtDays = (n: number) => n.toFixed(2);

const LeavesSheet: React.FC<{ member: TeamMemberRecord | null; onClose: () => void }> = ({ member, onClose }) => (
  <BottomSheet isOpen={Boolean(member)} onClose={onClose} maxHeight="max-h-[80%]">
    {member && (
      <>
        <SheetHeader title="Leaves" subtitle={`${member.staffName} (${member.staffCode}) · available / total`} onClose={onClose} />
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

/* ------------------------------ Filter + summary sheets ------------------------------ */

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
          label="Staff Status"
          placeholder="All statuses"
          options={opts(STAFF_STATUSES)}
          selected={draft.statuses}
          onChange={(v) => setDraft({ ...draft, statuses: v })}
        />
        <MultiSelectDropdown
          label="Reporting Manager"
          placeholder="All reporting managers"
          options={opts(MY_TEAM_MANAGERS)}
          selected={draft.managers}
          onChange={(v) => setDraft({ ...draft, managers: v })}
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

const SummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; members: TeamMemberRecord[] }> = ({ isOpen, onClose, members }) => {
  const Section: React.FC<{ title: string; rows: [string, React.ReactNode][] }> = ({ title, rows }) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2">
      <p className="font-bold text-[#1E293B]">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 shadow-2xs">
            <span className="text-slate-600 font-medium truncate">{k}</span>
            <span className="text-sm font-bold text-slate-700 tabular-nums shrink-0">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
  const count = (fn: (m: TeamMemberRecord) => boolean) => members.filter(fn).length;
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <SheetHeader title="Team Summary" subtitle="My Team · Complete Breakdown" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4 text-xs">
        <Section
          title="Overview"
          rows={[
            ['Team members', members.length],
            ['Available FTE', members.reduce((n, m) => n + m.availableFte, 0)],
            ['Total leaves', members.reduce((n, m) => n + totalLeavesOf(m), 0)],
          ]}
        />
        <Section title="By Staff Status" rows={STAFF_STATUSES.map((s) => [s, count((m) => m.status === s)] as [string, number])} />
        <Section title="By Branch" rows={MY_TEAM_BRANCHES.map((b) => [b, count((m) => m.branch === b)] as [string, number])} />
        <Section title="By Reporting Manager" rows={MY_TEAM_MANAGERS.map((r) => [r, count((m) => m.reportingManager === r)] as [string, number])} />
      </div>
      <div className="p-4 pt-2 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Close Summary
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
  onSubmitReview: (member: TeamMemberRecord) => void;
}

/** Manager-only: everyone in the hierarchy, with password-protected CTC and per-member actions */
export const MyTeamView: React.FC<MyTeamViewProps> = ({ members, onBack, onEditDetails, onSubmitReview }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  // CTC: unlocked once per visit after the password check; then revealed all at once or one by one
  const [ctcUnlocked, setCtcUnlocked] = useState(false);
  const [pendingReveal, setPendingReveal] = useState<'all' | string | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [reviewsOf, setReviewsOf] = useState<TeamMemberRecord | null>(null);
  const [leavesOf, setLeavesOf] = useState<TeamMemberRecord | null>(null);

  const q = query.trim().toLowerCase();
  const visible = members.filter(
    (m) =>
      (!q || m.staffName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.staffCode.toLowerCase().includes(q)) &&
      (!filters.branches.length || filters.branches.includes(m.branch)) &&
      (!filters.statuses.length || filters.statuses.includes(m.status)) &&
      (!filters.managers.length || filters.managers.includes(m.reportingManager))
  );
  const fCount = filterCount(filters);
  const isShown = (code: string) => revealAll || revealed.has(code);

  const applyReveal = (target: 'all' | string) => {
    if (target === 'all') {
      setRevealAll(true);
    } else {
      setRevealed((prev) => new Set(prev).add(target));
    }
  };
  const requestReveal = (target: 'all' | string) => (ctcUnlocked ? applyReveal(target) : setPendingReveal(target));
  const hideOne = (code: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(code);
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
              placeholder="Search name, email or code..."
              className="w-full h-12 pl-10 pr-9 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
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
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label={fCount ? `Filters (${fCount} applied)` : 'Filters'}
            className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-2xs cursor-pointer ${
              fCount ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]' : 'bg-white border-slate-200/90 text-[#2F68FE] active:bg-slate-50'
            }`}
          >
            <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
            {fCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F8FAFC]">
                {fCount}
              </span>
            )}
          </button>
        </div>

        {/* KPIs */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Team', value: visible.length, pill: 'bg-[#EFF6FF] text-[#2F68FE]' },
              { label: 'Active', value: visible.filter((m) => m.status === 'Active').length, pill: 'bg-[#E8F8F0] text-[#10B981]' },
              { label: 'Available FTE', value: visible.reduce((n, m) => n + m.availableFte, 0), pill: 'bg-[#FEF8E7] text-[#D97706]' },
            ].map(({ label, value, pill }) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`min-w-14 h-9 px-2 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>{value}</div>
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

        {/* List header: reveal / hide all CTC */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1E293B]">Team Members</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (revealAll) {
                setRevealAll(false);
                setRevealed(new Set());
              } else requestReveal('all');
            }}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center gap-1.5 shadow-2xs active:bg-slate-50 cursor-pointer"
          >
            {revealAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revealAll ? 'Hide all CTC' : 'Show all CTC'}
          </button>
        </div>

        {visible.map((m) => {
          const shown = isShown(m.staffCode);
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
                      {m.staffName} <span className="font-medium text-slate-400">({m.staffCode})</span>
                    </h3>
                    <p className="text-[11.5px] text-slate-500 truncate">{m.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[m.status]}`}>{m.status}</span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-[11.5px] text-slate-600">
                  <p className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <UserRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Reports to <span className="font-semibold text-[#1E293B]">{m.reportingManager}</span>
                  </p>
                  <p className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.branch}</span>
                    <span className="text-slate-300">·</span>
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="shrink-0">Joined {formatDate(m.joiningDate)}</span>
                  </p>
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#F5F3FF] px-2.5 py-2">
                    <span className="flex items-center justify-between text-[10px] font-semibold text-violet-600">
                      Current CTC
                      <button
                        type="button"
                        onClick={() => (shown ? (revealAll ? undefined : hideOne(m.staffCode)) : requestReveal(m.staffCode))}
                        disabled={shown && revealAll}
                        className="w-5 h-5 -mr-1 rounded-md flex items-center justify-center text-violet-500 active:bg-violet-100 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                        aria-label={shown ? 'Hide CTC' : 'Show CTC'}
                      >
                        {shown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                    <span className="block mt-0.5 text-[13px] font-extrabold text-[#1E293B] tabular-nums leading-tight truncate">
                      {shown ? formatCtc(m.ctc) : '●●●●●'}
                    </span>
                  </div>
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
              <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
                {[
                  { label: 'Edit Details', icon: Pencil, onClick: () => onEditDetails(m) },
                  { label: 'Submit Review', icon: ClipboardCheck, onClick: () => onSubmitReview(m) },
                  { label: 'Past Reviews', icon: History, onClick: () => setReviewsOf(m) },
                ].map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className="h-11 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
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

        {ctcUnlocked && (
          <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            CTC unlocked for this visit
          </p>
        )}
      </div>

      <PasswordSheet
        isOpen={pendingReveal !== null}
        onClose={() => setPendingReveal(null)}
        onVerified={() => {
          setCtcUnlocked(true);
          if (pendingReveal) applyReveal(pendingReveal);
          setPendingReveal(null);
        }}
      />
      <PastReviewsSheet member={reviewsOf} onClose={() => setReviewsOf(null)} />
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
      <SummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} members={members} />
    </div>
  );
};
