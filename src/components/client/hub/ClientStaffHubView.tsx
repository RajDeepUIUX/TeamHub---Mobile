import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Briefcase, CalendarClock, ChevronRight, Headset, Info, Loader2, MapPin, SearchX, Store, X } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { BottomSheet } from '../../common/BottomSheet';
import { ScreenHeader, Card, DesignVersion, EmptyCard, Pill, SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { InterviewScheduleSheet, InterviewScheduledSheet } from '../interviews/InterviewScheduleSheet';
import { ScheduledInterview, ShortlistedCandidate } from '../data/clientInterviewsData';
import {
  EMPTY_HUB_FILTERS,
  HUB_JOINING_OPTIONS,
  HUB_PAGE_SIZE,
  HUB_RATE_OPTIONS,
  HubFilters,
  HubProfile,
  HubRequirement,
  candidateFromProfile,
  cardSkillsOf,
  costBreakdownOf,
  hasRequirementFor,
  hubFilterCount,
  joiningLabel,
  labelOfRange,
  matchesHubProfile,
  rateLabel,
  totalExperienceLabel,
  totalExperienceMonths,
} from '../data/clientStaffHubData';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import { StaffRequirement, hasOpenRequirementFor, requirementsFromHub } from '../data/clientRequirementsData';
import { isoOfDate } from '../data/clientInterviewsData';
import { HubFilterOptions, HubFilterSheet } from './HubFilterSheet';
import { DomainTile, HubListSkeleton, SkillLine } from './HubParts';
import { HubRequirementSheet, HubShortlistedSheet, ShortlistNext } from './HubRequirementSheet';
import { HubResumeView, HubResumeViewV1 } from './HubResumeView';

interface Props {
  profiles: HubProfile[];
  /** Shortlisted Candidates live in ClientApp; shortlisting a profile adds a row there */
  candidates: ShortlistedCandidate[];
  /** Saved Resumes (profile ids) live in ClientApp so they're kept while switching modules */
  savedIds: string[];
  onToggleSave: (profileId: string) => void;
  onShortlist: (candidate: ShortlistedCandidate) => void;
  onUpdateCandidate: (id: string, patch: Partial<ShortlistedCandidate>) => void;
  /** Staff Requirements: an open one for the profile skips "Add Staff Requirement"; the sheet adds rows there */
  requirements: StaffRequirement[];
  onCreateRequirements: (created: StaffRequirement[]) => void;
  /** Opens Hire New Staff â€º Shortlisted Candidates (needs access to that module) */
  onOpenShortlisted?: () => void;
  onContactManager: () => void;
  /** Staff Requirement "Available Resumes" opens the list filtered to that profile (desktop `selected_profile_id`) */
  initialProfile?: string | null;
  /** Dashboard › Previously Saved Profiles opens the Saved Resumes tab, optionally straight on one resume (its Back returns to the Dashboard) */
  initialTab?: Tab;
  initialResumeId?: string | null;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type Tab = 'available' | 'saved';
type Sheet = 'filter' | 'requirement' | 'schedule' | 'scheduled' | 'shortlisted' | null;

interface TabState {
  query: string;
  filters: HubFilters;
  pages: number;
}

const INITIAL_TAB: TabState = { query: '', filters: EMPTY_HUB_FILTERS, pages: 1 };

/** Desktop loads the cards by ajax */
const LOAD_MS = 600;

const TAB_LABEL: Record<Tab, string> = { available: 'Available Resumes', saved: 'Saved Resumes' };

const sortedUnique = (values: string[]) => [...new Set(values)].sort();

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

/**
 * Hire New Staff â€º Available Staff Hub (desktop `staffingMarketplace`): Available Resumes and Saved Resumes tabs, search +
 * filters, resume cards (profile, level, experience, joining, location, skills, rate), View Resume, Save / Remove from Saved
 * Resumes and Shortlist Candidate (add requirement when none exists â†’ schedule the Zoom interview or shortlist for later).
 */
export const ClientStaffHubView: React.FC<Props> = ({
  profiles,
  candidates,
  savedIds,
  onToggleSave,
  onShortlist,
  onUpdateCandidate,
  requirements,
  onCreateRequirements,
  onOpenShortlisted,
  onContactManager,
  initialProfile,
  initialTab = 'available',
  initialResumeId,
  onBack,
}) => {
  // view = View Resume; add = Shortlist Candidate and Save / Remove from Saved Resumes; download = psychometric test, certificates, reports
  const { view: canView, add: canAdd, download: canDownload } = useClientPermission('staff-hub');

  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [tabState, setTabState] = useState<Record<Tab, TabState>>(() => ({
    available: initialProfile ? { ...INITIAL_TAB, filters: { ...EMPTY_HUB_FILTERS, profiles: [initialProfile] } } : INITIAL_TAB,
    saved: INITIAL_TAB,
  }));
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [entryResumeId] = useState(canView ? (initialResumeId ?? null) : null);
  const [resumeId, setResumeId] = useState<string | null>(entryResumeId);
  // Card whose skills sheet ("Show More") is open, and the card whose price info is open
  const [skillsId, setSkillsId] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  // Profile being shortlisted + the requirement the client typed in (kept while the schedule sheet is open)
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [requirement, setRequirement] = useState<HubRequirement | null>(null);
  const [createdProfile, setCreatedProfile] = useState<string>('');
  const [scheduledCandidateId, setScheduledCandidateId] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const patchTab = (patch: Partial<TabState>) => setTabState((s) => ({ ...s, [tab]: { ...s[tab], ...patch } }));
  const reload = () => {
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };

  /* ---------- Data ---------- */

  // Desktop hides profiles the client already shared / shortlisted
  const shortlistedResumeIds = useMemo(() => new Set(candidates.map((c) => c.resumeId)), [candidates]);
  const pool = useMemo(() => profiles.filter((p) => !shortlistedResumeIds.has(p.resumeId)), [profiles, shortlistedResumeIds]);
  const savedPool = useMemo(() => pool.filter((p) => savedIds.includes(p.id)), [pool, savedIds]);
  const source = tab === 'available' ? pool : savedPool;

  const options = useMemo<HubFilterOptions>(
    () => ({
      domains: sortedUnique(pool.map((p) => p.domain)),
      profiles: pool.map((p) => ({ name: p.profile, domain: p.domain })),
      software: sortedUnique(pool.flatMap((p) => p.resume.softwareSkills)),
      skills: sortedUnique(pool.flatMap((p) => p.resume.technicalSkills)),
      locations: sortedUnique(pool.map((p) => p.location)),
      qualifications: sortedUnique(pool.flatMap((p) => p.resume.qualifications)),
    }),
    [pool],
  );

  const { query, filters, pages } = tabState[tab];
  const results = source.filter((p) => matchesHubProfile(p, query, filters));
  const visible = results.slice(0, pages * HUB_PAGE_SIZE);
  const filterCount = hubFilterCount(filters);
  const isFiltered = filterCount > 0 || query.trim().length > 0;

  const profileOf = (id: string | null) => profiles.find((p) => p.id === id) ?? null;
  const resumeProfile = profileOf(resumeId);
  const shortlistProfile = profileOf(shortlistId);
  const scheduledCandidate = candidates.find((c) => c.id === scheduledCandidateId) ?? null;

  /* ---------- Actions ---------- */

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setTabState((s) => ({ ...s, [next]: { ...s[next], pages: 1 } }));
    reload();
  };

  const applyFilters = (next: HubFilters) => {
    patchTab({ filters: next, pages: 1 });
    reload();
  };

  const clearAll = () => {
    patchTab({ query: '', filters: EMPTY_HUB_FILTERS, pages: 1 });
    reload();
  };

  const toggleSave = (p: HubProfile) => {
    const wasSaved = savedIds.includes(p.id);
    onToggleSave(p.id);
    showNotice(wasSaved ? 'Resume removed from Saved Resumes.' : 'Resume added to Saved Resumes successfully.');
  };

  const startShortlist = (p: HubProfile) => {
    if (!canAdd) return;
    setShortlistId(p.id);
    setRequirement(null);
    // Desktop: an open requirement for the profile â†’ straight to the scheduler, otherwise "Add Staff Requirement"
    setSheet(hasOpenRequirementFor(requirements, p.profile) || hasRequirementFor(candidates, p.profile) ? 'schedule' : 'requirement');
  };

  const confirmRequirement = (req: HubRequirement, next: ShortlistNext) => {
    const p = shortlistProfile;
    if (!p) return;
    setRequirement(req);
    if (next === 'schedule') {
      setSheet('schedule');
      return;
    }
    onCreateRequirements(requirementsFromHub(p, req, isoOfDate(new Date())));
    onShortlist(candidateFromProfile(p));
    setCreatedProfile(`${p.profile} (${p.resumeId})`);
    setSheet('shortlisted');
  };

  const schedule = (_pendingId: string, interview: ScheduledInterview) => {
    const p = shortlistProfile;
    if (!p) return;
    const candidate = candidateFromProfile(p, { status: 'Interview Scheduled', interview });
    // The requirement typed in "Add Staff Requirement" is saved once the interview is booked
    if (requirement) onCreateRequirements(requirementsFromHub(p, requirement, isoOfDate(new Date())));
    onShortlist(candidate);
    setScheduledCandidateId(candidate.id);
    setSheet('scheduled');
  };

  const finishScheduled = (id: string, attendees: string[]) => {
    const c = candidates.find((x) => x.id === id);
    if (c?.interview) onUpdateCandidate(id, { interview: { ...c.interview, attendees } });
    setSheet(null);
    const created = requirement !== null;
    showNotice(
      attendees.length
        ? `${created ? 'Requirement created. ' : ''}Calendar invites sent to you and ${attendees.length} more ${attendees.length === 1 ? 'attendee' : 'attendees'}.`
        : `${created ? 'Requirement created. ' : ''}Interview scheduled. A calendar invite was sent to you.`,
    );
    setRequirement(null);
  };

  // Candidate shown in the scheduler before it exists in the list: name stays hidden, only the Resume ID is shown
  const pendingCandidate = useMemo(
    () => (shortlistProfile ? candidateFromProfile(shortlistProfile, { name: `Resume ${shortlistProfile.resumeId}` }) : null),
    [shortlistProfile],
  );

  /* ---------- Card ---------- */

  const card = (p: HubProfile) => {
    const r = p.resume;
    const saved = savedIds.includes(p.id);
    const skills = cardSkillsOf(p);
    const experience = totalExperienceMonths(r) > 0 ? totalExperienceLabel(r) : null;
    const infoOpen = infoId === p.id;
    const open = () => {
      if (canView) setResumeId(p.id);
    };
    const facts = [
      ...(experience ? [{ icon: Briefcase, label: 'Total Experience', value: experience, tone: 'text-[#1E293B]' }] : []),
      { icon: CalendarClock, label: 'Joining', value: joiningLabel(p.noticeDays), tone: p.noticeDays === 0 ? 'text-[#10B981]' : 'text-[#1E293B]' },
      { icon: MapPin, label: 'Location', value: p.location, tone: 'text-[#1E293B]' },
    ];

    return (
      <li key={p.id}>
        <Card className="overflow-hidden">
          <div className="relative">
            <div
              role={canView ? 'button' : undefined}
              tabIndex={canView ? 0 : undefined}
              onClick={open}
              onKeyDown={(e) => {
                if (canView && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  open();
                }
              }}
              aria-label={canView ? `${p.profile} (${p.resumeId}). View resume` : undefined}
              className={`relative p-4 pb-3.5 ${canView ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]`}
            >
              <div className={`flex items-center gap-3 ${canAdd ? 'pr-11' : ''}`}>
                <DomainTile domain={p.domain} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{p.domain}</p>
                  <h3 className="mt-0.5 text-sm font-bold text-[#1E293B] leading-snug">{p.profile}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 tabular-nums">({p.resumeId})</span>
                    <Pill tone="blue">{r.level}</Pill>
                  </div>
                </div>
              </div>

              <dl className={`mt-3.5 grid ${facts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                {facts.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div key={f.label} className="min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
                      <dt className="flex items-center gap-1 text-[10px] font-medium text-slate-400 leading-tight">
                        <FIcon className="w-3 h-3 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{f.label}</span>
                      </dt>
                      <dd className={`mt-1 text-xs font-semibold leading-snug truncate tabular-nums ${f.tone}`}>{f.value}</dd>
                    </div>
                  );
                })}
              </dl>

              {r.summary && <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">{r.summary}</p>}
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={() => toggleSave(p)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${p.resumeId} from Saved Resumes` : `Save resume ${p.resumeId}`}
                className={`absolute top-3 right-3 w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                  saved ? 'text-white bg-[#2F68FE] border-[#2F68FE] active:bg-[#1D4ED8]' : 'text-slate-400 bg-white border-slate-200 active:bg-slate-100'
                }`}
              >
                {saved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
              </button>
            )}
          </div>

          {skills.length > 0 && (
            <div className="px-4 pb-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Skills</h4>
              <div className="mt-2">
                <SkillLine skills={skills} onMore={() => setSkillsId(p.id)} />
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-0.5">
                <p className="text-base font-extrabold text-[#1E293B] tabular-nums">{rateLabel(p)}</p>
                <button
                  type="button"
                  onClick={() => setInfoId(p.id)}
                  aria-haspopup="dialog"
                  aria-label={CLIENT_IS_MOS ? 'About talent cost' : 'About hourly charges'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${infoOpen ? 'text-[#2F68FE] bg-blue-50' : 'text-slate-400 active:bg-slate-100'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {canView && (
                <button
                  type="button"
                  onClick={open}
                  aria-label={`View resume ${p.resumeId}`}
                  className="h-9 pl-3.5 pr-2.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  View Resume <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </li>
    );
  };

  /* ---------- Card (V2) ---------- */

  const cardV2 = (p: HubProfile) => {
    const r = p.resume;
    const saved = savedIds.includes(p.id);
    const skills = cardSkillsOf(p);
    const experience = totalExperienceMonths(r) > 0 ? totalExperienceLabel(r) : null;
    const infoOpen = infoId === p.id;
    const open = () => {
      if (canView) setResumeId(p.id);
    };
    const facts = [
      ...(experience ? [{ icon: Briefcase, label: 'Total Experience', value: experience, tone: 'text-[#1E293B]' }] : []),
      { icon: CalendarClock, label: 'Joining', value: joiningLabel(p.noticeDays), tone: p.noticeDays === 0 ? 'text-[#10B981]' : 'text-[#1E293B]' },
      { icon: MapPin, label: 'Location', value: p.location, tone: 'text-[#1E293B]' },
    ];

    return (
      <li key={p.id}>
        <Card className="overflow-hidden">
          <div className="relative">
            <div
              role={canView ? 'button' : undefined}
              tabIndex={canView ? 0 : undefined}
              onClick={open}
              onKeyDown={(e) => {
                if (canView && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  open();
                }
              }}
              aria-label={canView ? `${p.profile} (${p.resumeId}). View resume` : undefined}
              className={`p-4 pb-3.5 ${canView ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}
            >
              <div className={`flex items-start gap-3 ${canAdd ? 'pr-10' : ''}`}>
                <DomainTile domain={p.domain} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1E293B] leading-snug">{p.profile}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                    <span className="shrink-0 tabular-nums font-semibold text-slate-400">({p.resumeId})</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <span className="truncate">{p.domain}</span>
                  </p>
                  <span className="mt-2 inline-flex">
                    <Pill tone="blue">{r.level}</Pill>
                  </span>
                </div>
              </div>

              <dl className="mt-3.5 rounded-xl border border-slate-100 divide-y divide-slate-100">
                {facts.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div key={f.label} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                        <FIcon className="w-3.5 h-3.5" />
                      </span>
                      <dt className="flex-1 min-w-0 text-[11px] font-medium text-slate-500">{f.label}</dt>
                      <dd className={`max-w-[55%] text-right text-xs font-semibold leading-snug truncate tabular-nums ${f.tone}`}>{f.value}</dd>
                    </div>
                  );
                })}
              </dl>

              {r.summary && <p className="mt-3 pl-3 border-l-2 border-blue-100 text-xs text-slate-500 leading-relaxed line-clamp-2">{r.summary}</p>}
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={() => toggleSave(p)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${p.resumeId} from Saved Resumes` : `Save resume ${p.resumeId}`}
                className={`absolute top-3 right-3 w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                  saved ? 'text-white bg-[#2F68FE] border-[#2F68FE] active:bg-[#1D4ED8]' : 'text-slate-400 bg-white border-slate-200 active:bg-slate-100'
                }`}
              >
                {saved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
              </button>
            )}
          </div>

          {skills.length > 0 && (
            <div className="px-4 pb-3.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Skills</h4>
              <div className="mt-2">
                <SkillLine skills={skills} onMore={() => setSkillsId(p.id)} />
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <p className="text-base font-extrabold text-[#2F68FE] tabular-nums">{rateLabel(p)}</p>
                <button
                  type="button"
                  onClick={() => setInfoId(p.id)}
                  aria-haspopup="dialog"
                  aria-label={CLIENT_IS_MOS ? 'About talent cost' : 'About hourly charges'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${infoOpen ? 'text-[#2F68FE] bg-blue-50' : 'text-slate-400 active:bg-slate-100'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {canView && (
                <button
                  type="button"
                  onClick={open}
                  aria-label={`View resume ${p.resumeId}`}
                  className="h-9 pl-3.5 pr-2.5 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center gap-1 active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  View Resume <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </li>
    );
  };

  /* ---------- Chips for the active filters ---------- */

  const filterChips: { key: string; label: string; clear: () => void }[] = [
    ...(filters.domain ? [{ key: `d-${filters.domain}`, label: filters.domain, clear: () => applyFilters({ ...filters, domain: '' }) }] : []),
    ...filters.profiles.map((v) => ({ key: `p-${v}`, label: v, clear: () => applyFilters({ ...filters, profiles: filters.profiles.filter((x) => x !== v) }) })),
    ...filters.levels.map((v) => ({ key: `l-${v}`, label: v, clear: () => applyFilters({ ...filters, levels: filters.levels.filter((x) => x !== v) }) })),
    ...filters.workModes.map((v) => ({ key: `w-${v}`, label: v, clear: () => applyFilters({ ...filters, workModes: filters.workModes.filter((x) => x !== v) }) })),
    ...(filters.rate ? [{ key: 'rate', label: labelOfRange(HUB_RATE_OPTIONS, filters.rate), clear: () => applyFilters({ ...filters, rate: '' }) }] : []),
    ...(filters.joining ? [{ key: 'join', label: `Joining ${labelOfRange(HUB_JOINING_OPTIONS, filters.joining)}`, clear: () => applyFilters({ ...filters, joining: '' }) }] : []),
    ...filters.software.map((v) => ({ key: `s-${v}`, label: v, clear: () => applyFilters({ ...filters, software: filters.software.filter((x) => x !== v) }) })),
    ...filters.skills.map((v) => ({ key: `k-${v}`, label: v, clear: () => applyFilters({ ...filters, skills: filters.skills.filter((x) => x !== v) }) })),
    ...filters.locations.map((v) => ({ key: `o-${v}`, label: v, clear: () => applyFilters({ ...filters, locations: filters.locations.filter((x) => x !== v) }) })),
    ...filters.qualifications.map((v) => ({ key: `q-${v}`, label: v, clear: () => applyFilters({ ...filters, qualifications: filters.qualifications.filter((x) => x !== v) }) })),
  ];

  const closeSheet = () => setSheet(null);
  const ResumeView = v2 ? HubResumeView : HubResumeViewV1;
  const infoProfile = profileOf(infoId);
  const infoCost = infoProfile && CLIENT_IS_MOS ? costBreakdownOf(infoProfile) : null;
  const skillsProfile = profileOf(skillsId);
  const sheetSkills = skillsProfile ? cardSkillsOf(skillsProfile) : [];

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Available Staff Hub" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}

      <div ref={listRef} inert={Boolean(resumeProfile)} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div
          className={
            v2
              ? 'sticky top-0 z-10 bg-white border-b border-[#EBF0F7] px-4 pb-3'
              : 'sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm px-4 pt-3.5 pb-3 border-b border-[#EBF0F7]'
          }
        >
          {v2 ? (
            <div className="-mx-4 px-2 flex gap-1 overflow-x-auto no-scrollbar border-b border-[#EBF0F7]" role="tablist" aria-label="Resume lists">
              {(['available', 'saved'] as const).map((t) => {
                const on = tab === t;
                const TabIcon = t === 'available' ? Store : Bookmark;
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => switchTab(t)}
                    className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE] ${
                      on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {TAB_LABEL[t]}
                    {t === 'saved' && (
                      <span
                        className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                          on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {savedPool.length}
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <SegmentedTabs
                ariaLabel="Resume lists"
                value={tab}
                onChange={switchTab}
                options={[
                  { id: 'available', label: TAB_LABEL.available },
                  { id: 'saved', label: TAB_LABEL.saved, badge: savedPool.length },
                ]}
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => patchTab({ query: v, pages: 1 })}
                placeholder="Search by Resume ID, profile or skill"
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => setSheet('filter')} />
          </div>

          {filterChips.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {filterChips.map((c) => (
                  <span key={c.key} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1">
                    {c.label}
                    <button
                      type="button"
                      onClick={c.clear}
                      aria-label={`Remove ${c.label}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-3.5">
          {loading ? (
            <HubListSkeleton />
          ) : source.length === 0 ? (
            tab === 'available' ? (
              <EmptyCard
                icon={Store}
                title="No resumes available right now."
                text="New resumes are added regularly. Your account manager can also share profiles that match your needs."
                action={
                  <button
                    type="button"
                    onClick={onContactManager}
                    className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                  >
                    <Headset className="w-4 h-4" />
                    Contact Account Manager
                  </button>
                }
              />
            ) : (
              <EmptyCard
                icon={Bookmark}
                title="No saved resumes yet."
                text="Tap the bookmark on a resume to keep it here for later."
                action={
                  <button
                    type="button"
                    onClick={() => switchTab('available')}
                    className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                  >
                    Browse Available Resumes
                  </button>
                }
              />
            )
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No Records Found"
              text="Try another Resume ID, profile, skill or filter."
              action={
                isFiltered && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(v2 ? cardV2 : card)}</ul>

              {visible.length < results.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    setMoreLoading(true);
                    setTimeout(() => {
                      patchTab({ pages: pages + 1 });
                      setMoreLoading(false);
                    }, LOAD_MS);
                  }}
                  className={`mt-3 w-full h-11 text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${
                    'rounded-xl border border-slate-200 bg-white shadow-2xs active:bg-slate-50'
                  }`}
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loadingâ€¦' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing {results.length} Of {results.length} Records
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {resumeProfile && (
        <ResumeView
          profile={resumeProfile}
          fromLabel={resumeId === entryResumeId && onBack ? 'Dashboard' : TAB_LABEL[tab]}
          shortlisted={shortlistedResumeIds.has(resumeProfile.resumeId)}
          saved={savedIds.includes(resumeProfile.id)}
          canAdd={canAdd}
          canDownload={canDownload}
          onBack={() => (resumeId === entryResumeId && onBack ? onBack() : setResumeId(null))}
          onToggleSave={() => toggleSave(resumeProfile)}
          onShortlist={() => startShortlist(resumeProfile)}
          onOpenShortlisted={onOpenShortlisted}
          onNotice={(text) => showNotice(text)}
        />
      )}

      <HubFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        options={options}
        onClose={closeSheet}
        onApply={(next) => {
          closeSheet();
          applyFilters(next);
        }}
      />

      <BottomSheet isOpen={skillsProfile !== null} onClose={() => setSkillsId(null)} maxHeight="max-h-[75%]">
        <SheetHeader
          title={`Skills (${sheetSkills.length})`}
          subtitle={skillsProfile ? `${skillsProfile.profile} (${skillsProfile.resumeId})` : undefined}
          onClose={() => setSkillsId(null)}
        />
        <div className="flex-1 min-h-0 px-5 pt-4 pb-8 overflow-y-auto no-scrollbar">
          <ul className="flex flex-wrap gap-2" aria-label="Skills">
            {sheetSkills.map((s) => (
              <li key={s} className="px-3 py-1.5 rounded-full bg-white ring-1 ring-inset ring-slate-200 text-xs font-semibold text-slate-600 leading-snug">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={infoProfile !== null} onClose={() => setInfoId(null)} maxHeight="max-h-[60%]">
        <SheetHeader title={CLIENT_IS_MOS ? 'Talent Cost' : 'Hourly Charges'} onClose={() => setInfoId(null)} />
        <div className="px-5 pt-4 pb-8 overflow-y-auto no-scrollbar">
          <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="w-9 h-9 rounded-xl bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
              <Info className="w-4.5 h-4.5" />
            </span>
            <p className="text-xs text-[#2F68FE] leading-relaxed">
              Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.
            </p>
          </div>
          {infoCost && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Fixed</dt>
                <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] tabular-nums">USD {infoCost.fixed}</dd>
              </div>
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Variable</dt>
                <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] tabular-nums">USD {infoCost.variable}</dd>
              </div>
            </dl>
          )}
          <button
            type="button"
            onClick={() => setInfoId(null)}
            className="mt-4 w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            Got it
          </button>
        </div>
      </BottomSheet>

      <HubRequirementSheet isOpen={sheet === 'requirement'} profile={shortlistProfile} onClose={closeSheet} onConfirm={confirmRequirement} />

      <InterviewScheduleSheet isOpen={sheet === 'schedule'} candidate={pendingCandidate} mode="request" onClose={closeSheet} onSchedule={schedule} />

      <InterviewScheduledSheet isOpen={sheet === 'scheduled'} candidate={scheduledCandidate} onDone={finishScheduled} />

      <HubShortlistedSheet
        isOpen={sheet === 'shortlisted'}
        profileLabel={createdProfile}
        onKeepBrowsing={closeSheet}
        onViewShortlisted={
          onOpenShortlisted
            ? () => {
                closeSheet();
                onOpenShortlisted();
              }
            : undefined
        }
      />
    </div>
  );
};
