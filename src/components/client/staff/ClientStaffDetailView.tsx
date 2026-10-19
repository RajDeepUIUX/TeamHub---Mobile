import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  FileCog,
  FileSignature,
  FolderOpen,
  GraduationCap,
  Mail,
  MonitorSmartphone,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { TniRequest } from '../data/clientTrainingNeedData';
import { ClientStaffMember, STAFF_PROFILE_TABS, StaffProfileTab, formatStaffDate } from '../data/clientStaffData';
import {
  assessmentsFor,
  devicesFor,
  documentsFor,
  mappedContactsFor,
  skillsFor,
  sopsFor,
  systemAccessFor,
  termsFor,
  trainingsFor,
  workInfoFor,
  type StaffWorkMode,
} from '../data/clientStaffProfileData';
import { StaffAvatar, StaffStatusPill } from './ClientStaffParts';
import { InfoCard, TabTitle } from './tabs/StaffTabParts';
import { StaffReportingToTab } from './tabs/StaffReportingToTab';
import { StaffAttendanceLeaveTab } from './tabs/StaffAttendanceLeaveTab';
import { StaffSkillsTab } from './tabs/StaffSkillsTab';
import { StaffDocumentsTab } from './tabs/StaffDocumentsTab';
import { StaffTrainingTab } from './tabs/StaffTrainingTab';
import { StaffSystemTab } from './tabs/StaffSystemTab';
import { StaffAssessmentsTab } from './tabs/StaffAssessmentsTab';
import { StaffSopTab } from './tabs/StaffSopTab';

const TAB_ICONS: Record<StaffProfileTab, React.ElementType> = {
  'Personal Information': UserRound,
  'Work Information': Briefcase,
  'Reporting To': UsersRound,
  'Attendance & Leave': CalendarCheck,
  'Skills & Qualification': BadgeCheck,
  'Employee Documents': FolderOpen,
  'Terms of Employment': FileSignature,
  'Training & Development': GraduationCap,
  'System & IT Details': MonitorSmartphone,
  Assessments: ClipboardCheck,
  SOP: FileCog,
};

interface ClientStaffDetailViewProps {
  member: ClientStaffMember;
  tint: number;
  /** Signed-in client contact (SOP decisions & feedback author) */
  clientName: string;
  onBack: () => void;
  /** Tab to open first (e.g. Attendance & Leave from a leave notification) */
  initialTab?: StaffProfileTab;
  /** TNI requests raised for this staff member */
  tniRequests?: TniRequest[];
  onOpenTrainingNeed?: () => void;
  /** Work mode set in Staff Work Flexibility */
  workModeOverride?: StaffWorkMode;
}

/** Staff details (desktop eye icon in My Staff): profile header + desktop tabs */
export const ClientStaffDetailView: React.FC<ClientStaffDetailViewProps> = ({ member, tint, clientName, onBack, initialTab, tniRequests, onOpenTrainingNeed, workModeOverride }) => {
  const [tab, setTab] = useState<StaffProfileTab>(initialTab ?? 'Personal Information');
  const tabsRef = useRef<HTMLDivElement>(null);
  const leaving = member.status !== 'Active' && member.status !== 'Replacement In-Progress' && member.lastWorkingDay;

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [tab]);

  const work = useMemo(() => {
    const info = workInfoFor(member);
    return workModeOverride ? { ...info, currentMode: workModeOverride } : info;
  }, [member, workModeOverride]);
  const terms = useMemo(() => termsFor(member), [member]);
  const skills = useMemo(() => skillsFor(member), [member]);
  const documents = useMemo(() => documentsFor(member), [member]);
  const trainings = useMemo(() => trainingsFor(member), [member]);
  const devices = useMemo(() => devicesFor(member), [member]);
  const access = useMemo(() => systemAccessFor(member), [member]);
  const assessments = useMemo(() => assessmentsFor(member), [member]);
  // Editable on this screen (kept while switching tabs)
  const [contacts, setContacts] = useState(() => mappedContactsFor(member));
  const [sops, setSops] = useState(() => sopsFor(member));

  const panel = () => {
    switch (tab) {
      case 'Personal Information':
        return (
          <>
            <TabTitle title="Personal Information" />
            <InfoCard
              groups={[
                {
                  title: 'Basic Details',
                  fields: [
                    { label: 'Full Name', value: member.name },
                    { label: 'Gender', value: member.gender },
                    { label: 'Date of Birth', value: formatStaffDate(member.dateOfBirth) },
                    { label: 'Nationality', value: member.nationality },
                    { label: 'Marital Status', value: member.maritalStatus },
                  ],
                },
                {
                  title: 'Address Details',
                  fields: [
                    { label: 'Current City', value: member.currentCity },
                    { label: 'Time Zone', value: member.timeZone },
                    { label: 'Permanent Address', value: member.permanentAddress, wide: true },
                    { label: 'Correspondence Address', value: member.correspondenceAddress, wide: true },
                  ],
                },
              ]}
            />
          </>
        );
      case 'Work Information':
        return (
          <>
            <TabTitle title="Work Information" />
            <InfoCard
              groups={[
                {
                  title: 'Job Details',
                  fields: [
                    { label: 'Designation', value: member.designation, wide: true },
                    { label: 'Department', value: work.department },
                    { label: 'Reporting Manager', value: work.reportingManager },
                    { label: 'Engagement Type', value: member.engagementType },
                    { label: 'Employment Start Date', value: formatStaffDate(work.employmentStartDate) },
                  ],
                },
                {
                  title: 'Work Modes',
                  fields: [
                    { label: 'Current Mode', value: work.currentMode },
                    { label: `Shift Timing Preferences (${member.timeZone})`, value: `${work.shiftFrom} - ${work.shiftTo}` },
                  ],
                },
              ]}
            />
          </>
        );
      case 'Reporting To':
        return <StaffReportingToTab staffName={member.name} contacts={contacts} onChange={setContacts} />;
      case 'Attendance & Leave':
        return <StaffAttendanceLeaveTab member={member} workMode={work.currentMode} />;
      case 'Skills & Qualification':
        return <StaffSkillsTab skills={skills} />;
      case 'Employee Documents':
        return <StaffDocumentsTab documents={documents} staffName={member.name} />;
      case 'Terms of Employment':
        return (
          <>
            <TabTitle title="Terms of Employment" />
            <InfoCard
              groups={[
                {
                  title: 'Terms of Employment',
                  fields: [
                    { label: 'Notice Period', value: terms.noticePeriod },
                    { label: 'Probation Period', value: terms.probationPeriod },
                    { label: 'Minimum Employment Period', value: terms.minimumEmploymentPeriod },
                    { label: 'Employment Start Date', value: formatStaffDate(terms.employmentStartDate) },
                    { label: 'Joining Bonus', value: terms.joiningBonus },
                    { label: 'Buy Out Notice Period', value: terms.buyOutNoticePeriod },
                    { label: 'Next Appraisal Date', value: formatStaffDate(terms.nextAppraisalDate) },
                    { label: 'Base Location', value: terms.baseLocation },
                    { label: 'Branch Name', value: terms.branchName },
                    { label: 'OT Availability', value: terms.otAvailability },
                    { label: 'Employment Type', value: terms.employmentType },
                  ],
                },
                {
                  title: 'Shift',
                  fields: [
                    { label: `Available Up To (${member.timeZone})`, value: terms.availableUpTo },
                    { label: `Tax Season Available Up To (${member.timeZone})`, value: terms.taxSeasonAvailableUpTo },
                  ],
                },
              ]}
            />
          </>
        );
      case 'Training & Development':
        return <StaffTrainingTab trainings={trainings} tniRequests={tniRequests} onOpenTrainingNeed={onOpenTrainingNeed} />;
      case 'System & IT Details':
        return <StaffSystemTab devices={devices} access={access} />;
      case 'Assessments':
        return <StaffAssessmentsTab assessments={assessments} staffName={member.name} />;
      case 'SOP':
        return <StaffSopTab staffName={member.name} clientName={clientName} sops={sops} onChange={setSops} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to My Staff"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">Staff Details</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 min-w-0">
            <span className="shrink-0">Human Resources</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <button type="button" onClick={onBack} className="shrink-0 hover:text-[#2F68FE] cursor-pointer">
              My Staff
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-600 truncate">{member.name}</span>
          </p>

          <section className="mt-2.5 bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <StaffAvatar name={member.name} tint={tint} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-extrabold leading-tight truncate">{member.name}</h2>
                <p className="mt-0.5 text-xs text-slate-500 leading-snug">{member.designation}</p>
                <div className="mt-1.5">
                  <StaffStatusPill status={member.status} full />
                </div>
              </div>
            </div>
            <a
              href={`mailto:${member.email}`}
              className="mt-3.5 h-10 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-600 active:bg-slate-100"
            >
              <Mail className="w-4 h-4 text-[#2F68FE] shrink-0" />
              <span className="truncate">{member.email}</span>
            </a>
            {leaving && (
              <p className="mt-2.5 px-3 py-2 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] text-amber-800">
                Last working day: <strong className="font-bold">{formatStaffDate(member.lastWorkingDay!)}</strong>
              </p>
            )}
          </section>
        </div>

        {/* Desktop tab bar → Staff My Profile sticky pill tabs */}
        <nav className="sticky top-0 z-10 mt-3 bg-[#F8FAFC]/95 backdrop-blur-md pt-1 pb-2" aria-label="Staff profile sections">
          <div ref={tabsRef} className="flex gap-1.5 overflow-x-auto no-scrollbar px-4" role="tablist">
            {STAFF_PROFILE_TABS.map((t) => {
              const on = t === tab;
              const Icon = TAB_ICONS[t];
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t)}
                  className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.6)]' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t}
                </button>
              );
            })}
          </div>
        </nav>

        <div key={tab} className="px-4 pt-2 animate-in fade-in duration-200" role="tabpanel" aria-label={tab}>
          {panel()}
        </div>
      </div>
    </div>
  );
};
