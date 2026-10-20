import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Eye, Loader2, MessageSquareText, Pencil, SearchX, UserRoundPlus, X } from 'lucide-react';
import { CommentThreadSheet } from '../../common/CommentThreadSheet';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { ShortlistedCandidate, formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import type { HubProfile } from '../data/clientStaffHubData';
import {
  EMPTY_REQUIREMENT_FILTERS,
  REQUIREMENT_PAGE_SIZE,
  RequirementDraft,
  RequirementFilters,
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
import { RequirementListSkeleton, RequirementSavedSheet, RequirementStatusPill } from './RequirementParts';

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
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type Sheet = 'filter' | 'detail' | 'comments' | 'saved' | null;

/** Desktop loads the table by ajax */
const LOAD_MS = 600;


/** Desktop table column as a label / value pair */
const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-[10.5px] font-semibold text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Blue table link (Profile, N Locations, N Shortlisted); plain text when it can't be opened */
const TableLink: React.FC<{ label: string; onClick?: () => void; ariaLabel: string; tone?: 'blue' | 'purple' }> = ({ label, onClick, ariaLabel, tone = 'blue' }) => {
  const color = tone === 'purple' ? 'text-[#6366F1]' : 'text-[#2F68FE]';
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`text-left ${color} font-medium underline-offset-2 active:underline cursor-pointer`}>
      {label}
    </button>
  ) : (
    <span className={`${color} font-medium`}>{label}</span>
  );
};

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
  onBack,
}) => {
  // view = details + comments; add = Add Requirement; edit = Edit Requirement
  const { view: canView, add: canAdd, edit: canEdit } = useClientPermission('requirements');

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RequirementFilters>(EMPTY_REQUIREMENT_FILTERS);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  // Kept after a sheet closes so its content doesn't blank out during the close animation
  const [targetId, setTargetId] = useState<string | null>(null);
  const [form, setForm] = useState<{ editId: string | null } | null>(null);
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

  const card = (r: StaffRequirement) => {
    const resumes = availableResumesFor(r, hubProfiles, candidates);
    const shortlisted = shortlistedFor(r, candidates);
    const showEdit = canEdit && r.editable;

    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">Profile</span>
                <span className="block mt-0.5 text-[14px] leading-snug">
                  <TableLink
                    label={r.profile}
                    onClick={canView ? () => openSheet('detail', r.id) : undefined}
                    ariaLabel={`View requirement ${r.profile}`}
                  />
                </span>
              </span>
              <span className="shrink-0 flex flex-col items-end">
                <span className="text-[10.5px] font-semibold text-slate-400">Status</span>
                <span className="mt-0.5">
                  <RequirementStatusPill status={r.status} />
                </span>
              </span>
            </div>

            <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Pricing">
                <span className="tabular-nums">{r.pricing || '-'}</span>
              </Field>
              <Field label="Onboarding Timeline">{r.timeline || '-'}</Field>
              <Field label="Hours/Week">
                <span className="tabular-nums">{r.hoursPerWeek || '-'}</span>
              </Field>
              <Field label="Work Mode">{r.workMode || '-'}</Field>
              <Field label="Offshore Location">
                <LocationValue locations={r.locations} />
              </Field>
              <Field label="Available Resumes">
                {resumes > 0 ? (
                  <TableLink
                    label={`${resumes} ${resumes === 1 ? 'Resume' : 'Resumes'}`}
                    onClick={onOpenHub ? () => onOpenHub(r.profile) : undefined}
                    ariaLabel={`${resumes} available resumes for ${r.profile}`}
                  />
                ) : (
                  '-'
                )}
              </Field>
              <Field label="Shortlisted Candidates" className="col-span-2">
                {shortlisted > 0 ? (
                  <TableLink
                    tone="purple"
                    label={`${shortlisted} Shortlisted`}
                    onClick={onOpenShortlisted ? () => onOpenShortlisted(r.profile) : undefined}
                    ariaLabel={`${shortlisted} shortlisted candidates for ${r.profile}`}
                  />
                ) : (
                  '-'
                )}
              </Field>
            </dl>
          </div>

          {(canView || showEdit) && (
            <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
              {canView && (
                <button
                  type="button"
                  onClick={() => openSheet('comments', r.id)}
                  aria-label={`Comments on ${r.profile}${r.comments.length > 0 ? `, ${r.comments.length}` : ''}`}
                  className="flex-1 min-w-0 h-9 px-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                >
                  <MessageSquareText className="w-4 h-4 shrink-0" />
                  <span className="truncate">Comments</span>
                  {r.comments.length > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-[#2F68FE] text-white text-[9px] font-bold flex items-center justify-center tabular-nums shrink-0">
                      {r.comments.length}
                    </span>
                  )}
                </button>
              )}
              {showEdit && (
                <button
                  type="button"
                  onClick={() => openForm(r.id)}
                  aria-label={`Edit requirement ${r.profile}`}
                  className="flex-1 min-w-0 h-9 px-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-slate-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                >
                  <Pencil className="w-4 h-4 shrink-0" />
                  <span className="truncate">Edit</span>
                </button>
              )}
              {canView && (
                <button
                  type="button"
                  onClick={() => openSheet('detail', r.id)}
                  aria-label={`View requirement ${r.profile}`}
                  className="flex-1 min-w-0 h-9 px-2 rounded-xl bg-[#2F68FE]/10 text-[#2F68FE] text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-[#2F68FE]/20 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span className="truncate">View</span>
                </button>
              )}
            </div>
          )}
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Staff Requirement" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">
              {loading ? '' : `${results.length} ${results.length === 1 ? 'requirement' : 'requirements'}`}
            </span>
            {canAdd && (
              <button
                type="button"
                onClick={() => openForm(null)}
                className="h-11 px-3.5 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:bg-blue-50 shrink-0 cursor-pointer"
              >
                <UserRoundPlus className="w-4 h-4" />
                Add Requirement
              </button>
            )}
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          {applied.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {applied.map((a) => (
                  <span key={a.key} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                    {a.label}
                    <button
                      type="button"
                      onClick={() => applyFilters(a.next)}
                      aria-label={`Remove ${a.label}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {isFiltered && (
                <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-4 mt-4">
          {loading ? (
            <RequirementListSkeleton />
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
                  <button type="button" onClick={clearAll} className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer">
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>

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
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {results.length} {results.length === 1 ? 'requirement' : 'requirements'}
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

      <RequirementDetailSheet isOpen={sheet === 'detail'} requirement={target} onClose={closeSheet} />

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
const LocationValue: React.FC<{ locations: string[] }> = ({ locations }) => {
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
        className="text-[#2F68FE] font-medium tabular-nums cursor-pointer"
      >
        {locations.length} Locations
      </button>
      {open && (
        <span role="tooltip" className="absolute bottom-full left-0 mb-2.5 z-20 w-[230px] max-w-[calc(100vw-48px)] animate-in fade-in zoom-in-95 duration-150">
          <span className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.14)] p-2.5 flex flex-wrap gap-1.5">
            {locations.map((l) => (
              <span key={l} className="px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11.5px] font-medium">
                {l}
              </span>
            ))}
          </span>
          <span aria-hidden="true" className="absolute -bottom-1 left-8 w-2.5 h-2.5 rotate-45 bg-white border-r border-b border-slate-100" />
        </span>
      )}
    </span>
  );
};
