import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Headset, Info, Loader2, SearchX, Store, UsersRound, X } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard, Pill, SearchField } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { InterviewScheduleSheet, InterviewScheduledSheet } from '../interviews/InterviewScheduleSheet';
import { ScheduledInterview, ShortlistedCandidate } from '../data/clientInterviewsData';
import {
  CARD_SKILL_LIMIT,
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
import { HubFilterOptions, HubFilterSheet } from './HubFilterSheet';
import { DomainTile, HubListSkeleton } from './HubParts';
import { HubRequirementSheet, HubShortlistedSheet, ShortlistNext } from './HubRequirementSheet';
import { HubResumeView } from './HubResumeView';

interface Props {
  profiles: HubProfile[];
  /** Shortlisted Candidates live in ClientApp; shortlisting a profile adds a row there */
  candidates: ShortlistedCandidate[];
  /** Saved Resumes (profile ids) live in ClientApp so they're kept while switching modules */
  savedIds: string[];
  onToggleSave: (profileId: string) => void;
  onShortlist: (candidate: ShortlistedCandidate) => void;
  onUpdateCandidate: (id: string, patch: Partial<ShortlistedCandidate>) => void;
  /** Opens Hire New Staff › Shortlisted Candidates (needs access to that module) */
  onOpenShortlisted?: () => void;
  onContactManager: () => void;
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

/**
 * Hire New Staff › Available Staff Hub (desktop `staffingMarketplace`): Available Resumes and Saved Resumes tabs, search +
 * filters, resume cards (profile, level, experience, joining, location, skills, rate), View Resume, Save / Remove from Saved
 * Resumes and Shortlist Candidate (add requirement when none exists → schedule the Zoom interview or shortlist for later).
 */
export const ClientStaffHubView: React.FC<Props> = ({
  profiles,
  candidates,
  savedIds,
  onToggleSave,
  onShortlist,
  onUpdateCandidate,
  onOpenShortlisted,
  onContactManager,
  onBack,
}) => {
  // view = View Resume; add = Shortlist Candidate and Save / Remove from Saved Resumes; download = psychometric test, certificates, reports
  const { view: canView, add: canAdd, download: canDownload } = useClientPermission('staff-hub');

  const [tab, setTab] = useState<Tab>('available');
  const [tabState, setTabState] = useState<Record<Tab, TabState>>({ available: INITIAL_TAB, saved: INITIAL_TAB });
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  // Cards with "Show More" skills opened, and the card whose price info is open
  const [expandedSkills, setExpandedSkills] = useState<string[]>([]);
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
    // Desktop: an open requirement for the profile → straight to the scheduler, otherwise "Add Staff Requirement"
    setSheet(hasRequirementFor(candidates, p.profile) ? 'schedule' : 'requirement');
  };

  const confirmRequirement = (req: HubRequirement, next: ShortlistNext) => {
    const p = shortlistProfile;
    if (!p) return;
    setRequirement(req);
    if (next === 'schedule') {
      setSheet('schedule');
      return;
    }
    onShortlist(candidateFromProfile(p));
    setCreatedProfile(`${p.profile} (${p.resumeId})`);
    setSheet('shortlisted');
  };

  const schedule = (_pendingId: string, interview: ScheduledInterview) => {
    const p = shortlistProfile;
    if (!p) return;
    const candidate = candidateFromProfile(p, { status: 'Interview Scheduled', interview });
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
    const skillsOpen = expandedSkills.includes(p.id);
    const shownSkills = skillsOpen ? skills : skills.slice(0, CARD_SKILL_LIMIT);
    const hiddenSkills = skills.length - CARD_SKILL_LIMIT;
    const experience = totalExperienceMonths(r) > 0 ? totalExperienceLabel(r) : null;
    const cost = CLIENT_IS_MOS ? costBreakdownOf(p) : null;
    const infoOpen = infoId === p.id;
    const open = () => {
      if (canView) setResumeId(p.id);
    };

    return (
      <li key={p.id}>
        <Card>
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
              className={`p-3.5 pb-3 rounded-t-2xl ${canView ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}
            >
              <div className={`flex items-center gap-2 ${canAdd ? 'pr-11' : ''}`}>
                <DomainTile domain={p.domain} />
                <span className="text-[12px] font-semibold text-slate-600 truncate">{p.domain}</span>
              </div>

              <div className="mt-2.5 flex items-start gap-2">
                <h3 className="flex-1 min-w-0 text-[15px] font-extrabold text-[#1E293B] leading-snug">
                  {p.profile} <span className="tabular-nums">({p.resumeId})</span>
                </h3>
                <span className="shrink-0 mt-px">
                  <Pill tone="indigo">{r.level}</Pill>
                </span>
              </div>

              <dl className={`mt-3 grid ${experience ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-slate-200 text-[11px]`}>
                {experience && (
                  <div className="min-w-0 pr-3">
                    <dt className="text-slate-400">Total Experience</dt>
                    <dd className="mt-0.5 font-semibold text-[#1E293B] leading-snug">{experience}</dd>
                  </div>
                )}
                <div className={`min-w-0 ${experience ? 'px-3' : 'pr-3'}`}>
                  <dt className="text-slate-400">Joining</dt>
                  <dd className={`mt-0.5 font-semibold leading-snug ${p.noticeDays === 0 ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{joiningLabel(p.noticeDays)}</dd>
                </div>
                <div className="min-w-0 px-3">
                  <dt className="text-slate-400">Location</dt>
                  <dd className="mt-0.5 font-semibold text-[#1E293B] leading-snug truncate">{p.location}</dd>
                </div>
              </dl>

              {r.summary && <p className="mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-600 leading-relaxed line-clamp-2">{r.summary}</p>}
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={() => toggleSave(p)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${p.resumeId} from Saved Resumes` : `Save resume ${p.resumeId}`}
                className={`absolute top-1.5 right-1.5 w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  saved ? 'text-[#2F68FE] bg-[#EFF6FF]' : 'text-slate-400 active:bg-slate-100'
                }`}
              >
                {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
            )}
          </div>

          {skills.length > 0 && (
            <div className="mx-3.5 pt-3 pb-3.5 border-t border-slate-100">
              <h4 className="text-[13px] font-semibold text-[#1E293B]">Skills</h4>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills">
                {shownSkills.map((s) => (
                  <li key={s} className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 leading-snug">
                    {s}
                  </li>
                ))}
                {hiddenSkills > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setExpandedSkills((ids) => (skillsOpen ? ids.filter((x) => x !== p.id) : [...ids, p.id]))}
                      aria-expanded={skillsOpen}
                      className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-[#2F68FE] leading-snug active:bg-slate-200 cursor-pointer"
                    >
                      {skillsOpen ? 'Show Less' : 'Show More'}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="px-3.5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <p className="text-[14px] font-extrabold text-[#1E293B] tabular-nums">{rateLabel(p)}</p>
                <button
                  type="button"
                  onClick={() => setInfoId(infoOpen ? null : p.id)}
                  aria-expanded={infoOpen}
                  aria-label={CLIENT_IS_MOS ? 'About talent cost' : 'About hourly charges'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${infoOpen ? 'text-[#2F68FE] bg-[#EFF6FF]' : 'text-slate-400 active:bg-slate-100'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {canView && (
                <button
                  type="button"
                  onClick={open}
                  aria-label={`View resume ${p.resumeId}`}
                  className="h-10 px-5 rounded-lg bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
                >
                  View Resume
                </button>
              )}
            </div>
            {infoOpen && (
              <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed" role="note">
                {cost ? (
                  <>
                    <p>Indicative monthly talent cost (compensation package).</p>
                    <p className="mt-1 tabular-nums">
                      Fixed <span className="font-bold text-[#1E293B]">USD {cost.fixed}</span> + Variable <span className="font-bold text-[#1E293B]">USD {cost.variable}</span>
                    </p>
                  </>
                ) : (
                  <p>Hourly charges for this resume, billed on the hours worked.</p>
                )}
              </div>
            )}
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

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Available Staff Hub" onBack={onBack} />
      {notice}

      <div ref={listRef} inert={Boolean(resumeProfile)} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3">
            <p className="flex-1 min-w-0 text-[12px] text-slate-500 leading-snug">Browse resumes and shortlist candidates to interview.</p>
            {onOpenShortlisted && (
              <button
                type="button"
                onClick={onOpenShortlisted}
                aria-label={`Shortlisted Candidates (${candidates.length})`}
                className="h-8 pl-2.5 pr-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1 active:bg-blue-100 shrink-0 cursor-pointer"
              >
                <UsersRound className="w-3.5 h-3.5" />
                Shortlisted
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{candidates.length}</span>
              </button>
            )}
          </div>

          <div className="mt-3">
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
                  <span key={c.key} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
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

        <div className="px-4 mt-3">
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
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-[#E0E7FF] cursor-pointer"
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
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
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
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <p className="mb-2.5 px-0.5 text-[11px] text-slate-400 tabular-nums" aria-live="polite">
                Showing {visible.length} of {results.length} {results.length === 1 ? 'resume' : 'resumes'}
              </p>
              <ul className="space-y-3">{visible.map(card)}</ul>

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
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {results.length} {results.length === 1 ? 'resume' : 'resumes'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {resumeProfile && (
        <HubResumeView
          profile={resumeProfile}
          fromLabel={TAB_LABEL[tab]}
          shortlisted={shortlistedResumeIds.has(resumeProfile.resumeId)}
          saved={savedIds.includes(resumeProfile.id)}
          canAdd={canAdd}
          canDownload={canDownload}
          onBack={() => setResumeId(null)}
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
