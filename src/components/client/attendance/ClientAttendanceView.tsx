import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Home,
  Building2,
  SearchX,
  X,
} from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { RangeCalendar, formatShortDate, toDateKey } from '../../../design-system/components/RangeCalendar';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, DateField, EmptyCard, SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { STATUS_LABEL, STATUS_PILL } from '../staff/tabs/StaffAttendancePanel';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { ATTENDANCE_STATUSES, AttendanceDay, StaffWorkMode, attendanceFor, holidayName, workInfoFor } from '../data/clientStaffProfileData';
import {
  AmendRequest,
  AmendStatus,
  SET_OFF_REASON,
  amendTimes,
  isoOf,
  pendingAmendCount,
  withApprovedAmends,
} from '../data/clientAttendanceData';

interface Props {
  requests: AmendRequest[];
  staff: ClientStaffMember[];
  /** Approve / reject one or more requests (desktop `acceptAttendance` takes several attendance ids) */
  onDecide: (ids: string[], status: 'Approved' | 'Rejected', comment: string, setOffDate: string | null) => void;
  /** Current mode from Work Flexibility (falls back to the staff work info) */
  workModeOf?: (staffId: string) => StaffWorkMode | undefined;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
  /** Tab to open first (amend-request notification → Attendance Amend) */
  initialTab?: Tab;
}

type Tab = 'attendance' | 'amend';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  { id: 'amend', label: 'Attendance Amend', icon: CalendarClock },
];

const LOAD_MS = 450;
const PAGE = 10;

/** V2 amend card status band */
const AMEND_TONE: Record<AmendStatus, { band: string; dot: string; text: string }> = {
  Pending: {
    band: 'bg-[#FEF8E7]',
    dot: 'bg-[#D97706]',
    text: 'text-[#D97706]',
  },
  Approved: {
    band: 'bg-[#E8F8F0]',
    dot: 'bg-[#10B981]',
    text: 'text-[#10B981]',
  },
  Rejected: { band: 'bg-[#FEF2F2]', dot: 'bg-[#EF4444]', text: 'text-[#EF4444]' },
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

const WORK_MODE_LABEL = {
  Office: 'Work From Office',
  WFH: 'Work From Home',
} as const;
const WORK_MODE_OPTIONS = Object.values(WORK_MODE_LABEL);
const STATUS_OPTIONS = ATTENDANCE_STATUSES.map((s) => STATUS_LABEL[s]);

/* --------------------------------- Filters -------------------------------- */

interface Filters {
  /** ISO date range */
  from: string;
  to: string;
  /** Staff ids */
  staff: string[];
  workMode: string[];
  /** Attendance tab only */
  status: string[];
}

/** Desktop default: 1st of the current month → today (an earlier `from` keeps older pending amend requests in range) */
const defaultFilters = (from?: string): Filters => {
  const today = new Date();
  const monthStart = isoOf(new Date(today.getFullYear(), today.getMonth(), 1));
  return {
    from: from && from < monthStart ? from : monthStart,
    to: isoOf(today),
    staff: [],
    workMode: [],
    status: [],
  };
};

const filterCount = (f: Filters, d: Filters = defaultFilters()) =>
  (f.from !== d.from || f.to !== d.to ? 1 : 0) + f.staff.length + f.workMode.length + f.status.length;

const parse = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`) : null);

const AttendanceFilterSheet: React.FC<{
  isOpen: boolean;
  filters: Filters;
  /** Clear All target for the open tab */
  defaults: Filters;
  staff: ClientStaffMember[];
  showStatus: boolean;
  onClose: () => void;
  onApply: (f: Filters) => void;
}> = ({ isOpen, filters, defaults, staff, showStatus, onClose, onApply }) => {
  const [draft, setDraft] = useState(filters);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(filters);
    setActiveDateField(null);
  }, [isOpen, filters]);

  const from = parse(draft.from);
  const to = parse(draft.to || null);
  const rangeIncomplete = !draft.to;
  const count = filterCount(draft, defaults);

  const selectDay = (day: Date) => {
    const key = toDateKey(day);
    if (activeDateField === 'start') {
      setDraft((d) => ({
        ...d,
        from: key,
        to: d.to && key > d.to ? '' : d.to,
      }));
      setActiveDateField('end');
    } else if (activeDateField === 'end') {
      if (key < draft.from) setDraft((d) => ({ ...d, from: key, to: '' }));
      else {
        setDraft((d) => ({ ...d, to: key }));
        setActiveDateField(null);
      }
    }
  };

  const dateField = (field: 'start' | 'end', label: string, value: Date | null) => {
    const isActive = activeDateField === field;
    return (
      <div>
        <span className="block mb-1.5 text-xs font-bold text-[#1E293B]">{label}</span>
        <button
          type="button"
          onClick={() => setActiveDateField(isActive ? null : field)}
          className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
            isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>{value ? formatShortDate(value) : 'Select date'}</span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'}`} />
        </button>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filters" subtitle="Pick one or more options, then tap Search" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1E293B]">Date</span>
          <div className="grid grid-cols-2 gap-3">
            {dateField('start', 'Start Date', from)}
            {dateField('end', 'End Date', to)}
          </div>
          {activeDateField && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">{activeDateField === 'start' ? 'Select a start date' : 'Select an end date'}</p>
              <RangeCalendar
                key={activeDateField}
                start={from}
                end={to}
                activeField={activeDateField}
                onSelect={selectDay}
                initialMonth={from ?? undefined}
                maxDate={new Date()}
              />
            </div>
          )}
          {rangeIncomplete && !activeDateField && <p className="px-0.5 text-[11px] font-medium text-rose-500">Select an end date to complete the range.</p>}
        </div>

        <MultiSelectDropdown
          label="Staff"
          placeholder="Staff"
          options={staff.map((s) => ({ value: s.id, label: s.name }))}
          selected={draft.staff}
          onChange={(next) => setDraft((d) => ({ ...d, staff: next }))}
          searchable={staff.length > 6}
        />
        <MultiSelectDropdown
          label="Work Mode"
          placeholder="Work Mode"
          options={WORK_MODE_OPTIONS.map((o) => ({ value: o, label: o }))}
          selected={draft.workMode}
          onChange={(next) => setDraft((d) => ({ ...d, workMode: next }))}
        />
        {showStatus && (
          <MultiSelectDropdown
            label="Status"
            placeholder="Status"
            options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
            selected={draft.status}
            onChange={(next) => setDraft((d) => ({ ...d, status: next }))}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(defaults)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={rangeIncomplete}
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {count ? `Search (${count})` : 'Search'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Pieces --------------------------------- */

const shortDate = (iso: string) =>
  parse(iso)!.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

/* ------------------------------- V2 pieces -------------------------------- */

/** V2: calendar-leaf date block (Fri · 16 · Oct 2026) */
const DateBlock: React.FC<{ iso: string }> = ({ iso }) => {
  const d = parse(iso)!;
  return (
    <span className="w-14 shrink-0 rounded-xl border border-[#DBE5FF] bg-[#F8FAFF] overflow-hidden text-center shadow-2xs" aria-label={shortDate(iso)}>
      <span className="block py-1 bg-[#2F68FE] text-white text-[9px] font-bold uppercase tracking-wider leading-none">
        {d.toLocaleDateString('en-US', { weekday: 'short' })}
      </span>
      <span className="block pt-1.5 text-xl font-extrabold leading-none tabular-nums text-[#1E293B]">{String(d.getDate()).padStart(2, '0')}</span>
      <span className="block pt-1 pb-1.5 text-[9px] font-semibold leading-none whitespace-nowrap text-slate-500">
        {d.toLocaleDateString('en-US', { month: 'short' })} {d.getFullYear()}
      </span>
    </span>
  );
};

/** V2: label / value row */
const RowV2: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <dt className="min-w-0 text-[11px] font-medium text-slate-500">{label}</dt>
    <dd className="max-w-[62%] text-right text-xs font-semibold text-[#1E293B] break-words">{children || '--'}</dd>
  </div>
);

/** V2: Check In → Check Out rail with Total Office Time underneath */
const PunchStrip: React.FC<{
  checkIn: string | null;
  checkOut: string | null;
  office: string | null;
}> = ({ checkIn, checkOut, office }) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50">
      <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-slate-500 leading-tight">Check In</span>
          <span className="block mt-0.5 text-[13px] font-bold tabular-nums text-[#1E293B]">{checkIn || '--'}</span>
        </span>
        <span aria-hidden="true" className="flex-1 flex items-center gap-1 text-[#2F68FE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />
          <span className="flex-1 border-t-2 border-dashed border-[#BFDBFE]" />
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
        <span className="min-w-0 text-right">
          <span className="block text-[11px] font-medium text-slate-500 leading-tight">Check Out</span>
          <span className="block mt-0.5 text-[13px] font-bold tabular-nums text-[#1E293B]">{checkOut || '--'}</span>
        </span>
      </div>
      <dl className="border-t border-slate-100">
        <div className="min-w-0 px-3 py-2">
          <dt className="flex items-center gap-1 text-[10px] font-medium text-slate-500 leading-tight">
            <Clock className="w-3 h-3 shrink-0 text-slate-400" />
            Total Office Time
          </dt>
          <dd className="mt-0.5 text-xs font-bold tabular-nums text-[#2F68FE]">{office || '--'}</dd>
        </div>
      </dl>
    </div>
  );
};

const WorkModeTag: React.FC<{ mode: keyof typeof WORK_MODE_LABEL | null }> = ({ mode }) => {
  if (!mode) return <span className="text-[11px] font-semibold text-slate-400">--</span>;
  const Icon = mode === 'WFH' ? Home : Building2;
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
      <Icon className="w-3 h-3" />
      {WORK_MODE_LABEL[mode]}
    </span>
  );
};

interface Decision {
  ids: string[];
  status: 'Approved' | 'Rejected';
}

interface Row {
  member: ClientStaffMember;
  day: AttendanceDay;
}

/* ---------------------------------- View ---------------------------------- */

/** Human Resources › Attendance Management (desktop `attendancemanagement`): Attendance + Attendance Amend tabs */
export const ClientAttendanceView: React.FC<Props> = ({ requests, staff, onDecide, workModeOf, onBack, initialTab = 'attendance' }) => {
  const { edit: canDecide } = useClientPermission('attendance');
  const [notice, showNotice] = useTimesheetNotice();
  const [tab, setTab] = useState<Tab>(initialTab);
  // Pending requests from last month stay in the default Attendance Amend range (they're counted on the tab badge)
  const [defaults] = useState<Record<Tab, Filters>>(() => ({
    attendance: defaultFilters(),
    amend: defaultFilters(
      requests.filter((r) => r.status === 'Pending').reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined),
    ),
  }));
  const [filters, setFilters] = useState<Record<Tab, Filters>>(defaults);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [setOffDate, setSetOffDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const reload = () => {
    setShown(PAGE);
    setLoading(true);
  };

  const f = filters[tab];
  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);
  const pending = pendingAmendCount(requests);
  const q = query.trim().toLowerCase();
  const nameMatches = (id: string) => !q || (memberOf(id)?.name ?? '').toLowerCase().includes(q);

  const rows = useMemo<Row[]>(() => {
    const af = filters.attendance;
    const start = parse(af.from)!;
    const end = parse(af.to)!;
    const out: Row[] = [];
    sortedStaff.forEach((member) => {
      if (af.staff.length && !af.staff.includes(member.id)) return;
      const mode = workModeOf?.(member.id) ?? workInfoFor(member).currentMode;
      for (let k = start.getFullYear() * 12 + start.getMonth(); k <= end.getFullYear() * 12 + end.getMonth(); k++) {
        withApprovedAmends(member.id, attendanceFor(member, Math.floor(k / 12), k % 12, mode), requests).forEach((day) => {
          if (day.date < af.from || day.date > af.to) return;
          if (af.workMode.length && !(day.workMode && af.workMode.includes(WORK_MODE_LABEL[day.workMode]))) return;
          if (af.status.length && !af.status.includes(STATUS_LABEL[day.status])) return;
          out.push({ member, day });
        });
      }
    });
    // Stable sort keeps staff A→Z within a date
    return out.filter((r) => nameMatches(r.member.id)).sort((a, b) => b.day.date.localeCompare(a.day.date));
  }, [filters.attendance, sortedStaff, workModeOf, requests, q]);

  const amends = useMemo(() => {
    const af = filters.amend;
    return requests
      .filter((r) => r.date >= af.from && r.date <= af.to)
      .filter((r) => !af.staff.length || af.staff.includes(r.staffId))
      .filter((r) => !af.workMode.length || af.workMode.includes(WORK_MODE_LABEL[r.workMode]))
      .filter((r) => nameMatches(r.staffId))
      .sort((a, b) => Number(b.status === 'Pending') - Number(a.status === 'Pending') || b.date.localeCompare(a.date));
  }, [filters.amend, requests, q]);
  const pendingShown = amends.filter((r) => r.status === 'Pending');

  const total = tab === 'attendance' ? rows.length : amends.length;
  const activeFilters = filterCount(f, defaults[tab]);
  const isDefault = activeFilters === 0 && !q;

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    reload();
  };
  const apply = (next: Filters) => {
    setFilters((all) => ({ ...all, [tab]: next }));
    setFilterOpen(false);
    reload();
  };
  const clearAll = () => {
    setQuery('');
    apply(defaults[tab]);
  };

  const decide = (ids: string[], status: 'Approved' | 'Rejected', note: string, offDate: string | null) => {
    onDecide(ids, status, note, offDate);
    showNotice(
      ids.length > 1
        ? `${ids.length} requests ${status.toLowerCase()}.`
        : `Request ${status.toLowerCase()} for ${memberOf(requests.find((r) => r.id === ids[0])?.staffId ?? '')?.name ?? 'staff'}.`,
    );
  };

  const open = (ids: string[], status: 'Approved' | 'Rejected') => {
    // Approve goes straight through unless a "Left Early and Set Off Hours" request needs its make-up day
    if (status === 'Approved' && !requests.some((r) => ids.includes(r.id) && r.reason === SET_OFF_REASON)) {
      return decide(ids, status, '', null);
    }
    setDecision({ ids, status });
    setComment('');
    setSetOffDate('');
    setError('');
  };

  const target = decision ? requests.filter((r) => decision.ids.includes(r.id)) : [];
  // Every "Left Early and Set Off Hours" request in the approval (single or Approve All) needs the make-up day
  const setOffCount = decision?.status === 'Approved' ? target.filter((r) => r.reason === SET_OFF_REASON).length : 0;
  const needsSetOff = setOffCount > 0;

  const confirm = () => {
    if (!decision) return;
    if (decision.status === 'Rejected' && !comment.trim()) return setError('Add a comment so the staff member knows why.');
    if (needsSetOff && !setOffDate) return setError('Select the day the hours will be made up.');
    decide(decision.ids, decision.status, decision.status === 'Rejected' ? comment.trim() : '', needsSetOff ? setOffDate : null);
    setDecision(null);
  };

  /* ---------- Attendance card (V2): date leaf + punch rail ---------- */
  const attendanceCardV2 = ({ member, day }: Row) => {
    const note = day.status === 'Holiday' ? holidayName(day.date) : null;
    return (
      <li key={`${member.id}-${day.date}`}>
        <article className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden">
          <div className="p-3.5 flex items-start gap-3">
            <DateBlock iso={day.date} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">{member.name}</span>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <WorkModeTag mode={day.workMode} />
                <span className="h-6 px-2 rounded-md bg-blue-50 text-[11px] font-semibold text-[#2F68FE] inline-flex items-center">{member.level || '--'}</span>
              </div>
            </div>
          </div>
          <div className="px-3.5 pb-3.5 space-y-1">
            <PunchStrip checkIn={day.checkIn} checkOut={day.checkOut} office={day.officeTime} />
            {note && (
              <dl>
                <RowV2 label="Holiday">{note}</RowV2>
              </dl>
            )}
          </div>
        </article>
      </li>
    );
  };

  /* ---------- Amend card (V2): status band + segmented footer ---------- */
  const amendCardV2 = (r: AmendRequest) => {
    const m = memberOf(r.staffId);
    const times = amendTimes(r);
    const t = AMEND_TONE[r.status];
    const seg =
      'flex-1 min-w-0 h-11 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]';
    return (
      <li key={r.id}>
        <article className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden">
          <div className="p-3.5 flex items-start gap-3">
            <DateBlock iso={r.date} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</span>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold ${t.band} ${t.text}`}>
                  <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                  {r.status}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <WorkModeTag mode={r.workMode} />
              </div>
            </div>
          </div>

          <div className="px-3.5 pb-3.5 space-y-1">
            <PunchStrip checkIn={r.requestedIn} checkOut={r.requestedOut} office={times.office} />
            <dl className="divide-y divide-dashed divide-slate-200">
              <RowV2 label="Request Type">{r.reason}</RowV2>
              <RowV2 label="Recorded As">{r.recordedStatus}</RowV2>
            </dl>

            {r.staffNote && (
              <div className="mt-1 pl-3 py-1 border-l-[3px] border-[#BFDBFE]">
                <p className="text-[11px] font-medium text-slate-400">Reason</p>
                <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">{r.staffNote}</p>
              </div>
            )}
          </div>

          {r.status === 'Pending' && canDecide && (
            <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-white">
              <button type="button" onClick={() => open([r.id], 'Rejected')} className={`text-rose-600 active:bg-rose-50 ${seg}`}>
                <X className="w-4 h-4" />
                Reject
              </button>
              <button type="button" onClick={() => open([r.id], 'Approved')} className={`text-emerald-600 active:bg-emerald-50 ${seg}`}>
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          )}
        </article>
      </li>
    );
  };

  /* ---------- Tabs ---------- */
  /** Underline tabs: icon + label, active one in blue with a bar underneath (as on Manager My Profile) */
  const tabs = (
    <nav className="bg-[#F8FAFC] border-b border-slate-200/80 shrink-0" aria-label="Attendance Management">
      <div className="flex px-2" role="tablist">
        {TABS.map((t) => {
          const on = t.id === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchTab(t.id)}
              className={`relative flex-1 min-w-0 h-12 px-3 flex items-center justify-center gap-1.5 text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${FOCUS} ${
                on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
              {t.id === 'amend' && pending > 0 && (
                <span
                  className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                    on ? 'bg-[#2F68FE] text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pending}
                </span>
              )}
              <span
                className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );

  /* ---------- Search + Filter ---------- */
  const filterRow = (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <SearchField
          value={query}
          onChange={(v) => {
            setQuery(v);
            setShown(PAGE);
          }}
          placeholder="Search By Name"
        />
      </div>
      <FilterIconButton count={activeFilters} onClick={() => setFilterOpen(true)} label="Filter attendance" />
    </div>
  );

  /* ---------- Toolbar: sticky search + Filter, count row, Approve All bar ---------- */
  const toolbarV2 = (
    <div className="sticky top-0 z-10 bg-[#F8FAFC] px-4 pt-3.5 pb-2">
      {filterRow}

      {!isDefault && (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={clearAll}
            className="h-8 px-2 rounded-xl text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {tab === 'amend' && canDecide && !loading && pendingShown.length > 1 && (
        <div className="mt-2 h-12 pl-3 pr-1.5 rounded-xl border border-blue-100 bg-blue-50 flex items-center gap-2">
          <span className="flex-1 min-w-0 text-xs font-semibold text-[#1E293B] truncate tabular-nums">{pendingShown.length} requests pending</span>
          <button
            type="button"
            onClick={() =>
              open(
                pendingShown.map((r) => r.id),
                'Approved',
              )
            }
            className={`h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 active:bg-[#1D4ED8] transition-colors cursor-pointer ${FOCUS}`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Approve All ({pendingShown.length})
          </button>
        </div>
      )}
    </div>
  );

  const skeletonV2 = (
    <div className="space-y-3" aria-busy="true" aria-label="Loading records">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <StaffSkeleton className="w-12 h-[58px] rounded-xl" />
            <div className="flex-1 space-y-2 pt-1">
              <StaffSkeleton className="w-20 h-2.5" />
              <StaffSkeleton className="w-36 h-3.5" />
              <StaffSkeleton className="w-28 h-5 rounded-md" />
            </div>
          </div>
          <StaffSkeleton className="w-full h-[92px] rounded-xl" />
          <StaffSkeleton className="w-full h-3" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Attendance Management" onBack={onBack} />
      {notice}

      {tabs}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {toolbarV2}

        <div className="px-4 mt-1">
          {loading ? (
            skeletonV2
          ) : total === 0 ? (
            <EmptyCard
              icon={tab === 'amend' && isDefault ? CalendarCheck : SearchX}
              title="No Data Found"
              text={isDefault ? 'Nothing recorded for this date range.' : 'Try a different date range or filter.'}
              action={
                !isDefault ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-5 rounded-xl text-[#2F68FE] text-xs font-semibold active:bg-blue-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="space-y-3">
                {tab === 'attendance'
                  ? rows.slice(0, shown).map(attendanceCardV2)
                  : amends.slice(0, shown).map(amendCardV2)}
              </ul>
              {shown < total && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="mt-3 w-full h-11 rounded-xl border border-blue-100 bg-blue-50 text-[#2F68FE] text-xs font-bold active:bg-blue-100 cursor-pointer"
                >
                  Show More ({total - shown})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AttendanceFilterSheet
        isOpen={filterOpen}
        filters={f}
        defaults={defaults[tab]}
        staff={sortedStaff}
        showStatus={tab === 'attendance'}
        onClose={() => setFilterOpen(false)}
        onApply={apply}
      />

      <BottomSheet isOpen={Boolean(decision)} onClose={() => setDecision(null)} maxHeight="max-h-[80%]">
        {decision && (
          <>
            <SheetHeader
              title={decision.status === 'Approved' ? (target.length > 1 ? `Approve ${target.length} Requests` : 'Approve Request') : 'Reject Request'}
              subtitle={target.length === 1 ? `${memberOf(target[0].staffId)?.name ?? 'Staff'} · ${target[0].reason}` : 'Applies to every selected request'}
              onClose={() => setDecision(null)}
            />
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
              {needsSetOff && (
                <div className="space-y-1">
                  <DateField
                    label="Make up the hours on"
                    required
                    min={isoOf(new Date())}
                    value={setOffDate}
                    onChange={(iso) => {
                      setSetOffDate(iso);
                      setError('');
                    }}
                  />
                  {target.length > 1 && (
                    <p className="px-0.5 text-[11px] text-slate-500">
                      Applies to the {setOffCount} "Left Early and Set Off Hours" {setOffCount === 1 ? 'request' : 'requests'} in this approval.
                    </p>
                  )}
                </div>
              )}
              {decision.status === 'Rejected' && (
                <div className="space-y-1">
                  <label htmlFor="amend-comment" className="block text-xs font-bold text-[#1E293B]">
                    Comment
                    <span className="text-rose-500"> *</span>
                  </label>
                  <textarea
                    id="amend-comment"
                    rows={3}
                    maxLength={300}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setError('');
                    }}
                    placeholder="Why is this being rejected?"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
                  />
                </div>
              )}
              {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                className={`h-12 rounded-xl text-white text-xs font-bold cursor-pointer ${decision.status === 'Approved' ? 'bg-[#2F68FE] active:bg-[#1D4ED8]' : 'bg-rose-600 active:bg-rose-700'}`}
              >
                {decision.status === 'Approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
};
