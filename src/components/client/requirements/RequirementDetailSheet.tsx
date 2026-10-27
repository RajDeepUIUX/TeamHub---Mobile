import React, { useEffect, useState } from 'react';
import { Briefcase, CalendarClock, Clock3, DollarSign, FileText, Info, ListChecks, MessagesSquare, Sparkles, Users } from 'lucide-react';
import { InfoSheet, ScreenHeader } from '../staff/tabs/StaffTabParts';
import { formatShortDate } from '../data/clientInterviewsData';
import { StaffRequirement, formatTime12 } from '../data/clientRequirementsData';

interface Props {
  isOpen: boolean;
  requirement: StaffRequirement | null;
  onClose: () => void;
}

const dash = (v: string | number | null | undefined) => (v === undefined || v === null || v === '' ? '-' : String(v));

/** Yes / No / Maybe answers as a small badge */
const Answer: React.FC<{ value: string }> = ({ value }) => {
  if (!value) return <>-</>;
  const tone = value === 'Yes' ? 'bg-[#E8F8F0] text-[#10B981]' : value === 'Maybe' ? 'bg-[#FEF8E7] text-[#D97706]' : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center h-6 px-2.5 text-[11px] font-bold rounded-full ${tone}`}>{value}</span>;
};

/** Comma lists as chips */
const Chips: React.FC<{ items: string[] }> = ({ items }) =>
  items.length ? (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="px-2 py-0.5 text-[11px] font-semibold leading-snug rounded-md bg-blue-50 text-[#2F68FE]">
          {i}
        </span>
      ))}
    </span>
  ) : (
    <>-</>
  );

/** "Offshore Location Preference" label; ⓘ opens the desktop tooltip copy in a bottom sheet */
const LocationLabel: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <span className="inline-flex items-start gap-1">
    <span>Offshore Location Preference</span>
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label="About Offshore Location Preference"
      className="shrink-0 w-5 h-5 -mt-0.5 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
    >
      <Info className="w-3.5 h-3.5" />
    </button>
  </span>
);

type Field = { label: React.ReactNode; key: string; value: React.ReactNode; block?: boolean };
type Group = { title: string; icon: React.ElementType; fields: Field[] };

/** Desktop "View Requirement" offcanvas — every desktop field, same labels and values, grouped for mobile */
export const RequirementDetailSheet: React.FC<Props> = ({ isOpen, requirement: r, onClose }) => {
  const [tipOpen, setTipOpen] = useState(false);

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
        { key: 'loc', label: <LocationLabel onOpen={() => setTipOpen(true)} />, value: <Chips items={r.locations} />, block: true },
      ],
    },
    {
      title: 'Communication & Tasks',
      icon: MessagesSquare,
      fields: [
        { key: 'endc', label: 'End Clients Communicate Needed?', value: <Answer value={r.endClientComm} /> },
        { key: 'rep', label: 'Reporting To', value: dash(r.reportingTo) },
        { key: 'comm', label: 'Expected Communication Involvement', value: <Chips items={r.communication} />, block: true },
        { key: 'tasks', label: 'Type of Task to be Handled', value: <Chips items={r.tasks} />, block: true },
      ],
    },
    {
      title: 'Hiring Checks',
      icon: ListChecks,
      fields: [
        { key: 'us', label: 'Does the staff required to travel to US?', value: <Answer value={r.travelUS} /> },
        { key: 'int', label: 'Interview Required?', value: <Answer value={r.interviewRequired} /> },
        { key: 'tech', label: 'Technical Assessment Required?', value: <Answer value={r.technicalAssessment} /> },
        { key: 'tax', label: 'Do the staff required to sign Tax Return?', value: <Answer value={r.signTaxReturn} /> },
        { key: 'audit', label: 'Do the staff required to sign Audit Report?', value: <Answer value={r.signAuditReport} /> },
      ],
    },
    {
      title: 'Other Details',
      icon: Sparkles,
      fields: [
        { key: 'sw', label: 'Are there any Specific Software requirements?', value: <Chips items={r.software} />, block: true },
        { key: 'sk', label: 'Are there any Specific Technical Skills you’re looking for?', value: <Chips items={r.skills} />, block: true },
        { key: 'q', label: 'Are there any Specific Qualifications you’re looking for?', value: <Chips items={r.qualifications} />, block: true },
        { key: 'add', label: 'Anything specific you would like to add', value: dash(r.additionalNotes), block: true },
      ],
    },
  ];

  const jd = <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line break-words">{dash(r.jobDescription)}</p>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View Requirement"
      className="absolute inset-0 z-40 flex flex-col bg-[#F8FAFC] text-[#1E293B] animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <ScreenHeader title="View Requirement" onBack={onClose} backLabel="Close" />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-8 space-y-3 select-text">
        <section className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs p-4" aria-label="Profile">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </span>
            <dl className="min-w-0">
              <dt className="sr-only">Profile</dt>
              <dd className="text-base font-bold text-[#1E293B] leading-snug break-words">{dash(r.profile)}</dd>
              <dt className="sr-only">Domain</dt>
              <dd className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-semibold text-[#2F68FE]">
                <span className="text-slate-500 font-medium">Domain</span>
                {dash(r.domain)}
              </dd>
            </dl>
          </div>

          <dl className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2">
            {keyFacts.map((f) => (
              <div key={f.label} className="min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-start gap-2">
                <f.icon className="w-4 h-4 mt-px shrink-0 text-[#2F68FE]" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-slate-400 leading-tight">{f.label}</dt>
                  <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug tabular-nums break-words">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {groups.map((g) => (
          <section key={g.title} className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs p-4" aria-label={g.title}>
            <h3 className="flex items-center gap-2.5 text-sm font-bold text-[#1E293B]">
              <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <g.icon className="w-4 h-4" />
              </span>
              {g.title}
            </h3>
            <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
              {g.fields.map((f) => (
                <div key={f.key} className={`min-w-0 ${f.block ? 'col-span-2' : ''}`}>
                  <dt className="text-[11px] font-medium text-slate-400 leading-snug">{f.label}</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#1E293B] leading-snug break-words">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs p-4" aria-label="Job Description">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-[#1E293B]">
            <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            Job Description
          </h3>
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">{jd}</div>
        </section>
      </div>

      <InfoSheet isOpen={tipOpen} title="Offshore Location Preference" onClose={() => setTipOpen(false)}>
        Offshore office locations the staff can work from.
      </InfoSheet>
    </div>
  );
};
