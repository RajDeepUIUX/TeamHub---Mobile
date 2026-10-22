import React, { useEffect, useState } from 'react';
import { ArrowLeft, Briefcase, CalendarClock, Clock3, DollarSign, FileText, Info, ListChecks, MessagesSquare, Sparkles, Users, X } from 'lucide-react';
import type { DesignVersion } from '../staff/tabs/StaffTabParts';
import { formatShortDate } from '../data/clientInterviewsData';
import { StaffRequirement, formatTime12 } from '../data/clientRequirementsData';

interface Props {
  isOpen: boolean;
  requirement: StaffRequirement | null;
  onClose: () => void;
  /** Follows the list's V1 / V2 switch */
  version?: DesignVersion;
}

const dash = (v: string | number | null | undefined) => (v === undefined || v === null || v === '' ? '-' : String(v));

/** Yes / No / Maybe answers as a small badge */
const Answer: React.FC<{ value: string; square?: boolean }> = ({ value, square }) => {
  if (!value) return <>-</>;
  const tone = value === 'Yes' ? 'bg-[#E8F8F0] text-[#047857]' : value === 'Maybe' ? 'bg-[#FEF8E7] text-[#B45309]' : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center h-6 px-2.5 text-[11.5px] font-bold ${square ? 'rounded-md' : 'rounded-full'} ${tone}`}>{value}</span>;
};

/** Comma lists as chips */
const Chips: React.FC<{ items: string[]; square?: boolean }> = ({ items, square }) =>
  items.length ? (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className={`px-2.5 py-1 text-[11.5px] font-medium leading-snug ${square ? 'rounded-md bg-slate-100 text-[#1E293B]' : 'rounded-full bg-[#EEF2FF] text-[#4F46E5]'}`}
        >
          {i}
        </span>
      ))}
    </span>
  ) : (
    <>-</>
  );

/** "Offshore Location Preference" label with the desktop info tooltip */
const LocationLabel: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
  <span className="relative inline-flex items-start gap-1">
    <span>Offshore Location Preference</span>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label="About Offshore Location Preference"
      className="shrink-0 w-5 h-5 -mt-0.5 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
    >
      <Info className="w-3.5 h-3.5" />
    </button>
    {open && (
      <span role="tooltip" className="absolute top-full left-0 mt-1.5 z-10 w-[200px] px-2.5 py-2 rounded-lg bg-[#1E293B] text-white text-[11px] font-normal normal-case tracking-normal leading-snug shadow-lg">
        Offshore office locations the staff can work from.
      </span>
    )}
  </span>
);

type Field = { label: React.ReactNode; key: string; value: React.ReactNode; block?: boolean };
type Group = { title: string; icon: React.ElementType; fields: Field[] };

/** Desktop "View Requirement" offcanvas — every desktop field, same labels and values, grouped for mobile */
export const RequirementDetailSheet: React.FC<Props> = ({ isOpen, requirement: r, onClose, version = 'V1' }) => {
  const [tipOpen, setTipOpen] = useState(false);
  const v2 = version === 'V2';

  useEffect(() => {
    if (isOpen) setTipOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !r) return null;

  const overtime = (
    <span className="block space-y-0.5">
      <span className="block">Seasonal: {dash(r.overtimeSeasonal)}</span>
      <span className="block">ROY: {dash(r.overtimeRoy)}</span>
    </span>
  );
  const upto = r.availableUpto ? (
    <span className="block">
      <span className="block">{r.timezone}</span>
      <span className="block">{formatTime12(r.availableUpto)}</span>
    </span>
  ) : (
    '-'
  );

  /** Hero figures */
  const keyFacts = [
    { label: 'Hours/Week', value: r.hoursPerWeek ? `${r.hoursPerWeek} Hrs` : '-', icon: Clock3 },
    { label: 'Tentative Price', value: dash(r.pricing), icon: DollarSign },
    { label: 'No. of Staff', value: dash(r.staffCount), icon: Users },
    { label: 'Expected Start Date', value: r.startDate ? formatShortDate(r.startDate) : '-', icon: CalendarClock },
  ];

  const groups: Group[] = [
    {
      title: 'Role & Pricing',
      icon: Briefcase,
      fields: [
        { key: 'hiring', label: 'Hiring Type', value: dash(r.hiringType) },
        { key: 'level', label: 'Level', value: dash(r.level) },
        { key: 'budget', label: 'Budget Hourly Rate', value: dash(r.budgetRate) },
        { key: 'timeline', label: 'Onboarding Timeline', value: dash(r.timeline) },
      ],
    },
    {
      title: 'Availability & Location',
      icon: Clock3,
      fields: [
        { key: 'upto', label: 'Preferred Available Upto Time', value: upto },
        { key: 'ot', label: 'Overtime Requirement', value: overtime },
        { key: 'mode', label: 'Work Mode Preference', value: dash(r.workMode) },
        { key: 'loc', label: <LocationLabel open={tipOpen} onToggle={() => setTipOpen((o) => !o)} />, value: <Chips items={r.locations} square={v2} />, block: true },
      ],
    },
    {
      title: 'Communication & Tasks',
      icon: MessagesSquare,
      fields: [
        { key: 'endc', label: 'End Clients Communicate Needed?', value: <Answer value={r.endClientComm} square={v2} /> },
        { key: 'rep', label: 'Reporting To', value: dash(r.reportingTo) },
        { key: 'comm', label: 'Expected Communication Involvement', value: <Chips items={r.communication} square={v2} />, block: true },
        { key: 'tasks', label: 'Type of Task to be Handled', value: <Chips items={r.tasks} square={v2} />, block: true },
      ],
    },
    {
      title: 'Hiring Checks',
      icon: ListChecks,
      fields: [
        { key: 'us', label: 'Does the staff required to travel to US?', value: <Answer value={r.travelUS} square={v2} /> },
        { key: 'int', label: 'Interview Required?', value: <Answer value={r.interviewRequired} square={v2} /> },
        { key: 'tech', label: 'Technical Assessment Required?', value: <Answer value={r.technicalAssessment} square={v2} /> },
        { key: 'tax', label: 'Do the staff required to sign Tax Return?', value: <Answer value={r.signTaxReturn} square={v2} /> },
        { key: 'audit', label: 'Do the staff required to sign Audit Report?', value: <Answer value={r.signAuditReport} square={v2} /> },
      ],
    },
    {
      title: 'Other Details',
      icon: Sparkles,
      fields: [
        { key: 'sw', label: 'Are there any Specific Software requirements?', value: <Chips items={r.software} square={v2} />, block: true },
        { key: 'sk', label: 'Are there any Specific Technical Skills you’re looking for?', value: <Chips items={r.skills} square={v2} />, block: true },
        { key: 'q', label: 'Are there any Specific Qualifications you’re looking for?', value: <Chips items={r.qualifications} square={v2} />, block: true },
        { key: 'add', label: 'Anything specific you would like to add', value: dash(r.additionalNotes), block: true },
      ],
    },
  ];

  const jd = <p className="text-[13px] text-[#334155] leading-relaxed whitespace-pre-line break-words">{dash(r.jobDescription)}</p>;

  /* ------------------------------ V1: soft cards ------------------------------ */
  if (!v2) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="View Requirement"
        className="absolute inset-0 z-40 flex flex-col bg-[#F8FAFC] text-[#1E293B] animate-in fade-in slide-in-from-right-4 duration-200"
      >
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-8 select-text">
          <div className="bg-[#2F68FE] px-4 pt-3 pb-14 rounded-b-[28px]">
            <div className="h-10 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-white truncate">View Requirement</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center active:bg-white/25 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <span className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </span>
              <dl className="min-w-0">
                <dt className="text-[11px] font-medium text-white/70">Profile</dt>
                <dd className="mt-0.5 text-[18px] font-extrabold text-white leading-snug break-words">{dash(r.profile)}</dd>
                <dt className="sr-only">Domain</dt>
                <dd className="mt-1.5 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-white/15 text-[11px] font-semibold text-white">
                  <span className="text-white/70">Domain</span>
                  {dash(r.domain)}
                </dd>
              </dl>
            </div>
          </div>

          <dl className="-mt-10 mx-4 grid grid-cols-2 gap-2 p-2 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.25)]">
            {keyFacts.map((f) => (
              <div key={f.label} className="min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2.5 flex items-start gap-2">
                <f.icon className="w-4 h-4 mt-0.5 shrink-0 text-[#2F68FE]" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-medium text-slate-400 leading-tight">{f.label}</dt>
                  <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug tabular-nums break-words">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="px-4 mt-4 space-y-3">
            {groups.map((g) => (
              <section key={g.title} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4" aria-label={g.title}>
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                  <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center">
                    <g.icon className="w-4 h-4" />
                  </span>
                  {g.title}
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3.5">
                  {g.fields.map((f) => (
                    <div key={f.key} className={`min-w-0 ${f.block ? 'col-span-2' : ''}`}>
                      <dt className="text-[11px] font-medium text-slate-400 leading-snug">{f.label}</dt>
                      <dd className="mt-1 text-[13px] font-semibold text-[#1E293B] leading-snug break-words">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4" aria-label="Job Description">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
                Job Description
              </h3>
              <div className="mt-3 p-3 rounded-xl bg-[#F8FAFC] border border-dashed border-[#BFDBFE]">{jd}</div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ V2: compact spec sheet ------------------------------ */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View Requirement"
      className="absolute inset-0 z-40 flex flex-col bg-[#F8FAFC] text-[#1E293B] animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <header className="shrink-0 bg-white h-14 px-4 flex items-center gap-2 border-b border-[#EBF0F7]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold truncate">View Requirement</h2>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-8 select-text">
        <div className="bg-white border-b border-[#EBF0F7] px-4 pt-4 pb-4">
          <dl>
            <dt className="text-[10.5px] font-medium text-slate-400">Profile</dt>
            <dd className="mt-0.5 text-[17px] font-extrabold text-[#1E293B] leading-snug break-words">{dash(r.profile)}</dd>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
              <dt className="text-slate-500">Domain</dt>
              <dd className="font-semibold text-[#2F68FE]">{dash(r.domain)}</dd>
            </div>
          </dl>
          <dl className="mt-3.5 grid grid-cols-2 rounded-lg border border-slate-200 overflow-hidden">
            {keyFacts.map((f, i) => (
              <div key={f.label} className={`min-w-0 px-3 py-2.5 border-slate-200 ${i % 2 === 0 ? 'border-r' : ''} ${i > 1 ? 'border-t' : ''}`}>
                <dt className="text-[10.5px] font-medium text-slate-500 leading-tight">{f.label}</dt>
                <dd className={`mt-1 text-[15px] font-extrabold leading-tight tabular-nums break-words ${i === 1 ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="px-4 mt-3 space-y-3">
          {groups.map((g, gi) => (
            <section key={g.title} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" aria-label={g.title}>
              <h3 className="h-9 px-3.5 flex items-center gap-2 bg-[#F8FAFC] border-b border-[#EBF0F7] text-[11.5px] font-bold text-slate-600">
                <span className="w-5 h-5 rounded bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{gi + 1}</span>
                {g.title}
              </h3>
              <dl className="px-3.5 divide-y divide-dashed divide-slate-200">
                {g.fields.map((f) =>
                  f.block ? (
                    <div key={f.key} className="py-2.5">
                      <dt className="text-[12px] font-medium text-slate-500 leading-snug">{f.label}</dt>
                      <dd className="mt-1.5 text-[12.5px] font-semibold text-[#1E293B] leading-snug break-words">{f.value}</dd>
                    </div>
                  ) : (
                    <div key={f.key} className="py-2.5 flex items-start justify-between gap-3">
                      <dt className="min-w-0 text-[12px] font-medium text-slate-500 leading-snug">{f.label}</dt>
                      <dd className="shrink-0 max-w-[55%] text-right text-[12.5px] font-semibold text-[#1E293B] leading-snug break-words">{f.value}</dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          ))}

          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" aria-label="Job Description">
            <h3 className="h-9 px-3.5 flex items-center gap-2 bg-[#F8FAFC] border-b border-[#EBF0F7] text-[11.5px] font-bold text-slate-600">
              <span className="w-5 h-5 rounded bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{groups.length + 1}</span>
              Job Description
            </h3>
            <div className="px-3.5 py-3 border-l-[3px] border-[#2F68FE] m-3 rounded-r-md bg-[#F8FAFC]">{jd}</div>
          </section>
        </div>
      </div>
    </div>
  );
};
