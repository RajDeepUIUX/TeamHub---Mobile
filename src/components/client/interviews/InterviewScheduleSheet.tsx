import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, Clock3, Copy, Info, Link2, Loader2, Plus, Video, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import {
  CLIENT_TZ,
  INTERVIEW_MINUTES,
  INTERVIEW_TIMEZONES,
  InterviewTz,
  ScheduledInterview,
  ShortlistedCandidate,
  formatLongDate,
  interviewInClientTz,
  makeZoomUrl,
  slotsFor,
} from '../data/clientInterviewsData';
import { SlotCalendar } from './InterviewParts';

const SAVE_MS = 800;

interface ScheduleProps {
  isOpen: boolean;
  candidate: ShortlistedCandidate | null;
  mode: 'request' | 'reschedule';
  onClose: () => void;
  onSchedule: (candidateId: string, interview: ScheduledInterview) => void;
}

const TZ_OPTIONS = INTERVIEW_TIMEZONES.map((t) => ({ value: t.value, label: t.label }));

/**
 * Desktop "Request Interview" offcanvas (also used to Reschedule): fixed 30-minute duration, time zone, date calendar and
 * the candidate's available Zoom slots. Slots for the same day are never offered and already-booked slots are removed.
 */
export const InterviewScheduleSheet: React.FC<ScheduleProps> = ({ isOpen, candidate, mode, onClose, onSchedule }) => {
  const [tz, setTz] = useState<InterviewTz>(CLIENT_TZ);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTz(CLIENT_TZ);
    setDate(null);
    setSlot(null);
    setSaving(false);
  }, [isOpen, candidate?.id]);

  const slots = useMemo(() => (candidate && date ? slotsFor(candidate, date, tz) : []), [candidate, date, tz]);

  const submit = () => {
    if (!candidate || !date || !slot || saving) return;
    setSaving(true);
    setTimeout(() => {
      onSchedule(candidate.id, {
        date,
        time: slot,
        tz,
        zoomUrl: makeZoomUrl(`${candidate.id}|${date}|${slot}|${tz}`),
        attendees: candidate.interview?.attendees ?? [],
      });
    }, SAVE_MS);
  };

  const close = saving ? () => undefined : onClose;
  const current = candidate?.interview ? interviewInClientTz(candidate.interview) : null;
  const isReschedule = mode === 'reschedule';

  return (
    <BottomSheet isOpen={isOpen} onClose={close} maxHeight="max-h-[94%]">
      <SheetHeader
        title={isReschedule ? 'Reschedule Interview' : 'Request Interview'}
        subtitle={candidate ? `${candidate.name} · ${candidate.profile}` : undefined}
        onClose={close}
      />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-snug">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          Please select a convenient date and time slot for the interview. Each interview is scheduled for {INTERVIEW_MINUTES} minutes.
        </p>

        {isReschedule && current && (
          <p className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] text-slate-600">
            Currently scheduled: <span className="font-bold text-[#1E293B]">{formatLongDate(current.date)} · {current.time} ({current.tz})</span>
          </p>
        )}

        <div className="grid grid-cols-5 gap-3">
          <label className="col-span-2 block space-y-1.5">
            <span className="block text-xs font-bold text-[#1E293B]">Duration</span>
            <input readOnly value={`${INTERVIEW_MINUTES} Minutes`} aria-label="Duration" className={`${fieldInputClass()} bg-slate-50 text-slate-500`} />
          </label>
          <div className="col-span-3 space-y-1.5">
            <span className="block text-xs font-bold text-[#1E293B]">
              Time Zone <span className="text-rose-500">*</span>
            </span>
            <Dropdown
              ariaLabel="Time Zone"
              sheetTitle="Time Zone"
              value={tz}
              options={TZ_OPTIONS}
              onChange={(v) => {
                setTz(v);
                setSlot(null);
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-[#1D4ED8]">Select Date</h3>
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
            <SlotCalendar
              selected={date}
              onSelect={(iso) => {
                setDate(iso);
                setSlot(null);
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#1D4ED8]">Available Slots ({tz})</h3>
          <p className="mt-0.5 text-[11.5px] text-slate-500">{date ? formatLongDate(date) : 'Select a date'}</p>
          {!date ? (
            <p className="mt-2.5 px-3 py-4 rounded-xl bg-slate-50 text-center text-[11.5px] text-slate-500">Please select a date to view available slots.</p>
          ) : slots.length === 0 ? (
            <p className="mt-2.5 px-3 py-4 rounded-xl bg-slate-50 text-center text-[11.5px] text-slate-500">No slots available for this date. Try another day.</p>
          ) : (
            <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Available slots">
              {slots.map((s) => {
                const on = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSlot(s)}
                    className={`h-10 rounded-xl border text-[12px] font-semibold tabular-nums transition-colors cursor-pointer ${
                      on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-200 text-slate-700 active:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px text-[#2F68FE]" />
          Zoom details and calendar invites will be generated upon confirmation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={close}
          disabled={saving}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!date || !slot || saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Scheduling…' : isReschedule ? 'Reschedule' : 'Schedule'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* ------------------------- "Interview Scheduled!" popup ------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ScheduledProps {
  isOpen: boolean;
  candidate: ShortlistedCandidate | null;
  /** Saves the extra attendees (desktop "Invite Additional Attendees") */
  onDone: (candidateId: string, attendees: string[]) => void;
}

const DetailRow: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; action?: React.ReactNode }> = ({ icon: Icon, label, children, action }) => (
  <div className="flex items-center gap-3 py-2.5">
    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[10.5px] text-slate-400">{label}</span>
      <span className="block text-[12.5px] font-bold text-[#1E293B] break-words">{children}</span>
    </span>
    {action}
  </div>
);

export const InterviewScheduledSheet: React.FC<ScheduledProps> = ({ isOpen, candidate, onDone }) => {
  const [attendees, setAttendees] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAttendees(candidate?.interview?.attendees ?? []);
    setDraft('');
    setError('');
    setCopied(false);
  }, [isOpen, candidate?.id]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const iv = candidate?.interview ?? null;

  const addEmail = () => {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!attendees.includes(value)) setAttendees((a) => [...a, value]);
    setDraft('');
    setError('');
  };

  const done = () => {
    // A typed but not yet added email is kept if it is valid
    const pending = draft.trim().toLowerCase();
    const next = pending && EMAIL.test(pending) && !attendees.includes(pending) ? [...attendees, pending] : attendees;
    if (candidate) onDone(candidate.id, next);
  };

  const copyLink = async () => {
    if (!iv?.zoomUrl) return;
    try {
      await navigator.clipboard.writeText(iv.zoomUrl);
    } catch {
      /* clipboard can be blocked in the prototype frame; the confirmation still shows */
    }
    setCopied(true);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={done} maxHeight="max-h-[92%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-3 pb-4">
        <div className="flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center">
            <Check className="w-8 h-8" strokeWidth={2.5} />
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-[#1E293B]">Interview Scheduled!</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            The interview with <span className="font-bold text-[#1E293B]">{candidate?.profile}</span> has been scheduled successfully.
          </p>
        </div>

        {iv && (
          <div className="mt-4 px-3.5 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            <DetailRow icon={Video} label="Meeting Platform">
              Zoom Meeting
            </DetailRow>
            <DetailRow
              icon={Link2}
              label="Meeting Link"
              action={
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy meeting link"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5 active:bg-slate-50 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              }
            >
              <span className="text-[#2F68FE]">{iv.zoomUrl}</span>
            </DetailRow>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="pr-2">
                <DetailRow icon={CalendarCheck} label="Date">
                  {formatLongDate(iv.date)}
                </DetailRow>
              </div>
              <div className="pl-3">
                <DetailRow icon={Clock3} label="Time">
                  {iv.time} ({iv.tz})
                </DetailRow>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B]">Invite Additional Attendees</span>
            {attendees.length > 0 && <span className="text-[11px] font-semibold text-[#2F68FE]">{attendees.length} Added</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="email"
              inputMode="email"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder="Enter email and press Enter"
              aria-label="Attendee email"
              aria-invalid={Boolean(error)}
              className={`${fieldInputClass(error)} flex-1 min-w-0`}
            />
            <button
              type="button"
              onClick={addEmail}
              disabled={!draft.trim()}
              aria-label="Add attendee"
              className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2F68FE] flex items-center justify-center active:bg-blue-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
          {attendees.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {attendees.map((a) => (
                <li key={a} className="h-7 pl-2.5 pr-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1 max-w-full">
                  <span className="truncate">{a}</span>
                  <button
                    type="button"
                    onClick={() => setAttendees((x) => x.filter((e) => e !== a))}
                    aria-label={`Remove ${a}`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-200 cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={done} className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          Done
        </button>
      </div>
    </BottomSheet>
  );
};
