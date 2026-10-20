import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { formatShortDate } from '../data/clientInterviewsData';
import { StaffRequirement, formatTime12 } from '../data/clientRequirementsData';

interface Props {
  isOpen: boolean;
  requirement: StaffRequirement | null;
  onClose: () => void;
}

const dash = (v: string | number | null | undefined) => (v === undefined || v === null || v === '' ? '-' : String(v));
const list = (items: string[]) => (items.length ? items.join(', ') : '-');

const Item: React.FC<{ label: React.ReactNode; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
  <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
    <dt className="text-[11.5px] text-slate-400 leading-snug">{label}</dt>
    <dd className="mt-1 text-[13px] text-[#1E293B] leading-snug break-words whitespace-pre-line">{children}</dd>
  </div>
);

const Divider: React.FC<{ title: string }> = ({ title }) => (
  <div className="my-5 flex items-center gap-3" role="separator" aria-label={title}>
    <span className="flex-1 h-px bg-slate-200" />
    <span className="text-[12px] text-slate-400">{title}</span>
    <span className="flex-1 h-px bg-slate-200" />
  </div>
);

/** Desktop "View Requirement" offcanvas: blue header, two-column label / value grid, "Other Details" below a divider */
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View Requirement"
      className="absolute inset-0 z-40 flex flex-col bg-white text-[#1E293B] animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <header className="shrink-0 bg-[#2F68FE] h-14 pl-4 pr-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-white truncate">View Requirement</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-lg bg-white/95 text-[#1E293B] flex items-center justify-center active:bg-white shrink-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-8 select-text">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Item label="Hiring Type">{dash(r.hiringType)}</Item>
          <Item label="Domain">{dash(r.domain)}</Item>
          <Item label="Profile">{dash(r.profile)}</Item>
          <Item label="Hours/Week">{r.hoursPerWeek ? `${r.hoursPerWeek} Hrs` : '-'}</Item>
          <Item label="Level">{dash(r.level)}</Item>
          <Item label="Tentative Price">{dash(r.pricing)}</Item>
          <Item label="Budget Hourly Rate">{dash(r.budgetRate)}</Item>
          <Item label="Onboarding Timeline">{dash(r.timeline)}</Item>
          <Item label="Expected Start Date">{r.startDate ? formatShortDate(r.startDate) : '-'}</Item>
          <Item label="No. of Staff">{dash(r.staffCount)}</Item>
          <Item label="End Clients Communicate Needed?">{dash(r.endClientComm)}</Item>
          <Item label="Preferred Available Upto Time">{r.availableUpto ? `${r.timezone}\n${formatTime12(r.availableUpto)}` : '-'}</Item>
          <Item label="Overtime Requirement">{`Seasonal: ${dash(r.overtimeSeasonal)}\nROY: ${dash(r.overtimeRoy)}`}</Item>
          <Item label="Reporting To">{dash(r.reportingTo)}</Item>
          <Item label="Expected Communication Involvement">{list(r.communication)}</Item>
          <Item label="Type of Task to be Handled">{list(r.tasks)}</Item>
          <Item label="Does the staff required to travel to US?">{dash(r.travelUS)}</Item>
          <Item label="Interview Required?">{dash(r.interviewRequired)}</Item>
          <Item label="Technical Assessment Required?">{dash(r.technicalAssessment)}</Item>
          <Item label="Do the staff required to sign Tax Return?">{dash(r.signTaxReturn)}</Item>
          <Item label="Do the staff required to sign Audit Report?">{dash(r.signAuditReport)}</Item>
          <Item
            label={
              <span className="relative flex items-start justify-between gap-1">
                <span>Offshore Location Preference</span>
                <button
                  type="button"
                  onClick={() => setTipOpen((o) => !o)}
                  aria-expanded={tipOpen}
                  aria-label="About Offshore Location Preference"
                  className="shrink-0 w-5 h-5 -mt-0.5 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {tipOpen && (
                  <span role="tooltip" className="absolute top-full right-0 mt-1.5 z-10 w-[200px] px-2.5 py-2 rounded-lg bg-[#1E293B] text-white text-[11px] leading-snug shadow-lg">
                    Offshore office locations the staff can work from.
                  </span>
                )}
              </span>
            }
          >
            {list(r.locations)}
          </Item>
          <Item label="Work Mode Preference">{dash(r.workMode)}</Item>
        </dl>

        <Divider title="Other Details" />

        <dl className="space-y-4">
          <Item label="Are there any Specific Software requirements?">{list(r.software)}</Item>
          <Item label="Are there any Specific Technical Skills you’re looking for?">{list(r.skills)}</Item>
          <Item label="Are there any Specific Qualifications you’re looking for?">{list(r.qualifications)}</Item>
          <Item label="Anything specific you would like to add">{dash(r.additionalNotes)}</Item>
          <Item label="Job Description">{dash(r.jobDescription)}</Item>
        </dl>
      </div>
    </div>
  );
};
