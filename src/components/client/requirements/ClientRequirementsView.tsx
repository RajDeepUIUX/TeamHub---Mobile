import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarClock,
  ChevronRight,
  Clock3,
  DollarSign,
  Eye,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  SearchX,
  SlidersHorizontal,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { CommentThreadSheet } from '../../common/CommentThreadSheet';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { ShortlistedCandidate, formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import type { HubProfile } from '../data/clientStaffHubData';
import {
  EMPTY_REQUIREMENT_FILTERS,
  REQUIREMENT_PAGE_SIZE,
  RequirementDraft,
  RequirementFilters,
  RequirementStatus,
  StaffRequirement,
  availableResumesFor,
  draftOf,
  matchesRequirement,
  newRequirementDraft,
  requirementFilterCount,
  requirementsFromDraft,
  shortlistedFor,
} from '../data/clientRequirementsData';
import { RequirementDetailSheet } from './RequirementDetailSheet';
import { RequirementFilterSheet } from './RequirementFilterSheet';
import { RequirementFormView } from './RequirementFormView';
import { RequirementListSkeletonV1, RequirementListSkeletonV2, RequirementSavedSheet, RequirementStatusPill } from './RequirementParts';

interface Props {
  requirements: StaffRequirement[];
  /** Requirements live in ClientApp so changes are kept while switching modules */
  onChange: (next: StaffRequirement[]) => void;
  userName: string;
  hubProfiles: HubProfile[];
  candidates: ShortlistedCandidate[];
  /** Locations of the client's current staff pre-fill "Offshore Location Preference" (desktop `staff_location`) */
  defaultLocations: string[];
  /** Desktop links open the Hub / Shortlisted Candidates filtered to the requirement's profile */
  onOpenHub?: (profile?: string) => void;
  onOpenShortlisted?: (profile?: string) => void;
  /** Dashboard › Staff Requirement: open straight on View Requirement for one requirement, or on Add Requirement */
  initialRequirementId?: string | null;
  initialAdd?: boolean;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type Sheet = 'filter' | 'detail' | 'comments' | 'saved' | null;

/** Desktop loads the table by ajax */
const LOAD_MS = 600;

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

/** Status accent bar (V1): amber = In Progress, green = Completed, slate = Not Required */
const BAR: Record<RequirementStatus, string> = {
  'In Progress': 'bg-[#F59E0B]',
  Completed: 'bg-[#10B981]',
  'Not Required': 'bg-slate-300',
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** V2: label / value row */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <dt className="min-w-0 text-[11px] font-medium text-slate-500">{label}</dt>
    <dd className="shrink-0 max-w-[60%] text-right text-xs font-semibold text-[#1E293B] break-words">{children}</dd>
  </div>
);

/** V2: Available Resumes / Shortlisted Candidates tile; whole tile opens the linked list */
const LinkTile: React.FC<{ label: string; value: string | null; onClick?: () => void; ariaLabel: string }> = ({ label, value, onClick, ariaLabel }) => {
  const on = value !== null;
  const box = on ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100';
  const body = (
    <>
      <span className="block text-[10px] font-medium text-slate-500 leading-tight truncate">{label}</span>
      <span className={`mt-0.5 flex items-center gap-1 text-xs font-bold tabular-nums ${on ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>
        <span className="truncate">{value ?? '-'}</span>
        {on && onClick && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
      </span>
    </>
  );
  return on && onClick ? (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`min-w-0 text-left rounded-xl border px-2.5 py-1.5 active:bg-blue-100 transition-colors cursor-pointer ${box} ${FOCUS}`}>
      {body}
    </button>
  ) : (
    <div className={`min-w-0 rounded-xl border px-2.5 py-1.5 ${box}`}>{body}</div>
  );
};

/** Blue table link (Profile, N Locations, N Shortlisted); plain text when it can't be opened */
const TableLink: React.FC<{ label: string; onClick?: () => void; ariaLabel: string; weight?: string }> = ({ label, onClick, ariaLabel, weight = 'font-semibold' }) =>
  onClick ? (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`text-left text-[#2F68FE] ${weight} underline-offset-2 active:underline cursor-pointer`}>
      {label}
    </button>
  ) : (
    <span className={`text-[#2F68FE] ${weight}`}>{label}</span>
  );

/**
 * Hire New Staff › Staff Requirement (desktop `demands`): desktop filter bar (Tentative Date, Select Profile, Select Location,
 * status) with Search / Clear All, requirement cards labelled like the desktop table, Add / Edit Requirement (3 steps),
 * View Requirement, comments, and links to Available Resumes and Shortlisted Candidates.
 */
export const ClientRequirementsView: React.FC<Props> = ({
  requirements,
  onChange,
  userName,
  hubProfiles,
  candidates,
  defaultLocations,
  onOpenHub,
  onOpenShortlisted,
  initialRequirementId,
  initialAdd,
  onBack,
}) => {
  // view = details + comments; add = Add Requirement; edit = Edit Requirement
  const { view: canView, add: canAdd, edit: canEdit } = useClientPermission('requirements');

  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RequirementFilters>(EMPTY_REQUIREMENT_FILTERS);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const entryId = canView && initialRequirementId && requirements.some((r) => r.id === initialRequirementId) ? initialRequirementId : null;
  const [sheet, setSheet] = useState<Sheet>(entryId ? 'detail' : null);
  // Kept after a sheet closes so its content doesn't blank out during the close animation
  const [targetId, setTargetId] = useState<string | null>(entryId);
  const [form, setForm] = useState<{ editId: string | null } | null>(initialAdd && canAdd ? { editId: null } : null);
  const [saved, setSaved] = useState<{ mode: 'create' | 'edit'; count: number; profile: string } | null>(null);
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const target = requirements.find((r) => r.id === targetId) ?? null;
  const closeSheet = () => setSheet(null);
  const openSheet = (next: Exclude<Sheet, null>, id?: string) => {
    if (id) setTargetId(id);
    setSheet(next);
  };

  const profiles = useMemo(() => [...new Set(requirements.map((r) => r.profile))].sort(), [requirements]);

  const results = requirements.filter((r) => matchesRequirement(r, '', filters));
  const visible = results.slice(0, pages * REQUIREMENT_PAGE_SIZE);
  const filterCount = requirementFilterCount(filters);
  const isFiltered = filterCount > 0;
  // Status chip only when it differs from the desktop default (In Progress, Completed)
  const statusChanged = filterCount > (filters.date ? 1 : 0) + filters.profiles.length + filters.locations.length;
  const applied: { key: string; label: string; next: RequirementFilters }[] = [
    ...(filters.date ? [{ key: 'date', label: formatShortDate(filters.date), next: { ...filters, date: '' } }] : []),
    ...filters.profiles.map((p) => ({ key: `p-${p}`, label: p, next: { ...filters, profiles: filters.profiles.filter((x) => x !== p) } })),
    ...filters.locations.map((l) => ({ key: `l-${l}`, label: l, next: { ...filters, locations: filters.locations.filter((x) => x !== l) } })),
    ...(statusChanged
      ? [{ key: 'status', label: filters.statuses.length ? filters.statuses.join(', ') : 'All statuses', next: { ...filters, statuses: EMPTY_REQUIREMENT_FILTERS.statuses } }]
      : []),
  ];

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFilters = (next: RequirementFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => applyFilters(EMPTY_REQUIREMENT_FILTERS);

  const openForm = (editId: string | null) => {
    listScroll.current = listRef.current?.scrollTop ?? 0;
    setTargetId(editId);
    setForm({ editId });
  };

  useEffect(() => {
    if (!form && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [form]);

  const submit = (next: RequirementDraft) => {
    const today = isoOfDate(new Date());
    if (form?.editId) {
      onChange(requirements.map((r) => (r.id === form.editId ? { ...r, ...next } : r)));
      setSaved({ mode: 'edit', count: 1, profile: next.profile });
    } else {
      const created = requirementsFromDraft(next, today);
      onChange([...created, ...requirements]);
      setSaved({ mode: 'create', count: created.length, profile: next.profile });
    }
    setForm(null);
    setSheet('saved');
    reload();
  };

  const sendComment = (text: string) => {
    if (!targetId) return;
    onChange(
      requirements.map((r) =>
        r.id === targetId
          ? { ...r, comments: [...r.comments, { id: `cm-${Date.now()}`, author: userName, role: 'Staff', text, createdAt: new Date().toISOString() }] }
          : r,
      ),
    );
  };

  /* ---------- Add / Edit ---------- */
  if (form) {
    const editing = form.editId ? requirements.find((r) => r.id === form.editId) ?? null : null;
    return (
      <RequirementFormView
        key={form.editId ?? 'new'}
        editing={editing}
        initial={editing ? draftOf(editing) : newRequirementDraft(defaultLocations)}
        onBack={() => setForm(null)}
        onSubmit={submit}
      />
    );
  }

  /** Values + actions shared by both designs (same content and behaviour) */
  const cardData = (r: StaffRequirement) => {
    const resumes = availableResumesFor(r, hubProfiles, candidates);
    const shortlisted = shortlistedFor(r, candidates);
    return {
      resumes,
      shortlisted,
      showEdit: canEdit && r.editable,
      resumesLabel: resumes > 0 ? `${resumes} ${resumes === 1 ? 'Resume' : 'Resumes'}` : null,
      shortlistedLabel: shortlisted > 0 ? `${shortlisted} Shortlisted` : null,
      openResumes: resumes > 0 && onOpenHub ? () => onOpenHub(r.profile) : undefined,
      openShortlisted: shortlisted > 0 && onOpenShortlisted ? () => onOpenShortlisted(r.profile) : undefined,
      commentsAria: `Comments on ${r.profile}${r.comments.length > 0 ? `, ${r.comments.length}` : ''}`,
    };
  };

  /* ---------- Card (V1): soft card ---------- */
  const cardV1 = (r: StaffRequirement) => {
    const d = cardData(r);
    const facts = [
      { label: 'Pricing', value: r.pricing, icon: DollarSign, num: true },
      { label: 'Onboarding Timeline', value: r.timeline, icon: CalendarClock, num: false },
      { label: 'Hours/Week', value: r.hoursPerWeek ? String(r.hoursPerWeek) : '', icon: Clock3, num: true },
      { label: 'Work Mode', value: r.workMode, icon: Building2, num: false },
    ];
    const pill = `flex-1 min-w-0 h-9 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${FOCUS}`;

    return (
      <li key={r.id}>
        <article className="relative bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs">
          <span aria-hidden="true" className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${BAR[r.status]}`} />
          <div className="pl-5 pr-4 pt-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-medium text-slate-400 leading-tight">Profile</span>
                <span className="block mt-0.5 text-sm leading-snug">
                  <TableLink label={r.profile} weight="font-bold" onClick={canView ? () => openSheet('detail', r.id) : undefined} ariaLabel={`View requirement ${r.profile}`} />
                </span>
              </div>
              <span className="shrink-0 pt-0.5" aria-label={`Status: ${r.status}`}>
                <RequirementStatusPill status={r.status} />
              </span>
            </div>

            <dl className="mt-3.5 grid grid-cols-2 gap-2">
              {facts.map((f) => (
                <div key={f.label} className="min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-start gap-2">
                  <f.icon className="w-4 h-4 mt-px shrink-0 text-[#2F68FE]" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-medium text-slate-400 leading-tight">{f.label}</dt>
                    <dd className={`mt-0.5 text-xs font-semibold text-[#1E293B] leading-snug break-words ${f.num ? 'tabular-nums' : ''}`}>{f.value || '-'}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <dl className="mt-2 grid grid-cols-3 rounded-xl border border-slate-100 bg-slate-50 divide-x divide-slate-100">
              <div className="min-w-0 px-1.5 py-2.5 text-center">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Offshore Location</dt>
                <dd className="mt-1 text-xs font-bold text-[#1E293B] break-words">
                  <LocationValue locations={r.locations} align="left" />
                </dd>
              </div>
              <div className="min-w-0 px-1.5 py-2.5 text-center">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Available Resumes</dt>
                <dd className="mt-1 text-xs tabular-nums">
                  {d.resumesLabel ? (
                    <TableLink label={d.resumesLabel} weight="font-bold" onClick={d.openResumes} ariaLabel={`${d.resumes} available resumes for ${r.profile}`} />
                  ) : (
                    <span className="font-bold text-[#1E293B]">-</span>
                  )}
                </dd>
              </div>
              <div className="min-w-0 px-1.5 py-2.5 text-center">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Shortlisted Candidates</dt>
                <dd className="mt-1 text-xs tabular-nums">
                  {d.shortlistedLabel ? (
                    <TableLink
                      label={d.shortlistedLabel}
                      weight="font-bold"
                      onClick={d.openShortlisted}
                      ariaLabel={`${d.shortlisted} shortlisted candidates for ${r.profile}`}
                    />
                  ) : (
                    <span className="font-bold text-[#1E293B]">-</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {canView || d.showEdit ? (
            <div className="px-4 pt-3.5 pb-4 flex items-center gap-2">
              {canView && (
                <button type="button" onClick={() => openSheet('comments', r.id)} aria-label={d.commentsAria} className={`relative border border-slate-200 bg-white text-slate-700 active:bg-slate-50 ${pill}`}>
                  <MessageSquareText className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">Comments</span>
                  {r.comments.length > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {r.comments.length}
                    </span>
                  )}
                </button>
              )}
              {d.showEdit && (
                <button type="button" onClick={() => openForm(r.id)} aria-label={`Edit requirement ${r.profile}`} className={`border border-slate-200 bg-white text-slate-700 active:bg-slate-50 ${pill}`}>
                  <Pencil className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">Edit</span>
                </button>
              )}
              {canView && (
                <button
                  type="button"
                  onClick={() => openSheet('detail', r.id)}
                  aria-label={`View requirement ${r.profile}`}
                  className={`border border-[#2F68FE] bg-white text-[#2F68FE] active:bg-blue-50 ${pill}`}
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span className="truncate">View</span>
                </button>
              )}
            </div>
          ) : (
            <div className="h-4" />
          )}
        </article>
      </li>
    );
  };

  /* ---------- Card (V2): compact ticket ---------- */
  const cardV2 = (r: StaffRequirement) => {
    const d = cardData(r);
    const seg = `relative flex-1 min-w-0 h-10 px-1.5 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]`;

    return (
      <li key={r.id}>
        <article className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden">
          <div className="px-3.5 pt-3 pb-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-medium text-slate-400 leading-tight">Profile</span>
                {canView ? (
                  <button
                    type="button"
                    onClick={() => openSheet('detail', r.id)}
                    aria-label={`View requirement ${r.profile}`}
                    className={`mt-0.5 max-w-full flex items-center gap-1 text-left text-sm font-bold text-[#1E293B] leading-snug active:text-[#2F68FE] cursor-pointer rounded ${FOCUS}`}
                  >
                    <span className="min-w-0 break-words">{r.profile}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#2F68FE]" />
                  </button>
                ) : (
                  <span className="mt-0.5 block text-sm font-bold text-[#1E293B] leading-snug break-words">{r.profile}</span>
                )}
              </div>
              <span className="shrink-0" aria-label={`Status: ${r.status}`}>
                <RequirementStatusPill status={r.status} />
              </span>
            </div>

            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Pricing</dt>
                <dd className="mt-0.5 text-[13px] font-extrabold text-[#2F68FE] leading-tight tabular-nums break-words">{r.pricing || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Hours/Week</dt>
                <dd className="mt-0.5 text-[13px] font-extrabold text-[#1E293B] leading-tight tabular-nums">{r.hoursPerWeek || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Onboarding Timeline</dt>
                <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] leading-tight break-words">{r.timeline || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-slate-500 leading-tight">Work Mode</dt>
                <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] leading-tight break-words">{r.workMode || '-'}</dd>
              </div>
            </dl>

            <dl>
              <Row label="Offshore Location">
                <LocationValue locations={r.locations} />
              </Row>
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <LinkTile
                label="Available Resumes"
                value={d.resumesLabel}
                onClick={d.openResumes}
                ariaLabel={`${d.resumes} available resumes for ${r.profile}`}
              />
              <LinkTile
                label="Shortlisted Candidates"
                value={d.shortlistedLabel}
                onClick={d.openShortlisted}
                ariaLabel={`${d.shortlisted} shortlisted candidates for ${r.profile}`}
              />
            </div>
          </div>

          {(canView || d.showEdit) && (
            <div className="flex border-t border-slate-100 divide-x divide-slate-100">
              {canView && (
                <button type="button" onClick={() => openSheet('comments', r.id)} aria-label={d.commentsAria} className={`font-semibold text-slate-700 active:bg-slate-50 ${seg}`}>
                  <MessageSquareText className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">Comments</span>
                  {r.comments.length > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#EFF6FF] text-[#2F68FE] text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {r.comments.length}
                    </span>
                  )}
                </button>
              )}
              {d.showEdit && (
                <button type="button" onClick={() => openForm(r.id)} aria-label={`Edit requirement ${r.profile}`} className={`font-semibold text-slate-700 active:bg-slate-50 ${seg}`}>
                  <Pencil className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">Edit</span>
                </button>
              )}
              {canView && (
                <button type="button" onClick={() => openSheet('detail', r.id)} aria-label={`View requirement ${r.profile}`} className={`font-bold text-[#2F68FE] active:bg-blue-50 ${seg}`}>
                  <Eye className="w-4 h-4 shrink-0" />
                  <span className="truncate">View</span>
                </button>
              )}
            </div>
          )}
        </article>
      </li>
    );
  };

  /* ---------- Toolbar (V1): Add left, round filter right, pill chips ---------- */
  const toolbarV1 = (
    <div className="px-4 pt-3.5">
      <div className="flex items-center gap-2">
        {canAdd && (
          <button
            type="button"
            onClick={() => openForm(null)}
            className={`h-11 pl-3 pr-3.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer ${FOCUS}`}
          >
            <UserRoundPlus className="w-4 h-4" />
            Add Requirement
          </button>
        )}
        <div className="flex-1 min-w-0" />
        <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
      </div>

      {applied.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
            {applied.map((a) => (
              <span key={a.key} className="shrink-0 h-8 pl-3 pr-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                {a.label}
                <button
                  type="button"
                  onClick={() => applyFilters(a.next)}
                  aria-label={`Remove ${a.label}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {isFiltered && (
            <button type="button" onClick={clearAll} className="shrink-0 h-8 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );

  /* ---------- Toolbar (V2): sticky white bar, Add left, text Filter right, square chips ---------- */
  const toolbarV2 = (
    <div className="sticky top-0 z-10 bg-white border-b border-[#EBF0F7] px-4 py-2.5">
      <div className="flex items-center gap-2">
        {canAdd && (
          <button
            type="button"
            onClick={() => openForm(null)}
            className={`h-10 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer ${FOCUS}`}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Requirement
          </button>
        )}
        <div className="flex-1 min-w-0" />
        <button
          type="button"
          onClick={() => openSheet('filter')}
          aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
          className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer ${FOCUS} ${
            filterCount ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-[#2F68FE]" />
          Filter
          {filterCount > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{filterCount}</span>
          )}
        </button>
      </div>

      {applied.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
            {applied.map((a) => (
              <span key={a.key} className="shrink-0 h-8 pl-3 pr-1 rounded-full bg-blue-50 text-[11px] font-semibold text-[#2F68FE] flex items-center gap-0.5">
                {a.label}
                <button
                  type="button"
                  onClick={() => applyFilters(a.next)}
                  aria-label={`Remove ${a.label}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {isFiltered && (
            <button type="button" onClick={clearAll} className="shrink-0 h-8 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Staff Requirement" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? toolbarV2 : toolbarV1}

        <div className={`px-4 ${v2 ? 'mt-3' : 'mt-4'}`}>
          {loading ? (
            v2 ? (
              <RequirementListSkeletonV2 />
            ) : (
              <RequirementListSkeletonV1 />
            )
          ) : requirements.length === 0 ? (
            <EmptyCard
              icon={Briefcase}
              title="No staff requirements yet."
              text="Tell us who you want to hire and we will match resumes for you."
              action={
                canAdd && (
                  <button type="button" onClick={() => openForm(null)} className="mt-4 h-10 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
                    Add Requirement
                  </button>
                )
              }
            />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No requirements found."
              text="Try another date, profile, location or status."
              action={
                isFiltered && (
                  <button type="button" onClick={clearAll} className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer">
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className={v2 ? 'space-y-3' : 'space-y-3.5'}>{visible.map(v2 ? cardV2 : cardV1)}</ul>

              {visible.length < results.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    setMoreLoading(true);
                    setTimeout(() => {
                      setPages((n) => n + 1);
                      setMoreLoading(false);
                    }, LOAD_MS);
                  }}
                  className={`mt-3 w-full h-11 rounded-xl border text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${
                    v2 ? 'border-blue-100 bg-blue-50 active:bg-blue-100' : 'border-slate-200 bg-white shadow-2xs active:bg-slate-50'
                  }`}
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
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

      <RequirementFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        profiles={profiles}
        onClose={closeSheet}
        onApply={(next) => {
          closeSheet();
          applyFilters(next);
        }}
      />

      <RequirementDetailSheet isOpen={sheet === 'detail'} requirement={target} onClose={closeSheet} version={version} />

      <CommentThreadSheet
        isOpen={sheet === 'comments'}
        subtitle={target ? `${target.profile}${target.level ? ` · ${target.level}` : ''}` : ''}
        comments={target?.comments ?? []}
        currentUser={userName}
        onClose={closeSheet}
        onSend={sendComment}
        placeholder="Write a comment for your account manager..."
      />

      <RequirementSavedSheet
        isOpen={sheet === 'saved'}
        mode={saved?.mode ?? 'create'}
        count={saved?.count ?? 1}
        profile={saved?.profile ?? ''}
        onDone={() => {
          closeSheet();
          showNotice(saved?.mode === 'edit' ? 'Requirement updated.' : 'Requirement added.');
        }}
        onViewResumes={
          onOpenHub
            ? () => {
                closeSheet();
                onOpenHub(saved?.profile);
              }
            : undefined
        }
      />
    </div>
  );
};

/** Desktop shows "N Locations" with the full list in a hover tooltip; on mobile the link opens the same chip popover on tap */
const LocationValue: React.FC<{ locations: string[]; align?: 'left' | 'right' }> = ({ locations, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (locations.length === 0) return <>-</>;
  if (locations.length === 1) return <>{locations[0]}</>;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${locations.length} locations: ${locations.join(', ')}`}
        className="text-[#2F68FE] font-semibold tabular-nums cursor-pointer"
      >
        {locations.length} Locations
      </button>
      {open && (
        <span role="tooltip" className={`absolute bottom-full ${align === 'left' ? 'left-0 text-left' : 'right-0'} mb-2.5 z-20 w-[230px] max-w-[calc(100vw-48px)] animate-in fade-in zoom-in-95 duration-150`}>
          <span className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)] p-2.5 flex flex-wrap gap-1.5">
            {locations.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] text-[11px] font-semibold">
                {l}
              </span>
            ))}
          </span>
          <span aria-hidden="true" className={`absolute -bottom-1 ${align === 'left' ? 'left-8' : 'right-8'} w-2.5 h-2.5 rotate-45 bg-white border-r border-b border-slate-200/80`} />
        </span>
      )}
    </span>
  );
};
