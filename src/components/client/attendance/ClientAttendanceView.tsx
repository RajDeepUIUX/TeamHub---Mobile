import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarCheck, Check, ChevronDown, MessageSquareText, SearchX, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { RangeCalendar, formatShortDate, toDateKey } from '../../../design-system/components/RangeCalendar';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { STATUS_LABEL, STATUS_PILL } from '../staff/tabs/StaffAttendancePanel';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { ATTENDANCE_STATUSES, AttendanceDay, StaffWorkMode, attendanceFor, holidayName, workInfoFor } from '../data/clientStaffProfileData';
import { AmendRequest, AmendStatus, SET_OFF_REASON, formatAmendDate, isoOf, pendingAmendCount } from '../data/clientAttendanceData';

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

const LOAD_MS = 450;
const PAGE = 10;

const AMEND_STATUS_STYLE: Record<AmendStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-rose-600',
};

const WORK_MODE_LABEL = { Office: 'Work From Office', WFH: 'Work From Home' } as const;
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
  return { from: from && from < monthStart ? from : monthStart, to: isoOf(today), staff: [], workMode: [], status: [] };
};

const filterCount = (f: Filters, d: Filters = defaultFilters()) =>
  (f.from !== d.from || f.to !== d.to ? 1 : 0) + f.staff.length + f.workMode.length + f.status.length;

const parse = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`) : null);
/** Desktop range text "01-10-2026" */
const dmy = (iso: string) => iso.split('-').reverse().join('-');

/** 09:00 AM → minutes */
const minutesOf = (time: string | null) => {
  const m = time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
};
const hm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** Requested punch times → Total Office Time / Overtime (over a 9h day incl. break) */
const amendTimes = (r: AmendRequest) => {
  const a = minutesOf(r.requestedIn);
  const b = minutesOf(r.requestedOut);
  if (a === null || b === null || b <= a) return { office: null, overtime: null };
  const office = b - a;
  return { office: hm(office), overtime: hm(Math.max(0, office - 9 * 60)) };
};

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
      setDraft((d) => ({ ...d, from: key, to: d.to && key > d.to ? '' : d.to }));
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

/** Label / value pair = one desktop table column */
const Field: React.FC<{ label: string; value: React.ReactNode; wide?: boolean; accent?: boolean }> = ({ label, value, wide, accent }) => (
  <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
    <dt className="text-[11px] text-slate-400">{label}</dt>
    <dd className={`mt-0.5 text-[12.5px] font-semibold tabular-nums break-words ${accent ? 'text-[#4F46E5]' : 'text-[#1E293B]'}`}>{value || '--'}</dd>
  </div>
);

const CardHead: React.FC<{ member?: ClientStaffMember; tint: number; pill: React.ReactNode }> = ({ member, tint, pill }) => (
  <div className="p-3.5 flex items-center gap-3">
    {member && <StaffAvatar name={member.name} tint={tint} />}
    <span className="flex-1 min-w-0">
      <span className="block text-[11px] text-slate-400">Staff Name</span>
      <span className="block text-[13.5px] font-bold truncate">{member?.name ?? 'Staff'}</span>
    </span>
    {pill}
  </div>
);

const shortDate = (iso: string) => parse(iso)!.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

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
    amend: defaultFilters(requests.filter((r) => r.status === 'Pending').reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined)),
  }));
  const [filters, setFilters] = useState<Record<Tab, Filters>>(defaults);
  const [filterOpen, setFilterOpen] = useState(false);
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

  const rows = useMemo<Row[]>(() => {
    const af = filters.attendance;
    const start = parse(af.from)!;
    const end = parse(af.to)!;
    const out: Row[] = [];
    sortedStaff.forEach((member) => {
      if (af.staff.length && !af.staff.includes(member.id)) return;
      const mode = workModeOf?.(member.id) ?? workInfoFor(member).currentMode;
      for (let k = start.getFullYear() * 12 + start.getMonth(); k <= end.getFullYear() * 12 + end.getMonth(); k++) {
        attendanceFor(member, Math.floor(k / 12), k % 12, mode).forEach((day) => {
          if (day.date < af.from || day.date > af.to) return;
          if (af.workMode.length && !(day.workMode && af.workMode.includes(WORK_MODE_LABEL[day.workMode]))) return;
          if (af.status.length && !af.status.includes(STATUS_LABEL[day.status])) return;
          out.push({ member, day });
        });
      }
    });
    // Stable sort keeps staff A→Z within a date
    return out.sort((a, b) => b.day.date.localeCompare(a.day.date));
  }, [filters.attendance, sortedStaff, workModeOf]);

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
  const needsSetOff = decision?.status === 'Approved' && target.length === 1 && target[0].reason === SET_OFF_REASON;

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

  const attendanceCard = ({ member, day }: Row) => {
    const hasOt = Boolean(day.overtime && day.overtime !== '00:00');
    const note = day.status === 'Holiday' ? holidayName(day.date) : null;
    return (
      <li key={`${member.id}-${day.date}`}>
        <Card className="overflow-hidden">
          <div className="bg-linear-to-r from-[#F5F8FF] to-white border-b border-slate-100">
            <CardHead
              member={member}
              tint={tintOf(member.id)}
              pill={<span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>}
            />
          </div>
          <div className="p-3.5 space-y-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Date" value={shortDate(day.date)} />
              <Field label="Work Mode" value={day.workMode ? WORK_MODE_LABEL[day.workMode] : null} />
            </dl>
            <dl className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EBF0F7] grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Check In" value={day.checkIn} />
              <Field label="Check Out" value={day.checkOut} />
              <Field label="Total Office Time" value={day.officeTime} />
              <Field label="Overtime" value={day.overtime} accent={hasOt} />
            </dl>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Level" value={member.level} />
              <Field label="Status" value={note ? `${STATUS_LABEL[day.status]} (${note})` : STATUS_LABEL[day.status]} />
              <Field label="Designation" value={member.designation} wide />
            </dl>
          </div>
        </Card>
      </li>
    );
  };

  const amendCard = (r: AmendRequest) => {
    const m = memberOf(r.staffId);
    const times = amendTimes(r);
    const hasOt = Boolean(times.overtime && times.overtime !== '00:00');
    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="bg-linear-to-r from-[#F5F8FF] to-white border-b border-slate-100">
            <CardHead
              member={m}
              tint={tintOf(r.staffId)}
              pill={<span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0 ${AMEND_STATUS_STYLE[r.status]}`}>{r.status}</span>}
            />
          </div>
          <div className="p-3.5 space-y-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Date" value={shortDate(r.date)} />
              <Field label="Work Mode" value={WORK_MODE_LABEL[r.workMode]} />
            </dl>
            <dl className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EBF0F7] grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Check In" value={r.requestedIn} />
              <Field label="Check Out" value={r.requestedOut} />
              <Field label="Total Office Time" value={times.office} />
              <Field label="Overtime" value={times.overtime} accent={hasOt} />
            </dl>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Designation" value={m?.designation} wide />
              <Field label="Request Type" value={r.reason} />
              <Field label="Recorded As" value={r.recordedStatus} />
            </dl>

            {r.staffNote && (
              <div className="pt-2.5 border-t border-dashed border-slate-200">
                <p className="text-[11px] text-slate-400">Reason</p>
                <p className="mt-0.5 text-[12px] text-slate-700 leading-relaxed">{r.staffNote}</p>
              </div>
            )}

            {r.status !== 'Pending' && (
              <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <MessageSquareText className="w-3.5 h-3.5" />
                  Your comment{r.decidedOn ? ` · ${formatAmendDate(r.decidedOn)}` : ''}
                </p>
                <p className="text-[12px] text-slate-700">{r.clientComment || '-'}</p>
                {r.setOffDate && <p className="text-[11px] text-slate-500">Hours to be made up on {formatAmendDate(r.setOffDate)}</p>}
              </div>
            )}
          </div>

          {r.status === 'Pending' && canDecide && (
            <div className="px-3.5 pb-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => open([r.id], 'Rejected')}
                  className="h-10 rounded-xl border border-rose-200 bg-white text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-rose-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => open([r.id], 'Approved')}
                  className="h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>
          )}
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Attendance Management" onBack={onBack} />
      {notice}

      <div className="bg-white border-b border-slate-200 px-4 flex gap-5 shrink-0" role="tablist" aria-label="Attendance Management">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchTab(t.id)}
              className={`relative h-11 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer ${on ? 'text-[#2F68FE]' : 'text-slate-500'}`}
            >
              {t.label}
              {t.id === 'amend' && pending > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{pending}</span>
              )}
              {on && <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[#2F68FE]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="tabular-nums">
                {dmy(f.from)} - {dmy(f.to)}
              </span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </button>
            <FilterIconButton count={activeFilters} onClick={() => setFilterOpen(true)} label="Filter attendance" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {loading ? 'Loading…' : `${total} record${total === 1 ? '' : 's'}`}
            </p>
            {!isDefault && (
              <button type="button" onClick={() => apply(defaults[tab])} className="text-xs font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            )}
          </div>

          {tab === 'amend' && canDecide && !loading && pendingShown.length > 1 && (
            <button
              type="button"
              onClick={() => open(pendingShown.map((r) => r.id), 'Approved')}
              className="mt-3 w-full h-10 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
            >
              Approve All ({pendingShown.length})
            </button>
          )}
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading records">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <StaffSkeleton className="w-10 h-10 rounded-full" />
                    <StaffSkeleton className="w-32 h-3.5" />
                  </div>
                  <StaffSkeleton className="w-full h-24 rounded-xl" />
                </div>
              ))}
            </div>
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
              <ul className="space-y-3">{tab === 'attendance' ? rows.slice(0, shown).map(attendanceCard) : amends.slice(0, shown).map(amendCard)}</ul>
              {shown < total && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="mt-3 w-full h-10 rounded-xl bg-white border border-[#DCE3ED] text-[#2F68FE] text-xs font-bold active:bg-slate-50 cursor-pointer"
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
                  <label htmlFor="amend-setoff" className="block text-[11px] font-semibold text-slate-600">
                    Make up the hours on <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="amend-setoff"
                    type="date"
                    min={isoOf(new Date())}
                    value={setOffDate}
                    onChange={(e) => {
                      setSetOffDate(e.target.value);
                      setError('');
                    }}
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="amend-comment" className="block text-[11px] font-semibold text-slate-600">
                  Comment{decision.status === 'Rejected' && <span className="text-rose-500"> *</span>}
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
    </div>
  );
};
