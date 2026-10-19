import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, CalendarDays, ChevronRight, Clock3, Eye, FileSearch, Loader2, MapPin, MessageSquareText, Pencil, Plus, SearchX, UsersRound, Wallet, X } from 'lucide-react';
import { CommentThreadSheet } from '../../common/CommentThreadSheet';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, ChipRow, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { CardAction, CardIconButton } from '../interviews/InterviewParts';
import { ShortlistedCandidate, formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import type { HubProfile } from '../data/clientStaffHubData';
import {
  EMPTY_REQUIREMENT_DRAFT,
  EMPTY_REQUIREMENT_FILTERS,
  REQUIREMENT_PAGE_SIZE,
  RequirementDraft,
  RequirementFilters,
  RequirementStatus,
  StaffRequirement,
  availableResumesFor,
  draftOf,
  matchesRequirement,
  requirementFilterCount,
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
  onOpenHub?: () => void;
  onOpenShortlisted?: () => void;
}

type Sheet = 'filter' | 'detail' | 'comments' | 'saved' | null;
type StatusChip = 'All' | RequirementStatus;

/** Desktop loads the table by ajax */
const LOAD_MS = 600;

/**
 * Hire New Staff › Staff Requirements (desktop `demands`): requirement list with search and filters, Add / Edit Requirement
 * (3 steps), View Requirement, comments, and links to Available Resumes and Shortlisted Candidates per requirement.
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
}) => {
  // view = details + comments; add = Add Requirement; edit = Edit Requirement
  const { view: canView, add: canAdd, edit: canEdit } = useClientPermission('requirements');

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<StatusChip>('All');
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

  const base = requirements.filter((r) => matchesRequirement(r, query, filters));
  const chipOptions = useMemo<StatusChip[]>(
    () => ['All', ...(filters.statuses.length ? filters.statuses : (['In Progress', 'Completed', 'Not Required'] as RequirementStatus[]))],
    [filters.statuses],
  );
  const activeChip = chipOptions.includes(chip) ? chip : 'All';
  const counts = Object.fromEntries(chipOptions.map((o) => [o, o === 'All' ? base.length : base.filter((r) => r.status === o).length])) as Record<StatusChip, number>;
  const results = activeChip === 'All' ? base : base.filter((r) => r.status === activeChip);
  const visible = results.slice(0, pages * REQUIREMENT_PAGE_SIZE);

  const filterCount = requirementFilterCount(filters);
  const isFiltered = filterCount > 0 || query.trim().length > 0 || activeChip !== 'All';

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFilters = (next: RequirementFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => {
    setQuery('');
    setChip('All');
    applyFilters(EMPTY_REQUIREMENT_FILTERS);
  };

  const openForm = (editId: string | null) => {
    listScroll.current = listRef.current?.scrollTop ?? 0;
    setTargetId(editId);
    setForm({ editId });
  };

  useEffect(() => {
    if (!form && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [form]);

  const submit = (draft: RequirementDraft) => {
    const today = isoOfDate(new Date());
    if (form?.editId) {
      onChange(requirements.map((r) => (r.id === form.editId ? { ...r, ...draft } : r)));
      setSaved({ mode: 'edit', count: 1, profile: draft.profile });
    } else {
      const stamp = Date.now();
      // Desktop saves one requirement per head
      const created: StaffRequirement[] = Array.from({ length: draft.staffCount }, (_, i) => ({
        ...draft,
        id: `rq-${stamp}-${i}`,
        staffCount: 1,
        status: 'In Progress',
        editable: true,
        createdOn: today,
        comments: [],
      }));
      onChange([...created, ...requirements]);
      setSaved({ mode: 'create', count: created.length, profile: draft.profile });
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
        initial={editing ? draftOf(editing) : { ...EMPTY_REQUIREMENT_DRAFT, locations: defaultLocations }}
        onBack={() => setForm(null)}
        onSubmit={submit}
      />
    );
  }

  const card = (r: StaffRequirement) => {
    const resumes = availableResumesFor(r, hubProfiles, candidates);
    const shortlisted = shortlistedFor(r, candidates);
    const showEdit = canEdit && r.editable;
    const locationLabel = r.locations.length === 0 ? '-' : r.locations.length === 1 ? r.locations[0] : `${r.locations.length} Locations`;

    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                <Briefcase className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] leading-snug">{r.profile}</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {r.domain}
                  {r.level ? ` · ${r.level}` : ''}
                </span>
              </span>
              <RequirementStatusPill status={r.status} />
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
              <Detail icon={Wallet} label="Pricing" value={r.pricing || '-'} />
              <Detail icon={Clock3} label="Hours/Week" value={`${r.hoursPerWeek} Hrs`} />
              <Detail icon={CalendarDays} label="Onboarding" value={r.timeline} />
              <Detail icon={MapPin} label={`${r.workMode} · Location`} value={locationLabel} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <LinkTile
                label="Available Resumes"
                count={resumes}
                onClick={onOpenHub && resumes > 0 ? onOpenHub : undefined}
                ariaLabel={`${resumes} available resumes for ${r.profile}`}
                icon={FileSearch}
              />
              <LinkTile
                label="Shortlisted"
                count={shortlisted}
                onClick={onOpenShortlisted && shortlisted > 0 ? onOpenShortlisted : undefined}
                ariaLabel={`${shortlisted} shortlisted candidates for ${r.profile}`}
                icon={UsersRound}
              />
            </div>
          </div>

          {(canView || showEdit) && (
            <div className="px-3.5 py-3 border-t border-slate-100 flex items-center gap-2">
              {canView && <CardAction size="lg" label="View" icon={Eye} ariaLabel={`View requirement ${r.profile}`} onClick={() => openSheet('detail', r.id)} />}
              {canView && (
                <CardAction
                  size="lg"
                  tone="soft"
                  label={r.comments.length ? `Comments (${r.comments.length})` : 'Comments'}
                  icon={MessageSquareText}
                  ariaLabel={`Comments on ${r.profile}`}
                  onClick={() => openSheet('comments', r.id)}
                />
              )}
              {showEdit && <CardIconButton icon={Pencil} label={`Edit requirement ${r.profile}`} onClick={() => openForm(r.id)} />}
            </div>
          )}
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Hire New Staff <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Staff Requirement</span>
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold leading-tight">Staff Requirement</h1>
            {canAdd && (
              <button
                type="button"
                onClick={() => openForm(null)}
                className="h-9 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPages(1);
                }}
                placeholder="Search by profile, domain or location"
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {filters.date && <FilterChip label={formatShortDate(filters.date)} onRemove={() => applyFilters({ ...filters, date: '' })} />}
                {filters.profiles.map((p) => (
                  <FilterChip key={p} label={p} onRemove={() => applyFilters({ ...filters, profiles: filters.profiles.filter((x) => x !== p) })} />
                ))}
                {filters.locations.map((l) => (
                  <FilterChip key={l} label={l} onRemove={() => applyFilters({ ...filters, locations: filters.locations.filter((x) => x !== l) })} />
                ))}
                {filters.statuses.map((s) => (
                  <FilterChip key={s} label={s} onRemove={() => applyFilters({ ...filters, statuses: filters.statuses.filter((x) => x !== s) })} />
                ))}
              </div>
              <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}

          <div className="mt-3">
            <ChipRow
              options={chipOptions}
              value={activeChip}
              onChange={(c) => {
                setChip(c);
                reload();
              }}
              counts={counts}
              label="Requirement status"
            />
          </div>
        </div>

        <div className="px-4 mt-3">
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
              text="Try another profile, location, date or status."
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
                onOpenHub();
              }
            : undefined
        }
      />
    </div>
  );
};

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <Icon className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" aria-hidden="true" />
    <span className="min-w-0">
      <span className="block text-[10.5px] text-slate-400 truncate">{label}</span>
      <span className="block text-[12px] font-bold text-[#1E293B] tabular-nums truncate">{value}</span>
    </span>
  </div>
);

/** Available Resumes / Shortlisted count; opens the matching Hire New Staff screen when the role can open it */
const LinkTile: React.FC<{ label: string; count: number; icon: React.ElementType; onClick?: () => void; ariaLabel: string }> = ({ label, count, icon: Icon, onClick, ariaLabel }) => {
  const body = (
    <>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${count > 0 ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[10.5px] text-slate-400 truncate">{label}</span>
        <span className="block text-[13px] font-extrabold text-[#1E293B] tabular-nums leading-tight">{count > 0 ? count : '-'}</span>
      </span>
      {onClick && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
    </>
  );
  const cls = 'h-14 px-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2';
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`${cls} active:bg-slate-50 cursor-pointer`}>
      {body}
    </button>
  ) : (
    <div className={cls} aria-label={ariaLabel}>
      {body}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
    {label}
    <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer">
      <X className="w-3 h-3" />
    </button>
  </span>
);

