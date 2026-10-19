import React, { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, Check, Info, ListPlus, Minus, Plus } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { DatePickerSheet } from '../../common/DatePickerSheet';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { FieldGrid, SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import { HubProfile, HubRequirement, REQUIREMENT_HOURS, REQUIREMENT_MAX_STAFF } from '../data/clientStaffHubData';

export type ShortlistNext = 'schedule' | 'later';

interface Props {
  isOpen: boolean;
  profile: HubProfile | null;
  onClose: () => void;
  onConfirm: (requirement: HubRequirement, next: ShortlistNext) => void;
}

const HOURS_OPTIONS = REQUIREMENT_HOURS.map((h) => ({ value: h, label: h === 40 ? '40 Hours/Week (Full time)' : `${h} Hours/Week` }));

const NEXT_ACTIONS: { id: ShortlistNext; icon: React.ElementType; title: string; text: string }[] = [
  { id: 'schedule', icon: CalendarClock, title: 'Schedule the interview now', text: 'Pick a date and Zoom slot with this candidate.' },
  { id: 'later', icon: ListPlus, title: 'Shortlist now, schedule later', text: 'Add the candidate to Shortlisted Candidates and book the interview from there.' },
];

/**
 * Desktop "Add Staff Requirement" opened by Shortlist Candidate when the client has no requirement for the profile yet.
 * Domain, profile and level come from the resume; the client adds hours, start date and head count, then chooses the next action
 * (schedule now, or shortlist and schedule later). The full requirement form lives in the Staff Requirements module.
 */
export const HubRequirementSheet: React.FC<Props> = ({ isOpen, profile, onClose, onConfirm }) => {
  const [hours, setHours] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [staffCount, setStaffCount] = useState(1);
  const [next, setNext] = useState<ShortlistNext>('schedule');
  const [submitted, setSubmitted] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDateOpen(false);
    setHours(null);
    setStartDate('');
    setStaffCount(1);
    setNext('schedule');
    setSubmitted(false);
  }, [isOpen, profile?.id]);

  const hoursError = submitted && hours === null ? 'Hours/Week is required.' : undefined;
  const dateError = submitted && !startDate ? 'Tentative Start Date is required.' : undefined;

  const submit = () => {
    setSubmitted(true);
    if (hours === null || !startDate) return;
    onConfirm({ hoursPerWeek: hours, startDate, staffCount }, next);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[94%]">
      <SheetHeader title="Add Staff Requirement" subtitle={profile ? `${profile.profile} · ${profile.resumeId}` : undefined} onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-snug">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          You don&rsquo;t have a requirement for this profile yet. Add a few details and we&rsquo;ll create it, then shortlist this candidate.
        </p>

        {profile && (
          <div className="px-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50">
            <FieldGrid
              compact
              fields={[
                { label: 'Profile', value: profile.profile, wide: true },
                { label: 'Domain', value: profile.domain },
                { label: 'Level', value: profile.resume.level },
              ]}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">
            Hours/Week <span className="text-rose-500">*</span>
          </span>
          <Dropdown ariaLabel="Hours per week" sheetTitle="Hours/Week" value={hours} placeholder="Select hours" options={HOURS_OPTIONS} onChange={setHours} />
          {hoursError && <p className="px-0.5 text-[11px] font-medium text-rose-500">{hoursError}</p>}
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">
            Tentative Start Date <span className="text-rose-500">*</span>
          </span>
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            aria-label="Tentative Start Date"
            aria-invalid={Boolean(dateError)}
            className={`${fieldInputClass(dateError)} flex items-center justify-between gap-2 text-left cursor-pointer`}
          >
            <span className={`truncate ${startDate ? '' : 'text-slate-400'}`}>{startDate ? formatShortDate(startDate) : 'Select date'}</span>
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
          {dateError && <p className="px-0.5 text-[11px] font-medium text-rose-500">{dateError}</p>}
        </div>
        <DatePickerSheet
          isOpen={dateOpen}
          mode="single"
          title="Tentative Start Date"
          start={startDate || null}
          minDate={isoOfDate(new Date())}
          onClose={() => setDateOpen(false)}
          onApply={(iso) => {
            setStartDate(iso);
            setDateOpen(false);
          }}
        />

        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">
            No. of Staff <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStaffCount((n) => Math.max(1, n - 1))}
              disabled={staffCount <= 1}
              aria-label="Decrease staff count"
              className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="min-w-10 text-center text-base font-extrabold text-[#1E293B] tabular-nums" aria-live="polite">
              {staffCount}
            </span>
            <button
              type="button"
              onClick={() => setStaffCount((n) => Math.min(REQUIREMENT_MAX_STAFF, n + 1))}
              disabled={staffCount >= REQUIREMENT_MAX_STAFF}
              aria-label="Increase staff count"
              className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-[#1D4ED8]">Choose Next Action</h3>
          <div className="space-y-2.5" role="radiogroup" aria-label="Next action">
            {NEXT_ACTIONS.map(({ id, icon: Icon, title, text }) => {
              const on = next === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setNext(id)}
                  className={`w-full p-3.5 rounded-2xl border flex items-start gap-3 text-left transition-colors cursor-pointer ${
                    on ? 'border-[#2F68FE] bg-[#EFF6FF]' : 'border-slate-200 bg-white active:bg-slate-50'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B]">{title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-slate-500 leading-snug">{text}</span>
                  </span>
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-300 bg-white'}`}
                    aria-hidden="true"
                  >
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={submit} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          {next === 'schedule' ? 'Continue to Schedule' : 'Shortlist Candidate'}
        </button>
      </div>
    </BottomSheet>
  );
};

/** Desktop "Requirement Created Successfully!" popup, shown after a candidate is shortlisted without an interview */
export const HubShortlistedSheet: React.FC<{
  isOpen: boolean;
  profileLabel: string;
  onKeepBrowsing: () => void;
  onViewShortlisted?: () => void;
}> = ({ isOpen, profileLabel, onKeepBrowsing, onViewShortlisted }) => (
  <BottomSheet isOpen={isOpen} onClose={onKeepBrowsing} maxHeight="max-h-[70%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="px-5 pt-3 pb-4 flex flex-col items-center text-center">
      <span className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center">
        <Check className="w-8 h-8" strokeWidth={2.5} />
      </span>
      <h2 className="mt-3 text-lg font-extrabold text-[#1E293B]">Requirement Created Successfully!</h2>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
        The requirement has been added and <span className="font-bold text-[#1E293B]">{profileLabel}</span> was shortlisted. You can schedule the interview from
        Shortlisted Candidates whenever you&rsquo;re ready.
      </p>
    </div>
    <div className={`grid gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 ${onViewShortlisted ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <button type="button" onClick={onKeepBrowsing} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        Keep Browsing
      </button>
      {onViewShortlisted && (
        <button type="button" onClick={onViewShortlisted} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          View Shortlisted
        </button>
      )}
    </div>
  </BottomSheet>
);
