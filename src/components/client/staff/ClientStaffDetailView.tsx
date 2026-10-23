import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarCheck,
  CalendarX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  GraduationCap,
  LayoutGrid,
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
import { BottomSheet } from '../../common/BottomSheet';
import { Card, CardHeading, DesignVersion, Field, InfoCard, RowList, ScreenHeader, SheetHeader } from './tabs/StaffTabParts';
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

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

/** Changes made on this screen, kept in ClientApp so they survive Back and module switches */
export interface StaffProfileEdits {
  contacts?: MappedContact[];
  sops?: SopRecord[];
}

type InfoGroup = { title: string; icon: React.ElementType; fields: Field[] };

/** V2 info section: one card per group, gradient icon heading, label / value rows (long values drop under the label) */
const InfoListV2: React.FC<{ groups: InfoGroup[] }> = ({ groups }) => (
  <div className="mt-2.5 space-y-3">
    {groups.map((g) => (
      <Card key={g.title} className="px-4 pt-4 pb-1">
        <CardHeading icon={g.icon} title={g.title} />
        <RowList className="mt-3 border-t border-slate-100" rows={g.fields} />
      </Card>
    ))}
  </div>
);

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
  /** Follows the My Staff V1 / V2 switch */
  version?: DesignVersion;
  onVersionChange?: (v: DesignVersion) => void;
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
  version = 'V1',
  onVersionChange,
}) => {
  const v2 = version === 'V2';
  const [tab, setTab] = useState<StaffProfileTab>(initialTab ?? 'Personal Information');
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsSentinelRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  // V2 "All sections" sheet
  const [sectionsOpen, setSectionsOpen] = useState(false);
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
  }, [v2]);

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

  const info = (groups: InfoGroup[]) => (v2 ? <InfoListV2 groups={groups} /> : <InfoCard groups={groups} />);

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
        return <StaffReportingToTab staffName={member.name} contacts={contacts} onChange={setContacts} v2={v2} />;
      case 'Attendance & Leave':
        return <StaffAttendanceLeaveTab member={member} workMode={work.currentMode} amends={amends} v2={v2} />;
      case 'Skills & Qualification':
        return <StaffSkillsTab skills={skills} v2={v2} />;
      case 'Employee Documents':
        return <StaffDocumentsTab documents={documents} staffName={member.name} v2={v2} />;
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
        return <StaffTrainingTab trainings={trainings} tniRequests={tniRequests} onOpenTrainingNeed={onOpenTrainingNeed} v2={v2} />;
      case 'System & IT Details':
        return <StaffSystemTab devices={devices} access={access} v2={v2} />;
      case 'Assessments':
        return <StaffAssessmentsTab assessments={assessments} v2={v2} />;
      case 'SOP':
        return <StaffSopTab staffName={member.name} clientName={clientName} sops={sops} onChange={setSops} v2={v2} />;
    }
  };

  const header = (
    <ScreenHeader
      title="Staff Details"
      onBack={onBack}
      backLabel="Back to My Staff"
      version={onVersionChange ? { versions: DESIGN_VERSIONS, value: version, onChange: onVersionChange } : undefined}
    />
  );

  if (v2) {
    const idx = STAFF_PROFILE_TABS.indexOf(tab);
    const CurrentIcon = TAB_ICONS[tab];
    const go = (t: StaffProfileTab) => {
      setTab(t);
      setSectionsOpen(false);
      // Keep the section bar pinned: jump back to the top of the content when it was scrolled past
      if (tabsStuck) tabsSentinelRef.current?.scrollIntoView({ block: 'start' });
    };
    return (
      <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
        {header}

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {/* Full-width profile hero */}
          <section className="relative overflow-hidden px-4 pt-3.5 pb-8 bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white">
            <span aria-hidden="true" className="absolute -top-12 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <span className="rounded-full ring-2 ring-white/30 shrink-0">
                <StaffAvatar name={member.name} tint={tint} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="flex-1 min-w-0 text-[15px] font-extrabold leading-tight truncate">{member.name}</h2>
                  <StaffStatusPill status={member.status} />
                </div>
                <p className="mt-0.5 text-[11.5px] text-white/80 leading-snug truncate">{member.designation}</p>
                <a
                  href={`mailto:${member.email}`}
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[11.5px] font-semibold text-white active:opacity-70"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
          </section>

          {/* Content sheet overlapping the hero */}
          <div className="relative -mt-5 rounded-t-[24px] bg-[#F8FAFC] pt-3">
            {leaving && (
              <div className="mx-4 mb-1 px-3.5 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white text-[#D97706] flex items-center justify-center shrink-0" aria-hidden="true">
                  <CalendarX className="w-4 h-4" />
                </span>
                <p className="text-[11.5px] text-amber-800">
                  Last working day: <strong className="font-bold">{formatStaffDate(member.lastWorkingDay!)}</strong>
                </p>
              </div>
            )}

            {/* Desktop tab bar → section stepper (prev / current · all sections / next) */}
            <div ref={tabsSentinelRef} className="h-px" aria-hidden="true" />
            <nav
              className={`sticky top-0 z-10 px-4 py-2.5 transition-colors duration-200 ${
                tabsStuck ? 'bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200/80' : 'border-b border-transparent'
              }`}
              aria-label="Staff profile sections"
            >
              <div className="flex items-center gap-1 p-1.5 bg-white border border-[#DCE3ED] rounded-2xl shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]">
                <button
                  type="button"
                  onClick={() => go(STAFF_PROFILE_TABS[idx - 1])}
                  disabled={idx === 0}
                  aria-label="Previous section"
                  className="w-9 h-10 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-30 disabled:active:bg-transparent cursor-pointer disabled:cursor-default"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSectionsOpen(true)}
                  aria-haspopup="dialog"
                  aria-label={`${tab}. Show all sections`}
                  className="flex-1 min-w-0 h-10 px-1.5 rounded-xl flex items-center gap-2.5 text-left active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                >
                  <span className="w-8 h-8 rounded-lg bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white flex items-center justify-center shrink-0" aria-hidden="true">
                    <CurrentIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-semibold text-slate-400 tabular-nums leading-tight">
                      {idx + 1} / {STAFF_PROFILE_TABS.length}
                    </span>
                    <span className="block text-[13px] font-bold text-[#1E293B] leading-tight truncate">{tab}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => go(STAFF_PROFILE_TABS[idx + 1])}
                  disabled={idx === STAFF_PROFILE_TABS.length - 1}
                  aria-label="Next section"
                  className="w-9 h-10 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-30 disabled:active:bg-transparent cursor-pointer disabled:cursor-default"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 mx-1 h-1 rounded-full bg-slate-200/80 overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#4F46E5] transition-[width] duration-300"
                  style={{ width: `${((idx + 1) / STAFF_PROFILE_TABS.length) * 100}%` }}
                />
              </div>
            </nav>

            <div key={tab} className="px-4 animate-in fade-in slide-in-from-bottom-1 duration-200" role="region" aria-label={tab}>
              {panel()}
            </div>
          </div>
        </div>

        <BottomSheet isOpen={sectionsOpen} onClose={() => setSectionsOpen(false)} maxHeight="max-h-[85%]">
          <SheetHeader title="Staff Profile Sections" subtitle={member.name} onClose={() => setSectionsOpen(false)} />
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-6">
            <div className="grid grid-cols-3 gap-2.5">
              {STAFF_PROFILE_TABS.map((t) => {
                const Icon = TAB_ICONS[t];
                const on = t === tab;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => go(t)}
                    aria-current={on ? 'true' : undefined}
                    className={`min-h-[92px] px-2 py-3 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                      on ? 'bg-[#EEF2FF] ring-2 ring-[#2F68FE]' : 'bg-[#F8FAFC] border border-[#EBF0F7] active:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        on ? 'bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white' : 'bg-white text-[#2F68FE] shadow-2xs'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={`text-[11px] font-semibold leading-tight ${on ? 'text-[#2F68FE]' : 'text-slate-600'}`}>{t}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <LayoutGrid className="w-3.5 h-3.5" /> {STAFF_PROFILE_TABS.length} sections
            </p>
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {header}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <section className="bg-white border border-[#DCE3ED] rounded-2xl px-3.5 py-3 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]">
            <div className="flex items-center gap-3">
              <StaffAvatar name={member.name} tint={tint} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="flex-1 min-w-0 text-[15px] font-extrabold leading-tight truncate">{member.name}</h2>
                  <StaffStatusPill status={member.status} />
                </div>
                <p className="mt-0.5 text-[11.5px] text-slate-500 leading-snug truncate">{member.designation}</p>
                <a
                  href={`mailto:${member.email}`}
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[11.5px] font-semibold text-[#2F68FE] active:opacity-70"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
            {leaving && (
              <p className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] text-amber-800">
                Last working day: <strong className="font-bold">{formatStaffDate(member.lastWorkingDay!)}</strong>
              </p>
            )}
          </section>
        </div>

        {/* Desktop tab bar → Manager My Profile sticky underline tabs (icon + label) */}
        <div ref={tabsSentinelRef} className="h-px -mb-px mt-3" aria-hidden="true" />
        <nav
          className={`sticky top-0 z-10 border-b border-slate-200/80 mb-1 transition-colors duration-200 ${
            tabsStuck ? 'bg-[#F8FAFC]/95 backdrop-blur-md' : 'bg-transparent'
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
