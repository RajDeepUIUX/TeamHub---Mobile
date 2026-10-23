import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  FilePenLine,
  Clock,
  Home,
  Info,
  Building2,
  MessageSquareText,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { RangeCalendar, formatShortDate, toDateKey } from '../../../design-system/components/RangeCalendar';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, DateField, DesignVersion, EmptyCard, SheetHeader } from '../staff/tabs/StaffTabParts';
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
  formatAmendDate,
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
const TABS: { id: Tab; label: string }[] = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'amend', label: 'Attendance Amend' },
];
const TAB_ICONS: Record<Tab, React.ElementType> = { attendance: CalendarCheck, amend: FilePenLine };

const LOAD_MS = 450;
const PAGE = 10;
const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const AMEND_STATUS_STYLE: Record<AmendStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-rose-600',
};

/** V2 amend card status band */
const AMEND_TONE: Record<AmendStatus, { band: string; dot: string; text: string }> = {
  Pending: {
    band: 'bg-[#FEF8E7]',
    dot: 'bg-[#D97706]',
    text: 'text-[#B45309]',
  },
  Approved: {
    band: 'bg-[#E8F8F0]',
    dot: 'bg-[#10B981]',
    text: 'text-[#047857]',
  },
  Rejected: { band: 'bg-[#FEF2F2]', dot: 'bg-rose-500', text: 'text-rose-600' },
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
/** Desktop range text "01-10-2026" */
const dmy = (iso: string) => iso.split('-').reverse().join('-');

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
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
    <span className="w-12 shrink-0 rounded-lg border border-[#DBEAFE] bg-white overflow-hidden text-center" aria-label={shortDate(iso)}>
      <span className="block py-0.5 bg-[#2F68FE] text-white text-[10px] font-bold uppercase tracking-wide">
        {d.toLocaleDateString('en-US', { weekday: 'short' })}
      </span>
      <span className="block pt-1 text-[17px] font-extrabold leading-none tabular-nums text-[#1E293B]">{String(d.getDate()).padStart(2, '0')}</span>
      <span className="block pt-0.5 pb-1 text-[10px] font-semibold text-slate-500">
        {d.toLocaleDateString('en-US', { month: 'short' })} {d.getFullYear()}
      </span>
    </span>
  );
};

/** V2: label / value row */
const RowV2: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <dt className="min-w-0 text-[12px] font-medium text-slate-500">{label}</dt>
    <dd className="max-w-[62%] text-right text-[12.5px] font-semibold text-[#1E293B] break-words">{children || '--'}</dd>
  </div>
);

/** V2: Check In → Check Out rail with Total Office Time / Overtime underneath */
const PunchStrip: React.FC<{
  checkIn: string | null;
  checkOut: string | null;
  office: string | null;
  overtime: string | null;
}> = ({ checkIn, checkOut, office, overtime }) => {
  const hasOt = Boolean(overtime && overtime !== '00:00');
  return (
    <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF]">
      <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
        <span className="min-w-0">
          <span className="block text-[10.5px] font-medium text-slate-500 leading-tight">Check In</span>
          <span className="block mt-0.5 text-[13px] font-bold tabular-nums text-[#1E293B]">{checkIn || '--'}</span>
        </span>
        <span aria-hidden="true" className="flex-1 flex items-center gap-1 text-[#2F68FE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />
          <span className="flex-1 border-t-2 border-dashed border-[#BFDBFE]" />
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
        <span className="min-w-0 text-right">
          <span className="block text-[10.5px] font-medium text-slate-500 leading-tight">Check Out</span>
          <span className="block mt-0.5 text-[13px] font-bold tabular-nums text-[#1E293B]">{checkOut || '--'}</span>
        </span>
      </div>
      <dl className="grid grid-cols-2 border-t border-[#DBEAFE] divide-x divide-[#DBEAFE]">
        <div className="min-w-0 px-3 py-2">
          <dt className="flex items-center gap-1 text-[10px] font-medium text-slate-500 leading-tight">
            <Clock className="w-3 h-3 shrink-0 text-slate-400" />
            Total Office Time
          </dt>
          <dd className="mt-0.5 text-[12.5px] font-bold tabular-nums text-[#1E293B]">{office || '--'}</dd>
        </div>
        <div className="min-w-0 px-3 py-2">
          <dt className="flex items-center gap-1 text-[10px] font-medium text-slate-500 leading-tight">
            <Clock className={`w-3 h-3 shrink-0 ${hasOt ? 'text-[#4F46E5]' : 'text-slate-400'}`} />
            Overtime
          </dt>
          <dd className={`mt-0.5 text-[12.5px] font-bold tabular-nums ${hasOt ? 'text-[#4F46E5]' : 'text-[#1E293B]'}`}>{overtime || '--'}</dd>
        </div>
      </dl>
    </div>
  );
};

const WorkModeTag: React.FC<{ mode: keyof typeof WORK_MODE_LABEL | null }> = ({ mode }) => {
  if (!mode) return <span className="text-[11px] font-semibold text-slate-400">--</span>;
  const Icon = mode === 'WFH' ? Home : Building2;
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-slate-100 text-[10.5px] font-semibold text-slate-600">
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
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  // Pending requests from last month stay in the default Attendance Amend range (they're counted on the tab badge)
  const [defaults] = useState<Record<Tab, Filters>>(() => ({
    attendance: defaultFilters(),
    amend: defaultFilters(
      requests.filter((r) => r.status === 'Pending').reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined),
    ),
  }));
  const [filters, setFilters] = useState<Record<Tab, Filters>>(defaults);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [setOffDate, setSetOffDate] = useState('');
  const [error, setError] = useState('');
  const [notesFor, setNotesFor] = useState<AmendRequest | null>(null);

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
    return out.sort((a, b) => b.day.date.localeCompare(a.day.date));
  }, [filters.attendance, sortedStaff, workModeOf, requests]);

  const amends = useMemo(() => {
    const af = filters.amend;
    return requests
      .filter((r) => r.date >= af.from && r.date <= af.to)
      .filter((r) => !af.staff.length || af.staff.includes(r.staffId))
      .filter((r) => !af.workMode.length || af.workMode.includes(WORK_MODE_LABEL[r.workMode]))
      .sort((a, b) => Number(b.status === 'Pending') - Number(a.status === 'Pending') || b.date.localeCompare(a.date));
  }, [filters.amend, requests]);
  const pendingShown = amends.filter((r) => r.status === 'Pending');

  const total = tab === 'attendance' ? rows.length : amends.length;
  const activeFilters = filterCount(f, defaults[tab]);
  const isDefault = activeFilters === 0;

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

  const open = (ids: string[], status: 'Approved' | 'Rejected') => {
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
    onDecide(decision.ids, decision.status, comment.trim(), needsSetOff ? setOffDate : null);
    showNotice(
      decision.ids.length > 1
        ? `${decision.ids.length} requests ${decision.status.toLowerCase()}.`
        : `Request ${decision.status.toLowerCase()} for ${memberOf(target[0]?.staffId ?? '')?.name ?? 'staff'}.`,
    );
    setDecision(null);
  };

  /* ---------- Attendance card (V1): soft card, meta chips, time tiles ---------- */
  const attendanceCard = ({ member, day }: Row) => {
    const note = day.status === 'Holiday' ? holidayName(day.date) : null;
    return (
      <li key={`${member.id}-${day.date}`}>
        <article className="bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-3.5 pb-3 flex items-start gap-3">
            <StaffAvatar name={member.name} tint={tintOf(member.id)} />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1E293B] truncate">{member.name}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
                <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                {shortDate(day.date)}
                <span className="text-slate-300">·</span>
                {day.workMode ? WORK_MODE_LABEL[day.workMode] : '--'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                {member.designation || '--'} <span className="text-slate-300">·</span> {member.level || '--'}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
          </div>
          <dl className="mx-3.5 grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Check In', value: day.checkIn, tone: 'text-[#1E293B]' },
              { label: 'Check Out', value: day.checkOut, tone: 'text-[#1E293B]' },
              { label: 'Total Office Time', value: day.officeTime, tone: 'text-[#2F68FE]' },
              { label: 'Overtime', value: day.overtime, tone: day.overtime && day.overtime !== '00:00' ? 'text-[#4F46E5]' : 'text-[#1E293B]' },
            ].map((t) => (
              <div key={t.label} className="min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">{t.label}</dt>
                <dd className={`font-bold tabular-nums ${t.tone}`}>{t.value || '--'}</dd>
              </div>
            ))}
          </dl>
          {note ? (
            <p className="p-3.5 pt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {note}
            </p>
          ) : (
            <div className="h-3.5" />
          )}
        </article>
      </li>
    );
  };

  /* ---------- Amend card (V1): soft card, reason bubble, pill actions ---------- */
  const amendCard = (r: AmendRequest) => {
    const m = memberOf(r.staffId);
    const times = amendTimes(r);
    return (
      <li key={r.id}>
        <article
          className={`bg-white border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden ${
            r.status === 'Pending' ? 'border-[#FDE68A]' : 'border-[#EBF0F7]'
          }`}
        >
          <div className="p-3.5 pb-3 flex items-start gap-3">
            {m && <StaffAvatar name={m.name} tint={tintOf(r.staffId)} />}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
                <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                {shortDate(r.date)}
                <span className="text-slate-300">·</span>
                {WORK_MODE_LABEL[r.workMode]}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">{m?.designation || '--'}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${AMEND_STATUS_STYLE[r.status]}`}>{r.status}</span>
          </div>

          <dl className="mx-3.5 grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Check In', value: r.requestedIn, tone: 'text-[#1E293B]' },
              { label: 'Check Out', value: r.requestedOut, tone: 'text-[#1E293B]' },
              { label: 'Total Office Time', value: times.office, tone: 'text-[#2F68FE]' },
              { label: 'Overtime', value: times.overtime, tone: times.overtime && times.overtime !== '00:00' ? 'text-[#4F46E5]' : 'text-[#1E293B]' },
            ].map((t) => (
              <div key={t.label} className="min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">{t.label}</dt>
                <dd className={`font-bold tabular-nums ${t.tone}`}>{t.value || '--'}</dd>
              </div>
            ))}
          </dl>

          <dl className="px-3.5 pt-3 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <dt className="text-slate-500 font-medium shrink-0">Request Type</dt>
              <dd className="ml-auto px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] font-semibold truncate">{r.reason || '--'}</dd>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <dt className="text-slate-500 font-medium shrink-0">Recorded As</dt>
              <dd className="ml-auto px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold truncate">{r.recordedStatus || '--'}</dd>
            </div>
          </dl>

          <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotesFor(r)}
              disabled={!r.staffNote && r.status === 'Pending'}
              className={`h-9 px-3 -ml-1 rounded-xl text-[11px] font-semibold text-[#2F68FE] disabled:text-slate-300 flex items-center gap-1.5 active:bg-blue-50 cursor-pointer disabled:cursor-default ${FOCUS}`}
            >
              <MessageSquareText className="w-4 h-4" />
              {r.status === 'Pending' ? 'Reason' : 'Reason & Comment'}
            </button>
            {r.status === 'Pending' && canDecide && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => open([r.id], 'Rejected')}
                  className={`h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer ${FOCUS}`}
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => open([r.id], 'Approved')}
                  className={`h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-[11px] font-bold flex items-center gap-1 active:bg-[#1D4ED8] cursor-pointer ${FOCUS}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>
            )}
          </div>
        </article>
      </li>
    );
  };

  /* ---------- Attendance card (V2): date leaf + punch rail ---------- */
  const attendanceCardV2 = ({ member, day }: Row) => {
    const note = day.status === 'Holiday' ? holidayName(day.date) : null;
    return (
      <li key={`${member.id}-${day.date}`}>
        <article className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
          <div className="p-3 flex items-start gap-3">
            <DateBlock iso={day.date} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="flex-1 min-w-0">
                  <span className="block text-[10.5px] font-medium text-slate-400 leading-tight">Staff Name</span>
                  <span className="block mt-0.5 text-[14px] font-bold text-[#1E293B] truncate">{member.name}</span>
                </span>
                <span className={`shrink-0 px-2 py-1 rounded-md text-[10.5px] font-bold ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <WorkModeTag mode={day.workMode} />
                <span className="h-6 px-2 rounded-md bg-[#EFF6FF] text-[10.5px] font-bold text-[#2F68FE] inline-flex items-center">{member.level || '--'}</span>
              </div>
            </div>
          </div>
          <div className="px-3 pb-3 space-y-1">
            <PunchStrip checkIn={day.checkIn} checkOut={day.checkOut} office={day.officeTime} overtime={day.overtime} />
            <dl className="divide-y divide-dashed divide-slate-200">
              <RowV2 label="Designation">{member.designation}</RowV2>
              {note && <RowV2 label="Holiday">{note}</RowV2>}
            </dl>
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
      'flex-1 min-w-0 h-11 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]';
    return (
      <li key={r.id}>
        <article className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
          <div className={`h-9 px-3 flex items-center gap-2 border-b border-[#EBF0F7] ${t.band}`}>
            <span className="text-[10.5px] font-medium text-slate-500">Status</span>
            <span className={`ml-auto flex items-center gap-1.5 text-[11.5px] font-bold ${t.text}`}>
              <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              {r.status}
            </span>
          </div>

          <div className="p-3 flex items-start gap-3">
            <DateBlock iso={r.date} />
            <div className="flex-1 min-w-0">
              <span className="block text-[10.5px] font-medium text-slate-400 leading-tight">Staff Name</span>
              <span className="block mt-0.5 text-[14px] font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</span>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <WorkModeTag mode={r.workMode} />
              </div>
            </div>
          </div>

          <div className="px-3 pb-3 space-y-1">
            <PunchStrip checkIn={r.requestedIn} checkOut={r.requestedOut} office={times.office} overtime={times.overtime} />
            <dl className="divide-y divide-dashed divide-slate-200">
              <RowV2 label="Designation">{m?.designation}</RowV2>
              <RowV2 label="Request Type">{r.reason}</RowV2>
              <RowV2 label="Recorded As">{r.recordedStatus}</RowV2>
            </dl>

            {r.staffNote && (
              <div className="mt-1 pl-3 py-1 border-l-[3px] border-[#BFDBFE]">
                <p className="text-[10.5px] font-medium text-slate-400">Reason</p>
                <p className="mt-0.5 text-[12px] text-slate-700 leading-relaxed">{r.staffNote}</p>
              </div>
            )}

            {r.status !== 'Pending' && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-dashed border-slate-200 space-y-1">
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                  <MessageSquareText className="w-3.5 h-3.5" />
                  Your comment
                  {r.decidedOn ? ` · ${formatAmendDate(r.decidedOn)}` : ''}
                </p>
                <p className="text-[12px] text-slate-700">{r.clientComment || '-'}</p>
                {r.setOffDate && <p className="text-[11px] text-slate-500">Hours to be made up on {formatAmendDate(r.setOffDate)}</p>}
              </div>
            )}
          </div>

          {r.status === 'Pending' && canDecide && (
            <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-[#FBFCFE]">
              <button type="button" onClick={() => open([r.id], 'Rejected')} className={`text-rose-500 active:bg-rose-50 ${seg}`}>
                <X className="w-4 h-4" />
                Reject
              </button>
              <button type="button" onClick={() => open([r.id], 'Approved')} className={`text-[#2F68FE] active:bg-[#EFF6FF] ${seg}`}>
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
  const tabsV1 = (
    <div className="mt-3 border-b border-slate-200/80 px-2 flex gap-1 overflow-x-auto no-scrollbar shrink-0" role="tablist" aria-label="Attendance Management">
      {TABS.map((t) => {
        const on = t.id === tab;
        const Icon = TAB_ICONS[t.id];
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => switchTab(t.id)}
            className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${FOCUS} ${
              on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
            {t.id === 'amend' && pending > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{pending}</span>
            )}
            <span
              className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
        );
      })}
    </div>
  );

  /** V2: segmented control on a white bar */
  const tabsV2 = (
    <div className="mt-3 bg-white px-4 pt-2.5 pb-2.5 border-y border-[#EBF0F7] shrink-0">
      <div className="p-1 rounded-xl bg-slate-100 grid grid-cols-2 gap-1" role="tablist" aria-label="Attendance Management">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchTab(t.id)}
              className={`h-9 rounded-lg text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${FOCUS} ${
                on ? 'bg-white text-[#2F68FE] shadow-2xs' : 'text-slate-500'
              }`}
            >
              {t.label}
              {t.id === 'amend' && pending > 0 && (
                <span className="min-w-4.5 h-4.5 px-1 rounded-md bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ---------- Toolbar (V2): sticky date range + Filter, count row, Approve All bar ---------- */
  const toolbarV2 = (
    <div className="sticky top-0 z-10 bg-[#F8FAFC] px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={`Date range ${dmy(f.from)} to ${dmy(f.to)}`}
          className={`flex-1 min-w-0 h-10 pl-2 pr-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2 active:bg-slate-50 cursor-pointer ${FOCUS}`}
        >
          <span className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-slate-700 tabular-nums">
            {dmy(f.from)} - {dmy(f.to)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={activeFilters ? `Filter attendance (${activeFilters} applied)` : 'Filter attendance'}
          className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer ${FOCUS} ${
            activeFilters ? 'border-[#2F68FE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeFilters > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11.5px] font-semibold text-slate-500 tabular-nums">{loading ? 'Loading…' : `${total} record${total === 1 ? '' : 's'}`}</p>
        {!isDefault && (
          <button
            type="button"
            onClick={() => apply(defaults[tab])}
            className="text-[11.5px] font-bold text-[#2F68FE] underline underline-offset-2 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {tab === 'amend' && canDecide && !loading && pendingShown.length > 1 && (
        <div className="mt-2 h-11 pl-3 pr-1.5 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] flex items-center gap-2">
          <span className="flex-1 min-w-0 text-[11.5px] font-semibold text-[#1E293B] truncate tabular-nums">{pendingShown.length} requests pending</span>
          <button
            type="button"
            onClick={() =>
              open(
                pendingShown.map((r) => r.id),
                'Approved',
              )
            }
            className={`h-8 px-3 rounded-md bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center gap-1 shrink-0 active:bg-[#1D4ED8] cursor-pointer ${FOCUS}`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Approve All ({pendingShown.length})
          </button>
        </div>
      )}
    </div>
  );

  const skeletonV2 = (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading records">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-3">
          <div className="flex items-start gap-3">
            <StaffSkeleton className="w-12 h-[58px] rounded-lg" />
            <div className="flex-1 space-y-2 pt-1">
              <StaffSkeleton className="w-20 h-2.5" />
              <StaffSkeleton className="w-36 h-3.5" />
              <StaffSkeleton className="w-28 h-5 rounded-md" />
            </div>
          </div>
          <StaffSkeleton className="w-full h-[92px] rounded-lg" />
          <StaffSkeleton className="w-full h-3" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader
        title="Attendance Management"
        onBack={onBack}
        version={{
          versions: DESIGN_VERSIONS,
          value: version,
          onChange: setVersion,
        }}
      />
      {notice}

      {v2 ? tabsV2 : tabsV1}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? (
          toolbarV2
        ) : (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-label={`Date range ${dmy(f.from)} to ${dmy(f.to)}`}
                className={`flex-1 min-w-0 h-11 pl-1.5 pr-4 rounded-full border border-slate-200 bg-white flex items-center gap-2.5 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer ${FOCUS}`}
              >
                <span className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="min-w-0 truncate text-xs font-semibold text-slate-700 tabular-nums">
                  {dmy(f.from)} - {dmy(f.to)}
                </span>
                <ChevronDown className="ml-auto w-4 h-4 shrink-0 text-slate-400" />
              </button>
              <FilterIconButton count={activeFilters} onClick={() => setFilterOpen(true)} label="Filter attendance" />
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2">
              {loading ? (
                <span className="block w-24 h-4 rounded-md bg-slate-200/70 animate-pulse" aria-hidden="true" />
              ) : (
                <p className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-[15px] font-extrabold text-[#1E293B] leading-none">{total}</span>
                  <span className="text-xs font-semibold text-slate-500">record{total === 1 ? '' : 's'}</span>
                </p>
              )}
              {!isDefault && (
                <button
                  type="button"
                  onClick={() => apply(defaults[tab])}
                  className="h-8 px-3 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE] cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {tab === 'amend' && canDecide && !loading && pendingShown.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  open(
                    pendingShown.map((r) => r.id),
                    'Approved',
                  )
                }
                className={`mt-3 w-full h-11 rounded-full bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] cursor-pointer ${FOCUS}`}
              >
                <CheckCheck className="w-4 h-4" />
                Approve All ({pendingShown.length})
              </button>
            )}
          </div>
        )}

        <div className={`px-4 ${v2 ? 'mt-1' : 'mt-3'}`}>
          {loading ? (
            v2 ? (
              skeletonV2
            ) : (
              <div className="space-y-3" aria-busy="true" aria-label="Loading records">
                {[0, 1].map((i) => (
                  <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <StaffSkeleton className="w-10 h-10 rounded-full" />
                      <StaffSkeleton className="flex-1 h-3.5" />
                      <StaffSkeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <StaffSkeleton className="h-11 rounded-xl" />
                      <StaffSkeleton className="h-11 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((k) => (
                        <StaffSkeleton key={k} className="h-14 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : total === 0 ? (
            <EmptyCard
              icon={tab === 'amend' && isDefault ? CalendarCheck : SearchX}
              title="No Data Found"
              text={isDefault ? 'Nothing recorded for this date range.' : 'Try a different date range or filter.'}
              action={
                !isDefault ? (
                  <button
                    type="button"
                    onClick={() => apply(defaults[tab])}
                    className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className={v2 ? 'space-y-2.5' : 'space-y-3'}>
                {tab === 'attendance'
                  ? rows.slice(0, shown).map(v2 ? attendanceCardV2 : attendanceCard)
                  : amends.slice(0, shown).map(v2 ? amendCardV2 : amendCard)}
              </ul>
              {shown < total && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className={`mt-3 w-full text-[#2F68FE] text-xs font-bold cursor-pointer ${
                    v2
                      ? 'h-11 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] active:bg-[#DBEAFE]'
                      : 'h-11 rounded-full bg-white border border-slate-200 shadow-2xs active:bg-slate-50'
                  }`}
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
              <div className="space-y-1">
                <label htmlFor="amend-comment" className="block text-[11px] font-semibold text-slate-600">
                  Comment
                  {decision.status === 'Rejected' && <span className="text-rose-500"> *</span>}
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
                  placeholder={decision.status === 'Approved' ? 'Optional note for the staff member' : 'Why is this being rejected?'}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
                />
                {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                className={`h-12 rounded-xl text-white text-xs font-bold cursor-pointer ${decision.status === 'Approved' ? 'bg-[#2F68FE] active:bg-[#1D4ED8]' : 'bg-rose-500 active:bg-rose-600'}`}
              >
                {decision.status === 'Approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </>
        )}
      </BottomSheet>

      <BottomSheet isOpen={Boolean(notesFor)} onClose={() => setNotesFor(null)} maxHeight="max-h-[80%]">
        {notesFor && (
          <>
            <SheetHeader
              title={notesFor.status === 'Pending' ? 'Reason' : 'Reason & Comment'}
              subtitle={`${memberOf(notesFor.staffId)?.name ?? 'Staff'} · ${shortDate(notesFor.date)}`}
              onClose={() => setNotesFor(null)}
            />
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
              <div className="p-3 rounded-2xl rounded-tl-md bg-[#EFF6FF] border border-[#DBEAFE]">
                <p className="text-[10.5px] font-semibold text-[#2F68FE]">Reason</p>
                <p className="mt-0.5 text-[12px] text-slate-700 leading-relaxed">{notesFor.staffNote || '-'}</p>
              </div>
              {notesFor.status !== 'Pending' && (
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#EBF0F7] space-y-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E0E9FF] text-[#2F68FE] flex items-center justify-center">
                      <MessageSquareText className="w-3 h-3" />
                    </span>
                    Your comment
                    {notesFor.decidedOn ? ` · ${formatAmendDate(notesFor.decidedOn)}` : ''}
                  </p>
                  <p className="text-[12px] text-slate-700">{notesFor.clientComment || '-'}</p>
                  {notesFor.setOffDate && <p className="text-[11px] text-slate-500">Hours to be made up on {formatAmendDate(notesFor.setOffDate)}</p>}
                </div>
              )}
            </div>
            <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setNotesFor(null)}
                className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
};
