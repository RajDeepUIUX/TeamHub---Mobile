import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, CalendarCheck, CalendarDays, Check, ChevronRight, Clock, House, MessageSquareText, SearchX, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, EmptyCard, SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  AMEND_STATUSES,
  AmendRequest,
  AmendStatus,
  SET_OFF_REASON,
  formatAmendDate,
  isoOf,
  nextHoliday,
  pendingAmendCount,
} from '../data/clientAttendanceData';

interface Props {
  requests: AmendRequest[];
  staff: ClientStaffMember[];
  /** Approve / reject one or more requests (desktop `acceptAttendance` takes several attendance ids) */
  onDecide: (ids: string[], status: 'Approved' | 'Rejected', comment: string, setOffDate: string | null) => void;
  /** Daily attendance lives in each staff profile (My Staff › Attendance & Leave) */
  onOpenMyStaff?: () => void;
}

type Chip = 'All' | AmendStatus;
const CHIPS: Chip[] = ['All', ...AMEND_STATUSES];
const LOAD_MS = 500;

const STATUS_STYLE: Record<AmendStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-rose-600',
};

interface Decision {
  ids: string[];
  status: 'Approved' | 'Rejected';
}

/** Human Resources › Attendance Management › Attendance Amend: staff correction requests the client approves or rejects */
export const ClientAttendanceView: React.FC<Props> = ({ requests, staff, onDecide, onOpenMyStaff }) => {
  const { edit: canDecide } = useClientPermission('attendance');
  const [notice, showNotice] = useTimesheetNotice();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<Chip>('Pending');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [setOffDate, setSetOffDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);

  const term = query.trim().toLowerCase();
  const base = requests.filter((r) => !term || `${memberOf(r.staffId)?.name ?? ''} ${r.reason}`.toLowerCase().includes(term));
  const results = base.filter((r) => chip === 'All' || r.status === chip).sort((a, b) => b.date.localeCompare(a.date));
  const pending = pendingAmendCount(requests);
  const holiday = useMemo(() => nextHoliday(), []);
  const pendingShown = results.filter((r) => r.status === 'Pending');

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

  const card = (r: AmendRequest) => {
    const m = memberOf(r.staffId);
    const ModeIcon = r.workMode === 'WFH' ? House : Building2;
    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5 flex items-center gap-3">
            {m && <StaffAvatar name={m.name} tint={tintOf(m.id)} />}
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] font-bold truncate">{m?.name ?? 'Staff'}</span>
              <span className="block text-[11.5px] text-slate-500 truncate">{m?.designation}</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
          </div>

          <div className="px-3.5 pb-3.5 pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <CalendarCheck className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-snug">{r.reason}</span>
                <span className="block text-[11.5px] text-slate-500">
                  {formatAmendDate(r.date)} · recorded as {r.recordedStatus}
                </span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {r.requestedIn ?? '--'}
                <ArrowRight className="w-3 h-3 text-slate-300" />
                {r.requestedOut ?? '--'}
              </span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <ModeIcon className="w-3.5 h-3.5" />
                {r.workMode === 'WFH' ? 'Work From Home' : 'In Office'}
              </span>
            </div>

            {r.staffNote && <p className="text-[12px] text-slate-600 leading-relaxed">“{r.staffNote}”</p>}

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
            <div className="px-3.5 py-2.5 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => open([r.id], 'Rejected')}
                className="h-10 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-rose-50 cursor-pointer"
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
          )}
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {notice}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Human Resources <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Attendance Management</span>
          </p>
          <h1 className="mt-0.5 mb-1.5 text-xl font-extrabold leading-tight">Attendance Amendments</h1>
          <p className="mt-1 text-xs text-slate-500">
            {pending ? `${pending} request${pending === 1 ? '' : 's'} waiting for your approval.` : 'No requests waiting for your approval.'}
          </p>

          {holiday && (
            <p className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[11.5px] text-[#4338CA]">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>
                Next holiday: <span className="font-bold">{holiday.name}</span> · {formatAmendDate(holiday.date)}
              </span>
            </p>
          )}

          <div className="mt-3">
            <SearchField value={query} onChange={setQuery} placeholder="Search by staff or request type" />
          </div>

          <div className="mt-3 -mx-4 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label="Status">
            {CHIPS.map((c) => {
              const on = c === chip;
              const count = base.filter((r) => c === 'All' || r.status === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChip(c)}
                  className={`shrink-0 h-8 pl-3 pr-1.5 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {c}
                  <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums bg-white ${on ? 'text-[#2F68FE]' : 'text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {canDecide && pendingShown.length > 1 && (
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
            <div className="space-y-3" aria-busy="true" aria-label="Loading requests">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <StaffSkeleton className="w-10 h-10 rounded-full" />
                    <StaffSkeleton className="w-32 h-3.5" />
                  </div>
                  <StaffSkeleton className="w-full h-20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyCard
              icon={requests.length === 0 ? CalendarCheck : SearchX}
              title={chip === 'Pending' && !term ? 'All caught up' : 'No Data Found'}
              text={chip === 'Pending' && !term ? 'New attendance amend requests from your staff will show up here.' : 'Try a different status or search.'}
              action={
                chip !== 'All' || term ? (
                  <button
                    type="button"
                    onClick={() => {
                      setChip('All');
                      setQuery('');
                    }}
                    className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Show All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">{results.map(card)}</ul>
          )}

          {onOpenMyStaff && !loading && (
            <button
              type="button"
              onClick={onOpenMyStaff}
              className="mt-4 w-full p-3.5 rounded-2xl bg-white border border-[#EBF0F7] flex items-center justify-between gap-3 text-left active:bg-slate-50 cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] font-bold">Daily attendance &amp; leaves</span>
                <span className="block text-[11px] text-slate-500">Open a staff profile › Attendance &amp; Leave</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          )}
        </div>
      </div>

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
