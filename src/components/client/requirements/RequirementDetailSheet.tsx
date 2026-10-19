import React from 'react';
import { BottomSheet } from '../../common/BottomSheet';
import { FieldGrid, SheetHeader } from '../staff/tabs/StaffTabParts';
import { Tags } from '../interviews/CandidateResumeView';
import { formatShortDate } from '../data/clientInterviewsData';
import { StaffRequirement, formatTime12 } from '../data/clientRequirementsData';
import { RequirementStatusPill } from './RequirementParts';

interface Props {
  isOpen: boolean;
  requirement: StaffRequirement | null;
  onClose: () => void;
}

const dash = (v: string | number | null | undefined) => (v === undefined || v === null || v === '' ? '-' : String(v));

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="pt-4 mt-4 border-t border-slate-100 first:mt-0 first:pt-0 first:border-t-0">
    <h3 className="text-sm font-bold text-[#1D4ED8]">{title}</h3>
    {children}
  </section>
);

const TagBlock: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <div className="mt-3">
    <p className="text-[11px] text-slate-400">{label}</p>
    <div className="mt-1">{items.length ? <Tags items={items} /> : <p className="text-[13px] font-medium text-[#1E293B]">-</p>}</div>
  </div>
);

/** Desktop "View Requirement" offcanvas: every field the client entered, grouped for a phone */
export const RequirementDetailSheet: React.FC<Props> = ({ isOpen, requirement: r, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[94%]">
    <SheetHeader title="View Requirement" subtitle={r ? `${r.profile}${r.level ? ` · ${r.level}` : ''}` : undefined} onClose={onClose} />
    {r && (
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">Created {formatShortDate(r.createdOn)}</span>
          <RequirementStatusPill status={r.status} />
        </div>

        <Group title="Core Details">
          <FieldGrid
            fields={[
              { label: 'Hiring Type', value: dash(r.hiringType), wide: true },
              { label: 'Domain', value: dash(r.domain), wide: true },
              { label: 'Profile', value: dash(r.profile), wide: true },
              { label: 'Hours/Week', value: `${r.hoursPerWeek} Hrs` },
              { label: 'Level', value: dash(r.level) },
              { label: 'Tentative Price', value: dash(r.pricing) },
              { label: 'Budget Hourly Rate', value: r.budgetRate ? `$${r.budgetRate}` : '-' },
              { label: 'Onboarding Timeline', value: dash(r.timeline) },
              { label: 'Expected Start Date', value: formatShortDate(r.startDate) },
              { label: 'No. of Staff', value: dash(r.staffCount) },
              { label: 'Available Upto', value: `${formatTime12(r.availableUpto)} ${r.timezone}` },
              { label: 'Work Mode Preference', value: dash(r.workMode) },
            ]}
          />
          <TagBlock label="Offshore Location Preference" items={r.locations} />
        </Group>

        <Group title="Additional Details">
          <FieldGrid
            fields={[
              { label: 'End Clients Communicate Needed?', value: dash(r.endClientComm), wide: true },
              { label: 'Overtime (Seasonal)', value: dash(r.overtimeSeasonal) },
              { label: 'Overtime (ROY)', value: dash(r.overtimeRoy) },
              { label: 'Reporting To', value: dash(r.reportingTo) },
              { label: 'Interview Required?', value: dash(r.interviewRequired) },
              { label: 'Travel to US?', value: dash(r.travelUS) },
              { label: 'Technical Assessment Required?', value: dash(r.technicalAssessment) },
              { label: 'Sign Tax Return?', value: dash(r.signTaxReturn) },
              { label: 'Sign Audit Report?', value: dash(r.signAuditReport) },
            ]}
          />
          <TagBlock label="Expected Communication Involvement" items={r.communication} />
          <TagBlock label="Type of Task to be Handled" items={r.tasks} />
        </Group>

        <Group title="Other Details">
          <TagBlock label="Specific Software" items={r.software} />
          <TagBlock label="Specific Technical Skills" items={r.skills} />
          <TagBlock label="Specific Qualifications" items={r.qualifications} />
          <div className="mt-3">
            <p className="text-[11px] text-slate-400">Anything specific to add</p>
            <p className="mt-0.5 text-[13px] font-medium text-[#1E293B] leading-relaxed whitespace-pre-line">{dash(r.additionalNotes)}</p>
          </div>
        </Group>

        <Group title="Job Description">
          <p className="mt-2.5 text-[13px] font-medium text-[#1E293B] leading-relaxed whitespace-pre-line select-text">{dash(r.jobDescription)}</p>
        </Group>
      </div>
    )}
    <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
      <button type="button" onClick={onClose} className="w-full h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        Close
      </button>
    </div>
  </BottomSheet>
);
