import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  GraduationCap,
  Laptop,
  ListChecks,
  Mail,
  MapPin,
  Sparkles,
  User,
  UserCheck,
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
  type MappedContact,
  type SopRecord,
  type StaffWorkMode,
} from '../data/clientStaffProfileData';
import type { AmendRequest } from '../data/clientAttendanceData';
import { StaffAvatar, StaffStatusPill } from './ClientStaffParts';
import { Field, InfoCard, ScreenHeader } from './tabs/StaffTabParts';
import { StaffReportingToTab } from './tabs/StaffReportingToTab';
import { StaffAttendanceLeaveTab } from './tabs/StaffAttendanceLeaveTab';
import { StaffSkillsTab } from './tabs/StaffSkillsTab';
import { StaffDocumentsTab } from './tabs/StaffDocumentsTab';
import { StaffTrainingTab } from './tabs/StaffTrainingTab';
import { StaffSystemTab } from './tabs/StaffSystemTab';
import { StaffAssessmentsTab } from './tabs/StaffAssessmentsTab';
import { StaffSopTab } from './tabs/StaffSopTab';

const TAB_ICONS: Record<StaffProfileTab, React.ElementType> = {
  'Personal Information': User,
  'Work Information': BriefcaseBusiness,
  'Reporting To': UserCheck,
  'Attendance & Leave': CalendarCheck,
  'Skills & Qualification': Sparkles,
  'Employee Documents': FileText,
  'Terms of Employment': FileSignature,
  'Training & Development': GraduationCap,
  'System & IT Details': Laptop,
  'Assessments': ClipboardCheck,
  SOP: ListChecks,
};

/** Changes made on this screen, kept in ClientApp so they survive Back and module switches */
export interface StaffProfileEdits {
  contacts?: MappedContact[];
  sops?: SopRecord[];
}

type InfoGroup = { title: string; icon: React.ElementType; fields: Field[] };

const dateParts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return { day: String(d.getDate()).padStart(2, '0'), month: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear() };
};
/** Desktop Personal Information date: "15 Nov, 1996" */
const formatBirthDate = (iso: string) => {
  const { day, month, year } = dateParts(iso);
  return `${day} ${month}, ${year}`;
};
/** Desktop Work Information date: "Jan, 01 2023" */
const formatStartDate = (iso: string) => {
  const { day, month, year } = dateParts(iso);
  return `${month}, ${day} ${year}`;
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
  /** Attendance Amend requests (approved ones show on Attendance & Leave) */
  amends?: AmendRequest[];
  /** Saved Reporting To / SOP changes for this staff member */
  edits?: StaffProfileEdits;
  onEdit?: (patch: StaffProfileEdits) => void;
}

/** Staff details (desktop eye icon in My Staff): profile header + desktop tabs */
export const ClientStaffDetailView: React.FC<ClientStaffDetailViewProps> = ({
  member,
  tint,
  clientName,
  onBack,
  initialTab,
  tniRequests,
  onOpenTrainingNeed,
  workModeOverride,
  amends,
  edits,
  onEdit,
}) => {
  const [tab, setTab] = useState<StaffProfileTab>(initialTab ?? 'Personal Information');
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsSentinelRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  const leaving = member.status !== 'Active' && member.status !== 'Replacement In-Progress' && member.lastWorkingDay;

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [tab]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = tabsSentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setTabsStuck(!entry.isIntersecting), { root, threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
  const [contacts, setContactsState] = useState(() => edits?.contacts ?? mappedContactsFor(member));
  const [sops, setSopsState] = useState(() => edits?.sops ?? sopsFor(member));
  const setContacts = (next: MappedContact[]) => {
    setContactsState(next);
    onEdit?.({ contacts: next });
  };
  const setSops = (next: SopRecord[]) => {
    setSopsState(next);
    onEdit?.({ sops: next });
  };

  const info = (groups: InfoGroup[]) => <InfoCard groups={groups} />;

  const panel = () => {
    switch (tab) {
      case 'Personal Information':
        return info([
          {
            title: 'Basic Details',
            icon: User,
            fields: [
              { label: 'Full Name', value: member.name },
              { label: 'Gender', value: member.gender },
              { label: 'Date of Birth', value: formatBirthDate(member.dateOfBirth) },
              { label: 'Nationality', value: member.nationality },
              { label: 'Marital Status', value: member.maritalStatus },
            ],
          },
          {
            title: 'Address Details',
            icon: MapPin,
            fields: [
              { label: 'Current City', value: member.currentCity, wide: true },
              { label: 'Permanent Address', value: member.permanentAddress, wide: true },
              { label: 'Correspondence Address', value: member.correspondenceAddress, wide: true },
              { label: 'Time Zone', value: member.timeZone },
            ],
          },
        ]);
      case 'Work Information':
        return info([
          {
            title: 'Job Details',
            icon: BriefcaseBusiness,
            fields: [
              { label: 'Designation', value: member.designation, wide: true },
              { label: 'Department', value: work.department },
              { label: 'Reporting Manager', value: work.reportingManager },
              { label: 'Employment Start Date', value: formatStartDate(work.employmentStartDate) },
            ],
          },
          {
            title: 'Work Modes',
            icon: Clock,
            fields: [
              { label: 'Current Mode', value: work.currentMode },
              { label: `Shift Timing Preferences (${member.timeZone})`, value: `${work.shiftFrom} - ${work.shiftTo}` },
            ],
          },
        ]);
      case 'Reporting To':
        return <StaffReportingToTab staffName={member.name} contacts={contacts} onChange={setContacts} />;
      case 'Attendance & Leave':
        return <StaffAttendanceLeaveTab member={member} workMode={work.currentMode} amends={amends} />;
      case 'Skills & Qualification':
        return <StaffSkillsTab skills={skills} />;
      case 'Employee Documents':
        return <StaffDocumentsTab documents={documents} staffName={member.name} />;
      case 'Terms of Employment':
        return info([
          {
            title: 'Terms of Employment',
            icon: FileSignature,
            fields: [
              { label: 'Notice Period', value: terms.noticePeriod },
              { label: 'Minimum Employment Period', value: terms.minimumEmploymentPeriod },
              { label: 'Employment Start Date', value: formatStaffDate(terms.employmentStartDate) },
              { label: 'Base Location', value: terms.baseLocation },
              { label: 'Branch Name', value: terms.branchName },
              { label: 'Employment Type', value: terms.employmentType },
            ],
          },
          {
            title: 'Shift',
            icon: Clock,
            fields: [
              { label: `Available Up To (${terms.shiftTimeZone})`, value: terms.availableUpTo },
              { label: `Tax Season Available Up To (${terms.shiftTimeZone})`, value: terms.taxSeasonAvailableUpTo },
            ],
          },
        ]);
      case 'Training & Development':
        return <StaffTrainingTab trainings={trainings} tniRequests={tniRequests} onOpenTrainingNeed={onOpenTrainingNeed} />;
      case 'System & IT Details':
        return <StaffSystemTab devices={devices} access={access} />;
      case 'Assessments':
        return <StaffAssessmentsTab assessments={assessments} />;
      case 'SOP':
        return <StaffSopTab staffName={member.name} clientName={clientName} sops={sops} onChange={setSops} />;
    }
  };

  const header = <ScreenHeader title="Staff Details" onBack={onBack} backLabel="Back to My Staff" />;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {header}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <StaffAvatar name={member.name} tint={tint} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="flex-1 min-w-0 text-sm font-bold leading-tight truncate">{member.name}</h2>
                  <span className="shrink-0">
                    <StaffStatusPill status={member.status} />
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-500 leading-snug truncate">{member.designation}</p>
                <a
                  href={`mailto:${member.email}`}
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-[#2F68FE] active:opacity-70"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
            {leaving && (
              <p className="px-3 py-2 border-t border-amber-200/50 bg-[#FEF8E7] text-xs text-amber-700">
                Last working day: <strong className="font-bold">{formatStaffDate(member.lastWorkingDay!)}</strong>
              </p>
            )}
          </section>
        </div>

        {/* Desktop tab bar → Manager My Profile sticky underline tabs (icon + label) */}
        <div ref={tabsSentinelRef} className="h-px -mb-px mt-3" aria-hidden="true" />
        <nav
          className={`sticky top-0 z-10 border-b border-[#EBF0F7] mb-1 transition-colors duration-200 ${
            tabsStuck ? 'bg-white/95 backdrop-blur-md' : 'bg-white'
          }`}
          aria-label="Staff profile sections"
        >
          <div ref={tabsRef} className="flex gap-1 overflow-x-auto no-scrollbar px-2" role="tablist">
            {STAFF_PROFILE_TABS.map((t) => {
              const Icon = TAB_ICONS[t];
              const on = t === tab;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t)}
                  className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t}
                  <span
                    className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                      on ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
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
